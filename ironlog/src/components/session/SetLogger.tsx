import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../types';
import { MovementCard, type MovementCardHandle } from './MovementCard';
import { Button } from '../ui/Button';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useAuthStore } from '../../store/useAuthStore';
import { detectNewPRs } from '../../lib/prDetection';
import { postSessionToFeed } from '../../lib/feedService';

interface SetLoggerProps {
  session: WorkoutSession;
  onComplete: () => void;
  onDiscard: () => void;
}

export function SetLogger({ session, onDiscard }: SetLoggerProps) {
  const navigate = useNavigate();
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const saveSessionToSupabase = useWorkoutStore((s) => s.saveSessionToSupabase);
  const prs = useWorkoutStore((s) => s.prs);
  const sessions = useWorkoutStore((s) => s.sessions);
  const templates = useTemplateStore((s) => s.templates);
  const user = useAuthStore((s) => s.user);
  const template = templates.find((t) => t.id === session.templateId);
  const cardRefs = useRef<Map<string, MovementCardHandle>>(new Map());

  const handleComplete = () => {
    cardRefs.current.forEach((handle) => handle.flush());
    const completed = completeSession();
    if (!completed) return;
    const newPRs = detectNewPRs(completed, prs);
    navigate('/complete', { state: { session: completed, newPRs } });
    // Save in background after navigating away
    saveSessionToSupabase(completed).then(() => {
      if (user) postSessionToFeed(user.id, completed, newPRs);
    });
  };

  const previousSession = sessions
    .filter((s) => s.completed && s.templateId === session.templateId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return (
    <div className="set-logger">
      <div className="set-logger__movements">
        {session.movements.map((log) => {
          const prevLog = previousSession?.movements.find((m) => m.movement === log.movement);
          const prevSets = prevLog?.sets ?? [];
          const prevTop = prevSets.reduce(
            (best, s) => (!best || s.weight > best.weight ? s : best),
            null as { weight: number; reps: number } | null
          );
          const templateMovement = template?.movements.find((m) => m.name === log.movement);
          const templateAccessory = !templateMovement
            ? template?.accessories?.find((a) => a.name === log.movement)
            : undefined;

          const backdownGroups = templateMovement?.backdownGroups ??
            (templateMovement?.backdownSets
              ? [{ sets: templateMovement.backdownSets, reps: templateMovement.backdownReps ?? 0 }]
              : []);

          return (
            <MovementCard
              key={log.movement}
              ref={(el) => { if (el) cardRefs.current.set(log.movement, el); else cardRefs.current.delete(log.movement); }}
              movement={log.movement}
              variation={log.variation}
              sets={log.sets}
              previousTopSet={prevTop}
              previousSets={prevSets}
              targetSets={templateMovement?.targetSets ?? templateAccessory?.sets ?? 1}
              targetReps={templateMovement?.targetReps ?? templateAccessory?.reps}
              backdownGroups={backdownGroups}
            />
          );
        })}
      </div>

      <div className="set-logger__actions">
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button variant="primary" onClick={handleComplete}>
          Finish Session
        </Button>
      </div>
    </div>
  );
}
