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

interface BackdownGroupForm {
  id: string;
  sets: string;
  reps: string;
}

interface FormMovement {
  id: string;
  name: string;
  targetSets: string;
  targetReps: string;
  backdownGroups: BackdownGroupForm[];
}

function toFormMovement(m: TemplateMovement): FormMovement {
  let backdownGroups: BackdownGroupForm[] = [];
  if (m.backdownGroups?.length) {
    backdownGroups = m.backdownGroups.map((g) => ({
      id: crypto.randomUUID(),
      sets: String(g.sets),
      reps: String(g.reps),
    }));
  } else if (m.backdownSets) {
    backdownGroups = [{
      id: crypto.randomUUID(),
      sets: String(m.backdownSets),
      reps: m.backdownReps ? String(m.backdownReps) : '',
    }];
  }
  return {
    id: m.id,
    name: m.name,
    targetSets: String(m.targetSets),
    targetReps: String(m.targetReps),
    backdownGroups,
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
      { id: crypto.randomUUID(), name: movName, targetSets: '', targetReps: '', backdownGroups: [] },
    ]);
    if (addType === 'custom') setCustomName('');
  };

  const handleRemove = (id: string) => setMovements((prev) => prev.filter((m) => m.id !== id));

  const handleField = (id: string, field: 'targetSets' | 'targetReps', value: string) =>
    setMovements((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const handleAddBackdownGroup = (movId: string) =>
    setMovements((prev) => prev.map((m) => m.id === movId
      ? { ...m, backdownGroups: [...m.backdownGroups, { id: crypto.randomUUID(), sets: '', reps: '' }] }
      : m
    ));

  const handleRemoveBackdownGroup = (movId: string, groupId: string) =>
    setMovements((prev) => prev.map((m) => m.id === movId
      ? { ...m, backdownGroups: m.backdownGroups.filter((g) => g.id !== groupId) }
      : m
    ));

  const handleBackdownGroupField = (movId: string, groupId: string, field: 'sets' | 'reps', value: string) =>
    setMovements((prev) => prev.map((m) => m.id === movId
      ? { ...m, backdownGroups: m.backdownGroups.map((g) => g.id === groupId ? { ...g, [field]: value } : g) }
      : m
    ));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Template name is required';
    if (movements.length === 0) e.movements = 'Add at least one movement';
    if (movements.some((m) => !m.targetSets.trim() || !m.targetReps.trim()))
      e.movements = 'Fill in sets and reps for every movement';
    if (movements.some((m) => m.backdownGroups.some((g) => !g.sets.trim() || !g.reps.trim())))
      e.movements = 'Fill in sets and reps for every backdown group';
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
      backdownGroups: m.backdownGroups.length > 0
        ? m.backdownGroups.map((g) => ({
            sets: Math.max(1, parseInt(g.sets, 10) || 1),
            reps: Math.max(1, parseInt(g.reps, 10) || 1),
          }))
        : undefined,
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
            </div>
          </div>

          {/* Backdown groups */}
          {m.backdownGroups.map((group, gIdx) => (
            <div key={group.id} className="tmpl-bd-group">
              {gIdx === 0 && (
                <div className="tmpl-bd-group__head">
                  <span>BD SETS</span>
                  <span>BD REPS</span>
                  <span />
                </div>
              )}
              <div className="tmpl-table__row tmpl-bd-group__row">
                <input
                  className="tmpl-num-input"
                  type="number"
                  min="1"
                  placeholder="—"
                  value={group.sets}
                  onChange={(e) => handleBackdownGroupField(m.id, group.id, 'sets', e.target.value)}
                  inputMode="numeric"
                />
                <input
                  className="tmpl-num-input"
                  type="number"
                  min="1"
                  placeholder="—"
                  value={group.reps}
                  onChange={(e) => handleBackdownGroupField(m.id, group.id, 'reps', e.target.value)}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="tmpl-bd-group__remove"
                  onClick={() => handleRemoveBackdownGroup(m.id, group.id)}
                  aria-label="Remove backdown group"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="tmpl-card__bd-btn"
            onClick={() => handleAddBackdownGroup(m.id)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
            Backdown Set
          </button>
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
