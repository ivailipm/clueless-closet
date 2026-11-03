import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from './MenuBar';
import { PHOTO, type BgControl } from './BackgroundPicker';
import { useWallpaper, WallpaperLayer, type Slot, type Wallpaper } from './wallpaper';

/**
 * Before patterns could be picked here, this slot stored 'plaid' (unused) while showing leopard,
 * or 'lace'. Version 2 stores the real pattern id.
 */
const upgrade = (w: Wallpaper): Wallpaper => (w.v ? w : { ...w, pattern: w.pattern === 'lace' ? 'lace' : 'leopard', v: 2 });

/**
 * Background for the area inside a fashion window: any pattern from patterns.ts (leopard by default) or your
 * photo (horizontal photos are used on computers, vertical ones on phones). `node` goes first inside `.fx-content`.
 */
export function useInsideBackground(screen: string) {
  const bg = useWallpaper(`${screen}-inside`, false, 'leopard', upgrade);
  const inputs = {
    auto: useRef<HTMLInputElement>(null),
    landscape: useRef<HTMLInputElement>(null),
    portrait: useRef<HTMLInputElement>(null),
  };
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const onFile = (slot?: Slot) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    const saved = await bg.upload(f, slot);
    if (!saved) return;
    const other = saved === 'landscape' ? bg.wall.portrait : bg.wall.landscape;
    setToast(
      saved === 'landscape'
        ? `Background set for computers${other ? '' : ' (also used on phones until you add a vertical photo)'}`
        : `Background set for phones${other ? '' : ' (also used on computers until you add a horizontal photo)'}`,
    );
  };

  const openUpload = () => inputs.auto.current?.click();

  const menuItems: MenuItem[] = [
    { label: 'Inside: my photo', checked: bg.showingPhoto, disabled: !bg.hasPhoto, onSelect: bg.showPhoto },
    { label: 'Inside: upload a photo…', onSelect: openUpload },
    { label: 'Inside: upload computer photo (horizontal)…', onSelect: () => inputs.landscape.current?.click() },
    { label: 'Inside: upload phone photo (vertical)…', onSelect: () => inputs.portrait.current?.click() },
    { label: 'Inside: remove photos', disabled: !bg.hasPhoto, onSelect: bg.removeAll },
  ];

  const node = (
    <>
      <WallpaperLayer wall={bg.wall} photo={bg.showingPhoto} contained fallback="leopard" />
      {(['auto', 'landscape', 'portrait'] as const).map((k) => (
        <input
          key={k}
          ref={inputs[k]}
          type="file"
          accept="image/*"
          className="sr"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFile(k === 'auto' ? undefined : k)}
        />
      ))}
      {toast && (
        <div className="fx-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );

  /** For the Inside dropdown. */
  const control: BgControl = {
    value: bg.showingPhoto ? PHOTO : bg.wall.pattern,
    hasPhoto: bg.hasPhoto,
    choose: (v) => (v === PHOTO ? bg.showPhoto() : bg.setPattern(v)),
    upload: openUpload,
  };

  return { node, menuItems, control };
}
