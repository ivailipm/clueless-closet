import { useEffect, useRef, useState } from 'react';
import { Hanger } from '../shared/icons';
import { pickImage } from '../shared/image';
import { ROWS, LABELS, type Category } from './data';

export type ClothesDraft = {
  /** Set when editing an existing upload. */
  id?: string;
  img: string;
  name: string;
  cat: Category;
};

type Props = {
  draft: ClothesDraft | null;
  onSave: (d: ClothesDraft) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

/** Window for adding a photo of your own clothes (or editing one): preview, name and category. */
export function ClothesDialog({ draft, onSave, onRemove, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<ClothesDraft | null>(draft);

  useEffect(() => {
    setForm(draft);
    const el = ref.current;
    if (!el) return;
    if (draft && !el.open) el.showModal();
    if (!draft && el.open) el.close();
  }, [draft]);

  const editing = !!form?.id;

  return (
    <dialog ref={ref} className="about cl-dialog" aria-labelledby="clothes-title" onClose={onClose}>
      <div className="titlebar about-bar">
        <div className="titlebar-left">
          <Hanger size={18} />
          <h2 id="clothes-title" className="px">
            {editing ? 'Edit clothes' : 'Add to closet'}
          </h2>
        </div>
        <button type="button" className="wbtn wbtn-close" aria-label="Close" onClick={onClose}>
          x
        </button>
      </div>
      {form && (
        <form
          className="about-body cl-dialog-body"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...form, name: form.name.trim() || 'My item' });
          }}
        >
          <div className="cl-dialog-preview">
            <img src={form.img} alt="Preview of your photo" className="fit" />
          </div>
          <div className="cl-dialog-fields">
            <label htmlFor="clothes-name" className="fx-label">
              Name
            </label>
            <input
              id="clothes-name"
              className="fx-field"
              value={form.name}
              autoFocus
              maxLength={40}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Pink fluffy cardigan"
            />
            <label htmlFor="clothes-cat" className="fx-label">
              Category
            </label>
            <select
              id="clothes-cat"
              className="fx-field"
              value={form.cat}
              onChange={(e) => setForm({ ...form, cat: e.target.value as Category })}
            >
              {ROWS.map((r) => (
                <optgroup key={r.key} label={r.title}>
                  {r.cats.map((c) => (
                    <option key={c} value={c}>
                      {LABELS[c]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <label className="fx-btn px cl-dialog-photo">
              Use a different photo
              <input type="file" accept="image/*" className="sr" onChange={pickImage(600, (img) => setForm({ ...form, img }))} />
            </label>
            <p className="fx-muted fx-small" style={{ margin: 0 }}>
              Tip: photos on a plain or transparent background look best.
            </p>
          </div>
          <div className="fx-dialog-actions">
            {editing && (
              <button type="button" className="btn" onClick={() => onRemove(form.id!)}>
                Remove
              </button>
            )}
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent">
              {editing ? 'Save' : 'Add to closet'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
