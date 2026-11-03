import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Hanger } from './icons';
import { MenuBar, type Menu, type MenuItem } from './MenuBar';
import { exportBackup, importBackup } from './storage';
import type { WallpaperName } from './theme';
import { useWallpaper, WallpaperLayer, type Slot } from './wallpaper';

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

/** Things a screen can trigger from its own buttons. */
export type WindowApi = { openImport: () => void; openAbout: () => void; openWallpaper: () => void };

type Slot2<T> = T | ((api: WindowApi) => T);

type Props = {
  app: (typeof APPS)[number]['id'];
  title: string;
  subtitle: string;
  /**
   * classic: title bar + separate menu bar (closet).
   * fashion: one royal-blue top strip with menus, a centred brand pill and Sign out / Help (dashboard).
   */
  variant?: 'classic' | 'fashion';
  /** fashion only: big word in the pill, e.g. "GITHUB". */
  brand?: string;
  /** fashion only: text in < > next to the brand. */
  tagline?: string;
  /** fashion only: first button on the right of the top strip (default: Sign out, back to the closet). */
  exitLink?: { to: string; label: string };
  /**
   * Screen-specific menus, in order. "File", "View" and "Help" get shared items
   * (backup, wallpaper, about) added automatically, and are created if missing.
   */
  menus: Menu[];
  children: Slot2<ReactNode>;
  /** Row under the content area (status bar / toolbar). */
  footer: Slot2<ReactNode>;
};

/** 2000s-style desktop: wallpaper, window frame with title + menu bar, and a taskbar with a clock. */
export function OsWindow({
  app, title, subtitle, variant = 'classic', brand, tagline, exitLink = { to: '/', label: 'Sign out' }, menus, children, footer,
}: Props) {
  const clock = useClock();
  const wp = useWallpaper(app);
  const [wallMsg, setWallMsg] = useState('');
  useEffect(() => {
    if (!wallMsg) return;
    const t = setTimeout(() => setWallMsg(''), 6000);
    return () => clearTimeout(t);
  }, [wallMsg]);
  const wallInput = useRef<HTMLInputElement>(null);
  const slotInputs = { landscape: useRef<HTMLInputElement>(null), portrait: useRef<HTMLInputElement>(null) };
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
            checked: !wp.showingPhoto && wp.wall.pattern === p,
            onSelect: () => wp.setPattern(p),
          }),
        ),
        { label: 'My photo wallpaper', checked: wp.showingPhoto, disabled: !wp.hasPhoto, onSelect: wp.showPhoto },
        { separator: true },
        { label: 'Change wallpaper…', onSelect: () => wallInput.current?.click() },
        { label: 'Upload desktop photo (horizontal)…', onSelect: () => slotInputs.landscape.current?.click() },
        { label: 'Upload phone photo (vertical)…', onSelect: () => slotInputs.portrait.current?.click() },
        { label: 'Remove desktop photo', disabled: !wp.wall.landscape, onSelect: () => wp.remove('landscape') },
        { label: 'Remove phone photo', disabled: !wp.wall.portrait, onSelect: () => wp.remove('portrait') },
      ],
    },
    Help: { post: [{ label: `About ${title}`, onSelect: () => aboutRef.current?.showModal() }] },
  };
  const onWallFile = (slot?: Slot) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    const saved = await wp.upload(f, slot);
    if (!saved) return;
    const other = saved === 'landscape' ? wp.wall.portrait : wp.wall.landscape;
    setWallMsg(
      saved === 'landscape'
        ? `Desktop wallpaper set${other ? '' : ' (also used on phones until you add a vertical photo)'}`
        : `Phone wallpaper set${other ? '' : ' (also used on computers until you add a horizontal photo)'}`,
    );
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

  const api: WindowApi = {
    openImport: () => backupInput.current?.click(),
    openAbout: () => aboutRef.current?.showModal(),
    openWallpaper: () => wallInput.current?.click(),
  };
  const render = (x: Slot2<ReactNode>) => (typeof x === 'function' ? x(api) : x);
  const fashion = variant === 'fashion';

  const hiddenInputs = (
    <>
      {([undefined, 'landscape', 'portrait'] as (Slot | undefined)[]).map((slot) => (
        <input
          key={slot ?? 'auto'}
          ref={slot ? slotInputs[slot] : wallInput}
          type="file"
          accept="image/*"
          className="sr"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onWallFile(slot)}
        />
      ))}
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
    </>
  );

  const resetWall = wp.hasPhoto && (
    <button
      type="button"
      className={fashion ? 'fx-btn' : 'btn btn-sm'}
      onClick={() => {
        wp.removeAll();
        setWallMsg('');
      }}
    >
      Reset wallpaper
    </button>
  );

  return (
    <div className="desktop">
      <WallpaperLayer wall={wp.wall} photo={wp.showingPhoto} />

      <div className={`window${fashion ? ' window-fashion' : ''}`}>
        {fashion ? (
          <header className="fx-top">
            <MenuBar menus={merged} />
            <h1 className="fx-pill">
              <span className="fx-heart" aria-hidden="true">
                ♥
              </span>
              <span className="px fx-brand">{brand}</span>
              <span className="fx-heart" aria-hidden="true">
                ♥
              </span>
              <span className="px fx-tag">
                <span aria-hidden="true">‹ </span>
                {tagline}
                <span aria-hidden="true"> ›</span>
              </span>
            </h1>
            <div className="fx-top-right">
              {resetWall}
              <Link to={exitLink.to} className="fx-btn px">
                {exitLink.label}
              </Link>
              <button type="button" className="fx-btn px" onClick={api.openAbout}>
                Help
              </button>
              <button type="button" className="fx-btn px fx-q" onClick={api.openAbout} aria-label="Keyboard shortcuts">
                ?
              </button>
            </div>
          </header>
        ) : (
          <>
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
                {wallMsg && (
                  <span className="sunk wall-msg" role="status">
                    {wallMsg}
                  </span>
                )}
                <button
                  type="button"
                  className="upload px"
                  title="Horizontal photos are used on computers, vertical photos on phones"
                  onClick={() => wallInput.current?.click()}
                >
                  Change wallpaper
                </button>
                {resetWall}
              </div>
            </div>
          </>
        )}
        {hiddenInputs}
        {fashion && wallMsg && (
          <div className="fx-toast" role="status">
            {wallMsg}
          </div>
        )}

        {render(children)}

        <div className={fashion ? 'fx-footer' : 'footer'}>{render(footer)}</div>
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
          <p className="muted">
            Wallpaper: View › Change wallpaper. Horizontal photos are used on computers, vertical photos on phones.
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
