import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ClothingArt } from '../shared/icons';
import { ago, HANDLE, type Comment, type Repo } from './data';
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

export function RepoCard(p: {
  repo: Repo;
  starred: boolean;
  onStar: () => void;
  onFork: () => void;
  onCode: () => void;
  onDelete: () => void;
}) {
  const r = p.repo;
  return (
    <article className="fx-repo">
      <div className="fx-repo-head">
        <h3 title={`${HANDLE}/${r.name}`}>
          {HANDLE}/{r.name}
        </h3>
        <MoreMenu
          label={`More actions for ${r.name}`}
          items={[
            { label: 'Open in codespace', onSelect: p.onCode },
            { label: 'Fork', onSelect: p.onFork },
            { label: 'Delete repo…', onSelect: p.onDelete },
          ]}
        />
      </div>
      <div className="fx-repo-art">
        <ClothingArt shape={r.shape} color={r.color} />
      </div>
      <div className="fx-repo-body">
        <span className="fx-repo-tag">
          <span>
            {r.tag}
            {r.forkOf && <span className="fx-muted"> · forked from {r.forkOf}</span>}
          </span>
          <span className="fx-chip">{r.lang}</span>
        </span>
        <div className="fx-repo-stats">
          <button
            type="button"
            className={`fx-star${p.starred ? ' on' : ''}`}
            aria-pressed={p.starred}
            aria-label={`${p.starred ? 'Unstar' : 'Star'} ${r.name}, ${p.starred ? 1 : 0} stars`}
            onClick={p.onStar}
          >
            <Icon name="star" size={15} /> {p.starred ? 1 : 0}
          </button>
          <span className="fx-forks" aria-label={`${r.forks} forks`}>
            <Icon name="fork" size={15} /> {r.forks}
          </span>
        </div>
        <span className="fx-updated">{r.updatedAt ? `Updated ${ago(r.updatedAt)}` : 'No updates yet'}</span>
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
