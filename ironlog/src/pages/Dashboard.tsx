import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SessionEditor } from '../components/session/SessionEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import { getMovementLabel, getMovementTabLabel, MOVEMENTS } from '../lib/prDetection';
import type { WorkoutSession } from '../types';

const MAIN_LIFTS = ['squat', 'bench', 'deadlift'];

export function Dashboard() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore((s) => s.sessions);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const updateSession = useWorkoutStore((s) => s.updateSession);
  const { prs } = usePersonalRecords();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [activeTab, setActiveTab] = useState<Map<string, string>>(new Map());
  const [expandedBd, setExpandedBd] = useState<Set<string>>(new Set());

  const getActiveTab = (id: string, fallback: string) => activeTab.get(id) ?? fallback;
  const setTab = (id: string, movement: string) =>
    setActiveTab((prev) => new Map(prev).set(id, movement));
  const toggleBd = (key: string) => setExpandedBd((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const recentSessions = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <Header
        title="IronLog"
        right={
          <Link to="/profile" className="profile-icon-btn" aria-label="Profile">
            👤
          </Link>
        }
      />

      {editingSession && (
        <SessionEditor
          session={editingSession}
          onSave={(updated) => { updateSession(updated); setEditingSession(null); }}
          onCancel={() => setEditingSession(null)}
        />
      )}

      <div className="page-content">
        <section className="dashboard-section">
          <h2 className="section-title">Personal Records</h2>
          <div className="pr-grid">
            {MOVEMENTS.map((m) => {
              const pr = prs[m];
              return (
                <Card key={m} className={`pr-card pr-card--${m}`}>
                  <span className="pr-card__movement">{getMovementLabel(m)}</span>
                  {pr ? (
                    <>
                      <span className="pr-card__weight">{pr.weight}kg</span>
                      <span className="pr-card__reps">×{pr.reps}</span>
                      <span className="pr-card__e1rm">{Math.round(pr.e1rm)}kg e1RM</span>
                    </>
                  ) : (
                    <span className="pr-card__empty">No data yet</span>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Sessions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/session')}>
              + New
            </Button>
          </div>
          {recentSessions.length === 0 ? (
            <Card className="empty-state">
              <p>No sessions yet. Start your first workout!</p>
              <Button variant="primary" onClick={() => navigate('/templates')}>
                Browse Templates
              </Button>
            </Card>
          ) : (
            <div className="feed-list">
              {recentSessions.map((session) => {
                const activeMovements = session.movements.filter(
                  (log) => log && Array.isArray(log.sets) && log.sets.length > 0
                );
                const mainLogs = activeMovements.filter((log) => MAIN_LIFTS.includes(log.movement));
                const accessoryLogs = activeMovements.filter((log) => !MAIN_LIFTS.includes(log.movement));
                const hasAccessories = accessoryLogs.length > 0;

                const tabIds = [
                  ...mainLogs.map((log) => log.movement),
                  'accessories',
                ];
                const firstTab = tabIds[0] ?? null;
                const currentTab = firstTab ? getActiveTab(session.id, firstTab) : null;
                const currentMainLog = currentTab !== 'accessories'
                  ? mainLogs.find((log) => log.movement === currentTab) ?? null
                  : null;

                return (
                  <article key={session.id} className="social-card">
                    <div className="social-card__header">
                      <div className="social-card__user-info" style={{ flex: 1 }}>
                        <span className="social-card__display-name">{session.templateName}</span>
                        <span className="social-card__time">
                          {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button className="tmpl-card-action-btn" onClick={() => setEditingSession(session)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        {confirmDeleteId === session.id ? (
                          <>
                            <button className="feed-card__confirm-yes" onClick={() => { deleteSession(session.id); setConfirmDeleteId(null); }}>Delete</button>
                            <button className="feed-card__confirm-no" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="tmpl-card-action-btn tmpl-card-action-btn--danger" onClick={() => setConfirmDeleteId(session.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {tabIds.length > 0 && (
                      <div className="social-card__tabs-section">
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
                                  onClick={() => setTab(session.id, log.movement)}
                                >
                                  <span className="social-card__tab-name">
                                    {log.variation && log.variation !== 'competition' ? `${log.variation} ${getMovementTabLabel(log.movement)}` : getMovementTabLabel(log.movement)}
                                  </span>
                                  {best && <span className="social-card__tab-stat">{best.weight}kg×{best.reps}</span>}
                                </button>
                              );
                            })}
                            <button
                              className={`social-card__tab social-card__tab--accessories${currentTab === 'accessories' ? ' social-card__tab--active' : ''}`}
                              onClick={() => setTab(session.id, 'accessories')}
                            >
                              <span className="social-card__tab-name">Accessories</span>
                              {hasAccessories && <span className="social-card__tab-stat">({accessoryLogs.length})</span>}
                            </button>
                          </div>
                        )}

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
                              const bdKey = `${session.id}-${currentMainLog.movement}`;
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

                        {currentTab === 'accessories' && (
                          <div className="social-card__set-panel social-card__accessories-panel">
                            {!hasAccessories && (
                              <p style={{ fontSize: 12, color: 'var(--color-text-disabled)', padding: 'var(--space-2) 0' }}>No accessories logged</p>
                            )}
                            {accessoryLogs.map((log) => {
                              const first = log.sets[0];
                              const expandKey = `${session.id}-acc-${log.movement}`;
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
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
