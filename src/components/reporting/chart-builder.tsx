import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

interface ChartBuilderProps {
  data: any;
  type: 'line' | 'bar' | 'pie';
  metrics: string[];
  dimensions: string[];
}

export function ChartBuilder({ data, type, metrics, dimensions }: ChartBuilderProps) {
  const chartData = {
    labels: data.dimensions[dimensions[0]],
    datasets: metrics.map(metric => ({
      label: metric,
      data: data.metrics[metric],
      fill: false,
      tension: 0.4
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: type !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            // Format based on metric type
            if (metrics.some(m => m.includes('rate') || m.includes('percentage'))) {
              return `${value}%`;
            }
            if (metrics.some(m => m.includes('cost') || m.includes('value'))) {
              return `$${value}`;
            }
            return value.toLocaleString();
          }
        }
      }
    } : undefined
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    pie: Pie
  }[type];

  return (
    <div className="h-[400px]">
      <ChartComponent data={chartData} options={options} />
    </div>
  );
}