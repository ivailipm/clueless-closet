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

export const ROWS: { key: RowKey; num: string; title: string; cats: Category[]; noun: string }[] = [
  { key: 'top', num: '01', title: 'Top half', cats: TOPS, noun: 'tops' },
  { key: 'bottom', num: '02', title: 'Bottom half', cats: BOTTOMS, noun: 'bottoms' },
  { key: 'acc', num: '03', title: 'Extras', cats: EXTRAS, noun: 'extras' },
];

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

/** Ids of worn items. Ids (not whole items) keep saved looks small in localStorage. */
export type Look = { top: string | null; bottom: string | null; acc: Partial<Record<Category, string | null>> };

export type ClosetState = {
  tab: Record<RowKey, Category>;
  off: Partial<Record<Category, number>>;
  wearing: Look;
  added: Item[];
  saved: (Look & { id: string })[];
};

export const INITIAL_CLOSET: ClosetState = {
  tab: { top: 'tops', bottom: 'skirts', acc: 'jackets' },
  off: {},
  wearing: { top: 'tops1', bottom: 'skirts0', acc: { bags: 'bags1' } },
  added: [],
  saved: [],
};

export const CLOSET_KEY = 'closet';
export const MAX_SAVED = 6;
