import { useWorkoutStore } from '../store/useWorkoutStore';
import type { Movement, PersonalRecord } from '../types';

export function usePersonalRecords() {
  const prs = useWorkoutStore((s) => s.prs);

  const getPR = (movement: Movement): PersonalRecord | null => prs[movement];

  const hasPR = (movement: Movement): boolean => prs[movement] !== null;

  return { prs, getPR, hasPR };
}
