import * as cols from '../closet/collections';
import type { Collection, Style } from '../closet/data';
import { useClosetState, useItems } from '../closet/store';
import { usePersistentState } from '../shared/storage';
import {
  HANDLE, INITIAL_DASH, MAX_ACTIVITY, MONTHS, migrateDash,
  type ActivityKind, type Comment, type DashState, type View,
} from './data';

export const PER_PAGE = 4;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const slug = cols.slug;

let audio: AudioContext | null = null;
/** A tiny retro "blip" for when sound is on. */
function blip() {
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.05, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.1);
  } catch {
    /* no audio available */
  }
}

export function useDash() {
  const [s, setS] = usePersistentState<DashState>(
    'dashboard',
    INITIAL_DASH,
    () => alert('That photo is too big to remember. Try a smaller image.'),
    migrateDash,
  );
  // Repositories are the closet's outfit collections.
  const [closet, setCloset] = useClosetState();
  const collections = closet.collections;
  const { get } = useItems(closet.added);

  /** Apply a change and add a line to the activity feed. */
  const act = (kind: ActivityKind, text: string, change: (st: DashState) => Partial<DashState>) => {
    if (s.sound) blip();
    setS((st) => ({
      ...st,
      ...change(st),
      activity: [{ id: uid(), kind, text, at: Date.now() }, ...st.activity].slice(0, MAX_ACTIVITY),
    }));
  };
  const set = (change: (st: DashState) => Partial<DashState>) => setS((st) => ({ ...st, ...change(st) }));
  const comment = (text: string): Comment => ({ id: uid(), text: text.trim(), at: Date.now() });
  const log = (kind: ActivityKind, text: string) => act(kind, text, () => ({}));

  const actions = {
    setView: (view: View) => set(() => ({ view })),
    setAvatar: (avatar: string | null) => set(() => ({ avatar })),
    setSpotlight: (spotlight: string | null) => set(() => ({ spotlight })),

    // Repositories = outfit collections
    shiftRepos: (d: number) => set((st) => ({ off: st.off + d })),
    firstRepos: () => set(() => ({ off: 0 })),
    lastRepos: () => set(() => ({ off: Math.max(0, collections.length - PER_PAGE) })),
    toggleStar: (c: Collection) => {
      setCloset((st) => cols.toggleStar(st, c.id));
      if (!c.starred) log('star', `starred ${HANDLE}/${c.name}`);
    },
    createRepo: (raw: string, style: Style) => {
      const made = cols.createCollection(closet, raw, style);
      if (!made) return false;
      setCloset(made.state);
      act('create', `created ${HANDLE}/${made.col.name}`, () => ({
        off: Math.max(0, made.state.collections.length - PER_PAGE),
      }));
      return true;
    },
    forkRepo: (c: Collection) => {
      const made = cols.forkCollection(closet, c.id);
      if (!made) return;
      setCloset(made.state);
      log('fork', `forked ${HANDLE}/${c.name} to ${HANDLE}/${made.col.name}`);
    },
    deleteRepo: (c: Collection) => {
      const n = c.outfits.length;
      if (!confirm(`Delete ${HANDLE}/${c.name}${n ? ` and its ${n} outfit${n > 1 ? 's' : ''}` : ''}?`)) return;
      setCloset((st) => cols.deleteCollection(st, c.id));
      act('delete', `deleted ${HANDLE}/${c.name}`, (st) => ({
        codespaces: st.codespaces.filter((x) => x.repoId !== c.id),
      }));
    },
    setStyle: (c: Collection, style: Style) => setCloset((st) => cols.setStyle(st, c.id, style)),
    renameRepo: (c: Collection, raw: string) => {
      const next = cols.renameCollection(closet, c.id, raw);
      if (!next) return false;
      setCloset(next);
      const name = next.collections.find((x) => x.id === c.id)!.name;
      if (name !== c.name) log('push', `renamed ${HANDLE}/${c.name} to ${HANDLE}/${name}`);
      return true;
    },
    removeOutfit: (c: Collection, outfitId: string, name: string) => {
      if (!confirm(`Remove "${name}" from ${c.name}?`)) return;
      setCloset((st) => cols.removeOutfit(st, c.id, outfitId));
      log('delete', `removed "${name}" from ${HANDLE}/${c.name}`);
    },
    /** Put an outfit on in the closet (the caller then navigates there). */
    wearOutfit: (c: Collection, outfitId: string) => {
      const o = c.outfits.find((x) => x.id === outfitId);
      if (!o) return;
      setCloset((st) => ({ ...st, wearing: { layers: { ...o.layers }, bottom: o.bottom, acc: { ...o.acc } }, lastCollection: c.id }));
    },

    // Codespaces ("fitting room")
    openCodespace: (c: Collection) =>
      act('code', `opened a codespace for ${HANDLE}/${c.name}`, (st) => ({
        codespaces: [{ repoId: c.id, openedAt: Date.now() }, ...st.codespaces.filter((x) => x.repoId !== c.id)],
        view: 'codespaces',
      })),
    push: (c: Collection, message: string) => {
      setCloset((st) => ({
        ...st,
        collections: st.collections.map((x) => (x.id === c.id ? { ...x, updatedAt: Date.now() } : x)),
      }));
      act('push', `pushed to ${HANDLE}/${c.name}: ${message.trim() || 'update'}`, (st) => ({
        codespaces: st.codespaces.map((x) => (x.repoId === c.id ? { ...x, openedAt: Date.now() } : x)),
      }));
    },
    stopCodespace: (repoId: string) => set((st) => ({ codespaces: st.codespaces.filter((c) => c.repoId !== repoId) })),

    // Pull requests
    togglePr: (num: number) => {
      const p = s.prs.find((x) => x.num === num)!;
      const flip = (st: DashState) => ({ prs: st.prs.map((x) => (x.num === num ? { ...x, merged: !x.merged } : x)) });
      if (!p.merged) act('merge', `merged #${num} ${p.title}`, flip);
      else act('reopen', `reopened #${num} ${p.title}`, flip);
    },
    commentPr: (num: number, text: string) =>
      text.trim() &&
      act('comment', `commented on pull request #${num}`, (st) => ({
        prs: st.prs.map((x) => (x.num === num ? { ...x, comments: [...x.comments, comment(text)] } : x)),
      })),

    // Issues
    newIssue: (title: string) => {
      if (!title.trim()) return false;
      act('issue', `opened issue: ${title.trim()}`, (st) => {
        const num = Math.max(0, ...st.issues.map((i) => i.num), ...st.prs.map((p) => p.num)) + 1;
        return { issues: [{ num, title: title.trim(), closed: false, createdAt: Date.now(), comments: [] }, ...st.issues] };
      });
      return true;
    },
    toggleIssue: (num: number) => {
      const i = s.issues.find((x) => x.num === num)!;
      act(i.closed ? 'issue' : 'close', `${i.closed ? 'reopened' : 'closed'} issue #${num} ${i.title}`, (st) => ({
        issues: st.issues.map((x) => (x.num === num ? { ...x, closed: !x.closed } : x)),
      }));
    },
    commentIssue: (num: number, text: string) =>
      text.trim() &&
      act('comment', `commented on issue #${num}`, (st) => ({
        issues: st.issues.map((x) => (x.num === num ? { ...x, comments: [...x.comments, comment(text)] } : x)),
      })),

    // Gists
    addGist: (title: string, body: string) => {
      if (!body.trim()) return false;
      const t = title.trim() || 'untitled.txt';
      act('gist', `created gist ${t}`, (st) => ({ gists: [{ id: uid(), title: t, body, at: Date.now() }, ...st.gists] }));
      return true;
    },
    deleteGist: (id: string) => confirm('Delete this gist?') && set((st) => ({ gists: st.gists.filter((g) => g.id !== id) })),

    // Organizations
    addOrg: (name: string, about: string) => {
      const n = slug(name);
      if (!n) return false;
      act('org', `created organization ${n}`, (st) => ({
        orgs: [...st.orgs, { id: uid(), name: n, about: about.trim(), at: Date.now() }],
      }));
      return true;
    },
    deleteOrg: (id: string) =>
      confirm('Delete this organization?') && set((st) => ({ orgs: st.orgs.filter((o) => o.id !== id) })),

    // Calendar
    cycleDay: (y: number, m: number, day: number) => {
      const key = `${y}-${m}-${day}`;
      const next = ((s.cal[key] ?? 0) + 1) % 5;
      const change = (st: DashState) => ({ cal: { ...st.cal, [key]: next } });
      if (next === 1) act('log', `logged code on ${MONTHS[m].slice(0, 3)} ${day}`, change);
      else set(change);
    },

    toggleInstall: () => {
      if (!s.installed) act('install', 'installed 90s dev diva starter kit', () => ({ installed: true }));
      else set(() => ({ installed: false }));
    },
    toggleSound: () => {
      if (!s.sound) blip();
      set((st) => ({ sound: !st.sound }));
    },
    unstarAll: () =>
      setCloset((st) => ({ ...st, collections: st.collections.map((c) => ({ ...c, starred: false })) })),
    clearActivity: () => set(() => ({ activity: [] })),
    reset: () =>
      confirm('Reset the dashboard? Reviews, issues, gists, organizations, codespaces, calendar and activity are cleared. Your collections stay (manage them in the closet).') &&
      setS((st) => ({ ...INITIAL_DASH, avatar: st.avatar, spotlight: st.spotlight, sound: st.sound })),
  };

  return { s, collections, closet, get, ...actions };
}

export type Dash = ReturnType<typeof useDash>;
