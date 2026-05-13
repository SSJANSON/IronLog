import { useState, forwardRef, useImperativeHandle } from 'react';
import type { Set, BackdownGroup } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useProfileStore } from '../../store/useProfileStore';
import { PlateCalculator } from './PlateCalculator';

const MAIN_LIFTS = ['squat', 'bench', 'deadlift'];

export interface MovementCardHandle {
  flush: () => void;
}

interface MovementCardProps {
  movement: string;
  variation?: string;
  sets: Set[];
  previousTopSet?: { weight: number; reps: number } | null;
  previousSets?: Set[];
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

function makePendingRow(prefillReps = '', prefillWeight = '', prefillRpe = ''): PendingRow {
  return { id: crypto.randomUUID(), weight: prefillWeight, reps: prefillReps, rpe: prefillRpe };
}

export const MovementCard = forwardRef<MovementCardHandle, MovementCardProps>(function MovementCard({
  movement, variation, sets, previousTopSet, previousSets = [],
  targetSets = 1, targetReps, backdownGroups = [],
}, ref) {
  const logSet = useWorkoutStore((s) => s.logSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const profileUnit = useProfileStore((s) => s.profile?.unit ?? 'kg');
  const isAccessory = !MAIN_LIFTS.includes(movement);
  const [unit, setUnit] = useState<'kg' | 'lb'>(isAccessory ? 'lb' : profileUnit);

  const prefillWeight = previousTopSet ? String(previousTopSet.weight) : '';
  const prefillReps = previousTopSet?.reps
    ? String(previousTopSet.reps)
    : targetReps ? String(targetReps) : '';

  const initBdRows = () => {
    let bdIdx = 0;
    return backdownGroups.flatMap((g) =>
      Array.from({ length: g.sets }, () => {
        const prev = prevBdSets[bdIdx++];
        return prev
          ? makePendingRow(String(prev.reps), String(prev.weight), prev.rpe ? String(prev.rpe) : '')
          : makePendingRow(String(g.reps));
      })
    );
  };

  const prevTopSets = previousSets.filter((s) => !s.isBackdown);
  const prevBdSets = previousSets.filter((s) => s.isBackdown);

  const [topPending, setTopPending] = useState<PendingRow[]>(() =>
    Array.from({ length: targetSets }, (_, i) => {
      const prev = prevTopSets[i];
      if (prev) return makePendingRow(String(prev.reps), String(prev.weight), prev.rpe ? String(prev.rpe) : '');
      if (isAccessory) return makePendingRow(targetReps ? String(targetReps) : '');
      return makePendingRow(targetReps ? String(targetReps) : '', prefillWeight);
    })
  );
  const [bdPending, setBdPending] = useState<PendingRow[]>(initBdRows);
  const [activeWeight, setActiveWeight] = useState<number>(parseFloat(prefillWeight) || 0);
  const [showBackdown, setShowBackdown] = useState(backdownGroups.length > 0);

  useImperativeHandle(ref, () => ({
    flush: () => {
      const logValid = (rows: typeof topPending, isBackdown: boolean) => {
        rows.forEach((row) => {
          const w = parseFloat(row.weight);
          const r = parseInt(row.reps, 10);
          if (w > 0 && r > 0) {
            logSet(movement, { weight: w, reps: r, rpe: row.rpe ? parseFloat(row.rpe) : undefined, isBackdown });
          }
        });
      };
      setTopPending((prev) => { logValid(prev, false); return []; });
      setBdPending((prev) => { logValid(prev, true); return []; });
    },
  }));

  const loggedTop = sets.filter((s) => !s.isBackdown);
  const loggedBd = sets.filter((s) => s.isBackdown);

  const handleAutoLog = (isBackdown: boolean) => (id: string) => {
    const setter = isBackdown ? setBdPending : setTopPending;
    setter((prev) => {
      const row = prev.find((r) => r.id === id);
      if (!row) return prev;
      const w = parseFloat(row.weight);
      const r = parseInt(row.reps, 10);
      if (!w || !r || w <= 0 || r <= 0) return prev;
      logSet(movement, { weight: w, reps: r, rpe: row.rpe ? parseFloat(row.rpe) : undefined, isBackdown });
      return prev.filter((p) => p.id !== id);
    });
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
              className="log-table__remove-btn"
              onClick={() => removeSet(movement, s.id)}
              aria-label="Unlog set"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>
        ))}

        {pending.map((row, idx) => (
          <div key={row.id} className="log-table__row log-table__row--active">
            <span className="log-table__set-num">
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
              onBlur={() => handleAutoLog(isBackdown)(row.id)}
              inputMode="numeric"
            />
            <input
              className="log-table__input"
              type="number" min="6" max="10" step="0.5" placeholder="—"
              value={row.rpe}
              onChange={(e) => handleChange(isBackdown)(row.id, 'rpe', e.target.value)}
              inputMode="decimal"
            />
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
        <h3 className={`movement-card__title movement-${movement}`}>
          {variation && variation !== 'competition' && `${variation} `}
          {getMovementLabel(movement)}
        </h3>
        <div className="movement-card__header-right">
          {isAccessory && (
            <div className="movement-card__unit-toggle">
              <button
                className={`movement-card__unit-btn${unit === 'kg' ? ' movement-card__unit-btn--active' : ''}`}
                onClick={() => setUnit('kg')}
              >kg</button>
              <button
                className={`movement-card__unit-btn${unit === 'lb' ? ' movement-card__unit-btn--active' : ''}`}
                onClick={() => setUnit('lb')}
              >lb</button>
            </div>
          )}
          {previousTopSet && (
            <span className="movement-card__prev">
              Prev {previousTopSet.weight}{unit} × {previousTopSet.reps}
            </span>
          )}
        </div>
      </div>

      {/* Top sets */}
      <div className="log-table">
        <div className="log-table__head">
          <span>SET</span>
          <span>{unit.toUpperCase()}</span>
          <span>REPS</span>
          <span>RPE</span>
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
            <span>{unit.toUpperCase()}</span>
            <span>REPS</span>
            <span>RPE</span>
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

      {activeWeight >= 20 && ['squat', 'bench', 'deadlift'].includes(movement) && (
        <PlateCalculator weight={activeWeight} />
      )}
    </div>
  );
});
