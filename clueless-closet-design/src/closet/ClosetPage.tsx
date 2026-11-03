import { useMemo } from 'react';
import { ClothingArt } from '../shared/icons';
import { OsWindow } from '../shared/OsWindow';
import { usePersistentState } from '../shared/storage';
import { CategoryRow } from './CategoryRow';
import {
  BOTTOMS, BUILT_IN, CLOSET_KEY, EXTRAS, INITIAL_CLOSET, MAX_SAVED, ROWS, SHAPE, TOPS,
  type Category, type ClosetState, type Item, type Look, type RowKey,
} from './data';

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function Piece({ item, w, h }: { item: Item | null; w: number; h: number }) {
  if (!item) return null;
  return (
    <div style={{ width: w, height: h }}>
      <ClothingArt shape={item.shape} color={item.color} img={item.img} />
    </div>
  );
}

export function ClosetPage() {
  const [s, setS] = usePersistentState<ClosetState>(CLOSET_KEY, INITIAL_CLOSET, () =>
    alert('Your closet is full: the browser could not store that photo. Try a smaller image.'),
  );

  const itemsOf = useMemo(() => {
    const map = {} as Record<Category, Item[]>;
    (Object.keys(BUILT_IN) as Category[]).forEach((c) => {
      map[c] = BUILT_IN[c].concat(s.added.filter((a) => a.cat === c));
    });
    return map;
  }, [s.added]);

  const byId = useMemo(() => {
    const m = new Map<string, Item>();
    Object.values(itemsOf).forEach((list) => list.forEach((it) => m.set(it.id, it)));
    return m;
  }, [itemsOf]);
  const get = (id: string | null | undefined) => (id ? byId.get(id) ?? null : null);

  const top = get(s.wearing.top);
  const bottom = get(s.wearing.bottom);
  const extras = EXTRAS.map((c) => get(s.wearing.acc[c])).filter((x): x is Item => !!x);
  const total = Object.values(itemsOf).reduce((n, l) => n + l.length, 0);

  const isWorn = (key: RowKey) => (it: Item) =>
    key === 'acc' ? s.wearing.acc[it.cat] === it.id : s.wearing[key] === it.id;

  const wear = (key: RowKey, it: Item) =>
    setS((st) => {
      if (key === 'acc') {
        const cur = st.wearing.acc[it.cat];
        return { ...st, wearing: { ...st.wearing, acc: { ...st.wearing.acc, [it.cat]: cur === it.id ? null : it.id } } };
      }
      return { ...st, wearing: { ...st.wearing, [key]: it.id } };
    });

  const addOwn = (key: RowKey, cat: Category, img: string, file: File) =>
    setS((st) => {
      const it: Item = {
        id: 'u' + Date.now(),
        cat,
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My item',
        img,
        color: '#FFFFFF',
        shape: SHAPE[cat],
      };
      const count = BUILT_IN[cat].length + st.added.filter((a) => a.cat === cat).length + 1;
      const wearing: Look =
        key === 'acc' ? { ...st.wearing, acc: { ...st.wearing.acc, [cat]: it.id } } : { ...st.wearing, [key]: it.id };
      return {
        ...st,
        added: [...st.added, it],
        off: { ...st.off, [cat]: Math.max(0, count - 3) },
        tab: { ...st.tab, [key]: cat },
        wearing,
      };
    });

  /** Remove uploaded items and anything that still points at them. */
  const purge = (ids: Set<string>) =>
    setS((st) => {
      const drop = (id: string | null | undefined) => (id && ids.has(id) ? null : id ?? null);
      const clean = (l: Look): Look => ({
        top: drop(l.top),
        bottom: drop(l.bottom),
        acc: Object.fromEntries(Object.entries(l.acc).map(([c, id]) => [c, drop(id)])),
      });
      return {
        ...st,
        added: st.added.filter((a) => !ids.has(a.id)),
        wearing: clean(st.wearing),
        saved: st.saved
          .map((o) => ({ ...clean(o), id: o.id }))
          .filter((o) => o.top || o.bottom || Object.values(o.acc).some(Boolean)),
      };
    });

  const removeOwn = (it: Item) => confirm(`Remove "${it.name}" from your closet?`) && purge(new Set([it.id]));
  const removeAllOwn = () =>
    confirm(`Remove all ${s.added.length} clothes you uploaded? Built-in clothes stay.`) &&
    purge(new Set(s.added.map((a) => a.id)));

  const shuffle = () =>
    setS((st) => {
      const acc: Look['acc'] = {};
      EXTRAS.forEach((c) => (acc[c] = Math.random() < 0.35 ? rand(itemsOf[c]).id : null));
      return { ...st, wearing: { top: rand(itemsOf[rand(TOPS)]).id, bottom: rand(itemsOf[rand(BOTTOMS)]).id, acc } };
    });

  const save = () =>
    setS((st) => ({
      ...st,
      saved: [{ ...st.wearing, acc: { ...st.wearing.acc }, id: String(Date.now()) }, ...st.saved].slice(0, MAX_SAVED),
    }));

  const clear = () => setS((st) => ({ ...st, wearing: { top: null, bottom: null, acc: {} } }));

  return (
    <OsWindow
      app="closet"
      title="My Closet.exe"
      subtitle="pick · match · save"
      menus={[
        {
          label: 'File',
          items: [
            { label: 'Save outfit', onSelect: save },
            { label: 'Clear outfit', onSelect: clear },
          ],
        },
        {
          label: 'Edit',
          items: [
            { label: 'Shuffle outfit', onSelect: shuffle },
            {
              label: 'Take off all extras',
              disabled: extras.length === 0,
              onSelect: () => setS((st) => ({ ...st, wearing: { ...st.wearing, acc: {} } })),
            },
          ],
        },
        {
          label: 'Closet',
          items: [
            {
              label: 'Delete saved looks',
              disabled: s.saved.length === 0,
              onSelect: () => confirm('Delete all saved looks?') && setS((st) => ({ ...st, saved: [] })),
            },
            { label: 'Remove my uploads…', disabled: s.added.length === 0, onSelect: removeAllOwn },
            { separator: true },
            {
              label: 'Reset closet…',
              onSelect: () =>
                confirm('Reset the closet? This removes your uploads and saved looks.') && setS(INITIAL_CLOSET),
            },
          ],
        },
        { label: 'Help', items: [] },
      ]}
      footer={
        <>
          <span className="sunk grow">{total} items in closet</span>
          <span className="sunk grow">Wearing {(top ? 1 : 0) + (bottom ? 1 : 0) + extras.length} pieces</span>
          <span className="sunk grow">{s.saved.length} saved looks</span>
        </>
      }
    >
      <div className="content content-white">
        <main className="closet-main">
          {ROWS.map((r) => {
            const cat = s.tab[r.key];
            return (
              <CategoryRow
                key={r.key}
                num={r.num}
                title={r.title}
                noun={r.noun}
                cats={r.cats}
                cat={cat}
                items={itemsOf[cat]}
                offset={s.off[cat] ?? 0}
                isWorn={isWorn(r.key)}
                toggleHint={r.key === 'acc'}
                dashed={r.key === 'acc'}
                onTab={(c) => setS((st) => ({ ...st, tab: { ...st.tab, [r.key]: c } }))}
                onShift={(d) => setS((st) => ({ ...st, off: { ...st.off, [cat]: (st.off[cat] ?? 0) + d } }))}
                onPick={(it) => wear(r.key, it)}
                onAdd={(url, file) => addOwn(r.key, cat, url, file)}
                onRemove={removeOwn}
              />
            );
          })}
        </main>

        <aside aria-labelledby="h-out" className="outfit">
          <h2 id="h-out" className="px label">
            Today's outfit
          </h2>

          <div className="mannequin">
            {top ? (
              <>
                <Piece item={top} w={180} h={150} />
                <span className="piece-name">{top.name}</span>
              </>
            ) : (
              <div className="empty" style={{ width: 180, height: 150 }}>
                Pick a top
              </div>
            )}
            {bottom ? (
              <>
                <Piece item={bottom} w={180} h={170} />
                <span className="piece-name">{bottom.name}</span>
              </>
            ) : (
              <div className="empty" style={{ width: 180, height: 170 }}>
                Pick a bottom
              </div>
            )}
          </div>

          <div className="stack">
            <h3 className="px h3">Extras</h3>
            {extras.length ? (
              <div className="grid3">
                {extras.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className="mini-card"
                    onClick={() => wear('acc', x)}
                    aria-label={`Take off ${x.name}`}
                  >
                    <span style={{ display: 'block', height: 64 }}>
                      <ClothingArt shape={x.shape} color={x.color} img={x.img} />
                    </span>
                    <span className="mini-name">{x.name}</span>
                    <span aria-hidden="true" className="px mini-x">
                      x
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="hint">Tap a jacket, bag, scarf, gloves or hat to add it.</p>
            )}
          </div>

          <div className="actions">
            <button type="button" className="btn btn-lg" onClick={shuffle}>
              Shuffle
            </button>
            <button type="button" className="btn btn-lg btn-accent" onClick={save}>
              Save outfit
            </button>
            <button type="button" className="btn btn-lg" onClick={clear}>
              Clear
            </button>
          </div>

          <div className="stack saved">
            <h3 className="px h3">Saved looks ({s.saved.length})</h3>
            {s.saved.length ? (
              <div className="grid3">
                {s.saved.map((o, i) => {
                  const n = s.saved.length - i;
                  const t = get(o.top);
                  const b = get(o.bottom);
                  const count = EXTRAS.filter((c) => get(o.acc[c])).length;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="look"
                      aria-label={`Wear saved look ${n}`}
                      onClick={() => setS((st) => ({ ...st, wearing: { top: o.top, bottom: o.bottom, acc: { ...o.acc } } }))}
                    >
                      <span style={{ display: 'block', width: '100%', height: 44 }}>
                        {t && <ClothingArt shape={t.shape} color={t.color} img={t.img} />}
                      </span>
                      <span style={{ display: 'block', width: '100%', height: 48 }}>
                        {b && <ClothingArt shape={b.shape} color={b.color} img={b.img} />}
                      </span>
                      <span className="look-label">
                        {count ? `+${count} extra${count > 1 ? 's' : ''}` : `Look ${n}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="hint">Hit Save outfit and your looks show up here. Tap one to wear it again.</p>
            )}
          </div>
        </aside>
      </div>
    </OsWindow>
  );
}
