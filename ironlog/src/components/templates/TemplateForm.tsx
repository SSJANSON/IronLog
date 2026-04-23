import { useState } from 'react';
import type { TemplateMovement, WorkoutTemplate } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getMovementLabel } from '../../lib/prDetection';

interface TemplateFormProps {
  initial?: Partial<WorkoutTemplate>;
  onSubmit: (name: string, movements: TemplateMovement[]) => void;
  onCancel: () => void;
}

const PRESET_OPTIONS = ['squat', 'bench', 'deadlift', 'custom'] as const;

interface FormMovement {
  id: string;
  name: string;
  targetSets: string;
  targetReps: string;
  backdownSets: string;
  backdownReps: string;
  showBackdown: boolean;
}

function toFormMovement(m: TemplateMovement): FormMovement {
  return {
    id: m.id,
    name: m.name,
    targetSets: String(m.targetSets),
    targetReps: String(m.targetReps),
    backdownSets: m.backdownSets ? String(m.backdownSets) : '',
    backdownReps: m.backdownReps ? String(m.backdownReps) : '',
    showBackdown: !!(m.backdownSets || m.backdownReps),
  };
}

export function TemplateForm({ initial, onSubmit, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [movements, setMovements] = useState<FormMovement[]>(
    initial?.movements?.map(toFormMovement) ?? []
  );

  const [addType, setAddType] = useState<string>('squat');
  const [customName, setCustomName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddMovement = () => {
    const movName = addType === 'custom' ? customName.trim() : addType;
    if (!movName) return;
    setMovements((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: movName, targetSets: '', targetReps: '', backdownSets: '', backdownReps: '', showBackdown: false },
    ]);
    if (addType === 'custom') setCustomName('');
  };

  const handleRemoveMovement = (id: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const handleField = (id: string, field: keyof FormMovement, value: string | boolean) => {
    setMovements((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const toggleBackdown = (id: string) => {
    setMovements((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, showBackdown: !m.showBackdown, backdownSets: '', backdownReps: '' }
          : m
      )
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Template name is required';
    if (movements.length === 0) e.movements = 'Add at least one movement';
    const anyBlank = movements.some((m) => !m.targetSets.trim() || !m.targetReps.trim());
    if (anyBlank) e.movements = 'Fill in sets and reps for every movement';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const converted: TemplateMovement[] = movements.map((m) => ({
      id: m.id,
      name: m.name,
      targetSets: Math.max(1, parseInt(m.targetSets, 10) || 1),
      targetReps: Math.max(1, parseInt(m.targetReps, 10) || 1),
      backdownSets: m.showBackdown && m.backdownSets ? parseInt(m.backdownSets, 10) : undefined,
      backdownReps: m.showBackdown && m.backdownReps ? parseInt(m.backdownReps, 10) : undefined,
    }));
    onSubmit(name.trim(), converted);
  };

  return (
    <form className="template-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Template Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Heavy Day A"
        error={errors.name}
      />

      <div className="input-group">
        <span className="input-label">Movements</span>

        {movements.length > 0 && (
          <div className="movement-list">
            <div className="movement-list__header">
              <span>Movement</span>
              <span>Sets</span>
              <span>Reps</span>
              <span></span>
            </div>
            {movements.map((m) => (
              <div key={m.id}>
                <div className="movement-list__row">
                  <span className="movement-list__name">{getMovementLabel(m.name)}</span>
                  <input
                    className="input movement-list__num-input"
                    type="number"
                    min="1"
                    placeholder="—"
                    value={m.targetSets}
                    onChange={(e) => handleField(m.id, 'targetSets', e.target.value)}
                    inputMode="numeric"
                    aria-label="Sets"
                  />
                  <input
                    className="input movement-list__num-input"
                    type="number"
                    min="1"
                    placeholder="—"
                    value={m.targetReps}
                    onChange={(e) => handleField(m.id, 'targetReps', e.target.value)}
                    inputMode="numeric"
                    aria-label="Reps"
                  />
                  <div className="movement-list__row-actions">
                    <button
                      type="button"
                      className={`movement-list__bd-btn${m.showBackdown ? ' movement-list__bd-btn--active' : ''}`}
                      onClick={() => toggleBackdown(m.id)}
                      aria-label="Toggle backdown sets"
                    >
                      BD
                    </button>
                    <button
                      type="button"
                      className="movement-list__remove"
                      onClick={() => handleRemoveMovement(m.id)}
                      aria-label="Remove movement"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {m.showBackdown && (
                  <div className="movement-list__backdown-row">
                    <span className="movement-list__backdown-label">↳ Backdown</span>
                    <input
                      className="input movement-list__num-input"
                      type="number"
                      min="1"
                      placeholder="—"
                      value={m.backdownSets}
                      onChange={(e) => handleField(m.id, 'backdownSets', e.target.value)}
                      inputMode="numeric"
                      aria-label="Backdown sets"
                    />
                    <input
                      className="input movement-list__num-input"
                      type="number"
                      min="1"
                      placeholder="—"
                      value={m.backdownReps}
                      onChange={(e) => handleField(m.id, 'backdownReps', e.target.value)}
                      inputMode="numeric"
                      aria-label="Backdown reps"
                    />
                    <div></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="add-movement-row">
          <select
            className="input add-movement-row__select"
            value={addType}
            onChange={(e) => {
              setAddType(e.target.value);
              setCustomName('');
            }}
          >
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'custom' ? '+ Custom…' : getMovementLabel(opt)}
              </option>
            ))}
          </select>

          {addType === 'custom' && (
            <input
              className="input add-movement-row__custom"
              placeholder="Movement name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMovement())}
            />
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddMovement}
            disabled={addType === 'custom' && !customName.trim()}
          >
            Add
          </Button>
        </div>

        {errors.movements && <span className="input-error">{errors.movements}</span>}
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initial?.name ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
