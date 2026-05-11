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

                  {session.movements.filter((log) => log.sets.length > 0).length > 0 && (
                    <div className="feed-card__movements">
                      {session.movements
                        .filter((log) => log.sets.length > 0)
                        .map((log) => {
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
                              {backdownSets.length > 0 && (() => {
                                const bdKey = `${session.id}-${log.movement}`;
                                const bdExpanded = expandedBd.has(bdKey);
                                return (
                                  <>
                                    {bdExpanded && (
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
                                    <button className="feed-card__bd-toggle" onClick={() => toggleBd(bdKey)}>
                                      {bdExpanded ? 'Hide backdowns' : `+${backdownSets.length} backdown${backdownSets.length > 1 ? 's' : ''}`}
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
