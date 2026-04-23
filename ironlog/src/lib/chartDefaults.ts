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

export const MOVEMENT_COLORS = {
  squat: {
    solid: '#7C3AED',
    translucent: 'rgba(124, 58, 237, 0.15)',
  },
  bench: {
    solid: '#EF4444',
    translucent: 'rgba(239, 68, 68, 0.15)',
  },
  deadlift: {
    solid: '#22C55E',
    translucent: 'rgba(34, 197, 94, 0.15)',
  },
} as const;

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: {
      labels: {
        color: '#ffffff',
        font: { family: 'Inter, system-ui, sans-serif', size: 13 },
        boxWidth: 12,
        boxHeight: 12,
        borderRadius: 3,
      },
    },
    tooltip: {
      backgroundColor: '#1C1C27',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#2A2A3A',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'Inter, system-ui, sans-serif', weight: 'bold' as const },
      bodyFont: { family: 'Inter, system-ui, sans-serif' },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#ffffff',
        font: { family: 'Inter, system-ui, sans-serif', size: 11 },
      },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
    y: {
      ticks: {
        color: '#ffffff',
        font: { family: 'Inter, system-ui, sans-serif', size: 11 },
      },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
  },
};
