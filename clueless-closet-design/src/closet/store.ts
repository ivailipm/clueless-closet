import { useMemo } from 'react';
import { usePersistentState } from '../shared/storage';
import { BUILT_IN, builtIn, CLOSET_KEY, INITIAL_CLOSET, migrateCloset, type Category, type ClosetState, type Item } from './data';

/** Closet state (clothes, outfit, collections), shared by the closet and the dashboard. */
export function useClosetState() {
  return usePersistentState<ClosetState>(
    CLOSET_KEY,
    INITIAL_CLOSET,
    () => alert('Your closet is full: the browser could not store that photo. Try a smaller image.'),
    migrateCloset,
  );
}

/** Built-in plus uploaded items per category (read with `?? []`: empty categories are missing), and id → item. */
export function useItems(added: Item[]) {
  const itemsOf = useMemo(() => {
    const map: Record<Category, Item[]> = {};
    const cats = new Set([...Object.keys(BUILT_IN), ...added.map((a) => a.cat)]);
    cats.forEach((c) => {
      map[c] = builtIn(c).concat(added.filter((a) => a.cat === c));
    });
    return map;
  }, [added]);
  const byId = useMemo(() => {
    const m = new Map<string, Item>();
    Object.values(itemsOf).forEach((list) => list.forEach((it) => m.set(it.id, it)));
    return m;
  }, [itemsOf]);
  const get = (id: string | null | undefined) => (id ? byId.get(id) ?? null : null);
  return { itemsOf, get };
}

export type GetItem = ReturnType<typeof useItems>['get'];
