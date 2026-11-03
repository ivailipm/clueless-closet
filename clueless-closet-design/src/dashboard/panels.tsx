import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STYLES, STYLE_COLOR, type Collection, type Style } from '../closet/data';
import { OutfitThumb } from '../closet/OutfitThumb';
import { Tri } from '../shared/icons';
import { pickImage } from '../shared/image';
import { ago, HANDLE, LEVELS, MONTHS, type ActivityKind } from './data';
import { Icon, type IconName } from './icons';
import { Comments, Empty, Panel, RepoCard, StateToggle } from './parts';
import { PER_PAGE, type Dash } from './useDash';

type P = { d: Dash };

type Open = { onOpen: (id: string) => void };

const cardProps = (d: Dash, c: Collection, onOpen: (id: string) => void) => ({
  col: c,
  get: d.get,
  onOpen: () => onOpen(c.id),
  onStar: () => d.toggleStar(c),
  onStyle: (st: Style) => d.setStyle(c, st),
  onFork: () => d.forkRepo(c),
  onCode: () => d.openCodespace(c),
  onRename: () => {
    const name = prompt(`New name for ${c.name}`, c.name);
    if (name != null) d.renameRepo(c, name);
  },
  onDelete: () => d.deleteRepo(c),
});

/* ---------- Repositories = outfit collections ---------- */

export function ReposPanel({
  d, full, newOpen, onCloseNew, onOpen,
}: P & Open & { full: boolean; newOpen: boolean; onCloseNew: () => void }) {
  const list = d.collections;
  const [name, setName] = useState('');
  const [style, setStyle] = useState<Style>('Casual');
  const n = list.length;
  const off = n ? ((d.s.off % n) + n) % n : 0;
  const shown = full ? list : Array.from({ length: Math.min(PER_PAGE, n) }, (_, i) => list[(off + i) % n]);
  return (
    <Panel
      id="h-repos"
      title="My repositories"
      sub="aka my outfit collections"
      actions={
        !full &&
        n > PER_PAGE && (
          <>
            <button type="button" className="fx-mini" onClick={d.firstRepos} aria-label="First collections">
              <Tri dir="left" double width={18} height={11} />
            </button>
            <button type="button" className="fx-mini" onClick={() => d.shiftRepos(-1)} aria-label="Previous collection">
              <Tri dir="left" width={11} height={11} />
            </button>
            <button type="button" className="fx-mini" onClick={() => d.shiftRepos(1)} aria-label="Next collection">
              <Tri dir="right" width={11} height={11} />
            </button>
            <button type="button" className="fx-mini" onClick={d.lastRepos} aria-label="Last collections">
              <Tri dir="right" double width={18} height={11} />
            </button>
          </>
        )
      }
      footer={full || !n ? undefined : { label: `View all ${n} collection${n === 1 ? '' : 's'}`, onClick: () => d.setView('repos') }}
    >
      {n ? (
        <div className={`fx-repo-grid${full ? '' : ' fx-repo-grid-fit'}`}>
          {shown.map((c) => (
            <RepoCard key={c.id} {...cardProps(d, c, onOpen)} />
          ))}
        </div>
      ) : (
        <Empty>
          No collections yet. In My Closet, build an outfit and hit Save outfit to start one (like winter-outfits), or use + New
          repo.
        </Empty>
      )}
      {newOpen && (
        <form
          className="fx-inline-form fx-pad"
          onSubmit={(e) => {
            e.preventDefault();
            if (d.createRepo(name, style)) {
              setName('');
              onCloseNew();
            }
          }}
        >
          <label htmlFor="newrepo" className="fx-label">
            New collection
          </label>
          <input
            id="newrepo"
            className="fx-field"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. winter-outfits"
          />
          <label htmlFor="newrepo-style" className="sr">
            Style
          </label>
          <select id="newrepo-style" className="fx-field" style={{ flex: '0 1 140px' }} value={style} onChange={(e) => setStyle(e.target.value as Style)}>
            {STYLES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button type="submit" className="fx-btn fx-btn-pink px">
            Create
          </button>
          <button type="button" className="fx-btn px" onClick={onCloseNew}>
            Cancel
          </button>
        </form>
      )}
    </Panel>
  );
}

/** One collection opened: its outfits, to wear in the closet or remove. */
export function CollectionPanel({ d, id, onBack }: P & { id: string; onBack: () => void }) {
  const navigate = useNavigate();
  const c = d.collections.find((x) => x.id === id);
  if (!c) return null;
  const card = cardProps(d, c, () => {});
  return (
    <Panel
      id="h-col"
      title={`${HANDLE}/${c.name}`}
      sub={`${c.style} · ${c.outfits.length} outfit${c.outfits.length === 1 ? '' : 's'}`}
      icon="repo"
      actions={
        <>
          <button type="button" className={`fx-btn px${c.starred ? ' on' : ''}`} aria-pressed={c.starred} onClick={card.onStar}>
            <Icon name="star" size={13} /> {c.starred ? 'Starred' : 'Star'}
          </button>
          <button type="button" className="fx-btn px" onClick={card.onFork}>
            <Icon name="fork" size={13} /> Fork
          </button>
          <button type="button" className="fx-btn px" onClick={card.onRename}>
            Rename
          </button>
        </>
      }
      footer={{ label: 'Back to all collections', onClick: onBack }}
    >
      <p className="fx-muted fx-small fx-pad" style={{ margin: 0 }}>
        <span className="fx-chip" style={{ background: STYLE_COLOR[c.style] }}>
          {c.style}
        </span>{' '}
        {c.forkOf ? `Forked from ${c.forkOf} · ` : ''}
        {c.updatedAt ? `Updated ${ago(c.updatedAt)}` : 'No updates yet'}
      </p>
      {c.outfits.length ? (
        <ul className="fx-outfits">
          {c.outfits.map((o) => (
            <li key={o.id} className="fx-outfit">
              <OutfitThumb look={o} get={d.get} />
              <strong>{o.name}</strong>
              <span className="fx-muted fx-small">saved {ago(o.savedAt)}</span>
              <div className="fx-outfit-actions">
                <button
                  type="button"
                  className="fx-btn fx-btn-pink px"
                  onClick={() => {
                    d.wearOutfit(c, o.id);
                    navigate('/');
                  }}
                >
                  Wear
                </button>
                <button type="button" className="fx-btn px" aria-label={`Remove ${o.name}`} onClick={() => d.removeOutfit(c, o.id, o.name)}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No outfits here yet. In My Closet, hit Save outfit and pick {c.name}.</Empty>
      )}
    </Panel>
  );
}

export function StarsPanel({ d, onOpen }: P & Open) {
  const starred = d.collections.filter((c) => c.starred);
  return (
    <Panel id="h-stars" title="Stars" sub="my fave collections" icon="star">
      {starred.length ? (
        <div className="fx-repo-grid">
          {starred.map((c) => (
            <RepoCard key={c.id} {...cardProps(d, c, onOpen)} />
          ))}
        </div>
      ) : (
        <Empty>Nothing starred yet. Tap the ★ on a collection card to add it here.</Empty>
      )}
    </Panel>
  );
}

/* ---------- Pull requests & issues ---------- */

export function PrsPanel({ d, full }: P & { full: boolean }) {
  const { s } = d;
  const list = full ? s.prs : [...s.prs].sort((a, b) => Number(a.merged) - Number(b.merged)).slice(0, 3);
  return (
    <Panel
      id="h-prs"
      title="Pull requests"
      sub="fashion reviews"
      icon="pr"
      className="fx-grow-12"
      footer={full ? undefined : { label: 'View all pull requests', onClick: () => d.setView('prs') }}
    >
      <ul className="fx-list">
        {list.map((p) => (
          <li key={p.num} className="fx-row">
            <div className="fx-row-main">
              <Icon name="heart" size={22} className="fx-row-heart" />
              <div className="fx-row-text">
                <strong>{p.user}</strong>
                <span>{p.title}</span>
                <span className="fx-muted fx-small">
                  #{p.num} · {p.comments.length} comment{p.comments.length === 1 ? '' : 's'}
                </span>
              </div>
              <StateToggle
                on={p.merged}
                onLabel="Merged"
                offLabel="Open"
                label={`#${p.num} ${p.merged ? 'merged, reopen' : 'open, merge'}`}
                onClick={() => d.togglePr(p.num)}
              />
            </div>
            {full && <Comments list={p.comments} label={`pr-${p.num}`} onAdd={(t) => d.commentPr(p.num, t)} />}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function IssuesPanel({ d }: P) {
  const [title, setTitle] = useState('');
  const [show, setShow] = useState<'open' | 'closed'>('open');
  const list = d.s.issues.filter((i) => (show === 'open' ? !i.closed : i.closed));
  const openCount = d.s.issues.filter((i) => !i.closed).length;
  return (
    <Panel id="h-issues" title="Issues" sub="wardrobe malfunctions" icon="issue">
      <form
        className="fx-inline-form fx-pad"
        onSubmit={(e) => {
          e.preventDefault();
          if (d.newIssue(title)) setTitle('');
        }}
      >
        <label htmlFor="newissue" className="fx-label">
          New issue
        </label>
        <input
          id="newissue"
          className="fx-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sparkles missing on Mondays"
        />
        <button type="submit" className="fx-btn fx-btn-pink px">
          Open issue
        </button>
      </form>
      <div role="group" aria-label="Show issues" className="fx-seg fx-pad">
        {(['open', 'closed'] as const).map((k) => (
          <button key={k} type="button" className={`fx-btn px${show === k ? ' on' : ''}`} aria-pressed={show === k} onClick={() => setShow(k)}>
            {k === 'open' ? `${openCount} open` : `${d.s.issues.length - openCount} closed`}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="fx-list">
          {list.map((i) => (
            <li key={i.num} className="fx-row">
              <div className="fx-row-main">
                <Icon name={i.closed ? 'check' : 'issue'} size={22} className="fx-row-heart" />
                <div className="fx-row-text">
                  <span style={{ fontWeight: 600 }}>{i.title}</span>
                  <span className="fx-muted fx-small">
                    #{i.num}
                    {i.createdAt ? ` · opened ${ago(i.createdAt)}` : ''} · {i.comments.length} comment
                    {i.comments.length === 1 ? '' : 's'}
                  </span>
                </div>
                <StateToggle
                  on={i.closed}
                  onLabel="Closed"
                  offLabel="Open"
                  label={`Issue #${i.num} ${i.closed ? 'closed, reopen' : 'open, close'}`}
                  onClick={() => d.toggleIssue(i.num)}
                />
              </div>
              <Comments list={i.comments} label={`issue-${i.num}`} onAdd={(t) => d.commentIssue(i.num, t)} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{show === 'open' ? 'No open issues. Totally flawless.' : 'Nothing closed yet.'}</Empty>
      )}
    </Panel>
  );
}

/* ---------- Calendar ---------- */

export function CalendarPanel({ d }: P) {
  const [monthOff, setMonthOff] = useState(0);
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthOff, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const thisMonth = y === today.getFullYear() && m === today.getMonth();
  return (
    <Panel id="h-cal" title="Contribution calendar" sub="gettin' it done!" icon="calendar" className="fx-grow-13">
      <div className="fx-cal">
        <div className="fx-cal-head">
          <button type="button" className="fx-mini" onClick={() => setMonthOff((o) => o - 1)} aria-label="Previous month">
            <Tri dir="left" width={11} height={11} />
          </button>
          <span className="px" aria-live="polite">
            {MONTHS[m]} {y}
          </span>
          <button type="button" className="fx-mini" onClick={() => setMonthOff((o) => o + 1)} aria-label="Next month">
            <Tri dir="right" width={11} height={11} />
          </button>
        </div>
        <div aria-hidden="true" className="fx-cal-grid fx-cal-dow px">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x, i) => (
            <span key={i}>{x}</span>
          ))}
        </div>
        <div className="fx-cal-grid">
          {Array.from({ length: first.getDay() }, (_, i) => (
            <span key={'b' + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const lv = d.s.cal[`${y}-${m}-${day}`] ?? 0;
            const isToday = thisMonth && day === today.getDate();
            return (
              <button
                key={day}
                type="button"
                className={`fx-cell${isToday ? ' today' : ''}`}
                title={`${MONTHS[m]} ${day}`}
                aria-label={`${MONTHS[m]} ${day}${isToday ? ' (today)' : ''}, level ${lv} of 4`}
                onClick={() => d.cycleDay(y, m, day)}
                style={{ background: LEVELS[lv], color: lv >= 3 ? '#FFFFFF' : '#5A4F8A' }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="fx-legend px">
          <span>Less</span>
          {LEVELS.map((c) => (
            <span key={c} aria-hidden="true" className="fx-swatch" style={{ background: c }} />
          ))}
          <span>More</span>
          <Icon name="heart" size={12} className="fx-pinkico" />
          <span>Fab!</span>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Spotlight ---------- */

export function SpotlightPanel({ d }: P) {
  const photo = d.s.spotlight ?? d.s.avatar;
  return (
    <Panel id="h-spot" title="GitHub spotlight" icon="sparkle" pink className="fx-grow-8 fx-spot">
      <div className="fx-spot-body">
        <div className="fx-spot-frame">
          {photo ? (
            <img src={photo} alt={d.s.spotlight ? 'Spotlight photo' : 'Profile photo'} className="cover" />
          ) : (
            <svg className="sil" viewBox="0 0 100 100" width="110" height="110" aria-hidden="true">
              <circle cx="50" cy="38" r="18" />
              <path d="M18 92 Q18 62 50 62 Q82 62 82 92 Z" />
            </svg>
          )}
        </div>
        <div className="fx-spot-actions">
          <label className="fx-btn px">
            <Icon name="camera" size={14} /> {d.s.spotlight ? 'Change' : 'Add photo'}
            <input type="file" accept="image/*" className="sr" onChange={pickImage(700, (url) => d.setSpotlight(url))} />
          </label>
          {d.s.spotlight && (
            <button type="button" className="fx-btn px" onClick={() => d.setSpotlight(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Activity ---------- */

const KIND_ICON: Record<ActivityKind, IconName> = {
  push: 'push', star: 'star', merge: 'merge', reopen: 'pr', create: 'repo', fork: 'fork', delete: 'trash',
  log: 'calendar', install: 'sparkle', comment: 'comment', issue: 'issue', close: 'check', gist: 'gist',
  org: 'org', code: 'codespace',
};

export function ActivityPanel({ d, full }: P & { full: boolean }) {
  const list = full ? d.s.activity : d.s.activity.slice(0, 4);
  return (
    <Panel
      id="h-act"
      title="Activity feed"
      sub="what's hot"
      className="fx-grow-20"
      footer={!full && d.s.activity.length > 4 ? { label: 'View all activity', onClick: () => d.setView('activity') } : undefined}
    >
      {list.length ? (
        <ul className="fx-list">
          {list.map((a) => (
            <li key={a.id} className="fx-act">
              <span className="fx-act-ico">
                <Icon name={KIND_ICON[a.kind]} size={16} />
              </span>
              <span className="fx-act-text">
                <strong>{HANDLE}</strong> {a.text}
              </span>
              <span className="fx-muted fx-small fx-act-time">{ago(a.at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Star a repo, merge a review or log a day and it shows up here.</Empty>
      )}
    </Panel>
  );
}

/* ---------- Explore ---------- */

export function ExplorePanel({ d, onOpen }: P & Open) {
  const coding = new Set(d.s.codespaces.map((c) => c.repoId));
  const score = (c: Collection) => (c.starred ? 3 : 0) + c.forks * 2 + c.outfits.length + (coding.has(c.id) ? 1 : 0);
  const top = [...d.collections]
    .sort((a, b) => score(b) - score(a) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 4);
  return (
    <Panel
      id="h-explore"
      title="Explore"
      sub="trending now"
      className="fx-grow-10"
      footer={{ label: 'View trending', onClick: () => d.setView('repos') }}
    >
      {top.length ? (
        <ol className="fx-list fx-trend">
          {top.map((c) => (
            <li key={c.id}>
              <button type="button" className="fx-trend-btn" onClick={() => onOpen(c.id)}>
                <span className="fx-trend-name">
                  {HANDLE}/{c.name}
                </span>
                <span
                  className="fx-small fx-trend-stat"
                  aria-label={`${c.outfits.length} outfits, ${c.starred ? 1 : 0} stars, ${c.forks} forks`}
                >
                  <Icon name="hanger" size={12} /> {c.outfits.length}
                  <Icon name="star" size={12} /> {c.starred ? 1 : 0}
                  <Icon name="fork" size={12} /> {c.forks}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>No collections to rank yet.</Empty>
      )}
      <p className="fx-muted fx-small fx-pad" style={{ margin: 0 }}>
        Save outfits, star or fork to climb the chart.
      </p>
    </Panel>
  );
}

/* ---------- Featured ---------- */

export function FeaturedPanel({ d }: P) {
  return (
    <Panel id="h-feat" title="Featured collection" className="fx-grow-10">
      <div className="fx-feat">
        <strong>90s dev diva starter kit</strong>
        <span className="fx-muted fx-small">A pixel font, beveled buttons and a plaid wallpaper for your next side project.</span>
        <button
          type="button"
          className={`fx-state fx-state-lg px${d.s.installed ? ' on' : ''}`}
          aria-pressed={d.s.installed}
          onClick={d.toggleInstall}
        >
          {d.s.installed ? 'Installed' : 'Install look'}
        </button>
      </div>
    </Panel>
  );
}

/* ---------- Codespaces ---------- */

export function CodespacesPanel({ d }: P) {
  const { s } = d;
  const [msg, setMsg] = useState<Record<string, string>>({});
  const open = s.codespaces
    .map((c) => ({ c, r: d.collections.find((r) => r.id === c.repoId) }))
    .filter((x): x is { c: (typeof s.codespaces)[number]; r: Collection } => !!x.r);
  return (
    <Panel id="h-code" title="Codespaces" sub="fitting rooms" icon="codespace">
      {open.length ? (
        <ul className="fx-list">
          {open.map(({ c, r }) => (
            <li key={r.id} className="fx-row">
              <div className="fx-row-main">
                <span className="fx-trend-art" aria-hidden="true">
                  {r.outfits[0] ? <OutfitThumb look={r.outfits[0]} get={d.get} size="sm" /> : <Icon name="hanger" size={20} />}
                </span>
                <div className="fx-row-text">
                  <strong>
                    {HANDLE}/{r.name}
                  </strong>
                  <span className="fx-muted fx-small">Active · {ago(c.openedAt)}</span>
                </div>
                <button type="button" className="fx-btn px" onClick={() => d.stopCodespace(r.id)}>
                  Stop
                </button>
              </div>
              <form
                className="fx-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  d.push(r, msg[r.id] ?? '');
                  setMsg((m) => ({ ...m, [r.id]: '' }));
                }}
              >
                <label className="sr" htmlFor={`commit-${r.id}`}>
                  Commit message for {r.name}
                </label>
                <input
                  id={`commit-${r.id}`}
                  className="fx-field"
                  value={msg[r.id] ?? ''}
                  onChange={(e) => setMsg((m) => ({ ...m, [r.id]: e.target.value }))}
                  placeholder="Commit message, e.g. add more sparkle"
                />
                <button type="submit" className="fx-btn fx-btn-pink px">
                  <Icon name="push" size={14} /> Push
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No codespaces open. Use ··· › Open in codespace on a collection card.</Empty>
      )}
    </Panel>
  );
}

/* ---------- Gists ---------- */

export function GistsPanel({ d }: P) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <Panel id="h-gists" title="Gists" sub="little notes" icon="gist">
      <form
        className="fx-gist-form fx-pad"
        onSubmit={(e) => {
          e.preventDefault();
          if (d.addGist(title, body)) {
            setTitle('');
            setBody('');
          }
        }}
      >
        <label htmlFor="gist-title" className="fx-label">
          File name
        </label>
        <input id="gist-title" className="fx-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="outfit-ideas.md" />
        <label htmlFor="gist-body" className="fx-label">
          Note
        </label>
        <textarea
          id="gist-body"
          className="fx-field fx-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write anything: snippets, outfit ideas, to-dos…"
        />
        <button type="submit" className="fx-btn fx-btn-pink px" style={{ alignSelf: 'flex-start' }}>
          Save gist
        </button>
      </form>
      {d.s.gists.length ? (
        <ul className="fx-list">
          {d.s.gists.map((g) => (
            <li key={g.id} className="fx-row">
              <div className="fx-row-main">
                <Icon name="gist" size={20} className="fx-row-heart" />
                <div className="fx-row-text">
                  <strong>{g.title}</strong>
                  <span className="fx-muted fx-small">{ago(g.at)}</span>
                </div>
                <button type="button" className="fx-btn px" onClick={() => d.deleteGist(g.id)} aria-label={`Delete ${g.title}`}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <pre className="fx-pre">{g.body}</pre>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No gists yet.</Empty>
      )}
    </Panel>
  );
}

/* ---------- Organizations ---------- */

export function OrgsPanel({ d }: P) {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  return (
    <Panel id="h-orgs" title="Organizations" sub="my clique" icon="org">
      <form
        className="fx-inline-form fx-pad"
        onSubmit={(e) => {
          e.preventDefault();
          if (d.addOrg(name, about)) {
            setName('');
            setAbout('');
          }
        }}
      >
        <label htmlFor="org-name" className="fx-label">
          Name
        </label>
        <input id="org-name" className="fx-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. mall-coders" />
        <label htmlFor="org-about" className="fx-label">
          About
        </label>
        <input id="org-about" className="fx-field" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="What's your clique about?" />
        <button type="submit" className="fx-btn fx-btn-pink px">
          Create
        </button>
      </form>
      {d.s.orgs.length ? (
        <ul className="fx-org-grid">
          {d.s.orgs.map((o) => (
            <li key={o.id} className="fx-org">
              <span className="fx-org-badge px" aria-hidden="true">
                {o.name.charAt(0).toUpperCase()}
              </span>
              <div className="fx-row-text">
                <strong>{o.name}</strong>
                {o.about && <span className="fx-small">{o.about}</span>}
                <span className="fx-muted fx-small">1 member · since {ago(o.at)}</span>
              </div>
              <button type="button" className="fx-btn px" onClick={() => d.deleteOrg(o.id)} aria-label={`Delete ${o.name}`}>
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No organizations yet. Start your clique above.</Empty>
      )}
    </Panel>
  );
}
