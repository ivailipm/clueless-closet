import { downscale } from './image';
import { readStored, usePersistentState } from './storage';
import { patternBackground } from './patterns';

/**
 * The desktop behind the window. Each screen keeps its own.
 * `landscape` is shown on wide screens (desktop), `portrait` on tall ones (phones);
 * if only one exists it is used everywhere.
 */
export type Wallpaper = {
  /** Pattern id from patterns.ts. */
  pattern: string;
  landscape: string | null;
  portrait: string | null;
  showPhoto: boolean;
  /** Storage version; see useInsideBackground. */
  v?: number;
};

export type Slot = 'landscape' | 'portrait';

const EMPTY: Wallpaper = { pattern: 'plaid', landscape: null, portrait: null, showPhoto: false };

/** First version stored one shared { pattern, image }; carry that over. */
function legacy(): Wallpaper {
  const old = readStored<{ pattern?: string; image?: string | null } | null>('wallpaper', null);
  if (!old) return EMPTY;
  return { ...EMPTY, pattern: old.pattern ?? 'plaid', landscape: old.image ?? null, showPhoto: !!old.image };
}

/**
 * `screen` names the storage slot; only the screens' own wallpapers inherit the old shared one.
 * `pattern` is the starting pattern for a fresh slot.
 */
export function useWallpaper(
  screen: string,
  inheritLegacy = true,
  pattern = 'plaid',
  migrate?: (w: Wallpaper) => Wallpaper,
) {
  const [wall, setWall] = usePersistentState<Wallpaper>(
    `wallpaper-${screen}`,
    inheritLegacy ? legacy : { ...EMPTY, pattern },
    () => alert('That photo is too big to remember. Try a smaller one, or remove the other wallpaper photo first.'),
    migrate,
  );

  /** Store a photo. Without a slot, its shape decides: wide → desktop, tall → phone. */
  const upload = async (file: File, slot?: Slot) => {
    try {
      const img = await downscale(file, 1600, true);
      const s: Slot = slot ?? (img.height > img.width ? 'portrait' : 'landscape');
      setWall((w) => ({ ...w, [s]: img.url, showPhoto: true }));
      return s;
    } catch {
      alert('Sorry, that file could not be opened as an image.');
      return null;
    }
  };

  const hasPhoto = !!(wall.landscape || wall.portrait);

  return {
    wall,
    hasPhoto,
    showingPhoto: hasPhoto && wall.showPhoto,
    upload,
    setPattern: (pattern: string) => setWall((w) => ({ ...w, pattern, showPhoto: false })),
    showPhoto: () => setWall((w) => ({ ...w, showPhoto: true })),
    remove: (slot: Slot) =>
      setWall((w) => {
        const next = { ...w, [slot]: null };
        return { ...next, showPhoto: next.showPhoto && !!(next.landscape || next.portrait) };
      }),
    removeAll: () => setWall((w) => ({ ...w, landscape: null, portrait: null, showPhoto: false })),
  };
}

/**
 * Background: pattern, or the right photo for the screen's orientation.
 * `contained` fills its positioned parent instead of the whole viewport.
 */
export function WallpaperLayer({
  wall, photo, contained, fallback,
}: { wall: Wallpaper; photo: boolean; contained?: boolean; fallback?: string }) {
  const cls = `wall${contained ? ' wall-contained' : ''}`;
  if (!photo) return <div className={cls} style={{ background: patternBackground(wall.pattern, fallback) }} />;
  const land = wall.landscape ?? wall.portrait!;
  const port = wall.portrait ?? wall.landscape!;
  return (
    <div className={cls} style={{ background: '#1D1A2B' }}>
      <img src={land} alt="" className="wall-img wall-landscape" />
      {port !== land && <img src={port} alt="" className="wall-img wall-portrait" />}
    </div>
  );
}
