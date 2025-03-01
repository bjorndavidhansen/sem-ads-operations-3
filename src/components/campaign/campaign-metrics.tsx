import { useEffect, useState } from 'react';
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
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Calendar, ChevronDown } from 'lucide-react';
import type { CampaignMetrics as Metrics } from '../../lib/google-ads-api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CampaignMetricsProps {
  metrics: Metrics;
  historicalData?: {
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
  }[];
}

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

type DatePreset = {
  label: string;
  getValue: () => { start: Date; end: Date };
  group: 'quick' | 'month' | 'quarter' | 'year';
};

const DATE_PRESETS: DatePreset[] = [
  // Quick access
  {
    label: 'Today',
    getValue: () => {
      const now = new Date();
      return { start: now, end: now };
    },
    group: 'quick'
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: yesterday };
    },
    group: 'quick'
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return { start, end };
    },
    group: 'quick'
  },
  {
    label: 'Last 14 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 14);
      return { start, end };
    },
    group: 'quick'
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return { start, end };
    },
    group: 'quick'
  },
  // Monthly
  {
    label: 'This month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    },
    group: 'month'
  },
  {
    label: 'Last month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    },
    group: 'month'
  },
  {
    label: 'Last 3 months',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 3);
      return { start, end };
    },
    group: 'month'
  },
  {
    label: 'Last 6 months',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 6);
      return { start, end };
    },
    group: 'month'
  },
  // Quarterly
  {
    label: 'This quarter',
    getValue: () => {
      const now = new Date();
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth, 1);
      return { start, end: now };
    },
    group: 'quarter'
  },
  {
    label: 'Last quarter',
    getValue: () => {
      const now = new Date();
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth - 3, 1);
      const end = new Date(now.getFullYear(), quarterMonth, 0);
      return { start, end };
    },
    group: 'quarter'
  },
  // Yearly
  {
    label: 'This year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    },
    group: 'year'
  },
  {
    label: 'Last year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { start, end };
    },
    group: 'year'
  },
  {
    label: 'Last 365 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 365);
      return { start, end };
    },
    group: 'year'
  }
];

export function CampaignMetrics({ metrics, historicalData = [] }: CampaignMetricsProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Last 30 days');

  const applyDatePreset = (preset: DatePreset) => {
    const { start, end } = preset.getValue();
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setSelectedPreset(preset.label);
    setShowPresets(false);
  };

  useEffect(() => {
    if (historicalData.length > 0) {
      const preset = DATE_PRESETS.find(p => p.label === 'Last 30 days');
      if (preset) {
        applyDatePreset(preset);
      }
    }
  }, [historicalData]);

  const filteredData = historicalData.filter(d => {
    const date = new Date(d.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  const performanceData: ChartData<'line'> = {
    labels: filteredData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Clicks',
        data: filteredData.map(d => d.clicks),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Conversions',
        data: filteredData.map(d => d.conversions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const costData: ChartData<'bar'> = {
    labels: filteredData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Cost (USD)',
        data: filteredData.map(d => d.cost),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Calculate period metrics
  const periodMetrics = filteredData.reduce((acc, curr) => ({
    impressions: acc.impressions + curr.impressions,
    clicks: acc.clicks + curr.clicks,
    cost: acc.cost + curr.cost,
    conversions: acc.conversions + curr.conversions,
  }), {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
  });

  const averageCpc = periodMetrics.clicks > 0 
    ? periodMetrics.cost / periodMetrics.clicks 
    : 0;

  const ctr = periodMetrics.impressions > 0 
    ? (periodMetrics.clicks / periodMetrics.impressions) * 100 
    : 0;

  const conversionRate = periodMetrics.clicks > 0 
    ? (periodMetrics.conversions / periodMetrics.clicks) * 100 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Calendar className="h-4 w-4" />
            {selectedPreset}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showPresets && (
            <div className="absolute z-10 mt-1 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
              {(['quick', 'month', 'quarter', 'year'] as const).map(group => (
                <div key={group} className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    {group === 'quick' ? 'Quick Access' :
                     group === 'month' ? 'Monthly' :
                     group === 'quarter' ? 'Quarterly' : 'Yearly'}
                  </h3>
                  <div className="space-y-1">
                    {DATE_PRESETS.filter(preset => preset.group === group).map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => applyDatePreset(preset)}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${
                          selectedPreset === preset.label
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-2 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedPreset('Custom Range');
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedPreset('Custom Range');
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Impressions
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {periodMetrics.impressions.toLocaleString()}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Clicks
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {periodMetrics.clicks.toLocaleString()}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Cost
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${periodMetrics.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Conversions
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {periodMetrics.conversions.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Avg. CPC
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${averageCpc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              CTR
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {ctr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Conv. Rate
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {conversionRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </dd>
          </div>
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
            <Line options={chartOptions} data={performanceData} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Cost</h3>
            <Bar options={chartOptions} data={costData} />
          </div>
        </div>
      )}
    </div>
  );
}