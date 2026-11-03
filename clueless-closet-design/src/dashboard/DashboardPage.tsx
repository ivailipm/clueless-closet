import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BUILT_IN, CLOSET_KEY, INITIAL_CLOSET, type ClosetState, type Item } from '../closet/data';
import { ClothingArt, Hanger, Tri } from '../shared/icons';
import { pickImage } from '../shared/image';
import { OsWindow } from '../shared/OsWindow';
import { readStored, usePersistentState } from '../shared/storage';
import { ACCENT, DOWN, INK, PINK, UP } from '../shared/theme';
import {
  HANDLE, INITIAL_DASH, LEVELS, MONTHS, NAV, NEW_COLORS, NEW_SHAPES,
  type Activity, type DashState,
} from './data';

const PER_PAGE = 4;

function when(at: number) {
  const d = new Date(at);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return today ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

/** Outfit of the day = what the closet screen is currently wearing (falls back to the design's look). */
function useOutfitOfTheDay(): { top: Item; bottom: Item } {
  const closet = readStored<ClosetState>(CLOSET_KEY, INITIAL_CLOSET);
  const all = [...Object.values(BUILT_IN).flat(), ...(closet.added ?? [])];
  const find = (id: string | null | undefined) => all.find((i) => i.id === id);
  const top = find(closet.wearing?.top) ?? BUILT_IN.jackets[1];
  const bottom = find(closet.wearing?.bottom) ?? BUILT_IN.skirts[0];
  return { top, bottom };
}

export function DashboardPage() {
  const [s, setS] = usePersistentState<DashState>('dashboard', INITIAL_DASH, () =>
    alert('That photo is too big to remember. Try a smaller image.'),
  );
  const [monthOff, setMonthOff] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const ootd = useOutfitOfTheDay();

  const log = (activity: Activity[], text: string): Activity[] =>
    [{ id: Date.now() + '-' + Math.random(), text, at: Date.now() }, ...activity].slice(0, 8);

  const v = s.view;
  const openCount = s.prs.filter((p) => !p.merged).length;
  const starCount = Object.values(s.starred).filter(Boolean).length;
  const show = {
    home: v === 'home',
    repos: v === 'home' || v === 'repos',
    prs: v === 'home' || v === 'prs',
    cal: v === 'home' || v === 'cal',
    activity: v === 'home' || v === 'activity',
  };

  // Repositories carousel
  const n = s.repos.length;
  const off = n ? ((s.off % n) + n) % n : 0;
  const visibleRepos = Array.from({ length: Math.min(PER_PAGE, n) }, (_, i) => s.repos[(off + i) % n]);

  const createRepo = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name) return;
    setS((st) => {
      const k = st.repos.length % NEW_SHAPES.length;
      const repos = [
        ...st.repos,
        { id: name + Date.now(), name, tag: 'Fresh off the rack.', lang: 'New', shape: NEW_SHAPES[k], color: NEW_COLORS[k] },
      ];
      return { ...st, repos, off: Math.max(0, repos.length - PER_PAGE), activity: log(st.activity, `created ${HANDLE}/${name}`) };
    });
    setNewName('');
    setNewOpen(false);
  };

  // Calendar for the real current month (+ offset)
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() + monthOff, 1);
  const y = first.getFullYear();
  const m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const isThisMonth = y === today.getFullYear() && m === today.getMonth();

  return (
    <OsWindow
      app="dashboard"
      title="Code Closet.exe"
      subtitle="where my repos get dressed"
      menu={['File', 'Edit', 'View', 'Repos', 'Help']}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setNewOpen(true);
              if (!show.repos) setS((st) => ({ ...st, view: 'repos' }));
            }}
          >
            + New repo
          </button>
          <Link to="/" className="btn">
            Save outfit
          </Link>
          <span className="sunk grow">{n} repos</span>
          <span className="sunk grow">{starCount} starred</span>
          <span className="sunk grow">{openCount} open reviews</span>
        </>
      }
    >
      <div className="content content-lilac">
        <nav aria-label="Dashboard sections" className="sidebar">
          <div className="avatar">
            {s.avatar ? (
              <img src={s.avatar} alt="Profile photo" className="cover" />
            ) : (
              <svg className="sil" viewBox="0 0 100 100" width="130" height="130" aria-hidden="true">
                <circle cx="50" cy="38" r="18" />
                <path d="M18 92 Q18 62 50 62 Q82 62 82 92 Z" />
              </svg>
            )}
          </div>
          <label className="upload upload-center px">
            Upload your photo
            <input
              type="file"
              accept="image/*"
              className="sr"
              onChange={pickImage(480, (url) => setS((st) => ({ ...st, avatar: url })))}
            />
          </label>
          <div className="namecard">
            <strong className="px">{HANDLE}</strong>
            <span>Geel, Belgium</span>
            <span>totally coding</span>
          </div>
          {NAV.map(([key, label]) => {
            const on = v === key;
            return (
              <button
                key={key}
                type="button"
                className="tab nav-tab"
                aria-pressed={on}
                onClick={() => setS((st) => ({ ...st, view: key }))}
                style={{ background: on ? ACCENT : '#D4D0E0', color: on ? '#FFFFFF' : INK, borderColor: on ? DOWN : UP }}
              >
                <span>{label}</span>
                {key === 'prs' && openCount > 0 && (
                  <span className="cnt" aria-label={`${openCount} open`}>
                    {openCount}
                  </span>
                )}
              </button>
            );
          })}
          <Link to="/" className="btn" style={{ justifyContent: 'flex-start' }}>
            <Hanger size={18} />
            My closet
          </Link>
        </nav>

        <main className="dash-main">
          {show.repos && (
            <section className="panel" aria-labelledby="h-repos">
              <div className="ph">
                <h2 id="h-repos" className="px">
                  My repositories (aka my outfits)
                </h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" className="mini" onClick={() => setS((st) => ({ ...st, off: 0 }))} aria-label="First repositories">
                    <Tri dir="left" double width={20} height={12} />
                  </button>
                  <button type="button" className="mini" onClick={() => setS((st) => ({ ...st, off: st.off - 1 }))} aria-label="Previous repository">
                    <Tri dir="left" width={12} height={12} />
                  </button>
                  <button type="button" className="mini" onClick={() => setS((st) => ({ ...st, off: st.off + 1 }))} aria-label="Next repository">
                    <Tri dir="right" width={12} height={12} />
                  </button>
                  <button
                    type="button"
                    className="mini"
                    onClick={() => setS((st) => ({ ...st, off: Math.max(0, st.repos.length - PER_PAGE) }))}
                    aria-label="Last repositories"
                  >
                    <Tri dir="right" double width={20} height={12} />
                  </button>
                </div>
              </div>
              <div className="repo-grid">
                {visibleRepos.map((r) => {
                  const on = !!s.starred[r.id];
                  return (
                    <article key={r.id} className="repo">
                      <div className="repo-head">
                        <h3 title={`${HANDLE}/${r.name}`}>
                          {HANDLE}/{r.name}
                        </h3>
                        <span aria-hidden="true" className="px" style={{ fontSize: 11 }}>
                          ···
                        </span>
                      </div>
                      <div className="repo-art">
                        <ClothingArt shape={r.shape} color={r.color} />
                      </div>
                      <div className="repo-body">
                        <span style={{ fontSize: 13 }}>{r.tag}</span>
                        <div className="repo-meta">
                          <span className="chip">{r.lang}</span>
                          <button
                            type="button"
                            className="tab tab-sm"
                            aria-pressed={on}
                            aria-label={`${on ? 'Unstar' : 'Star'} ${r.name}`}
                            onClick={() =>
                              setS((st) => {
                                const now = !st.starred[r.id];
                                return {
                                  ...st,
                                  starred: { ...st.starred, [r.id]: now },
                                  activity: now ? log(st.activity, `starred ${HANDLE}/${r.name}`) : st.activity,
                                };
                              })
                            }
                            style={{ background: on ? ACCENT : '#D4D0E0', color: on ? '#FFFFFF' : INK, borderColor: on ? DOWN : UP }}
                          >
                            {on ? 'Starred' : 'Star'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {newOpen && (
                <form className="new-repo" onSubmit={createRepo}>
                  <label htmlFor="newrepo">New repo name</label>
                  <input
                    id="newrepo"
                    type="text"
                    value={newName}
                    autoFocus
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. velvet-router"
                    className="field"
                  />
                  <button type="submit" className="btn btn-accent">
                    Create
                  </button>
                  <button type="button" className="btn" onClick={() => setNewOpen(false)}>
                    Cancel
                  </button>
                </form>
              )}
            </section>
          )}

          <div className="panel-row">
            {show.prs && (
              <section className="panel" aria-labelledby="h-prs" style={{ flex: '1 1 340px' }}>
                <div className="ph">
                  <h2 id="h-prs" className="px">
                    Pull requests (fashion reviews)
                  </h2>
                </div>
                <ul className="list">
                  {s.prs.map((p, idx) => (
                    <li key={p.num} className="pr">
                      <span aria-hidden="true" className="px pr-initial">
                        {p.user.charAt(0).toUpperCase()}
                      </span>
                      <div className="pr-text">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          #{p.num} · {p.user}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="tab tab-sm"
                        aria-pressed={p.merged}
                        aria-label={`#${p.num} ${p.merged ? 'merged, mark open' : 'open, mark merged'}`}
                        onClick={() =>
                          setS((st) => {
                            const prs = st.prs.slice();
                            prs[idx] = { ...prs[idx], merged: !prs[idx].merged };
                            return {
                              ...st,
                              prs,
                              activity: prs[idx].merged ? log(st.activity, `merged #${p.num} ${p.title}`) : st.activity,
                            };
                          })
                        }
                        style={{ background: p.merged ? ACCENT : PINK, color: '#FFFFFF', borderColor: p.merged ? DOWN : UP }}
                      >
                        {p.merged ? 'Merged' : 'Open'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {show.cal && (
              <section className="panel" aria-labelledby="h-cal" style={{ flex: '1 1 300px' }}>
                <div className="ph">
                  <h2 id="h-cal" className="px">
                    Contribution calendar
                  </h2>
                </div>
                <div className="cal">
                  <div className="cal-head">
                    <button type="button" className="mini" onClick={() => setMonthOff((o) => o - 1)} aria-label="Previous month">
                      <Tri dir="left" width={12} height={12} />
                    </button>
                    <span className="px" style={{ fontSize: 14 }} aria-live="polite">
                      {MONTHS[m]} {y}
                    </span>
                    <button type="button" className="mini" onClick={() => setMonthOff((o) => o + 1)} aria-label="Next month">
                      <Tri dir="right" width={12} height={12} />
                    </button>
                  </div>
                  <div aria-hidden="true" className="cal-grid cal-dow">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                  <div className="cal-grid">
                    {Array.from({ length: first.getDay() }, (_, i) => (
                      <span key={'b' + i} />
                    ))}
                    {Array.from({ length: days }, (_, i) => {
                      const day = i + 1;
                      const key = `${y}-${m}-${day}`;
                      const lv = s.cal[key] ?? 0;
                      const isToday = isThisMonth && day === today.getDate();
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`cell${isToday ? ' cell-today' : ''}`}
                          aria-label={`${MONTHS[m]} ${day}${isToday ? ' (today)' : ''}, level ${lv} of 4`}
                          onClick={() =>
                            setS((st) => {
                              const next = ((st.cal[key] ?? 0) + 1) % 5;
                              return {
                                ...st,
                                cal: { ...st.cal, [key]: next },
                                activity: next === 1 ? log(st.activity, `logged code on ${MONTHS[m].slice(0, 3)} ${day}`) : st.activity,
                              };
                            })
                          }
                          style={{ background: LEVELS[lv], color: lv >= 3 ? '#FFFFFF' : INK }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="legend">
                    <span>Less</span>
                    {LEVELS.map((c) => (
                      <span key={c} aria-hidden="true" className="swatch" style={{ background: c }} />
                    ))}
                    <span>More</span>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Click a day to log how much you coded.
                  </span>
                </div>
              </section>
            )}

            {show.home && (
              <section className="panel" aria-labelledby="h-spot" style={{ flex: '1 1 200px' }}>
                <div className="ph ph-pink">
                  <h2 id="h-spot" className="px">
                    Outfit of the day
                  </h2>
                </div>
                <div className="ootd">
                  <div style={{ width: 140, height: 110 }}>
                    <ClothingArt shape={ootd.top.shape} color={ootd.top.color} img={ootd.top.img} />
                  </div>
                  <div style={{ width: 140, height: 90 }}>
                    <ClothingArt shape={ootd.bottom.shape} color={ootd.bottom.color} img={ootd.bottom.img} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    {ootd.top.name} + {ootd.bottom.name}
                  </span>
                  <Link to="/" className="btn" style={{ fontSize: 12 }}>
                    Open in closet
                  </Link>
                </div>
              </section>
            )}
          </div>

          <div className="panel-row">
            {show.activity && (
              <section className="panel" aria-labelledby="h-act" style={{ flex: '2 1 380px' }}>
                <div className="ph">
                  <h2 id="h-act" className="px">
                    Activity feed (what's hot)
                  </h2>
                </div>
                {s.activity.length ? (
                  <ul className="list">
                    {s.activity.map((a) => (
                      <li key={a.id} className="act">
                        <span>
                          <strong>{HANDLE}</strong> {a.text}
                        </span>
                        <span className="muted" style={{ flex: 'none' }}>
                          {when(a.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="hint" style={{ padding: '14px 12px' }}>
                    Star a repo, merge a review or log a day and it shows up here.
                  </p>
                )}
              </section>
            )}

            {show.home && (
              <section className="panel" aria-labelledby="h-feat" style={{ flex: '1 1 260px' }}>
                <div className="ph">
                  <h2 id="h-feat" className="px">
                    Featured collection
                  </h2>
                </div>
                <div className="feat">
                  <strong style={{ fontSize: 15 }}>90s dev diva starter kit</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    A pixel font, beveled buttons and a plaid wallpaper for your next side project.
                  </span>
                  <button
                    type="button"
                    className="tab"
                    aria-pressed={s.installed}
                    onClick={() =>
                      setS((st) => ({
                        ...st,
                        installed: !st.installed,
                        activity: !st.installed ? log(st.activity, 'installed 90s dev diva starter kit') : st.activity,
                      }))
                    }
                    style={{ background: s.installed ? ACCENT : PINK, color: '#FFFFFF', borderColor: s.installed ? DOWN : UP }}
                  >
                    {s.installed ? 'Installed' : 'Install look'}
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </OsWindow>
  );
}
