import type { ShapeName } from '../shared/theme';

export type Category =
  | 'tops' | 'sweaters' | 'shirts'
  | 'jeans' | 'skirts' | 'trousers'
  | 'jackets' | 'bags' | 'scarves' | 'gloves' | 'hats';

export type Item = { id: string; cat: Category; name: string; color: string; shape: ShapeName; img?: string };

export type RowKey = 'top' | 'bottom' | 'acc';

export const TOPS: Category[] = ['tops', 'sweaters', 'shirts'];
export const BOTTOMS: Category[] = ['jeans', 'skirts', 'trousers'];
export const EXTRAS: Category[] = ['jackets', 'bags', 'scarves', 'gloves', 'hats'];

export const ROWS: { key: RowKey; num: string; title: string; sub: string; cats: Category[]; noun: string }[] = [
  { key: 'top', num: '01', title: 'Top half', sub: 'layer it!', cats: TOPS, noun: 'tops' },
  { key: 'bottom', num: '02', title: 'Bottom half', sub: 'pick one', cats: BOTTOMS, noun: 'bottoms' },
  { key: 'acc', num: '03', title: 'Extras', sub: 'accessorize!', cats: EXTRAS, noun: 'extras' },
];

/** Which closet row a category belongs to. */
export const rowOf = (c: Category): RowKey => (TOPS.includes(c) ? 'top' : BOTTOMS.includes(c) ? 'bottom' : 'acc');

export const SHAPE: Record<Category, ShapeName> = {
  tops: 'tee', sweaters: 'knit', shirts: 'knit',
  jeans: 'pants', skirts: 'skirt', trousers: 'pants',
  jackets: 'jacket', bags: 'bag', scarves: 'scarf', gloves: 'glove', hats: 'hat',
};

export const LABELS: Record<Category, string> = {
  tops: 'Tops', sweaters: 'Sweaters', shirts: 'Shirts',
  jeans: 'Jeans', skirts: 'Skirts', trousers: 'Trousers',
  jackets: 'Jackets', bags: 'Bags', scarves: 'Scarves', gloves: 'Gloves', hats: 'Hats',
};

const RAW: Record<Category, [string, string][]> = {
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

export const BUILT_IN = Object.fromEntries(
  (Object.keys(RAW) as Category[]).map((c) => [
    c,
    RAW[c].map(([name, color], i): Item => ({ id: c + i, cat: c, name, color, shape: SHAPE[c] })),
  ]),
) as Record<Category, Item[]>;

/** Top-half layers, back to front: tee under shirt under sweater. */
export const LAYER_ORDER: Category[] = ['tops', 'shirts', 'sweaters'];

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
  collections: Collection[];
  /** Collection Save outfit picks by default. */
  lastCollection: string | null;
};

export const INITIAL_CLOSET: ClosetState = {
  tab: { top: 'tops', bottom: 'skirts', acc: 'jackets' },
  off: {},
  wearing: { layers: { tops: 'tops1' }, bottom: 'skirts0', acc: { bags: 'bags1' } },
  added: [],
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
    (Object.keys(BUILT_IN) as Category[]).find((c) => BUILT_IN[c].some((i) => i.id === id));
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
  return LAYER_ORDER.map((c) => l.layers?.[c]).filter((x): x is string => !!x);
}
