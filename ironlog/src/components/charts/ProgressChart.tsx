import { Line } from 'react-chartjs-2';
import type { FilterRange, Movement, RepRange } from '../../types';
import { baseChartOptions } from '../../lib/chartDefaults';
import { useStrengthChartData } from '../../hooks/useChartData';
import { FILTER_LABELS } from '../../lib/dateUtils';

interface ProgressChartProps {
  movement: Movement;
  filterRange: FilterRange;
  onFilterChange: (range: FilterRange) => void;
  repRange: RepRange;
  onRepRangeChange: (range: RepRange) => void;
}

const FILTERS: FilterRange[] = ['4w', '3m', '6m', '1y', 'all'];
const REP_RANGES: RepRange[] = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export function ProgressChart({ movement, filterRange, onFilterChange, repRange, onRepRangeChange }: ProgressChartProps) {
  const { labels, datasets, prValue } = useStrengthChartData(filterRange, repRange, movement);

  const options = {
    ...baseChartOptions,
    animation: { duration: 400 },
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: false },
    },
    scales: {
      ...baseChartOptions.scales,
      y: {
        ...baseChartOptions.scales.y,
        title: {
          display: true,
          text: 'TOP SET (KG)',
          color: '#444',
          font: { family: 'Space Grotesk, system-ui, sans-serif', size: 10 },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-header-row">
        <span className="chart-metric-label">TOP SET</span>
        {prValue != null && (
          <span className="chart-pr-badge">{prValue} KG PR</span>
        )}
      </div>
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
          <div className="chart-empty">Log sessions to see your strength progress</div>
        ) : (
          <Line data={{ labels, datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
