import { useEffect, useRef, useState } from 'react';
import { Hanger } from '../shared/icons';
import { HANDLE } from '../dashboard/data';
import { STYLES, STYLE_COLOR, type Collection, type Look, type Style } from './data';
import { OutfitThumb } from './OutfitThumb';
import type { GetItem } from './store';

export type SaveTarget = { id: string } | { name: string; style: Style };

type Props = {
  open: boolean;
  look: Look;
  collections: Collection[];
  defaultId: string | null;
  get: GetItem;
  onSave: (target: SaveTarget, outfitName: string) => void;
  onClose: () => void;
};

const NEW = '__new__';

/** "Save outfit" window: name the look and pick (or start) the collection it goes into. */
export function SaveDialog({ open, look, collections, defaultId, get, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pick, setPick] = useState<string>(NEW);
  const [name, setName] = useState('');
  const [newName, setNewName] = useState('');
  const [style, setStyle] = useState<Style>('Casual');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      const fallback = collections.some((c) => c.id === defaultId) ? defaultId! : collections[0]?.id ?? NEW;
      setPick(fallback);
      setName(`${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })} look`);
      setNewName('');
      el.showModal();
    }
    if (!open && el.open) el.close();
    // Only reset the form when the window opens, not on every collections change.
  }, [open]);

  const valid = pick !== NEW || newName.trim().length > 0;

  return (
    <dialog ref={ref} className="about cl-dialog cl-save-dialog" aria-labelledby="save-title" onClose={onClose}>
      <div className="titlebar about-bar">
        <div className="titlebar-left">
          <Hanger size={18} />
          <h2 id="save-title" className="px">
            Save outfit
          </h2>
        </div>
        <button type="button" className="wbtn wbtn-close" aria-label="Close" onClick={onClose}>
          x
        </button>
      </div>
      {open && (
        <form
          className="about-body cl-dialog-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSave(pick === NEW ? { name: newName, style } : { id: pick }, name);
          }}
        >
          <div className="cl-dialog-preview cl-save-preview">
            <OutfitThumb look={look} get={get} />
          </div>
          <div className="cl-dialog-fields">
            <label htmlFor="outfit-name" className="fx-label">
              Outfit name
            </label>
            <input
              id="outfit-name"
              className="fx-field"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
            />

            <fieldset className="cl-save-list">
              <legend className="fx-label">Save to collection</legend>
              {collections.map((c) => (
                <label key={c.id} className={`cl-save-opt${pick === c.id ? ' on' : ''}`}>
                  <input type="radio" name="col" value={c.id} checked={pick === c.id} onChange={() => setPick(c.id)} />
                  <span className="cl-save-name">
                    {HANDLE}/{c.name}
                  </span>
                  <span className="fx-chip" style={{ background: STYLE_COLOR[c.style] }}>
                    {c.style}
                  </span>
                  <span className="fx-muted fx-small">
                    {c.outfits.length} outfit{c.outfits.length === 1 ? '' : 's'}
                  </span>
                </label>
              ))}
              <label className={`cl-save-opt${pick === NEW ? ' on' : ''}`}>
                <input type="radio" name="col" value={NEW} checked={pick === NEW} onChange={() => setPick(NEW)} />
                <span className="cl-save-name">+ New collection</span>
              </label>
              {pick === NEW && (
                <div className="cl-save-new">
                  <label htmlFor="col-name" className="sr">
                    New collection name
                  </label>
                  <input
                    id="col-name"
                    className="fx-field"
                    value={newName}
                    autoFocus
                    maxLength={40}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. winter-outfits"
                  />
                  <label htmlFor="col-style" className="sr">
                    Style
                  </label>
                  <select id="col-style" className="fx-field" value={style} onChange={(e) => setStyle(e.target.value as Style)}>
                    {STYLES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </fieldset>
          </div>
          <div className="fx-dialog-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={!valid}>
              Save
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
