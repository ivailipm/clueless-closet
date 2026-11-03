import { ClothingArt } from '../shared/icons';
import type { Item } from './data';

/**
 * Top-half pieces drawn back to front. One piece fills the box; with more, each is
 * shrunk and fanned diagonally so you can see the tee under the shirt under the sweater.
 */
export function Layers({ items, w, h }: { items: Item[]; w: number | string; h: number }) {
  const n = items.length;
  if (!n) return null;
  const size = n > 1 ? 74 : 100; // % of the box
  const step = n > 1 ? (100 - size) / (n - 1) : 0;
  return (
    <div className="layers" style={{ width: w, height: h }}>
      {items.map((it, i) => (
        <div
          key={it.id}
          className="layer"
          style={{ width: `${size}%`, height: `${size}%`, left: `${i * step}%`, top: `${i * step}%` }}
        >
          <ClothingArt shape={it.shape} color={it.color} img={it.img} />
        </div>
      ))}
    </div>
  );
}
