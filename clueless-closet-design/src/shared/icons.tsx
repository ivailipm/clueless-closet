import { SHAPES, type ShapeName } from './theme';

export function Hanger({ size = 24 }: { size?: number }) {
  return (
    <svg className="hanger" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M10 5 a2 2 0 1 1 2 2 v2 L3 16 h18 L12 9" />
    </svg>
  );
}

type TriProps = { dir: 'left' | 'right'; double?: boolean; width?: number; height?: number };

/** Filled triangle(s): ◀ ▶ or ◀◀ ▶▶ */
export function Tri({ dir, double, width, height }: TriProps) {
  const d = double
    ? dir === 'left'
      ? 'M14 1 L1 8 L14 15 Z M27 1 L14 8 L27 15 Z'
      : 'M1 1 L14 8 L1 15 Z M14 1 L27 8 L14 15 Z'
    : dir === 'left'
      ? 'M14 1 L1 8 L14 15 Z'
      : 'M2 1 L15 8 L2 15 Z';
  const vw = double ? 28 : 16;
  return (
    <svg className="tri" viewBox={`0 0 ${vw} 16`} width={width ?? vw} height={height ?? 16} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** A piece of clothing: the uploaded photo if there is one, otherwise the SVG silhouette. */
export function ClothingArt({ shape, color, img }: { shape: ShapeName; color: string; img?: string }) {
  if (img) return <img src={img} alt="" className="fit" />;
  return (
    <svg className="ic" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <path d={SHAPES[shape]} fill={color} />
    </svg>
  );
}
