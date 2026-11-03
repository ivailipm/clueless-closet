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
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    const stored = readStored<T | undefined>(key, undefined);
    if (stored === undefined) return fallback;
    // Merge plain objects so new fields added later get their defaults.
    if (isPlainObject(fallback) && isPlainObject(stored)) return { ...fallback, ...stored } as T;
    return stored;
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
