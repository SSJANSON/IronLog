import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth,
  isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { getMovementLabel } from '../lib/prDetection';
import type { WorkoutSession } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
            {selectedSessions.map((session) => (
              <Card key={session.id} className="session-summary-card">
                <div className="session-summary-card__header">
                  <strong>{session.templateName}</strong>
                </div>
                <div className="session-detail">
                  {session.movements
                    .filter((log) => log.sets.length > 0)
                    .map((log) => (
                      <div key={log.movement} className="session-detail__movement">
                        <span className={`session-detail__movement-name movement-${log.movement}`}>
                          {getMovementLabel(log.movement)}
                        </span>
                        <div className="session-detail__sets">
                          <div className="session-detail__set-header">
                            <span>Set</span>
                            <span>Weight</span>
                            <span>Reps</span>
                            <span>RPE</span>
                          </div>
                          {log.sets.map((set, idx) => (
                            <div key={set.id} className="session-detail__set-row">
                              <span>{idx + 1}</span>
                              <span>{set.weight}kg</span>
                              <span>{set.reps}</span>
                              <span>{set.rpe ?? '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
