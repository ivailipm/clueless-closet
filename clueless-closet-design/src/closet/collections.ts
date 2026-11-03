import type { ClosetState, Collection, Look, Outfit, Style } from './data';

/** Pure helpers for outfit collections. Each takes the closet state and returns the next one. */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Turn free text into a repo-style name: "Winter Outfits!" → "winter-outfits". */
export const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

/** `name`, or `name-2`, `name-3`… if taken. */
export function uniqueName(cols: Collection[], name: string) {
  let n = name;
  for (let i = 2; cols.some((c) => c.name === n); i++) n = `${name}-${i}`;
  return n;
}

const mapCol = (st: ClosetState, id: string, f: (c: Collection) => Collection): ClosetState => ({
  ...st,
  collections: st.collections.map((c) => (c.id === id ? f(c) : c)),
});

export function createCollection(st: ClosetState, rawName: string, style: Style): { state: ClosetState; col: Collection } | null {
  const base = slug(rawName);
  if (!base) return null;
  const name = uniqueName(st.collections, base);
  const col: Collection = {
    id: name + '-' + uid(), name, style, outfits: [], starred: false, forks: 0, createdAt: Date.now(), updatedAt: null,
  };
  return { state: { ...st, collections: [...st.collections, col] }, col };
}

/** Copy a look into a collection (newest first). */
export function addOutfit(st: ClosetState, colId: string, look: Look, name: string): ClosetState {
  const outfit: Outfit = {
    layers: { ...look.layers }, bottom: look.bottom, acc: { ...look.acc },
    id: uid(), name: name.trim() || 'Untitled look', savedAt: Date.now(),
  };
  return {
    ...mapCol(st, colId, (c) => ({ ...c, outfits: [outfit, ...c.outfits], updatedAt: Date.now() })),
    lastCollection: colId,
  };
}

export const removeOutfit = (st: ClosetState, colId: string, outfitId: string): ClosetState =>
  mapCol(st, colId, (c) => ({ ...c, outfits: c.outfits.filter((o) => o.id !== outfitId), updatedAt: Date.now() }));

export const toggleStar = (st: ClosetState, id: string): ClosetState => mapCol(st, id, (c) => ({ ...c, starred: !c.starred }));

export const setStyle = (st: ClosetState, id: string, style: Style): ClosetState =>
  mapCol(st, id, (c) => ({ ...c, style, updatedAt: Date.now() }));

export function renameCollection(st: ClosetState, id: string, raw: string): ClosetState | null {
  const base = slug(raw);
  if (!base) return null;
  const name = uniqueName(st.collections.filter((c) => c.id !== id), base);
  return mapCol(st, id, (c) => ({ ...c, name, updatedAt: Date.now() }));
}

/** Copy a collection with all its outfits; the original's fork count goes up. */
export function forkCollection(st: ClosetState, id: string): { state: ClosetState; col: Collection } | null {
  const src = st.collections.find((c) => c.id === id);
  if (!src) return null;
  const name = uniqueName(st.collections, `${src.name}-fork`);
  const now = Date.now();
  const col: Collection = {
    ...src, id: name + '-' + uid(), name, starred: false, forks: 0, forkOf: src.name, createdAt: now, updatedAt: now,
    outfits: src.outfits.map((o) => ({ ...o, id: uid() + o.id })),
  };
  const state = mapCol(st, id, (c) => ({ ...c, forks: c.forks + 1 }));
  return { state: { ...state, collections: [...state.collections, col] }, col };
}

export const deleteCollection = (st: ClosetState, id: string): ClosetState => ({
  ...st,
  collections: st.collections.filter((c) => c.id !== id),
  lastCollection: st.lastCollection === id ? null : st.lastCollection,
});

/** Apply `f` to every outfit in every collection, dropping outfits that end up empty. */
export function mapOutfits(st: ClosetState, f: (o: Outfit) => Outfit, isEmpty: (l: Look) => boolean): ClosetState {
  return {
    ...st,
    collections: st.collections.map((c) => ({ ...c, outfits: c.outfits.map(f).filter((o) => !isEmpty(o)) })),
  };
}
