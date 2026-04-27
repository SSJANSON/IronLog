import { useNavigate } from 'react-router-dom';
import type { WorkoutSession } from '../../types';
import { MovementCard } from './MovementCard';
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

  const handleComplete = async () => {
    const completed = completeSession();
    if (!completed) return;
    const newPRs = detectNewPRs(completed, prs);
    // Save session first, then post to feed (feed_items has FK on sessions)
    await saveSessionToSupabase(completed);
    if (user) {
      postSessionToFeed(user.id, completed, newPRs);
    }
    navigate('/complete', { state: { session: completed, newPRs } });
  };

  const previousSession = sessions
    .filter((s) => s.completed && s.templateId === session.templateId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  return (
    <div className="set-logger">
      <div className="set-logger__movements">
        {session.movements.map((log) => {
          const prevLog = previousSession?.movements.find((m) => m.movement === log.movement);
          const prevTop = prevLog?.sets.reduce(
            (best, s) => (!best || s.weight > best.weight ? s : best),
            null as { weight: number; reps: number } | null
          );
          const templateMovement = template?.movements.find((m) => m.name === log.movement);

          return (
            <MovementCard
              key={log.movement}
              movement={log.movement}
              sets={log.sets}
              previousTopSet={prevTop}
              targetReps={templateMovement?.targetReps}
              backdownReps={templateMovement?.backdownReps}
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
