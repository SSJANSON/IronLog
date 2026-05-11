import { useLocation, useNavigate } from 'react-router-dom';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getMovementLabel } from '../lib/prDetection';
import { Button } from '../components/ui/Button';
import type { WorkoutSession, PersonalRecord } from '../types';

function computeStreak(sessions: WorkoutSession[]): number {
  const completed = sessions.filter((s) => s.completed);
  const weekKeys = new Set(
    completed.map((s) =>
      format(startOfWeek(new Date(s.date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    )
  );

  let streak = 0;
  let current = startOfWeek(new Date(), { weekStartsOn: 1 });

  while (weekKeys.has(format(current, 'yyyy-MM-dd'))) {
    streak++;
    current = subWeeks(current, 1);
  }

  return streak;
}

export function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessions = useWorkoutStore((s) => s.sessions);

  const state = location.state as { session: WorkoutSession; newPRs: PersonalRecord[] } | null;

  if (!state) {
    navigate('/');
    return null;
  }

  const { session, newPRs } = state;
  const streak = computeStreak(sessions);

  const topSetsCount = session.movements.reduce(
    (sum, log) => sum + log.sets.filter((s) => !s.isBackdown).length,
    0
  );
  const backdownSetsCount = session.movements.reduce(
    (sum, log) => sum + log.sets.filter((s) => s.isBackdown).length,
    0
  );
  const totalSets = topSetsCount + backdownSetsCount;
  const activeMovements = session.movements.filter((m) => m.sets.length > 0);

  return (
    <div className="complete-page">

      {/* Hero */}
      <div className="complete-hero">
        <div className="complete-hero__icon">
          <span className="material-symbols-outlined" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h1 className="complete-hero__title">Session Complete</h1>
        <p className="complete-hero__subtitle">{session.templateName}</p>
        <p className="complete-hero__date">{format(new Date(session.date), 'EEEE, MMM d yyyy').toUpperCase()}</p>
      </div>

      {/* Stats row */}
      <div className="complete-stats-row">
        <div className="complete-stat">
          <span className="complete-stat__value">{activeMovements.length}</span>
          <span className="complete-stat__label">Movements</span>
        </div>
        <div className="complete-stat">
          <span className="complete-stat__value">{topSetsCount}</span>
          <span className="complete-stat__label">Top Sets</span>
        </div>
        {backdownSetsCount > 0 && (
          <div className="complete-stat">
            <span className="complete-stat__value">{backdownSetsCount}</span>
            <span className="complete-stat__label">Backdowns</span>
          </div>
        )}
        {streak > 0 && (
          <div className="complete-stat complete-stat--streak">
            <span className="complete-stat__value">{streak}</span>
            <span className="complete-stat__label">Wk Streak</span>
          </div>
        )}
      </div>

      {/* PRs */}
      {newPRs.length > 0 && (
        <section className="complete-section">
          <h2 className="complete-section__title">
            <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle' }}>trophy</span>
            {' '}Personal Records
          </h2>
          <div className="complete-pr-list">
            {newPRs.map((pr) => (
              <div key={`${pr.movement}-${pr.weight}-${pr.reps}`} className="complete-pr-row">
                <span className="complete-pr-row__badge">PR</span>
                <span className={`complete-pr-row__movement movement-${pr.movement}`}>
                  {getMovementLabel(pr.movement)}
                </span>
                <span className="complete-pr-row__detail">
                  {pr.weight}kg × {pr.reps}
                </span>
                <span className="complete-pr-row__e1rm">{Math.round(pr.e1rm)}kg e1RM</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movement breakdown */}
      <section className="complete-section">
        <h2 className="complete-section__title">Breakdown</h2>
        <div className="feed-card__movements" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          {activeMovements.map((log) => {
            const topSets = log.sets.filter((s) => !s.isBackdown);
            const backdownSets = log.sets.filter((s) => s.isBackdown);
            return (
              <div key={log.movement} className="feed-card__movement">
                <span className={`feed-card__movement-name movement-${log.movement}`}>
                  {getMovementLabel(log.movement)}
                </span>
                {topSets.length > 0 && (
                  <div className="feed-card__set-group">
                    <table className="feed-card__set-table">
                      <thead><tr><td>Weight</td><td>Reps</td><td>RPE</td></tr></thead>
                      <tbody>
                        {topSets.map((s) => (
                          <tr key={s.id}><td>{s.weight}kg</td><td>{s.reps}</td><td>{s.rpe ?? '—'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {backdownSets.length > 0 && (
                  <div className="feed-card__set-group">
                    <span className="feed-card__set-label">Backdown</span>
                    <table className="feed-card__set-table">
                      <tbody>
                        {backdownSets.map((s) => (
                          <tr key={s.id}><td>{s.weight}kg</td><td>{s.reps}</td><td>{s.rpe ?? '—'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="complete-actions">
        <Button variant="primary" fullWidth onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
