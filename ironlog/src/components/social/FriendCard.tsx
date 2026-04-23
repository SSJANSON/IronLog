import type { Friend } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FriendCardProps {
  friend: Friend;
  onAccept?: () => void;
  onRemove: () => void;
}

export function FriendCard({ friend, onAccept, onRemove }: FriendCardProps) {
  return (
    <Card className="friend-card">
      <div className="friend-card__avatar">
        {friend.avatarUrl ? (
          <img src={friend.avatarUrl} alt={friend.displayName} />
        ) : (
          <div className="friend-card__avatar-fallback">
            {friend.displayName[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="friend-card__info">
        <span className="friend-card__name">{friend.displayName}</span>
        <span className="friend-card__username">@{friend.username}</span>
        {friend.status === 'pending' && (
          <Badge variant="default">Pending</Badge>
        )}
      </div>
      <div className="friend-card__actions">
        {friend.status === 'pending' && onAccept && (
          <Button variant="primary" size="sm" onClick={onAccept}>
            Accept
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRemove}>
          {friend.status === 'pending' ? 'Decline' : 'Remove'}
        </Button>
      </div>
    </Card>
  );
}
