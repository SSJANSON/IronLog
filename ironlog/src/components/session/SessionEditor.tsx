import { useState } from 'react';
import { format } from 'date-fns';
import type { WorkoutSession, Set } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';
import { epley1RM } from '../../lib/epley';
import { Button } from '../ui/Button';

interface SessionEditorProps {
  session: WorkoutSession;
  onSave: (updated: WorkoutSession) => void;
  onCancel: () => void;
}

interface EditSet extends Omit<Set, 'weight' | 'reps' | 'rpe'> {
  weight: string;
  reps: string;
  rpe: string;
  isBackdown?: boolean;
}

function toEditSet(s: Set): EditSet {
  return {
    id: s.id,
    weight: String(s.weight),
    reps: String(s.reps),
    rpe: s.rpe != null ? String(s.rpe) : '',
    isBackdown: s.isBackdown,
  };
}

function toSet(s: EditSet): Set {
  return {
    id: s.id,
    weight: parseFloat(s.weight) || 0,
    reps: parseInt(s.reps, 10) || 0,
    rpe: s.rpe !== '' ? parseFloat(s.rpe) : undefined,
    isBackdown: s.isBackdown,
  };
}

export function SessionEditor({ session, onSave, onCancel }: SessionEditorProps) {
  const [name, setName] = useState(session.templateName);
  const [date, setDate] = useState(format(new Date(session.date), 'yyyy-MM-dd'));
  const [movements, setMovements] = useState(
    session.movements.map((log) => ({
      movement: log.movement,
      sets: log.sets.map(toEditSet),
    }))
  );

  const updateSet = (movIdx: number, setIdx: number, field: keyof EditSet, value: string) => {
    setMovements((prev) =>
      prev.map((log, mi) =>
        mi !== movIdx ? log : {
          ...log,
          sets: log.sets.map((s, si) => si !== setIdx ? s : { ...s, [field]: value }),
        }
      )
    );
  };

  const removeSet = (movIdx: number, setIdx: number) => {
    setMovements((prev) =>
      prev.map((log, mi) =>
        mi !== movIdx ? log : { ...log, sets: log.sets.filter((_, si) => si !== setIdx) }
      )
    );
  };

  const addSet = (movIdx: number, isBackdown: boolean) => {
    const group = movements[movIdx].sets.filter((s) => !!s.isBackdown === isBackdown);
    const last = group.at(-1);
    setMovements((prev) =>
      prev.map((log, mi) =>
        mi !== movIdx ? log : {
          ...log,
          sets: [...log.sets, {
            id: crypto.randomUUID(),
            weight: last?.weight ?? '',
            reps: last?.reps ?? '',
            rpe: '',
            isBackdown,
          }],
        }
      )
    );
  };

  const handleSave = () => {
    const updated: WorkoutSession = {
      ...session,
      templateName: name.trim() || session.templateName,
      date: date ? new Date(date).toISOString() : session.date,
      movements: movements.map((log) => ({
        movement: log.movement,
        sets: log.sets.map(toSet).filter((s) => s.weight > 0 && s.reps > 0),
      })),
    };
    onSave(updated);
  };

  const renderSetRows = (movIdx: number, group: { set: EditSet; originalIdx: number }[]) =>
    group.map(({ set: s, originalIdx: si }, groupIdx) => {
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      const e1rm = w > 0 && r > 0 ? Math.round(epley1RM(w, r)) : '—';
      return (
        <div key={s.id} className="editor-set-row">
          <span className="set-row__num">{groupIdx + 1}</span>
          <input
            className="input editor-set-input"
            type="number"
            min="0"
            step="0.5"
            placeholder="kg"
            value={s.weight}
            onChange={(e) => updateSet(movIdx, si, 'weight', e.target.value)}
            inputMode="decimal"
          />
          <input
            className="input editor-set-input"
            type="number"
            min="1"
            placeholder="reps"
            value={s.reps}
            onChange={(e) => updateSet(movIdx, si, 'reps', e.target.value)}
            inputMode="numeric"
          />
          <span className="editor-e1rm">{e1rm}{typeof e1rm === 'number' ? 'kg' : ''}</span>
          <input
            className="input editor-set-input"
            type="number"
            min="6"
            max="10"
            step="0.5"
            placeholder="—"
            value={s.rpe}
            onChange={(e) => updateSet(movIdx, si, 'rpe', e.target.value)}
            inputMode="decimal"
          />
          <button
            className="set-row__remove"
            onClick={() => removeSet(movIdx, si)}
            aria-label="Remove set"
          >
            ×
          </button>
        </div>
      );
    });

  return (
    <div className="editor-overlay">
      <div className="editor-sheet">
        <div className="editor-header">
          <h2 className="editor-title">{session.templateName}</h2>
          <button className="editor-close" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="editor-body">
          <div className="input-group">
            <label className="input-label" htmlFor="edit-name">Session Name</label>
            <input
              id="edit-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={session.templateName}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-date">Date</label>
            <input
              id="edit-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {movements.map((log, mi) => {
            const indexed = log.sets.map((s, i) => ({ set: s, originalIdx: i }));
            const topGroup = indexed.filter(({ set }) => !set.isBackdown);
            const backdownGroup = indexed.filter(({ set }) => !!set.isBackdown);

            return (
              <div key={log.movement} className="editor-movement">
                <span className={`session-detail__movement-name movement-${log.movement}`}>
                  {getMovementLabel(log.movement)}
                </span>

                <span className="session-detail__set-group-label">Top Sets</span>
                <div className="session-detail__sets">
                  <div className="editor-set-header">
                    <span>#</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>e1RM</span>
                    <span>RPE</span>
                    <span></span>
                  </div>
                  {renderSetRows(mi, topGroup)}
                </div>
                <button className="editor-add-set" onClick={() => addSet(mi, false)}>
                  + Add top set
                </button>

                <span className="session-detail__set-group-label session-detail__set-group-label--backdown">
                  Backdown Sets
                </span>
                <div className="session-detail__sets">
                  <div className="editor-set-header">
                    <span>#</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>e1RM</span>
                    <span>RPE</span>
                    <span></span>
                  </div>
                  {renderSetRows(mi, backdownGroup)}
                </div>
                <button className="editor-add-set" onClick={() => addSet(mi, true)}>
                  + Add backdown set
                </button>
              </div>
            );
          })}
        </div>

        <div className="editor-footer">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
