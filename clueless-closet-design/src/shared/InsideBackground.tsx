import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from './MenuBar';
import { useWallpaper, WallpaperLayer, type Slot } from './wallpaper';

/**
 * Photo background for the leopard area inside a fashion window.
 * Leopard print shows until a photo is chosen; horizontal photos are used on computers,
 * vertical ones on phones. `node` goes first inside the positioned `.fx-content`.
 */
export function useInsideBackground(screen: string) {
  const bg = useWallpaper(`${screen}-inside`, false);
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
    { label: 'Inside: leopard print', checked: !bg.showingPhoto, onSelect: bg.hidePhoto },
    { label: 'Inside: my photo', checked: bg.showingPhoto, disabled: !bg.hasPhoto, onSelect: bg.showPhoto },
    { label: 'Change inside background…', onSelect: openUpload },
    { label: 'Inside: upload computer photo (horizontal)…', onSelect: () => inputs.landscape.current?.click() },
    { label: 'Inside: upload phone photo (vertical)…', onSelect: () => inputs.portrait.current?.click() },
    { label: 'Inside: remove photos', disabled: !bg.hasPhoto, onSelect: bg.removeAll },
  ];

  const node = (
    <>
      {bg.showingPhoto && <WallpaperLayer wall={bg.wall} photo contained />}
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
    hasPhoto: bg.hasPhoto,
    hidePhoto: bg.hidePhoto,
    showPhoto: bg.showPhoto,
  };
}
