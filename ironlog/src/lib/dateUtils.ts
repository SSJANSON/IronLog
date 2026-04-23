import { format, subWeeks, subMonths, subYears, isAfter } from 'date-fns';
import type { FilterRange } from '../types';

export function filterByRange(dates: string[], range: FilterRange): string[] {
  if (range === 'all') return dates;

  const now = new Date();
  const cutoff =
    range === '4w'
      ? subWeeks(now, 4)
      : range === '3m'
      ? subMonths(now, 3)
      : range === '6m'
      ? subMonths(now, 6)
      : subYears(now, 1);

  return dates.filter((d) => isAfter(new Date(d), cutoff));
}

export function formatChartDate(isoDate: string): string {
  return format(new Date(isoDate), 'MMM d');
}

export function formatWeekLabel(isoDate: string): string {
  return format(new Date(isoDate), 'MMM d');
}

export const FILTER_LABELS: Record<FilterRange, string> = {
  '4w': '4W',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  all: 'All',
};
