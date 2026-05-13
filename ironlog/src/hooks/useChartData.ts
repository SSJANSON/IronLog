import { useMemo } from 'react';
import { startOfWeek, format } from 'date-fns';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { FilterRange, Movement, RepRange, Set } from '../types';
import { topSetWeight, topE1RM, totalVolume } from '../lib/epley';
import { filterByRange, formatChartDate } from '../lib/dateUtils';
import { MOVEMENT_COLORS } from '../lib/chartDefaults';

const MOVEMENTS: Movement[] = ['squat', 'bench', 'deadlift'];

function makeGradient(color: string) {
  return (context: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return 'transparent';
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, color.replace('0.12)', '0.25)'));
    gradient.addColorStop(1, color.replace('0.12)', '0)'));
    return gradient;
  };
}

function filterSetsByRepRange(sets: Set[], repRange: RepRange): Set[] {
  if (repRange === 'all') return sets;
  const n = parseInt(repRange, 10);
  return sets.filter(({ reps }) => reps === n);
}

export function useStrengthChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat', variation = 'all') {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const pointData = sorted.map((session) => {
      const log = session.movements.find((m) => m.movement === movement && (variation === 'all' || m.variation === variation));
      if (!log) return { value: null, variation: null };
      const sets = filterSetsByRepRange(log.sets, repRange);
      return { value: sets.length ? topSetWeight(sets) : null, variation: log.variation ?? null };
    });

    const data = pointData.map((p) => p.value);
    const pointVariations = pointData.map((p) => p.variation);

    const prValue = data.reduce((max, v) => (v != null && v > (max ?? 0) ? v : max), null as number | null);

    const { solid, translucent } = MOVEMENT_COLORS[movement] ?? MOVEMENT_COLORS.squat;
    const dataset = {
      label: movement.charAt(0).toUpperCase() + movement.slice(1),
      data,
      borderColor: solid,
      backgroundColor: makeGradient(translucent),
      fill: true,
      tension: 0.4,
      spanGaps: true,
      borderWidth: 3,
      pointStyle: data.map((v) => (v === prValue && v != null ? 'rectRot' : 'circle')),
      pointRadius: data.map((v, i) => {
        if (v === prValue && v != null) return 8;
        return pointVariations[i] === 'competition' || !pointVariations[i] ? 5 : 3;
      }),
      pointHoverRadius: 10,
      pointBackgroundColor: solid,
      pointBorderColor: data.map((v, i) => {
        if (v === prValue && v != null) return '#fff';
        return pointVariations[i] === 'competition' || !pointVariations[i] ? '#fff' : solid;
      }),
      pointBorderWidth: data.map((v, i) => {
        if (v === prValue && v != null) return 2;
        return pointVariations[i] === 'competition' || !pointVariations[i] ? 2 : 0;
      }),
    };

    return { labels, datasets: [dataset], prValue, pointVariations };
  }, [sessions, range, repRange, movement, variation]);
}

export function useE1RMChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat', variation = 'all') {
  const sessions = useWorkoutStore((s) => s.sessions);

  return useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const filtered = completed.filter((s) => filterByRange([s.date], range).length > 0);
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = [...new Set(sorted.map((s) => formatChartDate(s.date)))];

    const pointData = sorted.map((session) => {
      const log = session.movements.find((m) => m.movement === movement && (variation === 'all' || m.variation === variation));
      if (!log) return { value: null, variation: null };
      const sets = filterSetsByRepRange(log.sets, repRange);
      return { value: sets.length ? Math.round(topE1RM(sets)) : null, variation: log.variation ?? null };
    });

    const data = pointData.map((p) => p.value);
    const pointVariations = pointData.map((p) => p.variation);

    const prValue = data.reduce((max, v) => (v != null && v > (max ?? 0) ? v : max), null as number | null);

    const { solid, translucent } = MOVEMENT_COLORS[movement] ?? MOVEMENT_COLORS.squat;
    const dataset = {
      label: movement.charAt(0).toUpperCase() + movement.slice(1),
      data,
      borderColor: solid,
      backgroundColor: makeGradient(translucent),
      fill: true,
      tension: 0.4,
      spanGaps: true,
      borderWidth: 3,
      pointStyle: data.map((v) => (v === prValue && v != null ? 'rectRot' : 'circle')),
      pointRadius: data.map((v, i) => {
        if (v === prValue && v != null) return 8;
        return pointVariations[i] === 'competition' || !pointVariations[i] ? 5 : 3;
      }),
      pointHoverRadius: 10,
      pointBackgroundColor: solid,
      pointBorderColor: data.map((v, i) => {
        if (v === prValue && v != null) return '#fff';
        return pointVariations[i] === 'competition' || !pointVariations[i] ? '#fff' : solid;
      }),
      pointBorderWidth: data.map((v, i) => {
        if (v === prValue && v != null) return 2;
        return pointVariations[i] === 'competition' || !pointVariations[i] ? 2 : 0;
      }),
    };

    return { labels, datasets: [dataset], prValue, pointVariations };
  }, [sessions, range, repRange, movement, variation]);
}

export function useVolumeChartData(range: FilterRange, repRange: RepRange, movement: Movement = 'squat', variation = 'all') {
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
        if (variation !== 'all' && log.variation !== variation) continue;
        const sets = filterSetsByRepRange(log.sets, repRange);
        weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + totalVolume(sets));
      }
    }

    const labels = Array.from(weekMap.keys());
    const data = labels.map((w) => Math.round(weekMap.get(w) ?? 0));

    const { solid } = MOVEMENT_COLORS[movement] ?? MOVEMENT_COLORS.squat;
    return {
      labels,
      datasets: [{
        label: movement.charAt(0).toUpperCase() + movement.slice(1),
        data,
        backgroundColor: solid,
        borderRadius: 4,
      }],
    };
  }, [sessions, range, repRange, movement, variation]);
}
