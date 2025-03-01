import { Bar } from 'react-chartjs-2';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { ABTest, ABTestVariant } from '../../../lib/ab-test-api';

interface ABTestMetricsProps {
  test: ABTest;
}

export function ABTestMetrics({ test }: ABTestMetricsProps) {
  const getMetricConfig = (type: ABTest['type']) => {
    switch (type) {
      case 'BIDDING_STRATEGY':
        return {
          primary: { key: 'roas', label: 'ROAS', format: (value: number) => `${value.toFixed(2)}x` },
          secondary: [
            { key: 'cost', label: 'Cost', format: (value: number) => `$${value.toFixed(2)}` },
            { key: 'conversions', label: 'Conversions', format: (value: number) => value.toFixed(0) }
          ]
        };
      case 'AD_COPY':
        return {
          primary: { key: 'ctr', label: 'CTR', format: (value: number) => `${(value * 100).toFixed(2)}%` },
          secondary: [
            { key: 'clicks', label: 'Clicks', format: (value: number) => value.toLocaleString() },
            { key: 'impressions', label: 'Impressions', format: (value: number) => value.toLocaleString() }
          ]
        };
      case 'TARGETING':
        return {
          primary: { key: 'conversionRate', label: 'Conv. Rate', format: (value: number) => `${(value * 100).toFixed(2)}%` },
          secondary: [
            { key: 'conversions', label: 'Conversions', format: (value: number) => value.toFixed(0) },
            { key: 'cost', label: 'Cost', format: (value: number) => `$${value.toFixed(2)}` }
          ]
        };
      case 'BUDGET':
        return {
          primary: { key: 'roas', label: 'ROAS', format: (value: number) => `${value.toFixed(2)}x` },
          secondary: [
            { key: 'cost', label: 'Cost', format: (value: number) => `$${value.toFixed(2)}` },
            { key: 'revenue', label: 'Revenue', format: (value: number) => `$${value.toFixed(2)}` }
          ]
        };
    }
  };

  const config = getMetricConfig(test.type);
  const controlVariant = test.variants.find(v => v.isControl);
  
  if (!controlVariant) return null;

  const getPerformanceIndicator = (variant: ABTestVariant, metric: string) => {
    if (variant.isControl) return null;

    const variantValue = variant.metrics[metric as keyof typeof variant.metrics] || 0;
    const controlValue = controlVariant.metrics[metric as keyof typeof controlVariant.metrics] || 0;
    
    if (controlValue === 0) return null;

    const difference = ((variantValue - controlValue) / controlValue) * 100;
    
    if (Math.abs(difference) < 1) {
      return (
        <span className="inline-flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          No change
        </span>
      );
    }

    const isPositive = difference > 0;
    return (
      <span className={`inline-flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUp className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-1" />
        )}
        {Math.abs(difference).toFixed(1)}%
      </span>
    );
  };

  const chartData = {
    labels: test.variants.map(v => v.name),
    datasets: [
      {
        label: config.primary.label,
        data: test.variants.map(v => v.metrics[config.primary.key as keyof typeof v.metrics] || 0),
        backgroundColor: test.variants.map(v => 
          v.isControl ? 'rgba(59, 130, 246, 0.5)' : 'rgba(99, 102, 241, 0.5)'
        ),
        borderColor: test.variants.map(v =>
          v.isControl ? 'rgb(59, 130, 246)' : 'rgb(99, 102, 241)'
        ),
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${config.primary.label}: ${config.primary.format(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => config.primary.format(value)
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {test.variants.map((variant) => (
          <div
            key={variant.id}
            className={`p-4 rounded-lg border ${
              variant.isControl
                ? 'border-blue-200 bg-blue-50'
                : test.winningVariantId === variant.id
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                {variant.name}
                {variant.isControl && (
                  <span className="ml-2 text-xs text-blue-600">(Control)</span>
                )}
                {test.winningVariantId === variant.id && (
                  <span className="ml-2 text-xs text-green-600">(Winner)</span>
                )}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{config.primary.label}</span>
                  {!variant.isControl && (
                    <div className="text-sm">
                      {getPerformanceIndicator(variant, config.primary.key)}
                    </div>
                  )}
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {config.primary.format(variant.metrics[config.primary.key as keyof typeof variant.metrics] || 0)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {config.secondary.map((metric) => (
                  <div key={metric.key}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{metric.label}</span>
                      {!variant.isControl && (
                        <div className="text-xs">
                          {getPerformanceIndicator(variant, metric.key)}
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {metric.format(variant.metrics[metric.key as keyof typeof variant.metrics] || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Comparison</h3>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}