import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { FriendCard } from '../components/social/FriendCard';
import { ProgressFeed } from '../components/social/ProgressFeed';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useSocialStore } from '../store/useSocialStore';

type Tab = 'feed' | 'friends';

export function Social() {
  const { friends, feed, sendFriendRequest, acceptFriendRequest, removeFriend } =
    useSocialStore();

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [addUsername, setAddUsername] = useState('');

  const handleAddFriend = () => {
    const username = addUsername.trim();
    if (!username) return;
    sendFriendRequest(username);
    setAddUsername('');
  };

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const feedForFriends = feed.filter((item) =>
    acceptedFriends.some((f) => f.id === item.userId)
  );

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
            Friends ({acceptedFriends.length})
          </button>
        </div>

        {activeTab === 'feed' && <ProgressFeed items={feedForFriends} />}

        {activeTab === 'friends' && (
          <div className="friends-tab">
            <div className="add-friend-row">
              <Input
                placeholder="Search by username"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              />
              <Button variant="primary" size="sm" onClick={handleAddFriend}>
                Add
              </Button>
            </div>

            {friends.length === 0 ? (
              <div className="empty-state">
                <p>Add friends by their username to follow their progress.</p>
              </div>
            ) : (
              <div className="friend-list">
                {friends.map((f) => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    onAccept={
                      f.status === 'pending'
                        ? () => acceptFriendRequest(f.id)
                        : undefined
                    }
                    onRemove={() => removeFriend(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
