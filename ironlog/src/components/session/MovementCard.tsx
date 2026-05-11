import { useState } from 'react';
import type { Set, BackdownGroup } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { PlateCalculator } from './PlateCalculator';

interface MovementCardProps {
  movement: string;
  sets: Set[];
  previousTopSet?: { weight: number; reps: number } | null;
  targetSets?: number;
  targetReps?: number;
  backdownGroups?: BackdownGroup[];
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

export function MovementCard({
  movement, sets, previousTopSet,
  targetSets = 1, targetReps, backdownGroups = [],
}: MovementCardProps) {
  const logSet = useWorkoutStore((s) => s.logSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const prefillWeight = previousTopSet ? String(previousTopSet.weight) : '';
  const prefillReps = previousTopSet?.reps
    ? String(previousTopSet.reps)
    : targetReps ? String(targetReps) : '';

  const initBdRows = () =>
    backdownGroups.flatMap((g) =>
      Array.from({ length: g.sets }, () => makePendingRow(String(g.reps)))
    );

  const [topPending, setTopPending] = useState<PendingRow[]>(() =>
    Array.from({ length: targetSets }, () => makePendingRow(prefillReps, prefillWeight))
  );
  const [bdPending, setBdPending] = useState<PendingRow[]>(initBdRows);
  const [activeWeight, setActiveWeight] = useState<number>(parseFloat(prefillWeight) || 0);
  const [showBackdown, setShowBackdown] = useState(backdownGroups.length > 0);

  const loggedTop = sets.filter((s) => !s.isBackdown);
  const loggedBd = sets.filter((s) => s.isBackdown);

  const handleLog = (isBackdown: boolean) => (row: PendingRow) => {
    const w = parseFloat(row.weight);
    const r = parseInt(row.reps, 10);
    if (!w || !r || w <= 0 || r <= 0) return;
    logSet(movement, { weight: w, reps: r, rpe: row.rpe ? parseFloat(row.rpe) : undefined, isBackdown });
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => prev.filter((p) => p.id !== row.id));
  };

  const handleChange = (isBackdown: boolean) => (id: string, field: keyof PendingRow, value: string) => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRow = (isBackdown: boolean) => () => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => [...prev, makePendingRow(isBackdown ? '' : prefillReps)]);
  };

  const handleRemovePending = (isBackdown: boolean) => (id: string) => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => prev.filter((r) => r.id !== id));
  };

  const renderTable = (isBackdown: boolean) => {
    const logged = isBackdown ? loggedBd : loggedTop;
    const pending = isBackdown ? bdPending : topPending;

    return (
      <>
        {logged.map((s, idx) => (
          <div key={s.id} className="log-table__row log-table__row--done">
            <span className="log-table__set-num">{idx + 1}</span>
            <span>{s.weight}</span>
            <span>{s.reps}</span>
            <span>{s.rpe ?? '—'}</span>
            <button
              className="log-table__check log-table__check--logged"
              onClick={() => removeSet(movement, s.id)}
              aria-label="Unlog set"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </button>
            <span />
          </div>
        ))}

        {pending.map((row, idx) => (
          <div
            key={row.id}
            className="log-table__row log-table__row--active"
            style={idx === 0 ? { borderLeft: '4px solid var(--color-accent)' } : undefined}
          >
            <span className={`log-table__set-num${idx === 0 ? ' log-table__set-num--active' : ''}`}>
              {logged.length + idx + 1}
            </span>
            <input
              className="log-table__input"
              type="number" min="0" step="0.5" placeholder="—"
              value={row.weight}
              onChange={(e) => { handleChange(isBackdown)(row.id, 'weight', e.target.value); setActiveWeight(parseFloat(e.target.value) || 0); }}
              onFocus={(e) => setActiveWeight(parseFloat(e.target.value) || 0)}
              inputMode="decimal"
            />
            <input
              className="log-table__input"
              type="number" min="1" placeholder="—"
              value={row.reps}
              onChange={(e) => handleChange(isBackdown)(row.id, 'reps', e.target.value)}
              inputMode="numeric"
            />
            <input
              className="log-table__input"
              type="number" min="6" max="10" step="0.5" placeholder="—"
              value={row.rpe}
              onChange={(e) => handleChange(isBackdown)(row.id, 'rpe', e.target.value)}
              inputMode="decimal"
            />
            <button className="log-table__check" onClick={() => handleLog(isBackdown)(row)} aria-label="Log set">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>done</span>
            </button>
            <button
              className="log-table__remove-btn"
              onClick={() => handleRemovePending(isBackdown)(row.id)}
              aria-label="Remove row"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
            </button>
          </div>
        ))}

        <button className="log-table__add-btn" onClick={handleAddRow(isBackdown)}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          ADD SET
        </button>
      </>
    );
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

      {/* Top sets */}
      <div className="log-table">
        <div className="log-table__head">
          <span>SET</span>
          <span>KG</span>
          <span>REPS</span>
          <span>RPE</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>done_all</span>
          <span />
        </div>
        {renderTable(false)}
      </div>

      {/* Backdown */}
      {(showBackdown || loggedBd.length > 0 || bdPending.length > 0) ? (
        <div className="log-table log-table--backdown-section">
          <div className="log-table__section-label">BACKDOWN SETS</div>
          <div className="log-table__head">
            <span>SET</span>
            <span>KG</span>
            <span>REPS</span>
            <span>RPE</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>done_all</span>
            <span />
          </div>
          {renderTable(true)}
        </div>
      ) : (
        <button
          className="movement-card__bd-btn"
          onClick={() => { setShowBackdown(true); handleAddRow(true)(); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
          Backdown Sets
        </button>
      )}

      {activeWeight >= 20 && <PlateCalculator weight={activeWeight} />}
    </div>
  );
}
