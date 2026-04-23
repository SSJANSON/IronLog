import type { WorkoutTemplate } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getMovementLabel } from '../../lib/prDetection';

interface TemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

const MOVEMENT_CSS: Record<string, string> = {
  squat: 'movement-squat',
  bench: 'movement-bench',
  deadlift: 'movement-deadlift',
};

export function TemplateCard({ template, onEdit, onDelete, onStart }: TemplateCardProps) {
  return (
    <Card className="template-card">
      <div className="template-card__header">
        <h3 className="template-card__name">{template.name}</h3>
        <span className="template-card__meta">{template.movements.length} movements</span>
      </div>
      <div className="template-card__movements">
        {template.movements.map((m) => (
          <Badge
            key={m.id}
            variant="movement"
            className={MOVEMENT_CSS[m.name] ?? 'movement-custom'}
          >
            {getMovementLabel(m.name)} {m.targetSets}×{m.targetReps}
          </Badge>
        ))}
      </div>
      <div className="template-card__actions">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
        <Button variant="primary" size="sm" onClick={onStart}>
          Start
        </Button>
      </div>
    </Card>
  );
}
