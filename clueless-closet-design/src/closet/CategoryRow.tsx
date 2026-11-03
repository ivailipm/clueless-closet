import { Panel } from '../dashboard/parts';
import { Icon } from '../dashboard/icons';
import { ClothingArt, Tri } from '../shared/icons';
import type { Catalog, Category, Item } from './data';

type Props = {
  id: string;
  num: string;
  title: string;
  sub: string;
  noun: string;
  cats: Category[];
  cat: Category;
  catalog: Catalog;
  items: Item[];
  offset: number;
  isWorn: (it: Item) => boolean;
  hint?: string;
  onTab: (c: Category) => void;
  onShift: (delta: number) => void;
  onPick: (it: Item) => void;
  onAdd: () => void;
  onEdit: (it: Item) => void;
  onRemove: (it: Item) => void;
  onNewCategory: () => void;
  onEditCategory: (c: Category) => void;
};

const PER_PAGE = 3;

/** One closet row: category tabs in the header, a wrapping 3-item carousel, and "+ Add your own" as the footer. */
export function CategoryRow(p: Props) {
  const n = p.items.length;
  const off = n ? ((p.offset % n) + n) % n : 0;
  const label = p.catalog.label;
  const visible = Array.from({ length: Math.min(PER_PAGE, n) }, (_, i) => p.items[(off + i) % n]);

  return (
    <Panel
      id={p.id}
      title={`${p.num} ${p.title}`}
      sub={p.sub}
      actions={
        <div role="group" aria-label={`${p.title} categories`} className="cl-tabs">
          {p.cats.map((c) => (
            <button
              key={c}
              type="button"
              className={`cl-tab px${c === p.cat ? ' on' : ''}`}
              aria-pressed={c === p.cat}
              onClick={() => p.onTab(c)}
            >
              {label(c)}
            </button>
          ))}
          {p.catalog.isCustom(p.cat) && (
            <button
              type="button"
              className="cl-tab cl-tab-icon"
              aria-label={`Rename or delete ${label(p.cat)}`}
              onClick={() => p.onEditCategory(p.cat)}
            >
              <Icon name="pencil" size={13} />
            </button>
          )}
          <button
            type="button"
            className="cl-tab cl-tab-icon px"
            aria-label={`Add a category to ${p.title}`}
            title="Add your own category"
            onClick={p.onNewCategory}
          >
            +
          </button>
        </div>
      }
      footer={{ label: `+ Add your own ${label(p.cat).toLowerCase()}`, onClick: p.onAdd }}
    >
      {n === 0 ? (
        <div className="cl-empty-row">
          <p>
            Nothing in <strong>{label(p.cat)}</strong> yet.
          </p>
          <button type="button" className="fx-btn fx-btn-pink px" onClick={p.onAdd}>
            <Icon name="camera" size={14} /> Add a photo
          </button>
        </div>
      ) : (
      <div className="cl-carousel">
        <button type="button" className="cl-arrow" onClick={() => p.onShift(-1)} aria-label={`Previous ${p.noun}`}>
          <Tri dir="left" double width={24} height={14} />
        </button>
        <div className="cl-tiles">
          {visible.map((it) => {
            const sel = p.isWorn(it);
            return (
              <div key={it.id} className="cl-tile-wrap">
                <button
                  type="button"
                  className={`cl-tile${sel ? ' on' : ''}`}
                  aria-pressed={sel}
                  onClick={() => p.onPick(it)}
                >
                  <span className="cl-art">
                    <ClothingArt shape={it.shape} color={it.color} img={it.img} />
                  </span>
                  <span className="cl-name">{it.name}</span>
                  {sel && <span className="cl-badge px">Wearing</span>}
                </button>
                {it.img && (
                  <div className="cl-own">
                    <button type="button" className="cl-own-btn" aria-label={`Edit ${it.name}`} onClick={() => p.onEdit(it)}>
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      type="button"
                      className="cl-own-btn px"
                      aria-label={`Remove ${it.name} from closet`}
                      onClick={() => p.onRemove(it)}
                    >
                      x
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" className="cl-arrow" onClick={() => p.onShift(1)} aria-label={`Next ${p.noun}`}>
          <Tri dir="right" double width={24} height={14} />
        </button>
      </div>
      )}
      <p className="cl-info">
        {n} {label(p.cat).toLowerCase()} in your closet{p.hint ? ` · ${p.hint}` : ''}
      </p>
    </Panel>
  );
}
