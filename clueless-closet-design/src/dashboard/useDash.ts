import { usePersistentState } from '../shared/storage';
import {
  HANDLE, INITIAL_DASH, MAX_ACTIVITY, MONTHS, NEW_COLORS, NEW_SHAPES, migrateDash,
  type ActivityKind, type Comment, type DashState, type Repo, type View,
} from './data';

export const PER_PAGE = 4;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Turn free text into a repo-style name: "Velvet Router!" → "velvet-router". */
export const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

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
  const touch = (repos: Repo[], id: string, extra: Partial<Repo> = {}) =>
    repos.map((r) => (r.id === id ? { ...r, ...extra, updatedAt: Date.now() } : r));
  const comment = (text: string): Comment => ({ id: uid(), text: text.trim(), at: Date.now() });

  const actions = {
    setView: (view: View) => set(() => ({ view })),
    setAvatar: (avatar: string | null) => set(() => ({ avatar })),
    setSpotlight: (spotlight: string | null) => set(() => ({ spotlight })),

    // Repositories
    shiftRepos: (d: number) => set((st) => ({ off: st.off + d })),
    firstRepos: () => set(() => ({ off: 0 })),
    lastRepos: () => set((st) => ({ off: Math.max(0, st.repos.length - PER_PAGE) })),
    toggleStar: (r: Repo) => {
      const on = !s.starred[r.id];
      if (on) act('star', `starred ${HANDLE}/${r.name}`, (st) => ({ starred: { ...st.starred, [r.id]: true } }));
      else set((st) => ({ starred: { ...st.starred, [r.id]: false } }));
    },
    createRepo: (raw: string) => {
      const name = slug(raw);
      if (!name) return false;
      if (s.repos.some((r) => r.name === name)) {
        alert(`You already have a repo called ${name}.`);
        return false;
      }
      act('create', `created ${HANDLE}/${name}`, (st) => {
        const k = st.repos.length % NEW_SHAPES.length;
        const repos: Repo[] = [
          ...st.repos,
          {
            id: name + '-' + uid(), name, tag: 'Fresh off the rack.', lang: 'New',
            shape: NEW_SHAPES[k], color: NEW_COLORS[k], forks: 0, updatedAt: Date.now(),
          },
        ];
        return { repos, off: Math.max(0, repos.length - PER_PAGE) };
      });
      return true;
    },
    forkRepo: (r: Repo) => {
      let name = `${r.name}-fork`;
      for (let i = 2; s.repos.some((x) => x.name === name); i++) name = `${r.name}-fork-${i}`;
      act('fork', `forked ${HANDLE}/${r.name} to ${HANDLE}/${name}`, (st) => ({
        repos: [
          ...st.repos.map((x) => (x.id === r.id ? { ...x, forks: x.forks + 1 } : x)),
          { ...r, id: name + '-' + uid(), name, forks: 0, updatedAt: Date.now(), forkOf: r.name },
        ],
      }));
    },
    deleteRepo: (r: Repo) => {
      if (!confirm(`Delete ${HANDLE}/${r.name}? Its stars and codespace go too.`)) return;
      act('delete', `deleted ${HANDLE}/${r.name}`, (st) => {
        const { [r.id]: _gone, ...starred } = st.starred;
        void _gone;
        return {
          repos: st.repos.filter((x) => x.id !== r.id),
          starred,
          codespaces: st.codespaces.filter((c) => c.repoId !== r.id),
        };
      });
    },

    // Codespaces
    openCodespace: (r: Repo) =>
      act('code', `opened a codespace for ${HANDLE}/${r.name}`, (st) => ({
        codespaces: [{ repoId: r.id, openedAt: Date.now() }, ...st.codespaces.filter((c) => c.repoId !== r.id)],
        view: 'codespaces',
      })),
    push: (r: Repo, message: string) =>
      act('push', `pushed to ${HANDLE}/${r.name}: ${message.trim() || 'update'}`, (st) => ({
        repos: touch(st.repos, r.id),
        codespaces: st.codespaces.map((c) => (c.repoId === r.id ? { ...c, openedAt: Date.now() } : c)),
      })),
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
    unstarAll: () => set(() => ({ starred: {} })),
    clearActivity: () => set(() => ({ activity: [] })),
    reset: () =>
      confirm('Reset the dashboard? Repos, stars, reviews, issues, gists, organizations, calendar and activity are cleared.') &&
      setS((st) => ({ ...INITIAL_DASH, avatar: st.avatar, spotlight: st.spotlight, sound: st.sound })),
  };

  return { s, ...actions };
}

export type Dash = ReturnType<typeof useDash>;
