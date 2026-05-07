import type { Set } from '../types';

// Tuchscherer RPE chart: percentage of 1RM at [reps 1-12][RPE 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const RPE_TABLE: number[][] = [
  [83.3, 85.2, 87.1, 89.1, 91.0, 93.2, 95.5, 97.8, 100.0], // 1 rep
  [79.6, 81.5, 83.3, 85.2, 87.1, 89.1, 91.0, 93.2,  95.5], // 2 reps
  [77.2, 78.9, 80.7, 82.4, 84.1, 86.1, 88.0, 90.1,  92.2], // 3 reps
  [75.1, 76.7, 78.3, 79.9, 81.5, 83.3, 85.1, 87.2,  89.2], // 4 reps
  [73.0, 74.5, 76.0, 77.5, 79.0, 80.7, 82.4, 84.4,  86.3], // 5 reps
  [70.8, 72.3, 73.7, 75.2, 76.7, 78.3, 79.9, 81.8,  83.7], // 6 reps
  [68.8, 70.2, 71.6, 73.0, 74.4, 76.0, 77.6, 79.4,  81.1], // 7 reps
  [66.8, 68.2, 69.5, 70.9, 72.3, 73.9, 75.4, 77.0,  78.6], // 8 reps
  [64.8, 66.2, 67.5, 68.9, 70.3, 71.7, 73.1, 74.7,  76.2], // 9 reps
  [63.1, 64.4, 65.7, 67.0, 68.3, 69.6, 71.0, 72.4,  73.9], // 10 reps
  [59.7, 61.0, 62.2, 63.5, 64.8, 66.2, 67.5, 69.0,  70.5], // 11 reps
  [57.1, 58.4, 59.7, 61.0, 62.3, 63.6, 65.0, 66.5,  68.0], // 12 reps
];

const RPE_COLS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

function rpePercent(reps: number, rpe: number): number {
  const rowIdx = Math.min(Math.max(Math.round(reps) - 1, 0), RPE_TABLE.length - 1);
  const clampedRpe = Math.min(Math.max(rpe, 6), 10);

  const lo = RPE_COLS.findIndex((r) => r >= clampedRpe);
  if (lo === 0 || RPE_COLS[lo] === clampedRpe) return RPE_TABLE[rowIdx][lo] / 100;

  // Interpolate between two columns for fractional RPE values
  const hi = lo;
  const loIdx = lo - 1;
  const t = (clampedRpe - RPE_COLS[loIdx]) / (RPE_COLS[hi] - RPE_COLS[loIdx]);
  return (RPE_TABLE[rowIdx][loIdx] + t * (RPE_TABLE[rowIdx][hi] - RPE_TABLE[rowIdx][loIdx])) / 100;
}

export function epley1RM(weight: number, reps: number, rpe?: number): number {
  if (reps <= 0) return weight;
  if (reps === 1 && !rpe) return weight;

  // Use RPE chart when reps are in range
  if (reps >= 1 && reps <= 12) {
    const effectiveRpe = rpe ?? 10;
    return weight / rpePercent(reps, effectiveRpe);
  }

  // Fallback for >12 reps: Epley
  return weight * (1 + reps / 30);
}

export function topSetWeight(sets: Set[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => s.weight));
}

export function topE1RM(sets: Set[]): number {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((s) => epley1RM(s.weight, s.reps, s.rpe)));
}

export function totalVolume(sets: Set[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}
