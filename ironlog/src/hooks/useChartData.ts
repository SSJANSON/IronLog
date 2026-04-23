import { useMemo } from 'react';
import { startOfWeek, format } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { FilterRange, Movement, RepRange, Set } from '../types';
import { topSetWeight, topE1RM, totalVolume } from '../lib/epley';
import { filterByRange, formatChartDate } from '../lib/dateUtils';
import { MOVEMENT_COLORS } from '../lib/chartDefaults';

const MOVEMENTS: Movement[] = ['squat', 'bench', 'deadlift'];

function filterSetsByRepRange(sets: Set[], repRange: RepRange): Set[] {
  if (repRange === 'all') return sets;
  const n = parseInt(repRange, 10);
  return sets.filter(({ reps }) => reps === n);
}

export function useStrengthChartData(range: FilterRange, repRange: RepRange) {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const datasets = MOVEMENTS.map((movement) => {
      const data = sorted.map((session) => {
        const log = session.movements.find((m) => m.movement === movement);
        if (!log) return null;
        const sets = filterSetsByRepRange(log.sets, repRange);
        return sets.length ? topSetWeight(sets) : null;
      });

      return {
        label: movement.charAt(0).toUpperCase() + movement.slice(1),
        data,
        borderColor: MOVEMENT_COLORS[movement].solid,
        backgroundColor: MOVEMENT_COLORS[movement].translucent,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return { labels, datasets };
  }, [sessions, range, repRange]);
}

export function useE1RMChartData(range: FilterRange, repRange: RepRange) {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const datasets = MOVEMENTS.map((movement) => {
      const data = sorted.map((session) => {
        const log = session.movements.find((m) => m.movement === movement);
        if (!log) return null;
        const sets = filterSetsByRepRange(log.sets, repRange);
        return sets.length ? Math.round(topE1RM(sets)) : null;
      });

      return {
        label: movement.charAt(0).toUpperCase() + movement.slice(1),
        data,
        borderColor: MOVEMENT_COLORS[movement].solid,
        backgroundColor: MOVEMENT_COLORS[movement].translucent,
        fill: false,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return { labels, datasets };
  }, [sessions, range, repRange]);
}

export function useVolumeChartData(range: FilterRange, repRange: RepRange) {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);

    const weekMap = new Map<string, Record<string, number>>();

    for (const session of filtered) {
      const weekStart = format(startOfWeek(new Date(session.date)), 'MMM d');
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, { squat: 0, bench: 0, deadlift: 0 });
      const week = weekMap.get(weekStart)!;
      for (const log of session.movements) {
        const sets = filterSetsByRepRange(log.sets, repRange);
        week[log.movement] = (week[log.movement] ?? 0) + totalVolume(sets);
      }
    }

    const labels = Array.from(weekMap.keys());

    const datasets = MOVEMENTS.map((movement) => ({
      label: movement.charAt(0).toUpperCase() + movement.slice(1),
      data: labels.map((w) => Math.round(weekMap.get(w)?.[movement] ?? 0)),
      backgroundColor: MOVEMENT_COLORS[movement].solid,
      borderRadius: 4,
      stack: 'volume',
    }));

    return { labels, datasets };
  }, [sessions, range, repRange]);
}
