import type { WorkoutSession, PersonalRecord, Movement, PRMap } from '../types';
import { epley1RM } from './epley';

const MOVEMENTS: Movement[] = ['squat', 'bench', 'deadlift'];

function isKnownMovement(m: string): m is Movement {
  return (MOVEMENTS as string[]).includes(m);
}

export function detectNewPRs(
  session: WorkoutSession,
  existingPRs: PRMap
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];

  for (const log of session.movements) {
    if (!isKnownMovement(log.movement)) continue;
    const existing = existingPRs[log.movement];

    for (const set of log.sets) {
      const e1rm = epley1RM(set.weight, set.reps, set.rpe);
      const isNewPR = !existing || e1rm > existing.e1rm;

      if (isNewPR) {
        newPRs.push({
          movement: log.movement,
          weight: set.weight,
          reps: set.reps,
          e1rm,
          date: session.date,
          sessionId: session.id,
        });
      }
    }
  }

  return newPRs;
}

export function buildPRMap(sessions: WorkoutSession[]): PRMap {
  const map: PRMap = { squat: null, bench: null, deadlift: null };

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const session of sorted) {
    for (const log of session.movements) {
      if (!isKnownMovement(log.movement)) continue;
      for (const set of log.sets) {
        const e1rm = epley1RM(set.weight, set.reps, set.rpe);
        const existing = map[log.movement];
        if (!existing || e1rm > existing.e1rm) {
          map[log.movement] = {
            movement: log.movement,
            weight: set.weight,
            reps: set.reps,
            e1rm,
            date: session.date,
            sessionId: session.id,
          };
        }
      }
    }
  }

  return map;
}

export function getMovementLabel(movement: string): string {
  const labels: Record<string, string> = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };
  return labels[movement] ?? movement.charAt(0).toUpperCase() + movement.slice(1);
}

export { MOVEMENTS };
