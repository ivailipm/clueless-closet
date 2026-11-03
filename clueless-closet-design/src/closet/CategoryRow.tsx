import { ClothingArt, Tri } from '../shared/icons';
import { pickImage } from '../shared/image';
import { ACCENT, DOWN, INK, UP } from '../shared/theme';
import { LABELS, type Category, type Item } from './data';

type Props = {
  num: string;
  title: string;
  noun: string;
  cats: Category[];
  cat: Category;
  items: Item[];
  offset: number;
  isWorn: (it: Item) => boolean;
  hint?: string;
  dashed?: boolean;
  onTab: (c: Category) => void;
  onShift: (delta: number) => void;
  onPick: (it: Item) => void;
  onAdd: (dataUrl: string, file: File) => void;
  onRemove: (it: Item) => void;
};

const PER_PAGE = 3;

export function CategoryRow(p: Props) {
  const id = `h-${p.title.toLowerCase().replace(/\s+/g, '-')}`;
  const n = p.items.length;
  const off = n ? ((p.offset % n) + n) % n : 0;
  const visible = Array.from({ length: Math.min(PER_PAGE, n) }, (_, i) => p.items[(off + i) % n]);

  return (
    <section aria-labelledby={id} className={`row${p.dashed ? ' row-dashed' : ''}`}>
      <div className="row-head">
        <h2 id={id} className="px label">
          {p.num} {p.title}
        </h2>
        <div role="group" aria-label={`${p.title} categories`} className="tabs">
          {p.cats.map((c) => {
            const on = c === p.cat;
            return (
              <button
                key={c}
                type="button"
                className="tab"
                aria-pressed={on}
                onClick={() => p.onTab(c)}
                style={{ background: on ? ACCENT : '#D4D0E0', color: on ? '#FFFFFF' : INK, borderColor: on ? DOWN : UP }}
              >
                {LABELS[c]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="carousel">
        <button type="button" className="arrow" onClick={() => p.onShift(-1)} aria-label={`Previous ${p.noun}`}>
          <Tri dir="left" double />
        </button>
        <div className="tiles">
          {visible.map((it) => {
            const sel = p.isWorn(it);
            return (
              <div key={it.id} className="tile-wrap">
              <button
                type="button"
                className="tile"
                aria-pressed={sel}
                onClick={() => p.onPick(it)}
                style={{ borderColor: sel ? ACCENT : INK, background: sel ? '#EEEAFB' : '#FFFFFF' }}
              >
                <span className="art">
                  <ClothingArt shape={it.shape} color={it.color} img={it.img} />
                </span>
                <span className="name">{it.name}</span>
                {sel && <span className="badge px">Wearing</span>}
              </button>
              {it.img && (
                <button
                  type="button"
                  className="remove px"
                  aria-label={`Remove ${it.name} from closet`}
                  onClick={() => p.onRemove(it)}
                >
                  x
                </button>
              )}
              </div>
            );
          })}
        </div>
        <button type="button" className="arrow" onClick={() => p.onShift(1)} aria-label={`Next ${p.noun}`}>
          <Tri dir="right" double />
        </button>
      </div>

      <div className="row-foot">
        <span>
          {n} {LABELS[p.cat].toLowerCase()} in your closet{p.hint ? ` · ${p.hint}` : ''}
        </span>
        <label className="upload px">
          + Add your own
          <input type="file" accept="image/*" className="sr" onChange={pickImage(600, p.onAdd)} />
        </label>
      </div>
    </section>
  );
}
