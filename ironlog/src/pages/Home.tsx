import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FriendCard } from '../components/social/FriendCard';
import { useFeedStore } from '../store/useFeedStore';
import { useFriendStore } from '../store/useFriendStore';
import { useAuthStore } from '../store/useAuthStore';
import { getMovementLabel, getMovementTabLabel } from '../lib/prDetection';
import type { SearchResult } from '../store/useFriendStore';

export function Home() {
  const { feed, loading: feedLoading, loadFeed } = useFeedStore();
  const { friends, loadFriends, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend } = useFriendStore();
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [expandedBd, setExpandedBd] = useState<Set<string>>(new Set());
  const toggleBd = (key: string) => setExpandedBd((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const [activeTab, setActiveTab] = useState<Map<string, string>>(new Map());
  const getActiveTab = (itemId: string, fallback: string) =>
    activeTab.get(itemId) ?? fallback;
  const setTab = (itemId: string, movement: string) =>
    setActiveTab((prev) => new Map(prev).set(itemId, movement));
  const [prDialog, setPrDialog] = useState<{ displayName: string; prs: typeof feed[0]['prs'] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFriends();
    if (user?.id) loadFeed(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = async () => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchUsers(query.trim());
    setSearchResults(results);
    setSearching(false);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setSearchResults([]);
  };

  const handleSendRequest = async (friendId: string) => {
    setPendingIds((s) => new Set(s).add(friendId));
    await sendFriendRequest(friendId);
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const incomingRequests = friends.filter((f) => f.status === 'pending' && f.direction === 'received');

  return (
    <div className="page">
      <Header
        title="IronLog"
        brand
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <button
              className="header-search-btn"
              onClick={() => user?.id && loadFeed(user.id, true)}
              aria-label="Refresh feed"
              disabled={feedLoading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>refresh</span>
            </button>
            <button className="header-search-btn" onClick={() => searchOpen ? handleCloseSearch() : setSearchOpen(true)} aria-label="Search users">
              <span className="material-symbols-outlined">{searchOpen ? 'close' : 'search'}</span>
            </button>
          </div>
        }
      />

      {searchOpen && (
        <div className="header-search-panel">
          <div className="header-search">
            <span className="material-symbols-outlined header-search__icon">search</span>
            <input
              ref={inputRef}
              className="header-search__input"
              placeholder="Search users…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setSearchResults([]); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') handleCloseSearch(); }}
            />
            {searching && <span className="header-search__spinner">…</span>}
          </div>
        </div>
      )}

      <div className="page-content">

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((r) => (
              <Card key={r.id} className="friend-card">
                <div className="friend-card__avatar">
                  <div className="friend-card__avatar-fallback">{r.displayName[0]?.toUpperCase()}</div>
                </div>
                <div className="friend-card__info">
                  <span className="friend-card__name">{r.displayName}</span>
                  <span className="friend-card__username">@{r.username}</span>
                </div>
                <div className="friend-card__actions">
                  {friendIds.has(r.id) ? (
                    <span className="friend-already">Added</span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={pendingIds.has(r.id)}
                      onClick={() => handleSendRequest(r.id)}
                    >
                      {pendingIds.has(r.id) ? 'Sent' : 'Add'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Incoming friend requests */}
        {incomingRequests.length > 0 && (
          <div className="home-requests">
            <p className="friends-section-label">Friend Requests</p>
            <div className="friend-list">
              {incomingRequests.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  onAccept={() => acceptFriendRequest(f.id)}
                  onRemove={() => removeFriend(f.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        {!searchOpen && (
          <div className="feed-list">
            {feedLoading ? (
              <p className="feed-empty">Loading…</p>
            ) : feed.length === 0 ? (
              <Card className="empty-state">
                <p>No activity yet. Add friends to see their workouts here.</p>
              </Card>
            ) : (
              feed.map((item) => {
                const MAIN_LIFTS = ['squat', 'bench', 'deadlift'];
                const activeMovements = item.movements.filter(
                  (log) => log && typeof log === 'object' && Array.isArray(log.sets) && log.sets.length > 0
                );
                const mainLogs = activeMovements.filter((log) => MAIN_LIFTS.includes(log.movement));
                const accessoryLogs = activeMovements.filter((log) => !MAIN_LIFTS.includes(log.movement));
                const hasAccessories = accessoryLogs.length > 0;

                const tabIds = [
                  ...mainLogs.map((log) => log.movement),
                  ...(hasAccessories ? ['accessories'] : []),
                ];
                const firstTab = tabIds[0] ?? null;
                const currentTab = firstTab ? getActiveTab(item.id, firstTab) : null;
                const currentMainLog = currentTab !== 'accessories'
                  ? mainLogs.find((log) => log.movement === currentTab) ?? null
                  : null;

                return (
                  <article key={item.id} className="social-card">
                    {/* User header */}
                    <div className="social-card__header">
                      <div className="social-card__avatar">
                        {item.avatarUrl ? (
                          <img className="social-card__avatar-img" src={item.avatarUrl} alt={item.displayName} />
                        ) : (
                          <span className="social-card__avatar-initials">
                            {item.displayName[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="social-card__user-info">
                        <span className="social-card__display-name">{item.displayName}</span>
                        <span className="social-card__time">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Activity */}
                    <div className="social-card__activity">
                      <div className="social-card__activity-label">
                        <span className="material-symbols-outlined social-card__activity-icon">fitness_center</span>
                        <h3 className="social-card__session-name">{item.sessionName}</h3>
                      </div>
                    </div>

                    {/* PR banner */}
                    {item.prs.length > 0 && (
                      <button
                        className="social-card__pr-banner social-card__pr-banner--btn"
                        onClick={() => setPrDialog({ displayName: item.displayName, prs: item.prs })}
                      >
                        <span className="material-symbols-outlined social-card__pr-icon">workspace_premium</span>
                        <span className="social-card__pr-text">
                          {item.prs.length === 1
                            ? `New PR — ${getMovementLabel(item.prs[0].movement)} ${item.prs[0].weight}kg × ${item.prs[0].reps}`
                            : `${item.prs.length} New Personal Records`}
                        </span>
                        <span className="material-symbols-outlined social-card__pr-chevron">chevron_right</span>
                      </button>
                    )}

                    {/* Tabbed movement breakdown */}
                    {tabIds.length > 0 && (
                      <div className="social-card__tabs-section">
                        {/* Tab bar — only when >1 tab */}
                        {tabIds.length > 1 && (
                          <div className="social-card__tabs">
                            {mainLogs.map((log) => {
                              const topSets = log.sets.filter((s) => !s.isBackdown);
                              const best = topSets.length > 0
                                ? topSets.reduce((b, s) => s.weight > b.weight ? s : b, topSets[0])
                                : null;
                              return (
                                <button
                                  key={log.movement}
                                  className={`social-card__tab social-card__tab--${log.movement}${currentTab === log.movement ? ' social-card__tab--active' : ''}`}
                                  onClick={() => setTab(item.id, log.movement)}
                                >
                                  <span className="social-card__tab-name">
                                    {log.variation && log.variation !== 'competition' ? `${log.variation} ${getMovementTabLabel(log.movement)}` : getMovementTabLabel(log.movement)}
                                  </span>
                                  {best && <span className="social-card__tab-stat">{best.weight}kg×{best.reps}</span>}
                                </button>
                              );
                            })}
                            {hasAccessories && (
                              <button
                                className={`social-card__tab social-card__tab--accessories${currentTab === 'accessories' ? ' social-card__tab--active' : ''}`}
                                onClick={() => setTab(item.id, 'accessories')}
                              >
                                <span className="social-card__tab-name">Accessories</span>
                                <span className="social-card__tab-stat">({accessoryLogs.length})</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Main lift panel */}
                        {currentTab !== 'accessories' && currentMainLog && (
                          <div className={`social-card__set-panel social-card__set-panel--${currentMainLog.movement}`}>
                            {currentMainLog.sets.filter((s) => !s.isBackdown).length > 0 && (
                              <table className="social-card__set-table">
                                <thead><tr><td>Weight</td><td>Reps</td><td>RPE</td></tr></thead>
                                <tbody>
                                  {currentMainLog.sets.filter((s) => !s.isBackdown).map((s) => (
                                    <tr key={s.id} className="social-card__set-row">
                                      <td className="social-card__set-cell social-card__set-cell--weight">{s.weight}kg</td>
                                      <td className="social-card__set-cell">{s.reps}</td>
                                      <td className="social-card__set-cell">{s.rpe ?? '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {currentMainLog.sets.filter((s) => s.isBackdown).length > 0 && (() => {
                              const bdKey = `${item.id}-${currentMainLog.movement}`;
                              const bdExpanded = expandedBd.has(bdKey);
                              const backdownSets = currentMainLog.sets.filter((s) => s.isBackdown);
                              return (
                                <>
                                  {bdExpanded && (
                                    <table className="social-card__set-table social-card__set-table--backdown">
                                      <thead>
                                        <tr><td colSpan={3} className="social-card__bd-label">Backdown</td></tr>
                                        <tr><td>Weight</td><td>Reps</td><td>RPE</td></tr>
                                      </thead>
                                      <tbody>
                                        {backdownSets.map((s) => (
                                          <tr key={s.id} className="social-card__set-row social-card__set-row--backdown">
                                            <td className="social-card__set-cell">{s.weight}kg</td>
                                            <td className="social-card__set-cell">{s.reps}</td>
                                            <td className="social-card__set-cell">{s.rpe ?? '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                  <button className="feed-card__bd-toggle" onClick={() => toggleBd(bdKey)}>
                                    {bdExpanded ? 'Hide backdowns' : `+${backdownSets.length} backdown${backdownSets.length > 1 ? 's' : ''}`}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Accessories panel */}
                        {currentTab === 'accessories' && (
                          <div className="social-card__set-panel social-card__accessories-panel">
                            {accessoryLogs.map((log) => {
                              const first = log.sets[0];
                              const expandKey = `${item.id}-acc-${log.movement}`;
                              const expanded = expandedBd.has(expandKey);
                              return (
                                <div key={log.movement} className="social-card__accessory-item">
                                  <button
                                    className="social-card__accessory-row"
                                    onClick={() => toggleBd(expandKey)}
                                  >
                                    <span className="social-card__accessory-name">{log.movement}</span>
                                    <div className="social-card__accessory-right">
                                      <span className="social-card__accessory-stat">
                                        {first ? `${first.weight}×${first.reps}` : '—'}
                                      </span>
                                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-disabled)' }}>
                                        {expanded ? 'expand_less' : 'expand_more'}
                                      </span>
                                    </div>
                                  </button>
                                  {expanded && (
                                    <div className="social-card__accessory-grid">
                                      <div className="social-card__accessory-grid-header">
                                        <span>Weight</span><span>Reps</span><span>RPE</span>
                                      </div>
                                      {log.sets.map((s) => (
                                        <div key={s.id} className="social-card__accessory-grid-row">
                                          <span>{s.weight}</span>
                                          <span>{s.reps}</span>
                                          <span>{s.rpe ?? '—'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </article>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* PR dialog */}
      {prDialog && (
        <div className="pr-dialog-backdrop" onClick={() => setPrDialog(null)}>
          <div className="pr-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="pr-dialog__header">
              <div className="pr-dialog__title-row">
                <span className="material-symbols-outlined pr-dialog__trophy">workspace_premium</span>
                <h2 className="pr-dialog__title">Personal Records</h2>
              </div>
              <span className="pr-dialog__sub">{prDialog.displayName}</span>
            </div>
            <div className="pr-dialog__list">
              {prDialog.prs.map((pr) => (
                <div key={`${pr.movement}-${pr.weight}-${pr.reps}`} className="pr-dialog__row">
                  <span className={`pr-dialog__movement movement-${pr.movement}`}>
                    {getMovementLabel(pr.movement)}
                  </span>
                  <div className="pr-dialog__stats">
                    <span className="pr-dialog__lift">{pr.weight}kg × {pr.reps}</span>
                    <span className="pr-dialog__e1rm">{Math.round(pr.e1rm)}kg e1RM</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="pr-dialog__close" onClick={() => setPrDialog(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
