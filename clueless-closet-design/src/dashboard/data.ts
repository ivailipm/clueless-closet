import type { ShapeName } from '../shared/theme';

export const HANDLE = 'ivailipm';

export type Comment = { id: string; text: string; at: number };

export type Repo = {
  id: string;
  name: string;
  tag: string;
  lang: string;
  shape: ShapeName;
  color: string;
  /** Times this repo was forked from the card menu. */
  forks: number;
  /** Last time something happened to it; null until then. */
  updatedAt: number | null;
  forkOf?: string;
};
export type Pr = { num: number; user: string; title: string; merged: boolean; comments: Comment[] };
export type Issue = { num: number; title: string; closed: boolean; createdAt: number | null; comments: Comment[] };
export type Gist = { id: string; title: string; body: string; at: number };
export type Codespace = { repoId: string; openedAt: number };
export type Org = { id: string; name: string; about: string; at: number };

export type ActivityKind =
  | 'push' | 'star' | 'merge' | 'reopen' | 'create' | 'fork' | 'delete' | 'log' | 'install'
  | 'comment' | 'issue' | 'close' | 'gist' | 'org' | 'code';
export type Activity = { id: string; kind: ActivityKind; text: string; at: number };

/** 'activity' has no sidebar button; it is reached from the feed's "View all". */
export type View = 'home' | 'repos' | 'prs' | 'issues' | 'codespaces' | 'stars' | 'gists' | 'orgs' | 'activity';

export const NEW_SHAPES: ShapeName[] = ['jacket', 'tee', 'bag', 'skirt', 'knit', 'hat', 'pants'];
export const NEW_COLORS = ['#E8C547', '#E86A92', '#C9A37A', '#6F8FBF', '#F4A9C0', '#A9BFA0', '#9DB8D9'];

const repo = (name: string, tag: string, lang: string, shape: ShapeName, color: string): Repo => ({
  id: name, name, tag, lang, shape, color, forks: 0, updatedAt: null,
});

export const REPOS: Repo[] = [
  repo('closet-core', 'The classic.', 'PHP', 'jacket', '#E8C547'),
  repo('pretty-utils', 'Pretty. Useful.', 'JavaScript', 'tee', '#E86A92'),
  repo('mall-style-ui', 'UI components', 'TypeScript', 'bag', '#C9A37A'),
  repo('plaid-api', 'A REST API, as if!', 'C#', 'skirt', '#6F8FBF'),
  repo('sweater-weather', 'Cosy weather widget', 'Python', 'knit', '#F4A9C0'),
  repo('accessory-hooks', 'Hooks for every look', 'React', 'hat', '#A9BFA0'),
];

export const PRS: Pr[] = [
  { num: 128, user: 'glam-user', title: 'feat: add sparkle to buttons', merged: false, comments: [] },
  { num: 127, user: 'totally-buggin', title: 'fix: plaid misaligned on mobile', merged: false, comments: [] },
  { num: 126, user: 'mall-rat', title: 'docs: update README', merged: false, comments: [] },
];

export const ISSUES: Issue[] = [
  { num: 42, title: 'Buttons are not shiny enough', closed: false, createdAt: null, comments: [] },
  { num: 41, title: 'Calendar needs more pink', closed: false, createdAt: null, comments: [] },
  { num: 40, title: 'Plaid clashes with dark mode', closed: false, createdAt: null, comments: [] },
];

export const LEVELS = ['#F3EEFB', '#F9CFE2', '#F29BC3', '#E2649F', '#B5307A'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const NAV: [View, string][] = [
  ['home', 'Home'],
  ['repos', 'Repositories'],
  ['prs', 'Pull requests'],
  ['issues', 'Issues'],
  ['codespaces', 'Codespaces'],
  ['stars', 'Stars'],
  ['gists', 'Gists'],
  ['orgs', 'Organizations'],
];

export type DashState = {
  view: View;
  avatar: string | null;
  spotlight: string | null;
  off: number;
  repos: Repo[];
  starred: Record<string, boolean>;
  prs: Pr[];
  issues: Issue[];
  gists: Gist[];
  codespaces: Codespace[];
  orgs: Org[];
  /** key `${year}-${month0}-${day}` → level 0..4 */
  cal: Record<string, number>;
  activity: Activity[];
  installed: boolean;
  sound: boolean;
};

export const INITIAL_DASH: DashState = {
  view: 'home',
  avatar: null,
  spotlight: null,
  off: 0,
  repos: REPOS,
  starred: {},
  prs: PRS,
  issues: ISSUES,
  gists: [],
  codespaces: [],
  orgs: [],
  cal: {},
  activity: [],
  installed: false,
  sound: false,
};

export const MAX_ACTIVITY = 40;

/** Fill in fields added after the first version so older saves keep working. */
export function migrateDash(st: DashState): DashState {
  const views: View[] = [...NAV.map(([v]) => v), 'activity'];
  return {
    ...st,
    view: views.includes(st.view) ? st.view : 'home',
    repos: st.repos.map((r) => ({ ...r, forks: r.forks ?? 0, updatedAt: r.updatedAt ?? null })),
    prs: st.prs.map((p) => ({ ...p, comments: p.comments ?? [] })),
    activity: st.activity.map((a) => ({
      ...a,
      kind: a.kind ?? guessKind(a.text),
      at: a.at ?? Date.now(),
    })),
  };
}

function guessKind(text: string): ActivityKind {
  if (text.startsWith('starred')) return 'star';
  if (text.startsWith('merged')) return 'merge';
  if (text.startsWith('created')) return 'create';
  if (text.startsWith('logged')) return 'log';
  if (text.startsWith('installed')) return 'install';
  return 'push';
}

/** "just now", "5 min ago", "2 hrs ago", "yesterday", "3 days ago", or a date. */
export function ago(at: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(at).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
