import { ClothingArt } from '../shared/icons';
import { EXTRAS, layerIds, type Item, type Look } from './data';
import { Layers } from './Layers';
import type { GetItem } from './store';

/** Small picture of an outfit: layered top over the bottom, with extras as a strip of minis. */
export function OutfitThumb({ look, get, size = 'md' }: { look: Look; get: GetItem; size?: 'sm' | 'md' }) {
  const top = layerIds(look).map(get).filter((x): x is Item => !!x);
  const bottom = get(look.bottom);
  const extras = EXTRAS.map((c) => get(look.acc[c])).filter((x): x is Item => !!x);
  const h = size === 'sm' ? 40 : 56;
  return (
    <span className={`cl-thumb cl-thumb-${size}`}>
      <span className="cl-thumb-main">
        {top.length ? <Layers items={top} w="100%" h={h} /> : <span style={{ height: h }} />}
        <span style={{ display: 'block', width: '100%', height: h }}>
          {bottom && <ClothingArt shape={bottom.shape} color={bottom.color} img={bottom.img} />}
        </span>
      </span>
      {extras.length > 0 && (
        <span className="cl-thumb-extras">
          {extras.map((x) => (
            <span key={x.id} className="cl-thumb-extra">
              <ClothingArt shape={x.shape} color={x.color} img={x.img} />
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
