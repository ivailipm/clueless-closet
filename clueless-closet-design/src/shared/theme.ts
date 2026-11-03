import lace from './lace.svg';
import leopard from './leopard.svg';

export const INK = '#1D1A2B';
export const ACCENT = '#5B4BC4';
export const PINK = '#C2255C';
export const FACE = '#D4D0E0';

/** Raised bevel: light top-left, dark bottom-right. */
export const UP = 'rgba(255,255,255,.85) rgba(0,0,0,.45) rgba(0,0,0,.45) rgba(255,255,255,.85)';
/** Pressed bevel: swapped. */
export const DOWN = 'rgba(0,0,0,.45) rgba(255,255,255,.85) rgba(255,255,255,.85) rgba(0,0,0,.45)';

/** Clothing silhouettes on a 100x100 viewBox. */
export const SHAPES = {
  tee: 'M30 16 L42 10 Q50 18 58 10 L70 16 L88 32 L78 44 L70 38 L70 90 L30 90 L30 38 L22 44 L12 32 Z',
  knit: 'M30 14 L42 10 Q50 17 58 10 L70 14 L86 30 L92 82 L80 84 L72 46 L72 90 L28 90 L28 46 L20 84 L8 82 L14 30 Z',
  jacket:
    'M30 14 L44 10 L50 30 L56 10 L70 14 L86 30 L92 82 L80 84 L72 46 L72 90 L54 90 L50 34 L46 90 L28 90 L28 46 L20 84 L8 82 L14 30 Z',
  pants: 'M28 10 L72 10 L77 92 L56 92 L50 38 L44 92 L23 92 Z',
  skirt: 'M34 16 L66 16 L84 82 L16 82 Z',
  bag: 'M18 40 L82 40 L86 88 L14 88 Z M34 40 Q34 14 50 14 Q66 14 66 40 L60 40 Q60 21 50 21 Q40 21 40 40 Z',
  scarf: 'M20 18 L80 18 L80 34 L62 34 L62 90 L48 90 L48 34 L20 34 Z',
  glove: 'M36 90 L36 40 Q36 22 50 22 Q66 22 66 40 L66 52 L74 44 Q84 42 80 54 L66 72 L66 90 Z',
  hat: 'M14 70 L86 70 L86 80 L14 80 Z M30 70 Q30 30 50 30 Q70 30 70 70 Z',
} as const;

export type ShapeName = keyof typeof SHAPES;

export type WallpaperName = 'plaid' | 'dots' | 'plain' | 'lace' | 'leopard';

export const WALLPAPERS: Record<WallpaperName, string> = {
  plaid:
    'repeating-linear-gradient(0deg, rgba(194,37,92,.13) 0 14px, transparent 14px 44px), repeating-linear-gradient(90deg, rgba(194,37,92,.13) 0 14px, transparent 14px 44px), repeating-linear-gradient(0deg, rgba(29,26,43,.07) 0 2px, transparent 2px 22px), repeating-linear-gradient(90deg, rgba(29,26,43,.07) 0 2px, transparent 2px 22px), #FFF1B8',
  dots: 'radial-gradient(#EF9DBA 3px, transparent 3.5px) 0 0 / 24px 24px, #FFF4C7',
  plain: '#FFF4C7',
  lace: `url('${lace}') 0 0 / 280px 280px, #F3E6DA`,
  leopard: `url('${leopard}') 0 0 / 150px 150px, #D3A065`,
};
