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
  // Keep only the best e1RM per (movement, reps) so duplicate sets at the
  // same rep range only produce one PR entry.
  const best = new Map<string, PersonalRecord>();

  for (const log of session.movements) {
    if (!isKnownMovement(log.movement)) continue;
    const existing = existingPRs[log.movement];

    for (const set of log.sets) {
      const e1rm = epley1RM(set.weight, set.reps, set.rpe);
      if (existing && e1rm <= existing.e1rm) continue;

      const key = `${log.movement}-${set.reps}`;
      const prev = best.get(key);
      if (!prev || e1rm > prev.e1rm) {
        best.set(key, {
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

  return Array.from(best.values());
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

export function getMovementTabLabel(movement: string): string {
  const labels: Record<string, string> = {
    squat: 'Squat',
    bench: 'Bench',
    deadlift: 'Deads',
  };
  return labels[movement] ?? movement.charAt(0).toUpperCase() + movement.slice(1);
}

export { MOVEMENTS };
