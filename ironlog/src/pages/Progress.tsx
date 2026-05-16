import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { ProgressChart } from '../components/charts/ProgressChart';
import { EstimatedOneRMChart } from '../components/charts/EstimatedOneRMChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import type { FilterRange, Movement, RepRange } from '../types';
import { MOVEMENT_VARIATIONS } from '../types';
import { useCustomVariations } from '../hooks/useCustomVariations';

type ChartTab = 'strength' | 'e1rm' | 'volume';

const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'e1rm', label: 'Est. 1RM' },
  { id: 'volume', label: 'Volume' },
];

const MOVEMENT_TABS: { id: Movement; label: string }[] = [
  { id: 'squat', label: 'Squat' },
  { id: 'bench', label: 'Bench' },
  { id: 'deadlift', label: 'Deadlift' },
];

export function Progress() {
  const [activeTab, setActiveTab] = useState<ChartTab>('strength');
  const [selectedMovement, setSelectedMovement] = useState<Movement>('squat');
  const [filterRange, setFilterRange] = useState<FilterRange>('3m');
  const [repRange, setRepRange] = useState<RepRange>('all');
  const [variation, setVariation] = useState<Record<Movement, string>>({
    squat: 'all', bench: 'all', deadlift: 'all',
  });
  const customVariations = useCustomVariations();

  return (
    <div className="page">
      <Header title="Progress" />
      <div className="page-content">

        <div className="progress-movement-tabs">
          {MOVEMENT_TABS.map((m) => (
            <button
              key={m.id}
              className={`progress-movement-tab${selectedMovement === m.id ? ' progress-movement-tab--active' : ''}`}
              onClick={() => setSelectedMovement(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="chart-filters progress-variation-filters">
          <button
            className={`chart-filter-btn${variation[selectedMovement] === 'all' ? ' chart-filter-btn--active' : ''}`}
            onClick={() => setVariation((prev) => ({ ...prev, [selectedMovement]: 'all' }))}
          >
            All
          </button>
          {[
            ...MOVEMENT_VARIATIONS[selectedMovement].filter((v) => v !== 'custom'),
            ...(customVariations[selectedMovement] ?? []),
          ].map((v) => (
            <button
              key={v}
              className={`chart-filter-btn${variation[selectedMovement] === v ? ' chart-filter-btn--active' : ''}`}
              onClick={() => setVariation((prev) => ({ ...prev, [selectedMovement]: v }))}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-bar">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="chart-section">
          {activeTab === 'strength' && (
            <ProgressChart
              movement={selectedMovement}
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
              variation={variation[selectedMovement]}
            />
          )}
          {activeTab === 'e1rm' && (
            <EstimatedOneRMChart
              movement={selectedMovement}
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
              variation={variation[selectedMovement]}
            />
          )}
          {activeTab === 'volume' && (
            <VolumeChart
              movement={selectedMovement}
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
              variation={variation[selectedMovement]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
