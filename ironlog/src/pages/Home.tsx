import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { FriendCard } from '../components/social/FriendCard';
import { useFeedStore } from '../store/useFeedStore';
import { useFriendStore } from '../store/useFriendStore';
import { getMovementLabel } from '../lib/prDetection';
import type { SearchResult } from '../store/useFriendStore';

export function Home() {
  const { feed, loading: feedLoading, loadFeed } = useFeedStore();
  const { friends, loadFriends, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend } = useFriendStore();
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFriends();
    loadFeed();
  }, []);

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
          <button className="header-search-btn" onClick={() => searchOpen ? handleCloseSearch() : setSearchOpen(true)} aria-label="Search users">
            <span className="material-symbols-outlined">{searchOpen ? 'close' : 'search'}</span>
          </button>
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
        {!searchOpen && <div className="feed-list">
          {feedLoading ? (
            <p className="feed-empty">Loading…</p>
          ) : feed.length === 0 ? (
            <Card className="empty-state">
              <p>No activity yet. Add friends to see their workouts here.</p>
            </Card>
          ) : (
            feed.map((item) => (
              <Card key={item.id} className="feed-card">
                <div className="feed-card__meta">
                  <span className="feed-card__name">{item.displayName}</span>
                  <span className="feed-card__time">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="feed-card__body">
                  Completed <strong>{item.sessionName}</strong>
                </p>
                {item.movements.length > 0 && (
                  <div className="feed-card__movements">
                    {item.movements.map((log) => {
                      if (!log || typeof log !== 'object' || !Array.isArray(log.sets)) return null;
                      const topSets = log.sets.filter((s) => !s.isBackdown);
                      const backdownSets = log.sets.filter((s) => s.isBackdown);
                      const SetGroup = ({ sets, label }: { sets: typeof topSets; label: string }) => (
                        <div className="feed-card__set-group">
                          <span className="feed-card__set-label">{label}</span>
                          <table className="feed-card__set-table">
                            <thead><tr><td>Weight</td><td>Reps</td></tr></thead>
                            <tbody>
                              {sets.map((s) => (
                                <tr key={s.id}><td>{s.weight}kg</td><td>{s.reps}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                      const bdKey = `${item.id}-${log.movement}`;
                      const bdExpanded = expandedBd.has(bdKey);
                      return (
                        <div key={log.movement} className="feed-card__movement">
                          <span className={`feed-card__movement-name movement-${log.movement}`}>
                            {getMovementLabel(log.movement)}
                          </span>
                          {topSets.length > 0 && <SetGroup sets={topSets} label="Top Sets" />}
                          {backdownSets.length > 0 && (
                            <>
                              {bdExpanded && <SetGroup sets={backdownSets} label="Backdown" />}
                              <button className="feed-card__bd-toggle" onClick={() => toggleBd(bdKey)}>
                                {bdExpanded ? 'Hide backdowns' : `+${backdownSets.length} backdown${backdownSets.length > 1 ? 's' : ''}`}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {item.prs.length > 0 && (
                  <div className="feed-card__prs">
                    {item.prs.map((pr) => (
                      <div key={`${pr.movement}-${pr.weight}-${pr.reps}`} className="feed-card__pr-row">
                        <span className="feed-card__pr-badge">PR</span>
                        <span className={`feed-card__pr-movement movement-${pr.movement}`}>
                          {getMovementLabel(pr.movement)}
                        </span>
                        <span className="feed-card__pr-detail">
                          {pr.weight}kg × {pr.reps} · {Math.round(pr.e1rm)}kg e1RM
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>}
      </div>
    </div>
  );
}
