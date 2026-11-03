import { useEffect, useRef, useState } from 'react';
import { Hanger } from '../shared/icons';
import { ROWS, type RowKey } from './data';

/** Adding a category to a row (no id), or renaming / deleting one you made (with id). */
export type CategoryDraft = { id?: string; row: RowKey; name: string; count?: number };

const EXAMPLES: Record<RowKey, string> = { top: 'Going out tops', bottom: 'Shorts', acc: 'Jewellery' };

type Props = {
  draft: CategoryDraft | null;
  onSave: (d: CategoryDraft) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function CategoryDialog({ draft, onSave, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (draft && !el.open) {
      setName(draft.name);
      el.showModal();
    }
    if (!draft && el.open) el.close();
  }, [draft]);

  const row = ROWS.find((r) => r.key === draft?.row);
  const editing = !!draft?.id;

  return (
    <dialog ref={ref} className="about cl-cat-dialog" aria-labelledby="cat-title" onClose={onClose}>
      <div className="titlebar about-bar">
        <div className="titlebar-left">
          <Hanger size={18} />
          <h2 id="cat-title" className="px">
            {editing ? 'Edit category' : 'New category'}
          </h2>
        </div>
        <button type="button" className="wbtn wbtn-close" aria-label="Close" onClick={onClose}>
          x
        </button>
      </div>
      {draft && (
        <form
          className="about-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave({ ...draft, name: name.trim() });
          }}
        >
          <label htmlFor="cat-name" className="fx-label">
            Category name {row && <span className="fx-muted">({row.title.toLowerCase()})</span>}
          </label>
          <input
            id="cat-name"
            className="fx-field"
            value={name}
            autoFocus
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${EXAMPLES[draft.row]}`}
          />
          <p className="fx-muted fx-small">
            {draft.row === 'top' && 'Pieces here layer with your tees, under shirts and sweaters.'}
            {draft.row === 'bottom' && 'Like the other bottoms, you wear one at a time.'}
            {draft.row === 'acc' && 'Like the other extras, you can wear one from this category at a time.'}
          </p>
          <div className="fx-dialog-actions">
            {editing && (
              <button type="button" className="btn" onClick={() => onDelete(draft.id!)}>
                Delete{draft.count ? ` (and ${draft.count} piece${draft.count > 1 ? 's' : ''})` : ''}
              </button>
            )}
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={!name.trim()}>
              {editing ? 'Save' : 'Add category'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
