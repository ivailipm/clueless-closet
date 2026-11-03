import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'clueless-closet:';

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Returns false when the browser refused the write (usually quota exceeded). */
export function writeStored<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * useState that persists to localStorage. `onQuota` fires when a write fails,
 * so the screen can tell the user their photos are too big to keep.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
  onQuota?: () => void,
  /** Upgrade data saved by an older version. */
  migrate?: (stored: T) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    const stored = readStored<T | undefined>(key, undefined);
    if (stored === undefined) return fallback;
    // Merge plain objects so new fields added later get their defaults.
    const merged = isPlainObject(fallback) && isPlainObject(stored) ? ({ ...fallback, ...stored } as T) : stored;
    return migrate ? migrate(merged) : merged;
  });
  const quotaRef = useRef(onQuota);
  quotaRef.current = onQuota;

  useEffect(() => {
    if (!writeStored(key, value)) quotaRef.current?.();
  }, [key, value]);

  return [value, setValue];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const BACKUP_APP = 'clueless-closet';

/** Download everything this app keeps in localStorage as one JSON file. */
export function exportBackup() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) ?? 'null');
    } catch {
      /* skip unreadable entries */
    }
  }
  const blob = new Blob([JSON.stringify({ app: BACKUP_APP, version: 1, savedAt: new Date().toISOString(), data })], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clueless-closet-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Restore a backup file made by exportBackup. Replaces current data. */
export async function importBackup(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text()) as { app?: string; data?: Record<string, unknown> };
  if (parsed.app !== BACKUP_APP || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('This is not a Clueless Closet backup file.');
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
  for (const [k, v] of Object.entries(parsed.data)) localStorage.setItem(PREFIX + k, JSON.stringify(v));
}
