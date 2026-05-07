import { useState } from 'react';
import type { Set } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { PlateCalculator } from './PlateCalculator';

interface MovementCardProps {
  movement: string;
  sets: Set[];
  previousTopSet?: { weight: number; reps: number } | null;
  targetSets?: number;
  targetReps?: number;
  backdownSets?: number;
  backdownReps?: number;
}

interface PendingRow {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
}

function makePendingRow(prefillReps = '', prefillWeight = ''): PendingRow {
  return { id: crypto.randomUUID(), weight: prefillWeight, reps: prefillReps, rpe: '' };
}

function SetTable({
  label,
  isBackdown,
  loggedSets,
  pendingRows,
  onLog,
  onRemoveLogged,
  onAddRow,
  onChangeRow,
  onWeightFocus,
}: {
  label: string;
  isBackdown: boolean;
  loggedSets: Set[];
  pendingRows: PendingRow[];
  onLog: (row: PendingRow) => void;
  onRemoveLogged: (id: string) => void;
  onAddRow: () => void;
  onChangeRow: (id: string, field: keyof PendingRow, value: string) => void;
  onWeightFocus: (weight: string) => void;
}) {
  return (
    <div className="log-table">
      <div className={`log-table__section-label${isBackdown ? ' log-table__section-label--backdown' : ''}`}>
        {label}
      </div>
      <div className="log-table__head">
        <span>SET</span>
        <span>KG</span>
        <span>REPS</span>
        <span>RPE</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>done</span>
      </div>

      {loggedSets.map((s, idx) => (
        <div key={s.id} className="log-table__row log-table__row--done">
          <span className="log-table__set-num">{idx + 1}</span>
          <span>{s.weight}</span>
          <span>{s.reps}</span>
          <span>{s.rpe ?? '—'}</span>
          <button className="log-table__remove" onClick={() => onRemoveLogged(s.id)} aria-label="Remove">
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </button>
        </div>
      ))}

      {pendingRows.map((row, idx) => (
        <div key={row.id} className="log-table__row log-table__row--active">
          <span className="log-table__set-num log-table__set-num--active">{loggedSets.length + idx + 1}</span>
          <input
            className="log-table__input"
            type="number"
            min="0"
            step="0.5"
            placeholder="—"
            value={row.weight}
            onChange={(e) => { onChangeRow(row.id, 'weight', e.target.value); onWeightFocus(e.target.value); }}
            onFocus={(e) => onWeightFocus(e.target.value)}
            inputMode="decimal"
          />
          <input
            className="log-table__input"
            type="number"
            min="1"
            placeholder="—"
            value={row.reps}
            onChange={(e) => onChangeRow(row.id, 'reps', e.target.value)}
            inputMode="numeric"
          />
          <input
            className="log-table__input"
            type="number"
            min="6"
            max="10"
            step="0.5"
            placeholder="—"
            value={row.rpe}
            onChange={(e) => onChangeRow(row.id, 'rpe', e.target.value)}
            inputMode="decimal"
          />
          <button
            className="log-table__check"
            onClick={() => onLog(row)}
            aria-label="Log set"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>done</span>
          </button>
        </div>
      ))}

    </div>
  );
}

export function MovementCard({
  movement, sets, previousTopSet,
  targetSets = 1, targetReps, backdownSets = 0, backdownReps,
}: MovementCardProps) {
  const logSet = useWorkoutStore((s) => s.logSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const prefillWeight = previousTopSet ? String(previousTopSet.weight) : '';
  const prefillReps = previousTopSet?.reps
    ? String(previousTopSet.reps)
    : targetReps ? String(targetReps) : '';
  const prefillBdReps = backdownReps ? String(backdownReps) : '';

  const initRows = (count: number, reps: string, weight = '') =>
    Array.from({ length: count }, () => makePendingRow(reps, weight));

  const [topPending, setTopPending] = useState<PendingRow[]>(() => initRows(targetSets, prefillReps, prefillWeight));
  const [bdPending, setBdPending] = useState<PendingRow[]>(() => initRows(backdownSets, prefillBdReps));
  const [activeWeight, setActiveWeight] = useState<number>(parseFloat(prefillWeight) || 0);

  const loggedTop = sets.filter((s) => !s.isBackdown);
  const loggedBd = sets.filter((s) => s.isBackdown);

  const handleLog = (isBackdown: boolean) => (row: PendingRow) => {
    const w = parseFloat(row.weight);
    const r = parseInt(row.reps, 10);
    if (!w || !r || w <= 0 || r <= 0) return;
    logSet(movement, {
      weight: w,
      reps: r,
      rpe: row.rpe ? parseFloat(row.rpe) : undefined,
      isBackdown,
    });
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => prev.filter((p) => p.id !== row.id));
  };

  const handleChange = (isBackdown: boolean) => (id: string, field: keyof PendingRow, value: string) => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRow = (isBackdown: boolean) => () => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => [...prev, makePendingRow(isBackdown ? prefillBdReps : prefillReps)]);
  };

  return (
    <div className="movement-card">
      <div className="movement-card__header">
        <h3 className={`movement-card__title movement-${movement}`}>{getMovementLabel(movement)}</h3>
        {previousTopSet && (
          <span className="movement-card__prev">
            Prev {previousTopSet.weight}kg × {previousTopSet.reps}
          </span>
        )}
      </div>

      <SetTable
        label="Top Sets"
        isBackdown={false}
        loggedSets={loggedTop}
        pendingRows={topPending}
        onLog={handleLog(false)}
        onRemoveLogged={(id) => removeSet(movement, id)}
        onAddRow={handleAddRow(false)}
        onChangeRow={handleChange(false)}
        onWeightFocus={(w) => setActiveWeight(parseFloat(w) || 0)}
      />

      {(backdownSets > 0 || loggedBd.length > 0 || bdPending.length > 0) && (
        <SetTable
          label="Backdown Sets"
          isBackdown={true}
          loggedSets={loggedBd}
          pendingRows={bdPending}
          onLog={handleLog(true)}
          onRemoveLogged={(id) => removeSet(movement, id)}
          onAddRow={handleAddRow(true)}
          onChangeRow={handleChange(true)}
          onWeightFocus={(w) => setActiveWeight(parseFloat(w) || 0)}
        />
      )}

      {activeWeight >= 20 && <PlateCalculator weight={activeWeight} />}
    </div>
  );
}
