import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { ProgressChart } from '../components/charts/ProgressChart';
import { EstimatedOneRMChart } from '../components/charts/EstimatedOneRMChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import type { FilterRange, RepRange } from '../types';

type ChartTab = 'strength' | 'e1rm' | 'volume';

const TABS: { id: ChartTab; label: string }[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'e1rm', label: 'Est. 1RM' },
  { id: 'volume', label: 'Volume' },
];

export function Progress() {
  const [activeTab, setActiveTab] = useState<ChartTab>('strength');
  const [filterRange, setFilterRange] = useState<FilterRange>('3m');
  const [repRange, setRepRange] = useState<RepRange>('all');

  return (
    <div className="page">
      <Header title="Progress" />
      <div className="page-content">
        <div className="tab-bar">
          {TABS.map((tab) => (
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
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
            />
          )}
          {activeTab === 'e1rm' && (
            <EstimatedOneRMChart
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
            />
          )}
          {activeTab === 'volume' && (
            <VolumeChart
              filterRange={filterRange}
              onFilterChange={setFilterRange}
              repRange={repRange}
              onRepRangeChange={setRepRange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
