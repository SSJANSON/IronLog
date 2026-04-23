import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SessionEditor } from '../components/session/SessionEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import { getMovementLabel, MOVEMENTS } from '../lib/prDetection';
import type { WorkoutSession } from '../types';
import { format } from 'date-fns';

export function Dashboard() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore((s) => s.sessions);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const updateSession = useWorkoutStore((s) => s.updateSession);
  const { prs } = usePersonalRecords();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);

  const recentSessions = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <Header title="IronLog" />

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
                <Card key={session.id} className="session-summary-card">
                  <div className="session-summary-card__header">
                    <strong>{session.templateName}</strong>
                    <div className="session-summary-card__actions">
                      <span className="session-summary-card__date">
                        {format(new Date(session.date), 'MMM d, yyyy')}
                      </span>
                      <button
                        className="session-edit-btn"
                        onClick={() => setEditingSession(session)}
                        aria-label="Edit session"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === session.id ? (
                        <>
                          <button
                            className="session-delete-confirm"
                            onClick={() => {
                              deleteSession(session.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            className="session-delete-cancel"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="session-delete-btn"
                          onClick={() => setConfirmDeleteId(session.id)}
                          aria-label="Delete session"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="session-detail">
                    {session.movements
                      .filter((log) => log.sets.length > 0)
                      .map((log) => {
                        const topSets = log.sets.filter((s) => !s.isBackdown);
                        const backdownSets = log.sets.filter((s) => s.isBackdown);
                        const renderTable = (sets: typeof log.sets, backdown: boolean) => (
                          <div className="session-detail__group">
                            <span className={`session-detail__set-group-label${backdown ? ' session-detail__set-group-label--backdown' : ''}`}>
                              {backdown ? 'Backdown Sets' : 'Top Sets'}
                            </span>
                            <div className="session-detail__sets">
                              <div className="session-detail__set-header">
                                <span>#</span>
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>RPE</span>
                              </div>
                              {sets.map((set, idx) => (
                                <div key={set.id} className="session-detail__set-row">
                                  <span>{idx + 1}</span>
                                  <span>{set.weight}kg</span>
                                  <span>{set.reps}</span>
                                  <span>{set.rpe ?? '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                        return (
                          <div key={log.movement} className="complete-movement">
                            <span className={`complete-movement__name movement-${log.movement}`}>
                              {getMovementLabel(log.movement)}
                            </span>
                            {topSets.length > 0 && renderTable(topSets, false)}
                            {backdownSets.length > 0 && renderTable(backdownSets, true)}
                          </div>
                        );
                      })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
