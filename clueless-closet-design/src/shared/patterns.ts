import lace from './lace.svg';
import leopard from './leopard.svg';

/**
 * Every background pattern, used by both the "outside" wallpaper and the "inside" area.
 * Photo patterns live in /public/patterns: "tile" ones are mirrored 2×2 so they repeat with no seams,
 * "cover" ones (a single object, like the rug) fill the space once.
 */
export type Pattern = { id: string; name: string; group: 'Classic' | 'Wallpapers'; background: string };

const photo = (id: string, name: string, color: string, mode: 'tile' | 'cover' = 'tile'): Pattern => {
  const url = `${import.meta.env.BASE_URL}patterns/${id}.jpg`;
  return {
    id,
    name,
    group: 'Wallpapers',
    background: mode === 'tile' ? `url('${url}') 0 0 / 560px auto, ${color}` : `url('${url}') center / cover no-repeat, ${color}`,
  };
};

export const PATTERNS: Pattern[] = [
  {
    id: 'plaid',
    name: 'Yellow plaid',
    group: 'Classic',
    background:
      'repeating-linear-gradient(0deg, rgba(194,37,92,.13) 0 14px, transparent 14px 44px), repeating-linear-gradient(90deg, rgba(194,37,92,.13) 0 14px, transparent 14px 44px), repeating-linear-gradient(0deg, rgba(29,26,43,.07) 0 2px, transparent 2px 22px), repeating-linear-gradient(90deg, rgba(29,26,43,.07) 0 2px, transparent 2px 22px), #FFF1B8',
  },
  { id: 'dots', name: 'Pink dots', group: 'Classic', background: 'radial-gradient(#EF9DBA 3px, transparent 3.5px) 0 0 / 24px 24px, #FFF4C7' },
  { id: 'plain', name: 'Plain butter', group: 'Classic', background: '#FFF4C7' },
  { id: 'leopard', name: 'Leopard print', group: 'Classic', background: `url('${leopard}') 0 0 / 150px 150px, #D3A065` },
  { id: 'lace', name: 'Red lace (drawn)', group: 'Classic', background: `url('${lace}') 0 0 / 280px 280px, #F3E6DA` },
  photo('black-lace', 'Black lace', '#3D3D38'),
  photo('midnight-lace', 'Midnight lace', '#3B4457'),
  photo('cocoa-lace', 'Cocoa lace', '#664337'),
  photo('vintage-bouquet', 'Vintage bouquet', '#79664D'),
  photo('gilded-scrolls', 'Gilded scrolls', '#968165'),
  photo('rose-damask', 'Rose damask', '#B38D78'),
  photo('bronze-baroque', 'Bronze baroque', '#4B342A'),
  photo('burgundy-blossoms', 'Burgundy blossoms', '#45201B'),
  photo('faded-florals', 'Faded florals', '#CCAE7B'),
  photo('paisley', 'Paisley', '#48352C'),
  photo('patchwork', 'Patchwork', '#A48E75'),
  photo('blue-tiles', 'Blue tiles', '#5D6463'),
  photo('love-letters', 'Love letters', '#CEA89A'),
  photo('persian-rug', 'Persian rug', '#453132', 'cover'),
];

const BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));

/** CSS background for a pattern id; unknown ids fall back to `fallback` (plaid by default). */
export const patternBackground = (id: string, fallback = 'plaid') => (BY_ID.get(id) ?? BY_ID.get(fallback)!).background;

export const isPattern = (id: string) => BY_ID.has(id);
