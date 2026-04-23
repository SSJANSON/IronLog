import { Line } from 'react-chartjs-2';
import type { FilterRange, RepRange } from '../../types';
import { baseChartOptions } from '../../lib/chartDefaults';
import { useE1RMChartData } from '../../hooks/useChartData';
import { FILTER_LABELS } from '../../lib/dateUtils';

interface EstimatedOneRMChartProps {
  filterRange: FilterRange;
  onFilterChange: (range: FilterRange) => void;
  repRange: RepRange;
  onRepRangeChange: (range: RepRange) => void;
}

const FILTERS: FilterRange[] = ['4w', '3m', '6m', '1y', 'all'];
const REP_RANGES: RepRange[] = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export function EstimatedOneRMChart({ filterRange, onFilterChange, repRange, onRepRangeChange }: EstimatedOneRMChartProps) {
  const { labels, datasets } = useE1RMChartData(filterRange, repRange);

  const options = {
    ...baseChartOptions,
    animation: { duration: 400 },
    scales: {
      ...baseChartOptions.scales,
      y: {
        ...baseChartOptions.scales.y,
        title: {
          display: true,
          text: 'Estimated 1RM (kg)',
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
          <div className="chart-empty">Log sessions to see your estimated 1RM over time</div>
        ) : (
          <Line data={{ labels, datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
