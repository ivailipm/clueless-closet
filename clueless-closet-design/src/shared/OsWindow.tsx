import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Hanger } from './icons';
import { pickImage } from './image';
import { MenuBar, type Menu, type MenuItem } from './MenuBar';
import { exportBackup, importBackup, usePersistentState } from './storage';
import { WALLPAPERS, type WallpaperName } from './theme';

type Wallpaper = { pattern: WallpaperName; image: string | null };

function useClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const t = setInterval(() => setTime(fmt()), 5000);
    return () => clearInterval(t);
  }, []);
  return time;
}

const APPS = [
  { to: '/', label: 'My Closet.exe', id: 'closet' },
  { to: '/dashboard', label: 'Code Closet.exe', id: 'dashboard' },
] as const;

const PATTERNS: [WallpaperName, string][] = [
  ['plaid', 'Plaid wallpaper'],
  ['dots', 'Dots wallpaper'],
  ['plain', 'Plain wallpaper'],
];

type Props = {
  app: (typeof APPS)[number]['id'];
  title: string;
  subtitle: string;
  /**
   * Screen-specific menus, in order. "File", "View" and "Help" get shared items
   * (backup, wallpaper, about) added automatically, and are created if missing.
   */
  menus: Menu[];
  children: ReactNode;
  /** Sunken status bar / footer row under the content area. */
  footer: ReactNode;
};

/** 2000s-style desktop: wallpaper, window frame with title + menu bar, and a taskbar with a clock. */
export function OsWindow({ app, title, subtitle, menus, children, footer }: Props) {
  const clock = useClock();
  const [wall, setWall] = usePersistentState<Wallpaper>('wallpaper', { pattern: 'plaid', image: null }, () =>
    alert('That wallpaper is too big to remember. Try a smaller photo.'),
  );
  const wallInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.title = title.replace(/\.exe$/, '');
  }, [title]);

  const shared: Record<string, { pre?: MenuItem[]; post?: MenuItem[] }> = {
    File: {
      post: [
        { separator: true },
        { label: 'Export backup…', onSelect: exportBackup },
        { label: 'Import backup…', onSelect: () => backupInput.current?.click() },
      ],
    },
    View: {
      pre: [
        ...PATTERNS.map(
          ([p, label]): MenuItem => ({
            label,
            checked: !wall.image && wall.pattern === p,
            onSelect: () => setWall({ pattern: p, image: null }),
          }),
        ),
        { label: 'Photo wallpaper…', checked: !!wall.image, onSelect: () => wallInput.current?.click() },
      ],
    },
    Help: { post: [{ label: `About ${title}`, onSelect: () => aboutRef.current?.showModal() }] },
  };
  const order = ['File', 'Edit', 'View'];
  const allMenus: Menu[] = [...menus];
  for (const label of Object.keys(shared)) {
    if (!allMenus.some((m) => m.label === label)) {
      allMenus.splice(label === 'Help' ? allMenus.length : Math.min(order.indexOf(label), allMenus.length), 0, {
        label,
        items: [],
      });
    }
  }
  const merged = allMenus.map((m) => {
    const s = shared[m.label];
    if (!s) return m;
    const items = [...(s.pre ?? []), ...(s.pre && m.items.length ? [{ separator: true } as MenuItem] : []), ...m.items, ...(s.post ?? [])];
    // Drop a leading separator (e.g. File with no screen items).
    return { ...m, items: 'separator' in (items[0] ?? {}) ? items.slice(1) : items };
  });

  return (
    <div className="desktop" style={{ background: wall.image ? '#1D1A2B' : WALLPAPERS[wall.pattern] }}>
      {wall.image && <img src={wall.image} alt="" className="wall-img" />}

      <div className="window">
        <header className="titlebar">
          <div className="titlebar-left">
            <Hanger />
            <h1 className="px">{title}</h1>
            <span className="subtitle">{subtitle}</span>
          </div>
          <div aria-hidden="true" className="wbtns">
            <span className="wbtn">_</span>
            <span className="wbtn">□</span>
            <span className="wbtn wbtn-close">x</span>
          </div>
        </header>

        <div className="menubar">
          <MenuBar menus={merged} />
          <div className="menu-tools">
            <label className="upload px">
              Change wallpaper
              <input
                ref={wallInput}
                type="file"
                accept="image/*"
                className="sr"
                onChange={pickImage(1600, (url) => setWall((w) => ({ ...w, image: url })))}
              />
            </label>
            {wall.image && (
              <button type="button" className="btn btn-sm" onClick={() => setWall((w) => ({ ...w, image: null }))}>
                Reset
              </button>
            )}
            <input
              ref={backupInput}
              type="file"
              accept="application/json,.json"
              className="sr"
              tabIndex={-1}
              aria-hidden="true"
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = input.files?.[0];
                input.value = '';
                if (!f) return;
                if (!confirm('Importing replaces your closet, saved looks and dashboard. Continue?')) return;
                try {
                  await importBackup(f);
                  location.reload();
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Could not read that backup.');
                }
              }}
            />
          </div>
        </div>

        {children}

        <div className="footer">{footer}</div>
      </div>

      <nav className="taskbar" aria-label="Apps">
        <div className="taskbar-left">
          <span aria-hidden="true" className="px start">
            <Hanger size={18} />
            Closet
          </span>
          {APPS.map((a) =>
            a.id === app ? (
              <span key={a.id} className="px task task-active" aria-current="page">
                {a.label}
              </span>
            ) : (
              <Link key={a.id} to={a.to} className="px task">
                {a.label}
              </Link>
            ),
          )}
        </div>
        <span className="sunk px clock" aria-label={`Time ${clock}`}>
          {clock}
        </span>
      </nav>

      <dialog ref={aboutRef} className="about" aria-labelledby="about-title">
        <div className="titlebar about-bar">
          <div className="titlebar-left">
            <Hanger size={18} />
            <h2 id="about-title" className="px">
              About
            </h2>
          </div>
          <button type="button" className="wbtn wbtn-close" aria-label="Close" onClick={() => aboutRef.current?.close()}>
            x
          </button>
        </div>
        <div className="about-body">
          <p className="px" style={{ fontSize: 16, margin: 0 }}>
            {title}
          </p>
          <p>A closet that dresses you, and a dashboard that dresses your repos. As if!</p>
          <p className="muted">
            Everything is saved in this browser only. Use File › Export backup to keep a copy or move it to another
            computer.
          </p>
          <p className="muted">Shortcuts: Alt + the underlined letter opens a menu; arrow keys move; Esc closes.</p>
          <form method="dialog">
            <button type="submit" className="btn btn-accent">
              OK
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
