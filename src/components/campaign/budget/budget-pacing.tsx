import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { budgetApi, type BudgetPacing, type BudgetForecast } from '../../../lib/budget-api';

interface BudgetPacingProps {
  campaignId: string;
}

export function BudgetPacing({ campaignId }: BudgetPacingProps) {
  const [pacing, setPacing] = useState<BudgetPacing | null>(null);
  const [forecast, setForecast] = useState<BudgetForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pacingData, forecastData] = await Promise.all([
        budgetApi.getBudgetPacing(campaignId),
        budgetApi.getForecast(campaignId)
      ]);
      setPacing(pacingData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
      console.error('Error loading budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPaceStatusIcon = (status: BudgetPacing['paceStatus']) => {
    switch (status) {
      case 'UNDER_PACING':
        return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      case 'OVER_PACING':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'ON_TRACK':
        return <Minus className="h-5 w-5 text-green-500" />;
    }
  };

  const chartData = {
    labels: forecast.map(f => new Date(f.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Projected Spend',
        data: forecast.map(f => f.projectedSpend),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Upper Bound',
        data: forecast.map(f => f.upperBound),
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false
      },
      {
        label: 'Lower Bound',
        data: forecast.map(f => f.lowerBound),
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: '-1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Spend ($)'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pacing) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Budget Utilization</h3>
            {getPaceStatusIcon(pacing.paceStatus)}
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {(pacing.utilizationRate * 100).toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {pacing.daysRemaining} days remaining
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Current Spend</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${pacing.actualSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            of ${pacing.budgetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Projected End of Month</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${pacing.forecastedEndOfMonthSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {pacing.paceStatus === 'OVER_PACING' ? 'Over budget' : 
             pacing.paceStatus === 'UNDER_PACING' ? 'Under budget' : 'On track'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">30-Day Forecast</h3>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}