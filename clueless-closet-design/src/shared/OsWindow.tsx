import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Hanger } from './icons';
import { pickImage } from './image';
import { usePersistentState } from './storage';
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

type Props = {
  app: (typeof APPS)[number]['id'];
  title: string;
  subtitle: string;
  menu: string[];
  children: ReactNode;
  /** Sunken status bar / footer row under the content area. */
  footer: ReactNode;
};

/** 2000s-style desktop: wallpaper, window frame with title + menu bar, and a taskbar with a clock. */
export function OsWindow({ app, title, subtitle, menu, children, footer }: Props) {
  const clock = useClock();
  const [wall, setWall] = usePersistentState<Wallpaper>('wallpaper', { pattern: 'plaid', image: null }, () =>
    alert('That wallpaper is too big to remember. Try a smaller photo.'),
  );

  useEffect(() => {
    document.title = title.replace(/\.exe$/, '');
  }, [title]);

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
          <div aria-hidden="true" className="menu-items">
            {menu.map((m) => (
              <span key={m}>
                <u>{m[0]}</u>
                {m.slice(1)}
              </span>
            ))}
          </div>
          <div className="menu-tools">
            <label className="wall-select">
              <span className="px">Wallpaper</span>
              <select
                value={wall.image ? 'photo' : wall.pattern}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== 'photo') setWall({ pattern: v as WallpaperName, image: null });
                }}
              >
                <option value="plaid">Plaid</option>
                <option value="dots">Dots</option>
                <option value="plain">Plain</option>
                {wall.image && <option value="photo">My photo</option>}
              </select>
            </label>
            <label className="upload px">
              Change wallpaper
              <input
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
    </div>
  );
}
