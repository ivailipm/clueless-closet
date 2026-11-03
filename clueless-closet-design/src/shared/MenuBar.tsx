import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export type MenuItem =
  | { label: string; onSelect: () => void; disabled?: boolean; checked?: boolean }
  | { separator: true };

export type Menu = { label: string; items: MenuItem[] };

const isAction = (i: MenuItem): i is Exclude<MenuItem, { separator: true }> => !('separator' in i);

/**
 * Classic menu bar. Click (or Alt + underlined letter) opens a menu;
 * arrow keys move, Enter picks, Escape closes.
 */
export function MenuBar({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const topRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on outside click.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Alt + first letter opens that menu.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const idx = menus.findIndex((m) => m.label[0].toLowerCase() === e.key.toLowerCase());
      if (idx < 0) return;
      e.preventDefault();
      setOpen(idx);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menus]);

  // Focus the first enabled item when a menu opens.
  useEffect(() => {
    if (open === null) return;
    itemRefs.current = itemRefs.current.slice(0, menus[open].items.length);
    const first = itemRefs.current.find((b) => b && !b.disabled);
    first?.focus();
  }, [open, menus]);

  const close = (refocus = true) => {
    const i = open;
    setOpen(null);
    if (refocus && i !== null) topRefs.current[i]?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (open === null) return;
    const enabled = itemRefs.current.filter((b): b is HTMLButtonElement => !!b && !b.disabled);
    const at = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      enabled[(at + 1) % enabled.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      enabled[(at - 1 + enabled.length) % enabled.length]?.focus();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      setOpen((open + d + menus.length) % menus.length);
    } else if (e.key === 'Tab') {
      setOpen(null);
    }
  };

  return (
    <div className="menu-items" ref={barRef} role="menubar" aria-label="Menu" onKeyDown={onMenuKey}>
      {menus.map((m, mi) => (
        <div key={m.label} className="menu">
          <button
            ref={(el) => (topRefs.current[mi] = el)}
            type="button"
            role="menuitem"
            className={`menu-top${open === mi ? ' menu-top-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={open === mi}
            aria-keyshortcuts={`Alt+${m.label[0]}`}
            onClick={() => setOpen(open === mi ? null : mi)}
            onMouseEnter={() => open !== null && open !== mi && setOpen(mi)}
          >
            <u>{m.label[0]}</u>
            {m.label.slice(1)}
          </button>
          {open === mi && (
            <div role="menu" aria-label={m.label} className="menu-pop">
              {m.items.map((it, ii) =>
                isAction(it) ? (
                  <button
                    key={it.label}
                    ref={(el) => (itemRefs.current[ii] = el)}
                    type="button"
                    role={it.checked === undefined ? 'menuitem' : 'menuitemradio'}
                    aria-checked={it.checked}
                    disabled={it.disabled}
                    className="menu-item"
                    onClick={() => {
                      close(false);
                      it.onSelect();
                    }}
                  >
                    <span className="menu-check" aria-hidden="true">
                      {it.checked ? '•' : ''}
                    </span>
                    {it.label}
                  </button>
                ) : (
                  <div key={'sep' + ii} role="separator" className="menu-sep" ref={() => (itemRefs.current[ii] = null)} />
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
