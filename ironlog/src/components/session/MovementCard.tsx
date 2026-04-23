import { useState } from 'react';
import type { Set } from '../../types';
import { getMovementLabel } from '../../lib/prDetection';
import { epley1RM } from '../../lib/epley';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface MovementCardProps {
  movement: string;
  sets: Set[];
  previousTopSet?: { weight: number; reps: number } | null;
  targetReps?: number;
  backdownReps?: number;
}

interface SetForm {
  weight: string;
  reps: string;
  rpe: string;
}

const emptyForm = (): SetForm => ({ weight: '', reps: '', rpe: '' });

function SetSection({
  label,
  sets,
  prefillWeight,
  prefillReps,
  isBackdown,
  onAdd,
  onRemove,
}: {
  label: string;
  sets: Set[];
  prefillWeight: string;
  prefillReps: string;
  isBackdown: boolean;
  onAdd: (form: SetForm) => void;
  onRemove: (id: string) => void;
}) {
  const [form, setForm] = useState<SetForm>({ weight: prefillWeight, reps: prefillReps, rpe: '' });

  const handleAdd = () => {
    const w = parseFloat(form.weight);
    const r = parseInt(form.reps, 10);
    if (!w || !r || w <= 0 || r <= 0) return;
    onAdd(form);
    setForm({ weight: prefillWeight, reps: prefillReps, rpe: '' });
  };

  return (
    <div className="set-section">
      <span className={`set-section__label${isBackdown ? ' set-section__label--backdown' : ''}`}>
        {label}
      </span>

      {sets.length > 0 && (
        <div className="set-list">
          <div className="set-list__header">
            <span>#</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>e1RM</span>
            <span>RPE</span>
            <span></span>
          </div>
          {sets.map((s, idx) => (
            <div key={s.id} className="set-row">
              <span className="set-row__num">{idx + 1}</span>
              <span>{s.weight}kg</span>
              <span>{s.reps}</span>
              <span>{Math.round(epley1RM(s.weight, s.reps))}kg</span>
              <span>{s.rpe ?? '—'}</span>
              <button
                className="set-row__remove"
                onClick={() => onRemove(s.id)}
                aria-label="Remove set"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="set-input-row">
        <Input
          label="Weight (kg)"
          type="number"
          min="0"
          step="0.5"
          value={form.weight}
          onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
          inputMode="decimal"
        />
        <Input
          label="Reps"
          type="number"
          min="1"
          value={form.reps}
          onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
          inputMode="numeric"
        />
        <Input
          label="RPE"
          type="number"
          min="6"
          max="10"
          step="0.5"
          value={form.rpe}
          onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))}
          inputMode="decimal"
        />
        <Button onClick={handleAdd} size="sm">
          + Set
        </Button>
      </div>
    </div>
  );
}

export function MovementCard({ movement, sets, previousTopSet, targetReps, backdownReps }: MovementCardProps) {
  const logSet = useWorkoutStore((s) => s.logSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const prefillWeight = previousTopSet ? String(previousTopSet.weight) : '';
  const prefillReps = previousTopSet
    ? String(previousTopSet.reps)
    : targetReps ? String(targetReps) : '';

  const topSets = sets.filter((s) => !s.isBackdown);
  const backdownSets = sets.filter((s) => s.isBackdown);

  const handleAdd = (isBackdown: boolean) => (form: SetForm) => {
    logSet(movement, {
      weight: parseFloat(form.weight),
      reps: parseInt(form.reps, 10),
      rpe: form.rpe ? parseFloat(form.rpe) : undefined,
      isBackdown,
    });
  };

  return (
    <div className="movement-card">
      <div className="movement-card__header">
        <h3 className="movement-card__title">{getMovementLabel(movement)}</h3>
        {previousTopSet && (
          <span className="movement-card__prev">
            Prev: {previousTopSet.weight}kg × {previousTopSet.reps}
          </span>
        )}
      </div>

      <SetSection
        label="Top Sets"
        sets={topSets}
        prefillWeight={prefillWeight}
        prefillReps={prefillReps}
        isBackdown={false}
        onAdd={handleAdd(false)}
        onRemove={(id) => removeSet(movement, id)}
      />

      <SetSection
        label="Backdown Sets"
        sets={backdownSets}
        prefillWeight=""
        prefillReps={backdownReps ? String(backdownReps) : ''}
        isBackdown={true}
        onAdd={handleAdd(true)}
        onRemove={(id) => removeSet(movement, id)}
      />
    </div>
  );
}
