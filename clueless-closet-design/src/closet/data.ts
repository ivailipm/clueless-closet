import type { ShapeName } from '../shared/theme';

export type BuiltInCategory =
  | 'tops' | 'sweaters' | 'shirts'
  | 'jeans' | 'skirts' | 'trousers'
  | 'jackets' | 'bags' | 'scarves' | 'gloves' | 'hats';

/** A built-in category, or the id of one you made (`c-…`). */
export type Category = string;

export type Item = { id: string; cat: Category; name: string; color: string; shape: ShapeName; img?: string };

export type RowKey = 'top' | 'bottom' | 'acc';

/** A category you added to a row, e.g. "Going out tops" in the top half or "Jewellery" in extras. */
export type CustomCategory = { id: string; name: string; row: RowKey };

export const TOPS: BuiltInCategory[] = ['tops', 'sweaters', 'shirts'];
export const BOTTOMS: BuiltInCategory[] = ['jeans', 'skirts', 'trousers'];
export const EXTRAS: BuiltInCategory[] = ['jackets', 'bags', 'scarves', 'gloves', 'hats'];

export const ROWS: { key: RowKey; num: string; title: string; sub: string; cats: BuiltInCategory[]; noun: string }[] = [
  { key: 'top', num: '01', title: 'Top half', sub: 'layer it!', cats: TOPS, noun: 'tops' },
  { key: 'bottom', num: '02', title: 'Bottom half', sub: 'pick one', cats: BOTTOMS, noun: 'bottoms' },
  { key: 'acc', num: '03', title: 'Extras', sub: 'accessorize!', cats: EXTRAS, noun: 'extras' },
];

const SHAPE: Record<BuiltInCategory, ShapeName> = {
  tops: 'tee', sweaters: 'knit', shirts: 'knit',
  jeans: 'pants', skirts: 'skirt', trousers: 'pants',
  jackets: 'jacket', bags: 'bag', scarves: 'scarf', gloves: 'glove', hats: 'hat',
};
/** Fallback drawing for pieces in your own categories (they always have a photo, so this rarely shows). */
const ROW_SHAPE: Record<RowKey, ShapeName> = { top: 'tee', bottom: 'skirt', acc: 'bag' };

const LABELS: Record<BuiltInCategory, string> = {
  tops: 'Tops', sweaters: 'Sweaters', shirts: 'Shirts',
  jeans: 'Jeans', skirts: 'Skirts', trousers: 'Trousers',
  jackets: 'Jackets', bags: 'Bags', scarves: 'Scarves', gloves: 'Gloves', hats: 'Hats',
};

const isBuiltIn = (c: Category): c is BuiltInCategory => c in LABELS;

/**
 * Everything about categories, built-in plus your own: which row each is in, its label and fallback shape.
 * Build it once per render with `catalog(state.customCats)`.
 */
export function catalog(custom: CustomCategory[]) {
  const byId = new Map(custom.map((c) => [c.id, c]));
  const rows = ROWS.map((r) => ({ ...r, cats: [...r.cats, ...custom.filter((c) => c.row === r.key).map((c) => c.id)] as Category[] }));
  const rowOf = (c: Category): RowKey =>
    isBuiltIn(c) ? (TOPS.includes(c) ? 'top' : BOTTOMS.includes(c) ? 'bottom' : 'acc') : byId.get(c)?.row ?? 'acc';
  return {
    rows,
    rowOf,
    label: (c: Category) => (isBuiltIn(c) ? LABELS[c] : byId.get(c)?.name ?? 'Other'),
    shape: (c: Category): ShapeName => (isBuiltIn(c) ? SHAPE[c] : ROW_SHAPE[rowOf(c)]),
    isCustom: (c: Category) => byId.has(c),
    extras: rows[2].cats,
  };
}
export type Catalog = ReturnType<typeof catalog>;

const RAW: Record<BuiltInCategory, [string, string][]> = {
  tops: [['White baby tee', '#F6F3EE'], ['Cherry crop top', '#D94155'], ['Lilac tee', '#C9B6E4'], ['Butter tank', '#F7DC6F'], ['Black fitted tee', '#2B2B33'], ['Mint tee', '#A8E0C8']],
  sweaters: [['Cream cable knit', '#EFE6D2'], ['Pink mohair', '#F4A9C0'], ['Navy v-neck', '#2E3A6B'], ['Sage cardigan', '#A9BFA0'], ['Oatmeal turtleneck', '#D9C7A7']],
  shirts: [['Oxford blue shirt', '#A9C3E8'], ['White button-up', '#FAFAFA'], ['Red gingham shirt', '#E57373'], ['Striped shirt', '#DCE6F2']],
  jeans: [['Light wash jeans', '#9DB8D9'], ['Dark rinse jeans', '#3A4F7A'], ['Black skinny jeans', '#2B2B33'], ['White denim', '#F3F1EC'], ['Mom jeans', '#7C9CC4']],
  skirts: [['Yellow plaid mini', '#F2C94C'], ['Black pleated skirt', '#2B2B33'], ['Pink satin skirt', '#F2B5C8'], ['Denim mini', '#6F8FBF'], ['Red plaid skirt', '#B83A4B']],
  trousers: [['Camel trousers', '#C19A6B'], ['Grey wide-leg', '#9A9AA3'], ['Black tailored', '#2B2B33'], ['Cream linen', '#EDE4D3']],
  jackets: [['Denim jacket', '#6F8FBF'], ['Yellow plaid blazer', '#E8C547'], ['Leather biker', '#2B2B33'], ['Pink faux fur', '#F6B8CC']],
  bags: [['Black mini bag', '#2B2B33'], ['Pink baguette', '#E86A92'], ['Tan tote', '#C9A37A'], ['White micro bag', '#F6F3EE']],
  scarves: [['Red knit scarf', '#C0392B'], ['Cream wool scarf', '#EFE6D2'], ['Plaid scarf', '#D4A84B']],
  gloves: [['Black leather gloves', '#2B2B33'], ['Pink knit mittens', '#F4A9C0'], ['Cream mittens', '#EFE6D2']],
  hats: [['Pink bucket hat', '#F2B5C8'], ['Black beanie', '#2B2B33'], ['Cream beret', '#EFE6D2']],
};

export const BUILT_IN: Partial<Record<Category, Item[]>> = Object.fromEntries(
  (Object.keys(RAW) as BuiltInCategory[]).map((c) => [
    c,
    RAW[c].map(([name, color], i): Item => ({ id: c + i, cat: c, name, color, shape: SHAPE[c] })),
  ]),
);

/** Built-in items in a category (none for your own categories). */
export const builtIn = (c: Category): Item[] => BUILT_IN[c] ?? [];

/**
 * Top-half layers, back to front: tee, then your own top categories, then shirt, then sweater.
 * (A "going out top" sits with the tees, under shirts and sweaters.)
 */
const LAYER_FRONT: Category[] = ['shirts', 'sweaters'];

type Slots = Partial<Record<Category, string | null>>;

/**
 * Ids of worn items. Ids (not whole items) keep saved looks small in localStorage.
 * `layers` holds one id per top category so they can be layered; `acc` one per extras category.
 */
export type Look = { layers: Slots; bottom: string | null; acc: Slots };

/** The "language" chip on a collection card. */
export const STYLES = ['Casual', 'Cozy', 'Party', 'Work', 'Date night', 'Sporty', 'Vacation', 'Chic'] as const;
export type Style = (typeof STYLES)[number];
export const STYLE_COLOR: Record<Style, string> = {
  Casual: '#9DB8D9', Cozy: '#E8C9A0', Party: '#F29BC3', Work: '#B9B4E8',
  'Date night': '#E57373', Sporty: '#A8E0C8', Vacation: '#F7DC6F', Chic: '#D9D4CC',
};

/** A saved outfit inside a collection. */
export type Outfit = Look & { id: string; name: string; savedAt: number };

/** A collection of outfits, shown on the dashboard as a repo (e.g. ivailipm/winter-outfits). */
export type Collection = {
  id: string;
  name: string;
  style: Style;
  outfits: Outfit[];
  starred: boolean;
  /** Times it was forked. */
  forks: number;
  forkOf?: string;
  createdAt: number;
  /** Last time an outfit was saved, changed or removed; null until then. */
  updatedAt: number | null;
};

export type ClosetState = {
  tab: Record<RowKey, Category>;
  off: Partial<Record<Category, number>>;
  wearing: Look;
  added: Item[];
  /** Categories you added to the rows. */
  customCats: CustomCategory[];
  collections: Collection[];
  /** Collection Save outfit picks by default. */
  lastCollection: string | null;
};

export const INITIAL_CLOSET: ClosetState = {
  tab: { top: 'tops', bottom: 'skirts', acc: 'jackets' },
  off: {},
  wearing: { layers: { tops: 'tops1' }, bottom: 'skirts0', acc: { bags: 'bags1' } },
  added: [],
  customCats: [],
  collections: [],
  lastCollection: null,
};

export const CLOSET_KEY = 'closet';

type OldLook = Look & { top?: string | null; id?: string };

/**
 * Upgrade older saves:
 * - a single `top` id moves into its category's layer slot;
 * - the old flat `saved` list becomes a starter collection called "my-looks".
 */
export function migrateCloset(raw: ClosetState & { saved?: OldLook[] }): ClosetState {
  const catOf = (id: string): Category | undefined =>
    raw.added?.find((a) => a.id === id)?.cat ??
    Object.keys(BUILT_IN).find((c) => builtIn(c).some((i) => i.id === id));
  const fix = <L extends Look>(l: L & { top?: string | null }): L => {
    if (l.layers) return l;
    const { top, ...rest } = l;
    const cat = top ? catOf(top) : undefined;
    return { ...rest, layers: cat ? { [cat]: top } : {} } as unknown as L;
  };
  const { saved, ...st } = raw;
  let collections = st.collections ?? [];
  if (saved?.length && !collections.length) {
    const now = Date.now();
    collections = [
      {
        id: 'my-looks',
        name: 'my-looks',
        style: 'Casual',
        starred: false,
        forks: 0,
        createdAt: now,
        updatedAt: now,
        outfits: saved.map((o, i) => {
          const l = fix(o);
          return {
            layers: l.layers, bottom: l.bottom, acc: l.acc,
            id: o.id ?? String(now + i), name: `Look ${saved.length - i}`, savedAt: Number(o.id) || now,
          };
        }),
      },
    ];
  }
  return { ...st, wearing: fix(st.wearing), collections, lastCollection: st.lastCollection ?? collections[0]?.id ?? null };
}

/** Worn top-half items, back to front. */
export function layerIds(l: Look): string[] {
  const cats = Object.keys(l.layers ?? {});
  const back = ['tops', ...cats.filter((c) => c !== 'tops' && !LAYER_FRONT.includes(c))];
  return [...back, ...LAYER_FRONT].map((c) => l.layers?.[c]).filter((x): x is string => !!x);
}

/** Worn extras: built-in order first, then your own extras categories. */
export function extraIds(l: Look): string[] {
  const cats = Object.keys(l.acc ?? {});
  const order = [...EXTRAS, ...cats.filter((c) => !EXTRAS.includes(c as BuiltInCategory))];
  return order.map((c) => l.acc?.[c]).filter((x): x is string => !!x);
}
