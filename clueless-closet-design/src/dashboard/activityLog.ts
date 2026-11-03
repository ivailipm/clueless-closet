import { readStored, writeStored } from '../shared/storage';
import { MAX_ACTIVITY, type ActivityKind, type DashState } from './data';

/**
 * Add a line to the dashboard's activity feed from another screen (the closet).
 * Only call this while the dashboard is not on screen: its own state would overwrite the write.
 */
export function logActivity(kind: ActivityKind, text: string) {
  const st = readStored<DashState | null>('dashboard', null);
  const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind, text, at: Date.now() };
  writeStored('dashboard', { ...(st ?? {}), activity: [entry, ...(st?.activity ?? [])].slice(0, MAX_ACTIVITY) });
}
