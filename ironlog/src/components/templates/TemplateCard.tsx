import { useState } from 'react';
import type { WorkoutTemplate } from '../../types';
import { Button } from '../ui/Button';
import { getMovementLabel } from '../../lib/prDetection';

interface TemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

export function TemplateCard({ template, onEdit, onDelete, onStart }: TemplateCardProps) {
  const [activeTab, setActiveTab] = useState(template.movements[0]?.name ?? '');
  const currentMovement = template.movements.find((m) => m.name === activeTab) ?? template.movements[0];

  return (
    <article className="social-card">
      {/* Header */}
      <div className="social-card__header">
        <div className="social-card__avatar">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-text-disabled)' }}>
            fitness_center
          </span>
        </div>
        <div className="social-card__user-info">
          <span className="social-card__display-name">{template.name}</span>
          <span className="social-card__time">{template.movements.length} movement{template.movements.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabbed movement preview */}
      {template.movements.length > 0 && (
        <div className="social-card__tabs-section">
          {template.movements.length === 1 && currentMovement && (
            <div className={`social-card__set-panel social-card__set-panel--${currentMovement.name}`} style={{ paddingBottom: 0 }}>
              <span className={`feed-card__movement-name movement-${currentMovement.name}`} style={{ display: 'block', marginBottom: 'var(--space-1)', background: 'none', padding: 0, borderBottom: 'none' }}>
                {getMovementLabel(currentMovement.name)}
              </span>
            </div>
          )}
          {template.movements.length > 1 && (
            <div className="social-card__tabs">
              {template.movements.map((m) => (
                <button
                  key={m.name}
                  className={`social-card__tab social-card__tab--${m.name}${activeTab === m.name ? ' social-card__tab--active' : ''}`}
                  onClick={() => setActiveTab(m.name)}
                >
                  <span className="social-card__tab-name">{getMovementLabel(m.name)}</span>
                  <span className="social-card__tab-stat">{m.targetSets}×{m.targetReps}</span>
                </button>
              ))}
            </div>
          )}

          {currentMovement && (() => {
            const backdownGroups = currentMovement.backdownGroups?.length
              ? currentMovement.backdownGroups
              : currentMovement.backdownSets
                ? [{ sets: currentMovement.backdownSets, reps: currentMovement.backdownReps ?? 0 }]
                : [];
            const totalBdSets = backdownGroups.reduce((s, g) => s + g.sets, 0);
            const bdReps = backdownGroups[0]?.reps ?? 0;
            return (
              <div className={`social-card__set-panel social-card__set-panel--${currentMovement.name} tmpl-card-set-panel`}>
                <table className="social-card__set-table">
                  <thead>
                    <tr><td>Sets</td><td>Reps</td></tr>
                  </thead>
                  <tbody>
                    <tr className="social-card__set-row">
                      <td className="social-card__set-cell social-card__set-cell--weight">{currentMovement.targetSets}</td>
                      <td className="social-card__set-cell">{currentMovement.targetReps}</td>
                    </tr>
                    {totalBdSets > 0 && (
                      <tr className="social-card__set-row social-card__set-row--backdown">
                        <td className="social-card__set-cell">{totalBdSets}</td>
                        <td className="social-card__set-cell">{bdReps}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Actions */}
      <div className="tmpl-card-actions">
        <button className="tmpl-card-action-btn" onClick={onEdit}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Edit
        </button>
        <button className="tmpl-card-action-btn tmpl-card-action-btn--danger" onClick={onDelete}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          Delete
        </button>
        <Button variant="primary" size="sm" onClick={onStart}>Start</Button>
      </div>
    </article>
  );
}
