import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../dashboard/icons';
import { Panel } from '../dashboard/parts';
import { ClothingArt } from '../shared/icons';
import { fileToDataUrl } from '../shared/image';
import { useInsideBackground } from '../shared/InsideBackground';
import { OsWindow } from '../shared/OsWindow';
import { usePersistentState } from '../shared/storage';
import { CategoryRow } from './CategoryRow';
import { ClothesDialog, type ClothesDraft } from './ClothesDialog';
import {
  BOTTOMS, BUILT_IN, CLOSET_KEY, EXTRAS, INITIAL_CLOSET, LABELS, MAX_SAVED, ROWS, SHAPE,
  layerIds, migrateCloset, rowOf,
  type Category, type ClosetState, type Item, type Look, type RowKey,
} from './data';
import { Layers } from './Layers';

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** Remove `id` from every slot of a look; if it was worn, put it in `place` instead. */
function relocate(l: Look, id: string, place?: (l: Look) => Look): Look {
  const was = layerIds(l).includes(id) || l.bottom === id || Object.values(l.acc).includes(id);
  const strip = (slots: Look['acc']) =>
    Object.fromEntries(Object.entries(slots).map(([c, v]) => [c, v === id ? null : v]));
  const out: Look = { layers: strip(l.layers), bottom: l.bottom === id ? null : l.bottom, acc: strip(l.acc) };
  return was && place ? place(out) : out;
}

const isEmpty = (l: Look) => !layerIds(l).length && !l.bottom && !Object.values(l.acc).some(Boolean);

export function ClosetPage() {
  const [s, setS] = usePersistentState<ClosetState>(
    CLOSET_KEY,
    INITIAL_CLOSET,
    () => alert('Your closet is full: the browser could not store that photo. Try a smaller image.'),
    migrateCloset,
  );
  const inside = useInsideBackground('closet');
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingCat, setPendingCat] = useState<Category>('tops');
  const [draft, setDraft] = useState<ClothesDraft | null>(null);

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
  const resolve = (ids: string[]) => ids.map(get).filter((x): x is Item => !!x);

  const layers = resolve(layerIds(s.wearing));
  const bottom = get(s.wearing.bottom);
  const extras = EXTRAS.map((c) => get(s.wearing.acc[c])).filter((x): x is Item => !!x);
  const total = Object.values(itemsOf).reduce((n, l) => n + l.length, 0);
  const wearingCount = layers.length + (bottom ? 1 : 0) + extras.length;

  // Top-half pieces live in `layers`, extras in `acc`: one per category, tap again to take off.
  const slotOf = (key: RowKey) => (key === 'top' ? 'layers' : 'acc') as 'layers' | 'acc';

  /** Put `it` on (replacing whatever was in its slot). */
  const putOn = (l: Look, it: Item): Look => {
    const key = rowOf(it.cat);
    if (key === 'bottom') return { ...l, bottom: it.id };
    return { ...l, [slotOf(key)]: { ...l[slotOf(key)], [it.cat]: it.id } };
  };

  const isWorn = (key: RowKey) => (it: Item) =>
    key === 'bottom' ? s.wearing.bottom === it.id : s.wearing[slotOf(key)][it.cat] === it.id;

  const wear = (key: RowKey, it: Item) =>
    setS((st) => {
      if (key === 'bottom') return { ...st, wearing: { ...st.wearing, bottom: it.id } };
      const slot = slotOf(key);
      const cur = st.wearing[slot][it.cat];
      return { ...st, wearing: { ...st.wearing, [slot]: { ...st.wearing[slot], [it.cat]: cur === it.id ? null : it.id } } };
    });

  /** Show `cat` in its row, scrolled so `index` is visible. */
  const reveal = (st: ClosetState, cat: Category, index: number): Partial<ClosetState> => ({
    tab: { ...st.tab, [rowOf(cat)]: cat },
    off: { ...st.off, [cat]: Math.max(0, index - 2) },
  });

  // ---- Adding and editing your own clothes ----
  const startAdd = (cat: Category) => {
    setPendingCat(cat);
    fileInput.current?.click();
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    try {
      const img = await fileToDataUrl(f, 600);
      setDraft({ img, name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 40), cat: pendingCat });
    } catch {
      alert('Sorry, that file could not be opened as an image.');
    }
  };
  const saveDraft = (d: ClothesDraft) => {
    setS((st) => {
      if (!d.id) {
        const it: Item = { id: 'u' + Date.now(), cat: d.cat, name: d.name, img: d.img, color: '#FFFFFF', shape: SHAPE[d.cat] };
        const index = BUILT_IN[d.cat].length + st.added.filter((a) => a.cat === d.cat).length;
        return { ...st, ...reveal(st, d.cat, index), added: [...st.added, it], wearing: putOn(st.wearing, it) };
      }
      const old = st.added.find((a) => a.id === d.id);
      if (!old) return st;
      const it: Item = { ...old, name: d.name, img: d.img, cat: d.cat, shape: SHAPE[d.cat] };
      const added = st.added.map((a) => (a.id === it.id ? it : a));
      if (old.cat === d.cat) return { ...st, added };
      // New category: move it to the matching slot in the outfit and saved looks.
      const move = (l: Look) => relocate(l, it.id, (x) => putOn(x, it));
      const index = BUILT_IN[d.cat].length + added.filter((a) => a.cat === d.cat).findIndex((a) => a.id === it.id);
      return {
        ...st,
        ...reveal(st, d.cat, index),
        added,
        wearing: move(st.wearing),
        saved: st.saved.map((o) => ({ ...move(o), id: o.id })),
      };
    });
    setDraft(null);
  };

  /** Remove uploaded items and anything that still points at them. */
  const purge = (ids: Set<string>) =>
    setS((st) => {
      const clean = (l: Look) => [...ids].reduce((acc, id) => relocate(acc, id), l);
      return {
        ...st,
        added: st.added.filter((a) => !ids.has(a.id)),
        wearing: clean(st.wearing),
        saved: st.saved.map((o) => ({ ...clean(o), id: o.id })).filter((o) => !isEmpty(o)),
      };
    });
  const removeOwn = (it: { id: string; name: string }) => {
    if (!confirm(`Remove "${it.name}" from your closet?`)) return;
    purge(new Set([it.id]));
    setDraft(null);
  };
  const removeAllOwn = () =>
    confirm(`Remove all ${s.added.length} clothes you uploaded? Built-in clothes stay.`) &&
    purge(new Set(s.added.map((a) => a.id)));

  // ---- Outfit actions ----
  const shuffle = () =>
    setS((st) => {
      const acc: Look['acc'] = {};
      EXTRAS.forEach((c) => (acc[c] = Math.random() < 0.35 ? rand(itemsOf[c]).id : null));
      // A tee or shirt as the base, sometimes both, sometimes a sweater on top.
      const layers: Look['layers'] = {};
      const base = rand<Category>(['tops', 'shirts']);
      layers[base] = rand(itemsOf[base]).id;
      if (base === 'shirts' && Math.random() < 0.3) layers.tops = rand(itemsOf.tops).id;
      if (Math.random() < 0.4) layers.sweaters = rand(itemsOf.sweaters).id;
      return { ...st, wearing: { layers, bottom: rand(itemsOf[rand(BOTTOMS)]).id, acc } };
    });
  const save = () =>
    setS((st) => ({
      ...st,
      saved: [
        { layers: { ...st.wearing.layers }, bottom: st.wearing.bottom, acc: { ...st.wearing.acc }, id: String(Date.now()) },
        ...st.saved,
      ].slice(0, MAX_SAVED),
    }));
  const clear = () => setS((st) => ({ ...st, wearing: { layers: {}, bottom: null, acc: {} } }));

  return (
    <OsWindow
      app="closet"
      variant="fashion"
      title="My Closet.exe"
      subtitle="pick · match · save"
      brand="MY CLOSET"
      tagline="PICK · MATCH · SAVE"
      exitLink={{ to: '/dashboard', label: 'Code Closet' }}
      menus={[
        {
          label: 'File',
          items: [
            { label: 'Add clothes…', onSelect: () => startAdd(s.tab.top) },
            { label: 'Save outfit', onSelect: save },
            { label: 'Clear outfit', onSelect: clear },
          ],
        },
        {
          label: 'Edit',
          items: [
            { label: 'Shuffle outfit', onSelect: shuffle },
            {
              label: 'Take off all layers',
              disabled: layers.length === 0,
              onSelect: () => setS((st) => ({ ...st, wearing: { ...st.wearing, layers: {} } })),
            },
            {
              label: 'Take off all extras',
              disabled: extras.length === 0,
              onSelect: () => setS((st) => ({ ...st, wearing: { ...st.wearing, acc: {} } })),
            },
          ],
        },
        { label: 'View', items: inside.menuItems },
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
      ]}
      footer={
        <>
          <span className="fx-pill-small px">
            <Icon name="heart" size={11} /> {total} items · wearing {wearingCount} · {s.saved.length} saved{' '}
            <Icon name="heart" size={11} />
          </span>
          <div className="fx-tools">
            <button type="button" className="fx-tool px" onClick={() => startAdd(s.tab.top)}>
              <Icon name="camera" size={15} /> Add clothes
            </button>
            <button type="button" className="fx-tool px" onClick={inside.openUpload} title="Photo for the leopard area">
              <Icon name="sparkle" size={15} /> Background
            </button>
            {inside.showingPhoto && (
              <button type="button" className="fx-tool px" onClick={inside.hidePhoto}>
                Back to leopard
              </button>
            )}
            <Link to="/dashboard" className="fx-tool px">
              <Icon name="repo" size={15} /> Code Closet
            </Link>
          </div>
        </>
      }
    >
      <div className="fx-content">
        {inside.node}
        <input ref={fileInput} type="file" accept="image/*" className="sr" tabIndex={-1} aria-hidden="true" onChange={onFile} />

        <main className="fx-main cl-main">
          {ROWS.map((r) => {
            const cat = s.tab[r.key];
            return (
              <CategoryRow
                key={r.key}
                id={`h-${r.key}`}
                num={r.num}
                title={r.title}
                sub={r.sub}
                noun={r.noun}
                cats={r.cats}
                cat={cat}
                items={itemsOf[cat]}
                offset={s.off[cat] ?? 0}
                isWorn={isWorn(r.key)}
                hint={
                  r.key === 'top'
                    ? 'layer a tee, shirt and sweater · tap again to take it off'
                    : r.key === 'acc'
                      ? 'tap again to take it off'
                      : undefined
                }
                onTab={(c) => setS((st) => ({ ...st, tab: { ...st.tab, [r.key]: c } }))}
                onShift={(d) => setS((st) => ({ ...st, off: { ...st.off, [cat]: (st.off[cat] ?? 0) + d } }))}
                onPick={(it) => wear(r.key, it)}
                onAdd={() => startAdd(cat)}
                onEdit={(it) => setDraft({ id: it.id, img: it.img!, name: it.name, cat: it.cat })}
                onRemove={removeOwn}
              />
            );
          })}
        </main>

        <aside className="cl-side" aria-label="Outfit">
          <Panel id="h-out" title="Today's outfit" icon="hanger" pink>
            <div className="cl-mannequin">
              {layers.length ? (
                <>
                  <Layers items={layers} w={180} h={150} />
                  <span className="cl-piece">{layers.map((l) => l.name).join(' + ')}</span>
                </>
              ) : (
                <div className="cl-empty" style={{ width: 180, height: 150 }}>
                  Pick a top
                </div>
              )}
              {bottom ? (
                <>
                  <div style={{ width: 180, height: 160 }}>
                    <ClothingArt shape={bottom.shape} color={bottom.color} img={bottom.img} />
                  </div>
                  <span className="cl-piece">{bottom.name}</span>
                </>
              ) : (
                <div className="cl-empty" style={{ width: 180, height: 160 }}>
                  Pick a bottom
                </div>
              )}
            </div>
            <div className="cl-actions">
              <button type="button" className="fx-tool px" onClick={shuffle}>
                <Icon name="shuffle" size={15} /> Shuffle
              </button>
              <button type="button" className="fx-btn fx-btn-pink px cl-save" onClick={save}>
                <Icon name="save" size={15} /> Save outfit
              </button>
              <button type="button" className="fx-tool px" onClick={clear}>
                Clear
              </button>
            </div>
          </Panel>

          <Panel id="h-extras" title="Extras" sub="accessorize!">
            {extras.length ? (
              <div className="cl-grid3">
                {extras.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className="cl-mini"
                    onClick={() => wear('acc', x)}
                    aria-label={`Take off ${x.name}`}
                  >
                    <span style={{ display: 'block', height: 60 }}>
                      <ClothingArt shape={x.shape} color={x.color} img={x.img} />
                    </span>
                    <span className="cl-mini-name">{x.name}</span>
                    <span aria-hidden="true" className="px cl-mini-x">
                      x
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="fx-empty">Tap a jacket, bag, scarf, gloves or hat to add it.</p>
            )}
          </Panel>

          <Panel id="h-saved" title={`Saved looks (${s.saved.length})`} icon="star">
            {s.saved.length ? (
              <div className="cl-grid3">
                {s.saved.map((o, i) => {
                  const n = s.saved.length - i;
                  const t = resolve(layerIds(o));
                  const b = get(o.bottom);
                  const count = EXTRAS.filter((c) => get(o.acc[c])).length;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="cl-mini cl-look"
                      aria-label={`Wear saved look ${n}`}
                      onClick={() =>
                        setS((st) => ({ ...st, wearing: { layers: { ...o.layers }, bottom: o.bottom, acc: { ...o.acc } } }))
                      }
                    >
                      <Layers items={t} w="100%" h={44} />
                      {!t.length && <span style={{ display: 'block', height: 44 }} />}
                      <span style={{ display: 'block', width: '100%', height: 46 }}>
                        {b && <ClothingArt shape={b.shape} color={b.color} img={b.img} />}
                      </span>
                      <span className="fx-small fx-muted">{count ? `+${count} extra${count > 1 ? 's' : ''}` : `Look ${n}`}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="fx-empty">Hit Save outfit and your looks show up here. Tap one to wear it again.</p>
            )}
          </Panel>

          <Panel id="h-mine" title="My uploads" icon="camera">
            <p className="fx-empty" style={{ paddingBottom: 6 }}>
              {s.added.length
                ? `${s.added.length} of your own piece${s.added.length > 1 ? 's' : ''} in the closet. Use the pencil on a piece to rename it or change its category.`
                : 'The clothes here are placeholders. Add photos of your own and pick their category.'}
            </p>
            <div className="fx-pad" style={{ paddingBottom: 12 }}>
              <button type="button" className="fx-btn fx-btn-pink px" onClick={() => startAdd(s.tab.top)}>
                <Icon name="camera" size={14} /> Add clothes
              </button>
            </div>
            {s.added.length > 0 && (
              <ul className="cl-own-list">
                {s.added.map((a) => (
                  <li key={a.id}>
                    <span className="cl-own-thumb">
                      <img src={a.img} alt="" className="fit" />
                    </span>
                    <span className="cl-own-name">
                      {a.name}
                      <span className="fx-muted fx-small"> · {LABELS[a.cat]}</span>
                    </span>
                    <button
                      type="button"
                      className="cl-own-btn"
                      aria-label={`Edit ${a.name}`}
                      onClick={() => setDraft({ id: a.id, img: a.img!, name: a.name, cat: a.cat })}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      <ClothesDialog draft={draft} onSave={saveDraft} onRemove={(id) => removeOwn({ id, name: get(id)?.name ?? 'this' })} onClose={() => setDraft(null)} />
    </OsWindow>
  );
}
