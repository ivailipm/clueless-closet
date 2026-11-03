import { PATTERNS } from './patterns';

/** One background slot ("outside" wallpaper or "inside" area) as the picker needs it. */
export type BgControl = {
  /** A pattern id, or PHOTO when the uploaded photo is showing. */
  value: string;
  hasPhoto: boolean;
  choose: (value: string) => void;
  /** Open the file chooser for a photo (horizontal → computers, vertical → phones). */
  upload: () => void;
};

export const PHOTO = '__photo';
const UPLOAD = '__upload';
const GROUPS = ['Classic', 'Wallpapers'] as const;

function Select({ id, label, bg }: { id: string; label: string; bg: BgControl }) {
  return (
    <div className="bg-pick">
      <label htmlFor={id} className="bg-pick-label px">
        {label}
      </label>
      <select
        id={id}
        className="fx-field bg-pick-select"
        value={bg.value}
        onChange={(e) => (e.target.value === UPLOAD ? bg.upload() : bg.choose(e.target.value))}
      >
        {GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {PATTERNS.filter((p) => p.group === g).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Your photo">
          {bg.hasPhoto && <option value={PHOTO}>My photo</option>}
          <option value={UPLOAD}>Upload a photo…</option>
        </optgroup>
      </select>
    </div>
  );
}

/** Two dropdowns over the same pattern list: the wallpaper behind the window, and the area inside it. */
export function BackgroundPicker({ outside, inside }: { outside: BgControl; inside: BgControl }) {
  return (
    <div className="bg-picker">
      <Select id="bg-outside" label="Outside" bg={outside} />
      <Select id="bg-inside" label="Inside" bg={inside} />
    </div>
  );
}
