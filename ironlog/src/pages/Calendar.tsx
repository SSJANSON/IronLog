import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth,
  isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { SessionEditor } from '../components/session/SessionEditor';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getMovementTabLabel } from '../lib/prDetection';
import type { WorkoutSession } from '../types';

const MAIN_LIFTS = ['squat', 'bench', 'deadlift'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const updateSession = useWorkoutStore((s) => s.updateSession);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<Map<string, string>>(new Map());
  const getActiveTab = (sessionId: string, fallback: string) => activeTab.get(sessionId) ?? fallback;
  const setTab = (sessionId: string, movement: string) =>
    setActiveTab((prev) => new Map(prev).set(sessionId, movement));
  const [expandedBd, setExpandedBd] = useState<Set<string>>(new Set());
  const toggleBd = (key: string) => setExpandedBd((prev) => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of sessions.filter((s) => s.completed)) {
      const key = format(new Date(session.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(session);
    }
    return map;
  }, [sessions]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    if (!sessionsByDate.has(key)) return;
    setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day));
  };

  const selectedSessions = selectedDate
    ? (sessionsByDate.get(format(selectedDate, 'yyyy-MM-dd')) ?? [])
    : [];

  return (
    <div className="page">
      <Header title="Calendar" />
      <div className="page-content">

        <div className="cal-nav">
          <button
            className="cal-nav-btn"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="cal-month-label">{format(currentMonth, 'MMMM yyyy')}</span>
          <button
            className="cal-nav-btn"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="cal-grid">
          {DAY_LABELS.map((d) => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const hasSession = sessionsByDate.has(key);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <button
                key={key}
                className={[
                  'cal-day',
                  !inMonth && 'cal-day--faded',
                  today && 'cal-day--today',
                  hasSession && 'cal-day--has-session',
                  isSelected && 'cal-day--selected',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(day)}
                aria-pressed={isSelected}
                aria-label={`${format(day, 'MMMM d')}${hasSession ? ', has session' : ''}`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {selectedDate && selectedSessions.length > 0 && (
          <div className="cal-sessions">
            <h3 className="section-title">{format(selectedDate, 'EEEE, MMMM d')}</h3>
            {selectedSessions.map((session) => {
              const activeMovements = session.movements.filter((log) => log && Array.isArray(log.sets) && log.sets.length > 0);
              const mainLogs = activeMovements.filter((log) => MAIN_LIFTS.includes(log.movement));
              const accessoryLogs = activeMovements.filter((log) => !MAIN_LIFTS.includes(log.movement));
              const hasAccessories = accessoryLogs.length > 0;
              const tabIds = [...mainLogs.map((log) => log.movement), ...(hasAccessories ? ['accessories'] : [])];
              const firstTab = tabIds[0] ?? null;
              const currentTab = firstTab ? getActiveTab(session.id, firstTab) : null;
              const currentMainLog = currentTab !== 'accessories'
                ? mainLogs.find((log) => log.movement === currentTab) ?? null
                : null;
              return (
                <Card key={session.id} className="feed-card">
                  <div className="feed-card__meta">
                    <span className="feed-card__name">{session.templateName}</span>
                    <button
                      className="tmpl-card-action-btn"
                      onClick={() => setEditingSession(session)}
                      style={{ marginLeft: 'auto' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      Edit
                    </button>
                    <button
                      className="tmpl-card-action-btn tmpl-card-action-btn--danger"
                      onClick={() => { if (confirm('Delete this session?')) deleteSession(session.id); }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      Delete
                    </button>
                  </div>

                  {tabIds.length > 0 && (
                    <div className="social-card__tabs-section">
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
                        {hasAccessories && (
                          <button
                            className={`social-card__tab social-card__tab--accessories${currentTab === 'accessories' ? ' social-card__tab--active' : ''}`}
                            onClick={() => setTab(session.id, 'accessories')}
                          >
                            <span className="social-card__tab-name">Accessories</span>
                            <span className="social-card__tab-stat">({accessoryLogs.length})</span>
                          </button>
                        )}
                      </div>

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
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {editingSession && (
        <SessionEditor
          session={editingSession}
          onSave={(updated) => { updateSession(updated); setEditingSession(null); }}
          onCancel={() => setEditingSession(null)}
        />
      )}
    </div>
  );
}
