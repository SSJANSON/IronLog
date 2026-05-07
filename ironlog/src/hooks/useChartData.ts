import { useMemo } from 'react';
import { startOfWeek, format } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { FilterRange, Movement, RepRange, Set } from '../types';
import { topSetWeight, topE1RM, totalVolume } from '../lib/epley';
import { filterByRange, formatChartDate } from '../lib/dateUtils';
import { ACCENT, ACCENT_TRANSLUCENT } from '../lib/chartDefaults';

const MOVEMENTS: Movement[] = ['squat', 'bench', 'deadlift'];

function gradientFill(context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) return 'rgba(204,255,0,0.1)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(204,255,0,0.25)');
  gradient.addColorStop(1, 'rgba(204,255,0,0)');
  return gradient;
}

function filterSetsByRepRange(sets: Set[], repRange: RepRange): Set[] {
  if (repRange === 'all') return sets;
  const n = parseInt(repRange, 10);
  return sets.filter(({ reps }) => reps === n);
}

export function useStrengthChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat') {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const data = sorted.map((session) => {
      const log = session.movements.find((m) => m.movement === movement);
      if (!log) return null;
      const sets = filterSetsByRepRange(log.sets, repRange);
      return sets.length ? topSetWeight(sets) : null;
    });

    const prValue = data.reduce((max, v) => (v != null && v > (max ?? 0) ? v : max), null as number | null);

    const dataset = {
      label: movement.charAt(0).toUpperCase() + movement.slice(1),
      data,
      borderColor: ACCENT,
      backgroundColor: gradientFill,
      fill: true,
      tension: 0.4,
      spanGaps: true,
      borderWidth: 3,
      pointRadius: data.map((v) => (v === prValue && v != null ? 6 : 3)),
      pointHoverRadius: 8,
      pointBackgroundColor: data.map((v) => (v === prValue && v != null ? ACCENT : ACCENT)),
      pointBorderColor: data.map((v) => (v === prValue && v != null ? '#fff' : ACCENT)),
      pointBorderWidth: data.map((v) => (v === prValue && v != null ? 2 : 0)),
    };

    return { labels, datasets: [dataset], prValue };
  }, [sessions, range, repRange, movement]);
}

export function useE1RMChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat') {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const data = sorted.map((session) => {
      const log = session.movements.find((m) => m.movement === movement);
      if (!log) return null;
      const sets = filterSetsByRepRange(log.sets, repRange);
      return sets.length ? Math.round(topE1RM(sets)) : null;
    });

    const prValue = data.reduce((max, v) => (v != null && v > (max ?? 0) ? v : max), null as number | null);

    const dataset = {
      label: movement.charAt(0).toUpperCase() + movement.slice(1),
      data,
      borderColor: ACCENT,
      backgroundColor: gradientFill,
      fill: true,
      tension: 0.4,
      spanGaps: true,
      borderWidth: 3,
      pointRadius: data.map((v) => (v === prValue && v != null ? 6 : 3)),
      pointHoverRadius: 8,
      pointBackgroundColor: ACCENT,
      pointBorderColor: data.map((v) => (v === prValue && v != null ? '#fff' : ACCENT)),
      pointBorderWidth: data.map((v) => (v === prValue && v != null ? 2 : 0)),
    };

    return { labels, datasets: [dataset], prValue };
  }, [sessions, range, repRange, movement]);
}

export function useVolumeChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat') {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);

    const weekMap = new Map<string, number>();

    for (const session of filtered) {
      const weekStart = format(startOfWeek(new Date(session.date)), 'MMM d');
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, 0);
      for (const log of session.movements) {
        if (log.movement !== movement) continue;
        const sets = filterSetsByRepRange(log.sets, repRange);
        weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + totalVolume(sets));
      }
    }

    const labels = Array.from(weekMap.keys());
    const data = labels.map((w) => Math.round(weekMap.get(w) ?? 0));

    return {
      labels,
      datasets: [{
        label: movement.charAt(0).toUpperCase() + movement.slice(1),
        data,
        backgroundColor: ACCENT,
        borderRadius: 4,
      }],
    };
  }, [sessions, range, repRange, movement]);
}
