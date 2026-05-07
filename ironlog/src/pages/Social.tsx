import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FriendCard } from '../components/social/FriendCard';
import { fetchFeed } from '../lib/feedService';
import { useFriendStore } from '../store/useFriendStore';
import { getMovementLabel } from '../lib/prDetection';
import type { FeedEntry } from '../lib/feedService';
import type { SearchResult } from '../store/useFriendStore';

export function Social() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');

  // Feed
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Friends
  const { friends, loadFriends, searchUsers, sendFriendRequest, acceptFriendRequest, removeFriend } = useFriendStore();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (activeTab !== 'feed') return;
    setFeedLoading(true);
    fetchFeed().then((items) => {
      setFeed(items);
      setFeedLoading(false);
    });
  }, [activeTab]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await searchUsers(query.trim());
    setSearchResults(results);
    setSearching(false);
  };

  const handleSendRequest = async (friendId: string) => {
    setPendingIds((s) => new Set(s).add(friendId));
    await sendFriendRequest(friendId);
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const incomingRequests = friends.filter((f) => f.status === 'pending' && f.direction === 'received');
  const outgoingRequests = friends.filter((f) => f.status === 'pending' && f.direction === 'sent');

  return (
    <div className="page">
      <Header title="Social" />
      <div className="page-content">
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'feed' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends {acceptedFriends.length > 0 && `(${acceptedFriends.length})`}
            {incomingRequests.length > 0 && <span className="friend-badge">{incomingRequests.length}</span>}
          </button>
        </div>

        {activeTab === 'feed' && (
          <div className="feed-list">
            {feedLoading ? (
              <p className="feed-empty">Loading…</p>
            ) : feed.length === 0 ? (
              <Card className="empty-state">
                <p>No activity yet.</p>
                <button className="link-btn" onClick={() => {
                  setFeedLoading(true);
                  fetchFeed().then((items) => { setFeed(items); setFeedLoading(false); });
                }}>Refresh</button>
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
                              <thead>
                                <tr>
                                  <td>Weight</td>
                                  <td>Reps</td>
                                </tr>
                              </thead>
                              <tbody>
                                {sets.map((s) => (
                                  <tr key={s.id}>
                                    <td>{s.weight}kg</td>
                                    <td>{s.reps}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                        return (
                          <div key={log.movement} className="feed-card__movement">
                            <span className={`feed-card__movement-name movement-${log.movement}`}>
                              {getMovementLabel(log.movement)}
                            </span>
                            {topSets.length > 0 && <SetGroup sets={topSets} label="Top Sets" />}
                            {backdownSets.length > 0 && <SetGroup sets={backdownSets} label="Backdown" />}
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
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="friends-tab">
            <div className="add-friend-row">
              <Input
                placeholder="Search by username"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchResults([]); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="primary" size="sm" onClick={handleSearch} disabled={searching}>
                {searching ? '…' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((r) => (
                  <Card key={r.id} className="friend-card">
                    <div className="friend-card__avatar">
                      <div className="friend-card__avatar-fallback">{r.displayName[0].toUpperCase()}</div>
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

            {incomingRequests.length > 0 && (
              <>
                <p className="friends-section-label">Requests</p>
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
              </>
            )}
            {outgoingRequests.length > 0 && (
              <>
                <p className="friends-section-label">Sent</p>
                <div className="friend-list">
                  {outgoingRequests.map((f) => (
                    <FriendCard
                      key={f.id}
                      friend={f}
                      onRemove={() => removeFriend(f.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {acceptedFriends.length > 0 && (
              <>
                <p className="friends-section-label">Friends</p>
                <div className="friend-list">
                  {acceptedFriends.map((f) => (
                    <FriendCard
                      key={f.id}
                      friend={f}
                      onRemove={() => removeFriend(f.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {acceptedFriends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 && searchResults.length === 0 && (
              <Card className="empty-state">
                <p>Search for friends by username to get started.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
