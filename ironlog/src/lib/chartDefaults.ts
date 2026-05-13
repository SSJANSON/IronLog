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

export const ACCENT = '#FF4500';
export const ACCENT_TRANSLUCENT = 'rgba(255, 69, 0, 0.15)';

export const MOVEMENT_COLORS = {
  squat:    { solid: '#7C3AED', translucent: 'rgba(124, 58, 237, 0.12)' },
  bench:    { solid: '#EF4444', translucent: 'rgba(239, 68, 68, 0.12)'  },
  deadlift: { solid: '#22C55E', translucent: 'rgba(34, 197, 94, 0.12)'  },
} as const;

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#fff',
      titleColor: '#1A1A1A',
      bodyColor: '#424242',
      borderColor: '#D4D4D4',
      borderWidth: 1,
      padding: 10,
      usePointStyle: true,
      titleFont: { family: 'Space Grotesk, system-ui, sans-serif', weight: 'bold' as const, size: 12 },
      bodyFont: { family: 'Space Grotesk, system-ui, sans-serif', size: 12 },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#757575',
        font: { family: 'Space Grotesk, system-ui, sans-serif', size: 10 },
        maxRotation: 0,
      },
      grid: { color: 'rgba(0,0,0,0.06)' },
      border: { color: '#D4D4D4' },
    },
    y: {
      ticks: {
        color: '#757575',
        font: { family: 'Space Grotesk, system-ui, sans-serif', size: 10 },
      },
      grid: { color: 'rgba(0,0,0,0.06)' },
      border: { color: '#D4D4D4' },
    },
  },
};
