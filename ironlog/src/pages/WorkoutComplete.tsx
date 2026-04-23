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

  return (
    <div className="complete-page">
      <div className="complete-hero">
        <div className="complete-hero__icon">🏋️</div>
        <h1 className="complete-hero__title">Session Complete</h1>
        <p className="complete-hero__subtitle">{session.templateName}</p>
        <p className="complete-hero__date">{format(new Date(session.date), 'EEEE, MMM d yyyy')}</p>
      </div>

      {streak > 0 && (
        <div className="complete-card complete-card--streak">
          <span className="complete-card__icon">🔥</span>
          <div>
            <p className="complete-card__label">Weekly Streak</p>
            <p className="complete-card__value">{streak} {streak === 1 ? 'week' : 'weeks'} in a row</p>
          </div>
        </div>
      )}

      {newPRs.length > 0 && (
        <section className="complete-section">
          <h2 className="complete-section__title">Personal Records</h2>
          <div className="complete-pr-list">
            {newPRs.map((pr) => (
              <div key={`${pr.movement}-${pr.weight}-${pr.reps}`} className="complete-pr-row">
                <span className={`complete-pr-row__movement movement-${pr.movement}`}>
                  {getMovementLabel(pr.movement)}
                </span>
                <span className="complete-pr-row__detail">
                  {pr.weight}kg × {pr.reps} — {Math.round(pr.e1rm)}kg e1RM
                </span>
                <span className="complete-pr-row__badge">PR</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="complete-section">
        <h2 className="complete-section__title">Session Overview</h2>
        <div className="complete-stats-row">
          <div className="complete-stat">
            <span className="complete-stat__value">{session.movements.filter((m) => m.sets.length > 0).length}</span>
            <span className="complete-stat__label">Movements</span>
          </div>
          <div className="complete-stat">
            <span className="complete-stat__value">{totalSets}</span>
            <span className="complete-stat__label">Total Sets</span>
          </div>
          {backdownSetsCount > 0 && (
            <div className="complete-stat">
              <span className="complete-stat__value">{backdownSetsCount}</span>
              <span className="complete-stat__label">Backdowns</span>
            </div>
          )}
        </div>

        {session.movements
          .filter((log) => log.sets.length > 0)
          .map((log) => {
            const topSets = log.sets.filter((s) => !s.isBackdown);
            const backdownSets = log.sets.filter((s) => s.isBackdown);
            return (
              <div key={log.movement} className="complete-movement">
                <span className={`complete-movement__name movement-${log.movement}`}>
                  {getMovementLabel(log.movement)}
                </span>
                {topSets.length > 0 && (
                  <div className="complete-set-group">
                    <span className="complete-set-group__label">Top Sets</span>
                    <div className="complete-set-rows">
                      {topSets.map((s, i) => (
                        <div key={s.id} className="complete-set-row">
                          <span className="complete-set-row__num">{i + 1}</span>
                          <span>{s.weight}kg × {s.reps}</span>
                          {s.rpe != null && <span className="complete-set-row__rpe">RPE {s.rpe}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {backdownSets.length > 0 && (
                  <div className="complete-set-group">
                    <span className="complete-set-group__label complete-set-group__label--backdown">Backdown Sets</span>
                    <div className="complete-set-rows">
                      {backdownSets.map((s, i) => (
                        <div key={s.id} className="complete-set-row">
                          <span className="complete-set-row__num">{i + 1}</span>
                          <span>{s.weight}kg × {s.reps}</span>
                          {s.rpe != null && <span className="complete-set-row__rpe">RPE {s.rpe}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </section>

      <div className="complete-actions">
        <Button variant="primary" fullWidth onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
