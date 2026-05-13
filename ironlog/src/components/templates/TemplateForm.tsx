import { useState } from 'react';
import type { TemplateMovement, WorkoutTemplate, Accessory } from '../../types';
import { MOVEMENT_VARIATIONS } from '../../types';
import { useCustomVariations } from '../../hooks/useCustomVariations';
import { Button } from '../ui/Button';
import { getMovementLabel } from '../../lib/prDetection';

interface TemplateFormProps {
  initial?: Partial<WorkoutTemplate>;
  onSubmit: (name: string, movements: TemplateMovement[], accessories: Accessory[]) => void;
  onCancel: () => void;
}

const PRESET_OPTIONS = ['squat', 'bench', 'deadlift', 'accessory', 'custom'] as const;

interface BackdownGroupForm {
  id: string;
  sets: string;
  reps: string;
}

interface FormMovement {
  id: string;
  name: string;
  variation: string;
  targetSets: string;
  targetReps: string;
  backdownGroups: BackdownGroupForm[];
}

interface FormAccessory {
  id: string;
  name: string;
  sets: string;
  reps: string;
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
    variation: m.variation ?? 'competition',
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
  const [accessories, setAccessories] = useState<FormAccessory[]>(
    initial?.accessories?.map((a) => ({ ...a, sets: String(a.sets), reps: String(a.reps) })) ?? []
  );
  const [addType, setAddType] = useState<string>('squat');
  const [customName, setCustomName] = useState('');
  const [showAccessories, setShowAccessories] = useState((initial?.accessories?.length ?? 0) > 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const customVariations = useCustomVariations();

  // Movement handlers
  const handleAddMovement = () => {
    if (addType === 'accessory') {
      setShowAccessories(true);
      setAccessories((prev) => [...prev, { id: crypto.randomUUID(), name: '', sets: '', reps: '' }]);
      setAddType('squat');
      return;
    }
    const movName = addType === 'custom' ? customName.trim() : addType;
    if (!movName) return;
    setMovements((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: movName, variation: 'competition', targetSets: '', targetReps: '', backdownGroups: [] },
    ]);
    if (addType === 'custom') setCustomName('');
  };

  const handleRemove = (id: string) => setMovements((prev) => prev.filter((m) => m.id !== id));

  const handleField = (id: string, field: 'targetSets' | 'targetReps' | 'variation', value: string) =>
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

  // Accessory handlers
  const handleAddAccessory = () =>
    setAccessories((prev) => [...prev, { id: crypto.randomUUID(), name: '', sets: '', reps: '' }]);

  const handleRemoveAccessory = (id: string) =>
    setAccessories((prev) => prev.filter((a) => a.id !== id));

  const handleAccessoryField = (id: string, field: 'name' | 'sets' | 'reps', value: string) =>
    setAccessories((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value } : a));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Template name is required';
    if (movements.length === 0) e.movements = 'Add at least one movement';
    if (movements.some((m) => !m.targetSets.trim() || !m.targetReps.trim()))
      e.movements = 'Fill in sets and reps for every movement';
    if (movements.some((m) => m.backdownGroups.some((g) => !g.sets.trim() || !g.reps.trim())))
      e.movements = 'Fill in sets and reps for every backdown group';
    if (accessories.some((a) => !a.name.trim() || !a.sets.trim() || !a.reps.trim()))
      e.accessories = 'Fill in name, sets and reps for every accessory';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(
      name.trim(),
      movements.map((m) => ({
        id: m.id,
        name: m.name,
        variation: m.variation.trim() || 'competition',
        targetSets: Math.max(1, parseInt(m.targetSets, 10) || 1),
        targetReps: Math.max(1, parseInt(m.targetReps, 10) || 1),
        backdownGroups: m.backdownGroups.length > 0
          ? m.backdownGroups.map((g) => ({
              sets: Math.max(1, parseInt(g.sets, 10) || 1),
              reps: Math.max(1, parseInt(g.reps, 10) || 1),
            }))
          : undefined,
      })),
      accessories.map((a) => ({
        id: a.id,
        name: a.name.trim(),
        sets: Math.max(1, parseInt(a.sets, 10) || 1),
        reps: Math.max(1, parseInt(a.reps, 10) || 1),
      }))
    );
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
            <div className="tmpl-card__header-right">
              {MOVEMENT_VARIATIONS[m.name] && (
                <>
                  <datalist id={`variation-opts-${m.id}`}>
                    {[...MOVEMENT_VARIATIONS[m.name], ...(customVariations[m.name] ?? [])].map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                  <input
                    className="tmpl-variation-select"
                    list={`variation-opts-${m.id}`}
                    placeholder="Variation…"
                    value={m.variation}
                    onChange={(e) => handleField(m.id, 'variation', e.target.value)}
                  />
                </>
              )}
              <button type="button" className="tmpl-card__remove" onClick={() => handleRemove(m.id)} aria-label="Remove">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
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
                  <span className="tmpl-bd-group__head-label">Backdown</span>
                  <span>Sets</span>
                  <span>Reps</span>
                  <span />
                </div>
              )}
              <div className="tmpl-table__row tmpl-bd-group__row">
                <span />
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

      {/* Accessories section */}
      {showAccessories && (
        <div className="tmpl-accessories">
          <div className="tmpl-accessories__header">
            <span className="tmpl-accessories__title">Accessories</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button type="button" className="tmpl-accessories__add-btn" onClick={handleAddAccessory}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Add exercise
              </button>
              <button
                type="button"
                className="tmpl-card__remove"
                onClick={() => { setShowAccessories(false); setAccessories([]); }}
                aria-label="Remove accessories"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          </div>

          {accessories.length > 0 && (
            <div className="tmpl-accessories__list">
              <div className="tmpl-accessories__list-head">
                <span>Exercise</span>
                <span>Sets</span>
                <span>Reps</span>
                <span />
              </div>
              {accessories.map((a) => (
                <div key={a.id} className="tmpl-accessories__row">
                  <input
                    className="tmpl-accessories__name-input"
                    placeholder="Exercise name"
                    value={a.name}
                    onChange={(e) => handleAccessoryField(a.id, 'name', e.target.value)}
                  />
                  <input
                    className="tmpl-num-input"
                    type="number"
                    min="1"
                    placeholder="—"
                    value={a.sets}
                    onChange={(e) => handleAccessoryField(a.id, 'sets', e.target.value)}
                    inputMode="numeric"
                  />
                  <input
                    className="tmpl-num-input"
                    type="number"
                    min="1"
                    placeholder="—"
                    value={a.reps}
                    onChange={(e) => handleAccessoryField(a.id, 'reps', e.target.value)}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    className="tmpl-bd-group__remove"
                    onClick={() => handleRemoveAccessory(a.id)}
                    aria-label="Remove accessory"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.accessories && <span className="input-error">{errors.accessories}</span>}
        </div>
      )}

      {/* Add row — always at bottom */}
      <div className="tmpl-add-row">
        <select
          className="tmpl-add-row__select"
          value={addType}
          onChange={(e) => { setAddType(e.target.value); setCustomName(''); }}
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'custom' ? '+ Custom…' : opt === 'accessory' ? 'Accessories' : getMovementLabel(opt)}
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
