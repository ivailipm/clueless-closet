import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUILT_IN, CLOSET_KEY, EXTRAS, INITIAL_CLOSET, layerIds, migrateCloset, type ClosetState, type Item } from '../closet/data';
import { Layers } from '../closet/Layers';
import { ClothingArt, Hanger } from '../shared/icons';
import { pickImage } from '../shared/image';
import { OsWindow } from '../shared/OsWindow';
import { readStored } from '../shared/storage';
import { HANDLE, NAV, type View } from './data';
import { Icon, type IconName } from './icons';
import {
  ActivityPanel, CalendarPanel, CodespacesPanel, ExplorePanel, FeaturedPanel, GistsPanel, IssuesPanel,
  OrgsPanel, PrsPanel, ReposPanel, SpotlightPanel, StarsPanel,
} from './panels';
import { useDash } from './useDash';

const NAV_ICON: Record<View, IconName> = {
  home: 'home', repos: 'repo', prs: 'pr', issues: 'issue', codespaces: 'codespace',
  stars: 'star', gists: 'gist', orgs: 'org', activity: 'heart',
};

/** Saved looks from the closet screen, resolved to items, for the lookbook. */
function readLookbook() {
  const closet = migrateCloset({ ...INITIAL_CLOSET, ...readStored<ClosetState>(CLOSET_KEY, INITIAL_CLOSET) });
  const all = [...Object.values(BUILT_IN).flat(), ...(closet.added ?? [])];
  const find = (id: string | null | undefined) => all.find((i) => i.id === id);
  return closet.saved.map((o, i) => ({
    id: o.id,
    n: closet.saved.length - i,
    layers: layerIds(o).map(find).filter((x): x is Item => !!x),
    bottom: find(o.bottom) ?? null,
    extras: EXTRAS.map((c) => find(o.acc[c])).filter((x): x is Item => !!x),
  }));
}

export function DashboardPage() {
  const d = useDash();
  const { s } = d;
  const [newOpen, setNewOpen] = useState(false);
  const lookRef = useRef<HTMLDialogElement>(null);
  const [looks, setLooks] = useState<ReturnType<typeof readLookbook>>([]);

  const v = s.view;
  const counts: Partial<Record<View, number>> = {
    prs: s.prs.filter((p) => !p.merged).length,
    issues: s.issues.filter((i) => !i.closed).length,
  };

  const openNew = () => {
    setNewOpen(true);
    if (v !== 'home' && v !== 'repos') d.setView('repos');
  };
  const openLookbook = () => {
    setLooks(readLookbook());
    if (!lookRef.current?.open) lookRef.current?.showModal();
  };
  const print = () => {
    document.documentElement.classList.add('print-lookbook');
    setTimeout(() => window.print(), 50);
  };
  const printLookbook = () => {
    openLookbook();
    print();
  };
  useEffect(() => {
    const done = () => document.documentElement.classList.remove('print-lookbook');
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  return (
    <OsWindow
      app="dashboard"
      variant="fashion"
      title="Code Closet.exe"
      subtitle="where my repos get dressed"
      brand="GITHUB"
      tagline={`${HANDLE.toUpperCase()}'S CODE CLOSET`}
      menus={[
        {
          label: 'File',
          items: [
            { label: 'New repo…', onSelect: openNew },
            { label: 'Preview lookbook', onSelect: openLookbook },
            { label: 'Print lookbook…', onSelect: printLookbook },
          ],
        },
        {
          label: 'Edit',
          items: [
            { label: 'Unstar all repos', disabled: !Object.values(s.starred).some(Boolean), onSelect: d.unstarAll },
            { label: 'Clear activity feed', disabled: s.activity.length === 0, onSelect: d.clearActivity },
          ],
        },
        {
          label: 'View',
          items: [...NAV, ['activity', 'Activity'] as [View, string]].map(([key, label]) => ({
            label,
            checked: v === key,
            onSelect: () => d.setView(key),
          })),
        },
        {
          label: 'Repos',
          items: [
            { label: 'First repos', onSelect: () => (d.setView(v === 'repos' ? 'repos' : 'home'), d.firstRepos()) },
            { label: 'Last repos', onSelect: () => (d.setView(v === 'repos' ? 'repos' : 'home'), d.lastRepos()) },
            { separator: true },
            { label: 'Reset dashboard…', onSelect: d.reset },
          ],
        },
      ]}
      footer={(api) => (
        <>
          <span className="fx-pill-small px">
            <Icon name="heart" size={11} /> GitHub for fashionistas <Icon name="heart" size={11} />
          </span>
          <div className="fx-tools">
            <Link to="/" className="fx-tool px">
              <Icon name="save" size={15} /> Save outfit
            </Link>
            <button type="button" className="fx-tool px" onClick={openNew}>
              <Icon name="plus" size={15} /> New repo
            </button>
            <button type="button" className="fx-tool px" onClick={api.openImport} title="Import a backup file">
              <Icon name="cd" size={15} /> Import CD
            </button>
            <button type="button" className="fx-tool px" onClick={printLookbook}>
              <Icon name="print" size={15} /> Print lookbook
            </button>
            <button type="button" className="fx-tool px" onClick={openLookbook}>
              <Icon name="eye" size={15} /> Preview
            </button>
            <button
              type="button"
              className={`fx-tool fx-sound${s.sound ? ' on' : ''}`}
              aria-pressed={s.sound}
              aria-label="Sound effects"
              onClick={d.toggleSound}
            >
              <Icon name={s.sound ? 'sound' : 'mute'} size={16} />
            </button>
          </div>
        </>
      )}
    >
      <div className="fx-content">
        <nav aria-label="Dashboard sections" className="fx-side">
          <label className="fx-avatar">
            {s.avatar ? (
              <img src={s.avatar} alt="Profile photo" className="cover" />
            ) : (
              <svg className="sil" viewBox="0 0 100 100" width="120" height="120" aria-hidden="true">
                <circle cx="50" cy="38" r="18" />
                <path d="M18 92 Q18 62 50 62 Q82 62 82 92 Z" />
              </svg>
            )}
            <span className="fx-avatar-cap px">
              <Icon name="camera" size={12} /> {s.avatar ? 'Change photo' : 'Upload your photo'}
            </span>
            <input type="file" accept="image/*" className="sr" onChange={pickImage(480, (url) => d.setAvatar(url))} />
          </label>

          <div className="fx-namecard">
            <strong className="px">{HANDLE}</strong>
            <span>
              <Icon name="pin" size={13} /> Geel, Belgium
            </span>
            <span>
              totally coding <Icon name="sparkle" size={12} className="fx-goldico" />
            </span>
          </div>

          {NAV.map(([key, label]) => {
            const on = v === key;
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                className={`fx-nav px${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => d.setView(key)}
              >
                <Icon name={NAV_ICON[key]} size={17} />
                <span className="fx-nav-label">{label}</span>
                {!!count && (
                  <span className="fx-count" aria-label={`${count} open`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <Link to="/" className="fx-nav px fx-nav-closet">
            <Hanger size={17} />
            <span className="fx-nav-label">My closet</span>
          </Link>
        </nav>

        <main className="fx-main">
          {v === 'home' && (
            <>
              <ReposPanel d={d} full={false} newOpen={newOpen} onCloseNew={() => setNewOpen(false)} />
              <div className="fx-row-panels">
                <PrsPanel d={d} full={false} />
                <CalendarPanel d={d} />
                <SpotlightPanel d={d} />
              </div>
              <div className="fx-row-panels">
                <ActivityPanel d={d} full={false} />
                <ExplorePanel d={d} />
                <FeaturedPanel d={d} />
              </div>
            </>
          )}
          {v === 'repos' && <ReposPanel d={d} full newOpen={newOpen} onCloseNew={() => setNewOpen(false)} />}
          {v === 'prs' && <PrsPanel d={d} full />}
          {v === 'issues' && <IssuesPanel d={d} />}
          {v === 'codespaces' && <CodespacesPanel d={d} />}
          {v === 'stars' && <StarsPanel d={d} />}
          {v === 'gists' && <GistsPanel d={d} />}
          {v === 'orgs' && <OrgsPanel d={d} />}
          {v === 'activity' && <ActivityPanel d={d} full />}
        </main>
      </div>

      <dialog ref={lookRef} className="about lookbook" aria-labelledby="lookbook-title">
        <div className="titlebar about-bar">
          <div className="titlebar-left">
            <Icon name="heart" size={16} />
            <h2 id="lookbook-title" className="px">
              {HANDLE}'s lookbook
            </h2>
          </div>
          <button type="button" className="wbtn wbtn-close" aria-label="Close" onClick={() => lookRef.current?.close()}>
            x
          </button>
        </div>
        <div className="about-body">
          {looks.length ? (
            <ol className="fx-looks">
              {looks.map((l) => (
                <li key={l.id} className="fx-look">
                  <span className="px fx-small">Look {l.n}</span>
                  <Layers items={l.layers} w={110} h={90} />
                  {l.bottom && (
                    <div style={{ width: 110, height: 90 }}>
                      <ClothingArt shape={l.bottom.shape} color={l.bottom.color} img={l.bottom.img} />
                    </div>
                  )}
                  <span className="fx-small">
                    {[...l.layers, ...(l.bottom ? [l.bottom] : []), ...l.extras].map((i) => i.name).join(', ')}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>
              No saved looks yet. Build an outfit in <Link to="/">My Closet</Link> and hit Save outfit.
            </p>
          )}
          <div className="fx-dialog-actions">
            {looks.length > 0 && (
              <button type="button" className="btn" onClick={print}>
                Print
              </button>
            )}
            <button type="button" className="btn btn-accent" onClick={() => lookRef.current?.close()}>
              OK
            </button>
          </div>
        </div>
      </dialog>
    </OsWindow>
  );
}
