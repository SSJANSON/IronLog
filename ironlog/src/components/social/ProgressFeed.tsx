import type { FeedItem } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getMovementLabel } from '../../lib/prDetection';
import { formatChartDate } from '../../lib/dateUtils';

interface ProgressFeedProps {
  items: FeedItem[];
}

export function ProgressFeed({ items }: ProgressFeedProps) {
  if (items.length === 0) {
    return (
      <div className="feed-empty">
        Add friends to see their progress here
      </div>
    );
  }

  return (
    <div className="feed">
      {items.map((item) => (
        <Card key={item.id} className="feed-item">
          <div className="feed-item__avatar">
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt={item.displayName} />
            ) : (
              <div className="feed-item__avatar-fallback">
                {item.displayName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="feed-item__body">
            <div className="feed-item__header">
              <strong>{item.displayName}</strong>
              <span className="feed-item__date">{formatChartDate(item.date)}</span>
            </div>
            {item.type === 'pr' && item.movement && (
              <div className="feed-item__content">
                <Badge variant="pr">PR</Badge>
                <span>
                  {getMovementLabel(item.movement)}: {item.weight}kg × {item.reps} ={' '}
                  {Math.round(item.e1rm ?? 0)}kg e1RM
                </span>
              </div>
            )}
            {item.type === 'session' && (
              <div className="feed-item__content">
                Completed <strong>{item.sessionName}</strong>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
