import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from './MenuBar';
import { useWallpaper, WallpaperLayer, type Slot } from './wallpaper';

/** Patterns offered for the area inside the window (leopard is the CSS default under everything). */
export type InsidePattern = 'leopard' | 'lace';

/**
 * Background for the leopard area inside a fashion window: leopard print, red lace, or your photo
 * (horizontal photos are used on computers, vertical ones on phones). `node` goes first inside `.fx-content`.
 */
export function useInsideBackground(screen: string) {
  const bg = useWallpaper(`${screen}-inside`, false, 'leopard');
  // Slots saved before lace existed hold 'plaid'; they always showed leopard.
  const pattern: InsidePattern = bg.wall.pattern === 'lace' ? 'lace' : 'leopard';
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
    { label: 'Inside: leopard print', checked: !bg.showingPhoto && pattern === 'leopard', onSelect: () => bg.setPattern('leopard') },
    { label: 'Inside: red lace', checked: !bg.showingPhoto && pattern === 'lace', onSelect: () => bg.setPattern('lace') },
    { label: 'Inside: my photo', checked: bg.showingPhoto, disabled: !bg.hasPhoto, onSelect: bg.showPhoto },
    { label: 'Change inside background…', onSelect: openUpload },
    { label: 'Inside: upload computer photo (horizontal)…', onSelect: () => inputs.landscape.current?.click() },
    { label: 'Inside: upload phone photo (vertical)…', onSelect: () => inputs.portrait.current?.click() },
    { label: 'Inside: remove photos', disabled: !bg.hasPhoto, onSelect: bg.removeAll },
  ];

  const node = (
    <>
      {(bg.showingPhoto || pattern === 'lace') && <WallpaperLayer wall={bg.wall} photo={bg.showingPhoto} contained />}
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

  return {
    node,
    menuItems,
    openUpload,
    showingPhoto: bg.showingPhoto,
    pattern,
    /** Show a pattern (and stop showing the photo, which is kept). */
    setPattern: (p: InsidePattern) => bg.setPattern(p),
    hasPhoto: bg.hasPhoto,
    showPhoto: bg.showPhoto,
  };
}
