import { Bar } from 'react-chartjs-2';
import type { FilterRange, RepRange } from '../../types';
import { baseChartOptions } from '../../lib/chartDefaults';
import { useVolumeChartData } from '../../hooks/useChartData';
import { FILTER_LABELS } from '../../lib/dateUtils';

interface VolumeChartProps {
  filterRange: FilterRange;
  onFilterChange: (range: FilterRange) => void;
  repRange: RepRange;
  onRepRangeChange: (range: RepRange) => void;
}

const FILTERS: FilterRange[] = ['4w', '3m', '6m', '1y', 'all'];
const REP_RANGES: RepRange[] = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export function VolumeChart({ filterRange, onFilterChange, repRange, onRepRangeChange }: VolumeChartProps) {
  const { labels, datasets } = useVolumeChartData(filterRange, repRange);

  const options = {
    ...baseChartOptions,
    animation: { duration: 400 },
    scales: {
      ...baseChartOptions.scales,
      x: { ...baseChartOptions.scales.x, stacked: true },
      y: {
        ...baseChartOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Total Volume (kg)',
          color: 'var(--color-text-secondary)',
          font: { family: 'var(--font-sans)', size: 11 },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chart-filter-btn ${filterRange === f ? 'chart-filter-btn--active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="chart-filters chart-filters--rep">
        {REP_RANGES.map((r) => (
          <button
            key={r}
            className={`chart-filter-btn ${repRange === r ? 'chart-filter-btn--active' : ''}`}
            onClick={() => onRepRangeChange(r)}
          >
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>
      <div className="chart-canvas-wrapper">
        {labels.length === 0 ? (
          <div className="chart-empty">Log sessions to see your weekly volume</div>
        ) : (
          <Bar data={{ labels, datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
