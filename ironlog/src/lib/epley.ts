import type { Set } from '../types';

export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function topSetWeight(sets: Set[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => s.weight));
}

export function topE1RM(sets: Set[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => epley1RM(s.weight, s.reps)));
}

export function totalVolume(sets: Set[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
