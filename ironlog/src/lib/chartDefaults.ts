import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ACCENT = '#CCFF00';
export const ACCENT_TRANSLUCENT = 'rgba(204, 255, 0, 0.15)';

export const MOVEMENT_COLORS = {
  squat:    { solid: ACCENT, translucent: ACCENT_TRANSLUCENT },
  bench:    { solid: ACCENT, translucent: ACCENT_TRANSLUCENT },
  deadlift: { solid: ACCENT, translucent: ACCENT_TRANSLUCENT },
} as const;

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111',
      titleColor: ACCENT,
      bodyColor: '#ccc',
      borderColor: '#2E2E2E',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Space Grotesk, system-ui, sans-serif', weight: 'bold' as const, size: 12 },
      bodyFont: { family: 'Space Grotesk, system-ui, sans-serif', size: 12 },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#666',
        font: { family: 'Space Grotesk, system-ui, sans-serif', size: 10 },
        maxRotation: 0,
      },
      grid: { color: '#2E2E2E' },
      border: { color: '#2E2E2E' },
    },
    y: {
      ticks: {
        color: '#666',
        font: { family: 'Space Grotesk, system-ui, sans-serif', size: 10 },
      },
      grid: { color: '#2E2E2E' },
      border: { color: '#2E2E2E' },
    },
  },
};
