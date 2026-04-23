import type { PersonalRecord } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';

interface PRBadgeProps {
  prs: PersonalRecord[];
  onDismiss: () => void;
}

export function PRBadge({ prs, onDismiss }: PRBadgeProps) {
  if (prs.length === 0) return null;

  return (
    <div className="pr-badge-overlay" role="alert" aria-live="assertive">
      <div className="pr-badge-card">
        <div className="pr-badge-icon">🏆</div>
        <h2 className="pr-badge-title">Personal Record{prs.length > 1 ? 's' : ''}!</h2>
        <ul className="pr-badge-list">
          {prs.map((pr, i) => (
            <li key={i} className="pr-badge-item">
              <span className="pr-badge-movement">{getMovementLabel(pr.movement)}</span>
              <span className="pr-badge-value">
                {pr.weight}kg × {pr.reps} = {Math.round(pr.e1rm)}kg e1RM
              </span>
            </li>
          ))}
        </ul>
        <button className="btn btn--primary" onClick={onDismiss}>
          Keep Going!
        </button>
      </div>
    </div>
  );
}
