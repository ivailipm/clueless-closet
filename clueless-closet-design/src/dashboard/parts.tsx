import { useEffect, useRef, useState, type ReactNode } from 'react';
import { STYLES, STYLE_COLOR, type Collection, type Style } from '../closet/data';
import { OutfitThumb } from '../closet/OutfitThumb';
import type { GetItem } from '../closet/store';
import { ago, HANDLE, type Comment } from './data';
import { Icon, type IconName } from './icons';

/** Blue-headed panel with a pink heart, an optional (subtitle), header buttons and a "VIEW ALL »" footer. */
export function Panel(p: {
  id: string;
  title: string;
  sub?: string;
  icon?: IconName;
  pink?: boolean;
  actions?: ReactNode;
  footer?: { label: string; onClick: () => void };
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <section className={`fx-panel${p.className ? ' ' + p.className : ''}`} aria-labelledby={p.id} style={p.style}>
      <div className={`fx-ph${p.pink ? ' fx-ph-pink' : ''}`}>
        <h2 id={p.id}>
          <Icon name={p.icon ?? 'heart'} size={14} className="fx-ph-ico" />
          <span className="px">{p.title}</span>
          {p.sub && <span className="fx-sub">({p.sub})</span>}
        </h2>
        {p.actions && <div className="fx-ph-actions">{p.actions}</div>}
      </div>
      <div className="fx-pb">{p.children}</div>
      {p.footer && (
        <button type="button" className="fx-pfoot px" onClick={p.footer.onClick}>
          {p.footer.label} »
        </button>
      )}
    </section>
  );
}

/** Small popup list of actions anchored to a "···" button. */
function MoreMenu({ label, items }: { label: string; items: { label: string; onSelect: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', down);
    ref.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();
    return () => document.removeEventListener('mousedown', down);
  }, [open]);
  return (
    <div
      className="fx-more"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
        }
      }}
    >
      <button
        type="button"
        className="fx-dots px"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ···
      </button>
      {open && (
        <div role="menu" className="menu-pop fx-more-pop">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A collection of outfits shown as a repo card. */
export function RepoCard(p: {
  col: Collection;
  get: GetItem;
  onOpen: () => void;
  onStar: () => void;
  onStyle: (s: Style) => void;
  onFork: () => void;
  onCode: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const c = p.col;
  const n = c.outfits.length;
  return (
    <article className="fx-repo">
      <div className="fx-repo-head">
        <h3 title={`${HANDLE}/${c.name}`}>
          {HANDLE}/{c.name}
        </h3>
        <MoreMenu
          label={`More actions for ${c.name}`}
          items={[
            { label: 'Open collection', onSelect: p.onOpen },
            { label: 'Open in codespace', onSelect: p.onCode },
            { label: 'Fork', onSelect: p.onFork },
            { label: 'Rename…', onSelect: p.onRename },
            { label: 'Delete collection…', onSelect: p.onDelete },
          ]}
        />
      </div>
      <button type="button" className="fx-repo-art" onClick={p.onOpen} aria-label={`Open ${c.name}`}>
        {n ? <OutfitThumb look={c.outfits[0]} get={p.get} /> : <span className="fx-repo-empty px">No outfits yet</span>}
      </button>
      <div className="fx-repo-body">
        <span className="fx-repo-tag">
          <span>
            {n} outfit{n === 1 ? '' : 's'}
            {c.forkOf && <span className="fx-muted"> · forked from {c.forkOf}</span>}
          </span>
          <select
            className="fx-chip fx-chip-select"
            aria-label={`Style of ${c.name}`}
            value={c.style}
            onChange={(e) => p.onStyle(e.target.value as Style)}
            style={{ background: STYLE_COLOR[c.style] }}
          >
            {STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </span>
        <div className="fx-repo-stats">
          <button
            type="button"
            className={`fx-star${c.starred ? ' on' : ''}`}
            aria-pressed={c.starred}
            aria-label={`${c.starred ? 'Unstar' : 'Star'} ${c.name}, ${c.starred ? 1 : 0} stars`}
            onClick={p.onStar}
          >
            <Icon name="star" size={15} /> {c.starred ? 1 : 0}
          </button>
          <span className="fx-forks" aria-label={`${c.forks} forks`}>
            <Icon name="fork" size={15} /> {c.forks}
          </span>
        </div>
        <span className="fx-updated">{c.updatedAt ? `Updated ${ago(c.updatedAt)}` : 'No updates yet'}</span>
      </div>
    </article>
  );
}

/** Comment list plus a one-line form to add another. */
export function Comments({ list, onAdd, label }: { list: Comment[]; onAdd: (text: string) => void; label: string }) {
  const [text, setText] = useState('');
  return (
    <div className="fx-comments">
      {list.length > 0 && (
        <ul>
          {list.map((c) => (
            <li key={c.id}>
              <strong>{HANDLE}</strong> {c.text} <span className="fx-muted">· {ago(c.at)}</span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="fx-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onAdd(text);
          setText('');
        }}
      >
        <label className="sr" htmlFor={label}>
          Comment
        </label>
        <input id={label} className="fx-field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave a comment…" />
        <button type="submit" className="fx-btn px">
          Comment
        </button>
      </form>
    </div>
  );
}

/** Pink OPEN / blue MERGED style toggle. */
export function StateToggle(p: { on: boolean; onLabel: string; offLabel: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`fx-state px${p.on ? ' on' : ''}`}
      aria-pressed={p.on}
      aria-label={p.label}
      onClick={p.onClick}
    >
      {p.on ? p.onLabel : p.offLabel}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="fx-empty">{children}</p>;
}
