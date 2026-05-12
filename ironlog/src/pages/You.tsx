import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SessionEditor } from '../components/session/SessionEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import { getMovementLabel, MOVEMENTS } from '../lib/prDetection';
import type { WorkoutSession } from '../types';
import { format } from 'date-fns';

export function You() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore((s) => s.sessions);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const updateSession = useWorkoutStore((s) => s.updateSession);
  const { prs } = usePersonalRecords();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [expandedBd, setExpandedBd] = useState<Set<string>>(new Set());
  const toggleBd = (key: string) => setExpandedBd((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const [activeTab, setActiveTab] = useState<Map<string, string>>(new Map());
  const getActiveTab = (sessionId: string, fallback: string) =>
    activeTab.get(sessionId) ?? fallback;
  const setTab = (sessionId: string, movement: string) =>
    setActiveTab((prev) => new Map(prev).set(sessionId, movement));

  const recentSessions = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <Header
        title="You"
        right={
          <Link to="/profile" className="profile-icon-btn" aria-label="Profile">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
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
            <div className="session-list">
              {recentSessions.map((session) => (
                <Card key={session.id} className="feed-card">
                  <div className="feed-card__meta">
                    <span className="feed-card__name">{session.templateName}</span>
                    <div className="feed-card__actions">
                      <span className="feed-card__time">
                        {format(new Date(session.date), 'MMM d, yyyy')}
                      </span>
                      <button
                        className="feed-card__action-btn"
                        onClick={() => setEditingSession(session)}
                        aria-label="Edit"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      {confirmDeleteId === session.id ? (
                        <>
                          <button className="feed-card__confirm-yes" onClick={() => { deleteSession(session.id); setConfirmDeleteId(null); }}>Delete</button>
                          <button className="feed-card__confirm-no" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button
                          className="feed-card__action-btn"
                          onClick={() => setConfirmDeleteId(session.id)}
                          aria-label="Delete"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const activeMovements = session.movements.filter((log) => log.sets.length > 0);
                    if (activeMovements.length === 0) return null;
                    const currentTab = getActiveTab(session.id, activeMovements[0].movement);
                    const currentLog = activeMovements.find((log) => log.movement === currentTab);
                    if (!currentLog) return null;
                    return (
                      <div className="social-card__tabs-section">
                        {activeMovements.length > 1 && <div className="social-card__tabs">
                          {activeMovements.map((log) => {
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
                                <span className="social-card__tab-name">{getMovementLabel(log.movement)}</span>
                                {best && (
                                  <span className="social-card__tab-stat">{best.weight}kg×{best.reps}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>}
                        <div className={`social-card__set-panel social-card__set-panel--${currentLog.movement}`}>
                          {currentLog.sets.filter((s) => !s.isBackdown).length > 0 && (
                            <table className="social-card__set-table">
                              <thead>
                                <tr><td>Weight</td><td>Reps</td><td>RPE</td></tr>
                              </thead>
                              <tbody>
                                {currentLog.sets.filter((s) => !s.isBackdown).map((s) => (
                                  <tr key={s.id} className="social-card__set-row">
                                    <td className="social-card__set-cell social-card__set-cell--weight">{s.weight}kg</td>
                                    <td className="social-card__set-cell">{s.reps}</td>
                                    <td className="social-card__set-cell">{s.rpe ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {currentLog.sets.filter((s) => s.isBackdown).length > 0 && (() => {
                            const bdKey = `${session.id}-${currentLog.movement}`;
                            const bdExpanded = expandedBd.has(bdKey);
                            const backdownSets = currentLog.sets.filter((s) => s.isBackdown);
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
                      </div>
                    );
                  })()}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
