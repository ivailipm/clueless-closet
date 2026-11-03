import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../dashboard/icons';
import { Panel } from '../dashboard/parts';
import { ClothingArt } from '../shared/icons';
import { fileToDataUrl } from '../shared/image';
import { useInsideBackground } from '../shared/InsideBackground';
import { OsWindow } from '../shared/OsWindow';
import { HANDLE } from '../dashboard/data';
import { logActivity } from '../dashboard/activityLog';
import { CategoryRow } from './CategoryRow';
import { ClothesDialog, type ClothesDraft } from './ClothesDialog';
import { addOutfit, createCollection, mapOutfits } from './collections';
import { CategoryDialog, type CategoryDraft } from './CategoryDialog';
import {
  INITIAL_CLOSET, STYLE_COLOR, builtIn, catalog, extraIds, layerIds,
  type Category, type ClosetState, type Item, type Look, type RowKey,
} from './data';
import { Layers } from './Layers';
import { OutfitThumb } from './OutfitThumb';
import { SaveDialog, type SaveTarget } from './SaveDialog';
import { useClosetState, useItems } from './store';

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
  const [s, setS] = useClosetState();
  const inside = useInsideBackground('closet');
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingCat, setPendingCat] = useState<Category>('tops');
  const [draft, setDraft] = useState<ClothesDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [catDraft, setCatDraft] = useState<CategoryDraft | null>(null);
  const [shelf, setShelf] = useState<string | null>(s.lastCollection);

  const { itemsOf, get } = useItems(s.added);
  /** Built-in categories plus the ones you added. */
  const cats = catalog(s.customCats);
  const itemsIn = (c: Category) => itemsOf[c] ?? [];
  const navigate = useNavigate();
  const current = s.collections.find((c) => c.id === shelf) ?? s.collections[0];
  const resolve = (ids: string[]) => ids.map(get).filter((x): x is Item => !!x);

  const layers = resolve(layerIds(s.wearing));
  const bottom = get(s.wearing.bottom);
  const extras = extraIds(s.wearing).map(get).filter((x): x is Item => !!x);
  const total = Object.values(itemsOf).reduce((n, l) => n + l.length, 0);
  const wearingCount = layers.length + (bottom ? 1 : 0) + extras.length;

  // Top-half pieces live in `layers`, extras in `acc`: one per category, tap again to take off.
  const slotOf = (key: RowKey) => (key === 'top' ? 'layers' : 'acc') as 'layers' | 'acc';

  /** Put `it` on (replacing whatever was in its slot). */
  const putOn = (l: Look, it: Item): Look => {
    const key = cats.rowOf(it.cat);
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
    tab: { ...st.tab, [cats.rowOf(cat)]: cat },
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
        const it: Item = { id: 'u' + Date.now(), cat: d.cat, name: d.name, img: d.img, color: '#FFFFFF', shape: cats.shape(d.cat) };
        const index = builtIn(d.cat).length + st.added.filter((a) => a.cat === d.cat).length;
        return { ...st, ...reveal(st, d.cat, index), added: [...st.added, it], wearing: putOn(st.wearing, it) };
      }
      const old = st.added.find((a) => a.id === d.id);
      if (!old) return st;
      const it: Item = { ...old, name: d.name, img: d.img, cat: d.cat, shape: cats.shape(d.cat) };
      const added = st.added.map((a) => (a.id === it.id ? it : a));
      if (old.cat === d.cat) return { ...st, added };
      // New category: move it to the matching slot in the outfit and saved looks.
      const move = (l: Look) => relocate(l, it.id, (x) => putOn(x, it));
      const index = builtIn(d.cat).length + added.filter((a) => a.cat === d.cat).findIndex((a) => a.id === it.id);
      return mapOutfits(
        { ...st, ...reveal(st, d.cat, index), added, wearing: move(st.wearing) },
        (o) => ({ ...o, ...move(o) }),
        isEmpty,
      );
    });
    setDraft(null);
  };

  /** Remove uploaded items and anything that still points at them. */
  const purgeState = (st: ClosetState, ids: Set<string>) => {
    const clean = (l: Look) => [...ids].reduce((acc, id) => relocate(acc, id), l);
    return mapOutfits(
      { ...st, added: st.added.filter((a) => !ids.has(a.id)), wearing: clean(st.wearing) },
      (o) => ({ ...o, ...clean(o) }),
      isEmpty,
    );
  };
  const purge = (ids: Set<string>) => setS((st) => purgeState(st, ids));

  // ---- Your own categories ----
  const saveCategory = (d: CategoryDraft) => {
    setS((st) => {
      if (d.id) return { ...st, customCats: st.customCats.map((c) => (c.id === d.id ? { ...c, name: d.name } : c)) };
      const id = 'c-' + Date.now().toString(36);
      return { ...st, customCats: [...st.customCats, { id, name: d.name, row: d.row }], tab: { ...st.tab, [d.row]: id } };
    });
    setCatDraft(null);
  };
  const deleteCategory = (id: string) => {
    const c = s.customCats.find((x) => x.id === id);
    const pieces = s.added.filter((a) => a.cat === id);
    if (!c || !confirm(`Delete "${c.name}"${pieces.length ? ` and the ${pieces.length} piece${pieces.length > 1 ? 's' : ''} in it` : ''}?`)) return;
    setS((st) => {
      const next = purgeState(st, new Set(pieces.map((p) => p.id)));
      const firstCat = cats.rows.find((r) => r.key === c.row)!.cats[0];
      return {
        ...next,
        customCats: next.customCats.filter((x) => x.id !== id),
        tab: next.tab[c.row] === id ? { ...next.tab, [c.row]: firstCat } : next.tab,
      };
    });
    setCatDraft(null);
  };
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
      const pick = (c: Category) => (itemsIn(c).length ? rand(itemsIn(c)).id : null);
      const filled = (list: Category[]) => list.filter((c) => itemsIn(c).length);
      const [topRow, bottomRow, accRow] = cats.rows;
      const acc: Look['acc'] = {};
      accRow.cats.forEach((c) => (acc[c] = Math.random() < 0.35 ? pick(c) : null));
      // A base top (tee, shirt or one of your own top categories), sometimes a tee under it, sometimes a sweater over.
      const layers: Look['layers'] = {};
      const bases = filled(topRow.cats.filter((c) => c !== 'sweaters'));
      const base = bases.length ? rand(bases) : null;
      if (base) layers[base] = pick(base);
      if (base && base !== 'tops' && Math.random() < 0.3) layers.tops = pick('tops');
      if (Math.random() < 0.4) layers.sweaters = pick('sweaters');
      const bottoms = filled(bottomRow.cats);
      return { ...st, wearing: { layers, bottom: bottoms.length ? pick(rand(bottoms)) : null, acc } };
    });
  const save = () => {
    if (isEmpty(s.wearing)) return alert('Put something on first, then save the outfit.');
    setSaving(true);
  };
  /** Save the current outfit into an existing or brand-new collection. */
  const saveTo = (target: SaveTarget, outfitName: string) => {
    let st = s;
    let colId: string;
    if ('id' in target) colId = target.id;
    else {
      const made = createCollection(st, target.name, target.style);
      if (!made) return;
      st = made.state;
      colId = made.col.id;
      logActivity('create', `created ${HANDLE}/${made.col.name}`);
    }
    const col = st.collections.find((c) => c.id === colId)!;
    setS(addOutfit(st, colId, st.wearing, outfitName));
    logActivity('push', `saved "${outfitName.trim() || 'Untitled look'}" to ${HANDLE}/${col.name}`);
    setShelf(colId);
    setSaving(false);
  };
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
            { label: 'Remove my uploads…', disabled: s.added.length === 0, onSelect: removeAllOwn },
            { separator: true },
            {
              label: 'Reset closet…',
              onSelect: () =>
                confirm('Reset the closet? This removes your uploads and all collections.') && setS(INITIAL_CLOSET),
            },
          ],
        },
      ]}
      footer={
        <>
          <span className="fx-pill-small px">
            <Icon name="heart" size={11} /> {total} items · wearing {wearingCount} · {s.collections.length} collections{' '}
            <Icon name="heart" size={11} />
          </span>
          <div className="fx-tools">
            <button type="button" className="fx-tool px" onClick={() => startAdd(s.tab.top)}>
              <Icon name="camera" size={15} /> Add clothes
            </button>
            <button type="button" className="fx-tool px" onClick={inside.openUpload} title="Photo for the leopard area">
              <Icon name="sparkle" size={15} /> Background
            </button>
            <button
              type="button"
              className="fx-tool px"
              onClick={() => inside.setPattern(inside.pattern === 'lace' && !inside.showingPhoto ? 'leopard' : 'lace')}
            >
              {inside.pattern === 'lace' && !inside.showingPhoto ? 'Leopard print' : 'Red lace'}
            </button>
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
          {cats.rows.map((r) => {
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
                catalog={cats}
                items={itemsIn(cat)}
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
                onNewCategory={() => setCatDraft({ row: r.key, name: '' })}
                onEditCategory={(c) =>
                  setCatDraft({ id: c, row: r.key, name: cats.label(c), count: s.added.filter((a) => a.cat === c).length })
                }
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

          <Panel
            id="h-saved"
            title="My collections"
            icon="star"
            footer={{ label: 'Manage in Code Closet', onClick: () => navigate('/dashboard') }}
          >
            {s.collections.length ? (
              <>
                <div role="group" aria-label="Collection" className="cl-shelf-tabs">
                  {s.collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`cl-tab px${current?.id === c.id ? ' on' : ''}`}
                      aria-pressed={current?.id === c.id}
                      onClick={() => setShelf(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {current && (
                  <p className="fx-muted fx-small fx-pad" style={{ margin: 0 }}>
                    <span className="fx-chip" style={{ background: STYLE_COLOR[current.style] }}>
                      {current.style}
                    </span>{' '}
                    {current.outfits.length} outfit{current.outfits.length === 1 ? '' : 's'} · tap one to wear it
                  </p>
                )}
                {current?.outfits.length ? (
                  <div className="cl-grid3">
                    {current.outfits.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className="cl-mini cl-look"
                        aria-label={`Wear ${o.name}`}
                        onClick={() =>
                          setS((st) => ({ ...st, wearing: { layers: { ...o.layers }, bottom: o.bottom, acc: { ...o.acc } } }))
                        }
                      >
                        <OutfitThumb look={o} get={get} size="sm" />
                        <span className="cl-mini-name">{o.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="fx-empty">No outfits in this collection yet. Hit Save outfit and pick it.</p>
                )}
              </>
            ) : (
              <p className="fx-empty">
                Hit Save outfit to start your first collection, like <em>winter-outfits</em>. Collections show up as repos in
                Code Closet.
              </p>
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
                      <span className="fx-muted fx-small"> · {cats.label(a.cat)}</span>
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

      <SaveDialog
        open={saving}
        look={s.wearing}
        collections={s.collections}
        defaultId={s.lastCollection}
        get={get}
        onSave={saveTo}
        onClose={() => setSaving(false)}
      />
      <CategoryDialog draft={catDraft} onSave={saveCategory} onDelete={deleteCategory} onClose={() => setCatDraft(null)} />
      <ClothesDialog draft={draft} cat={cats} onSave={saveDraft} onRemove={(id) => removeOwn({ id, name: get(id)?.name ?? 'this' })} onClose={() => setDraft(null)} />
    </OsWindow>
  );
}
