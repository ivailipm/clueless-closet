import type { ShapeName } from '../shared/theme';

export const HANDLE = 'ivailipm';

export type Repo = { id: string; name: string; tag: string; lang: string; shape: ShapeName; color: string };
export type Pr = { num: number; user: string; title: string; merged: boolean };
export type Activity = { id: string; text: string; at: number };
export type View = 'home' | 'repos' | 'prs' | 'cal' | 'activity';

export const NEW_SHAPES: ShapeName[] = ['jacket', 'tee', 'bag', 'skirt', 'knit', 'hat', 'pants'];
export const NEW_COLORS = ['#E8C547', '#E86A92', '#C9A37A', '#6F8FBF', '#F4A9C0', '#A9BFA0', '#9DB8D9'];

export const REPOS: Repo[] = [
  { id: 'closet-core', name: 'closet-core', tag: 'The classic.', lang: 'PHP', shape: 'jacket', color: '#E8C547' },
  { id: 'pretty-utils', name: 'pretty-utils', tag: 'Pretty. Useful.', lang: 'JavaScript', shape: 'tee', color: '#E86A92' },
  { id: 'mall-style-ui', name: 'mall-style-ui', tag: 'UI components', lang: 'TypeScript', shape: 'bag', color: '#C9A37A' },
  { id: 'plaid-api', name: 'plaid-api', tag: 'A REST API, as if!', lang: 'C#', shape: 'skirt', color: '#6F8FBF' },
  { id: 'sweater-weather', name: 'sweater-weather', tag: 'Cosy weather widget', lang: 'Python', shape: 'knit', color: '#F4A9C0' },
  { id: 'accessory-hooks', name: 'accessory-hooks', tag: 'Hooks for every look', lang: 'React', shape: 'hat', color: '#A9BFA0' },
];

export const PRS: Pr[] = [
  { num: 128, user: 'glam-user', title: 'feat: add sparkle to buttons', merged: false },
  { num: 127, user: 'totally-buggin', title: 'fix: plaid misaligned on mobile', merged: false },
  { num: 126, user: 'mall-rat', title: 'docs: update README', merged: false },
];

export const LEVELS = ['#EDEAF6', '#F7C6D9', '#EF8FB4', '#D94C86', '#A3245B'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const NAV: [View, string][] = [
  ['home', 'Home'],
  ['repos', 'Repositories'],
  ['prs', 'Pull requests'],
  ['cal', 'Calendar'],
  ['activity', 'Activity'],
];

export type DashState = {
  view: View;
  avatar: string | null;
  off: number;
  repos: Repo[];
  starred: Record<string, boolean>;
  prs: Pr[];
  /** key `${year}-${month0}-${day}` → level 0..4 */
  cal: Record<string, number>;
  activity: Activity[];
  installed: boolean;
};

export const INITIAL_DASH: DashState = {
  view: 'home',
  avatar: null,
  off: 0,
  repos: REPOS,
  starred: {},
  prs: PRS,
  cal: {},
  activity: [],
  installed: false,
};
