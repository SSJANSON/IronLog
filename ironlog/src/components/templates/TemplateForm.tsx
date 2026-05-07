import { useState } from 'react';
import type { TemplateMovement, WorkoutTemplate } from '../../types';
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

  const handleRemove = (id: string) => setMovements((prev) => prev.filter((m) => m.id !== id));

  const handleField = (id: string, field: keyof FormMovement, value: string | boolean) =>
    setMovements((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const toggleBackdown = (id: string) =>
    setMovements((prev) =>
      prev.map((m) => m.id === id ? { ...m, showBackdown: !m.showBackdown, backdownSets: '', backdownReps: '' } : m)
    );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Template name is required';
    if (movements.length === 0) e.movements = 'Add at least one movement';
    if (movements.some((m) => !m.targetSets.trim() || !m.targetReps.trim()))
      e.movements = 'Fill in sets and reps for every movement';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(name.trim(), movements.map((m) => ({
      id: m.id,
      name: m.name,
      targetSets: Math.max(1, parseInt(m.targetSets, 10) || 1),
      targetReps: Math.max(1, parseInt(m.targetReps, 10) || 1),
      backdownSets: m.showBackdown && m.backdownSets ? parseInt(m.backdownSets, 10) : undefined,
      backdownReps: m.showBackdown && m.backdownReps ? parseInt(m.backdownReps, 10) : undefined,
    })));
  };

  return (
    <form className="template-form" onSubmit={handleSubmit} noValidate>

      {/* Template name */}
      <div className="tmpl-name-row">
        <input
          className="tmpl-name-input"
          placeholder="TEMPLATE NAME"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <span className="input-error">{errors.name}</span>}
      </div>

      {/* Movement cards */}
      {movements.map((m) => (
        <div key={m.id} className="tmpl-card">
          <div className="tmpl-card__header">
            <span className={`tmpl-card__name movement-${m.name}`}>
              {getMovementLabel(m.name)}
            </span>
            <button type="button" className="tmpl-card__remove" onClick={() => handleRemove(m.id)} aria-label="Remove">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>

          {/* Top sets table */}
          <div className="tmpl-table">
            <div className="tmpl-table__head">
              <span>SETS</span>
              <span>REPS</span>
              <span></span>
            </div>
            <div className="tmpl-table__row">
              <input
                className="tmpl-num-input"
                type="number"
                min="1"
                placeholder="—"
                value={m.targetSets}
                onChange={(e) => handleField(m.id, 'targetSets', e.target.value)}
                inputMode="numeric"
              />
              <input
                className="tmpl-num-input"
                type="number"
                min="1"
                placeholder="—"
                value={m.targetReps}
                onChange={(e) => handleField(m.id, 'targetReps', e.target.value)}
                inputMode="numeric"
              />
              <div className="tmpl-table__action">
                <button
                  type="button"
                  className={`tmpl-bd-toggle${m.showBackdown ? ' tmpl-bd-toggle--active' : ''}`}
                  onClick={() => toggleBackdown(m.id)}
                >
                  BD
                </button>
              </div>
            </div>
          </div>

          {/* Backdown table */}
          {m.showBackdown && (
            <div className="tmpl-table tmpl-table--backdown">
              <div className="tmpl-table__head">
                <span>BD SETS</span>
                <span>BD REPS</span>
                <span></span>
              </div>
              <div className="tmpl-table__row">
                <input
                  className="tmpl-num-input"
                  type="number"
                  min="1"
                  placeholder="—"
                  value={m.backdownSets}
                  onChange={(e) => handleField(m.id, 'backdownSets', e.target.value)}
                  inputMode="numeric"
                />
                <input
                  className="tmpl-num-input"
                  type="number"
                  min="1"
                  placeholder="—"
                  value={m.backdownReps}
                  onChange={(e) => handleField(m.id, 'backdownReps', e.target.value)}
                  inputMode="numeric"
                />
                <div></div>
              </div>
            </div>
          )}
        </div>
      ))}

      {errors.movements && <span className="input-error">{errors.movements}</span>}

      {/* Add movement row */}
      <div className="tmpl-add-row">
        <select
          className="tmpl-add-row__select"
          value={addType}
          onChange={(e) => { setAddType(e.target.value); setCustomName(''); }}
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'custom' ? '+ Custom…' : getMovementLabel(opt)}
            </option>
          ))}
        </select>
        {addType === 'custom' && (
          <input
            className="tmpl-add-row__custom"
            placeholder="Movement name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMovement())}
          />
        )}
        <button
          type="button"
          className="tmpl-add-row__btn"
          onClick={handleAddMovement}
          disabled={addType === 'custom' && !customName.trim()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          ADD
        </button>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initial?.name ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
