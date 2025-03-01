import { Line, Bar } from 'react-chartjs-2';
import { formatNumber, formatCurrency, formatPercentage } from '../../../lib/format-utils';
import { mean, standardDeviation, tTest } from 'simple-statistics';
import regression from 'regression';
import type { Campaign } from '../../../lib/google-ads-api';

interface ComparisonMetricsProps {
  campaigns: Campaign[];
}

interface TrendAnalysis {
  slope: number;
  direction: 'up' | 'down' | 'flat';
  confidence: number;
  prediction: number;
}

interface StatisticalTest {
  metric: string;
  difference: number;
  percentDifference: number;
  significant: boolean;
  pValue: number;
  confidenceInterval: [number, number];
}

export function ComparisonMetrics({ campaigns }: ComparisonMetricsProps) {
  const metrics = [
    { key: 'impressions', label: 'Impressions', format: formatNumber },
    { key: 'clicks', label: 'Clicks', format: formatNumber },
    { key: 'cost', label: 'Cost', format: formatCurrency },
    { key: 'conversions', label: 'Conversions', format: formatNumber },
    { key: 'ctr', label: 'CTR', format: formatPercentage },
    { key: 'conversionRate', label: 'Conv. Rate', format: formatPercentage },
    { key: 'cpa', label: 'Cost per Conversion', format: formatCurrency },
    { key: 'roas', label: 'ROAS', format: (value: number) => `${value.toFixed(2)}x` },
    { key: 'averagePosition', label: 'Avg. Position', format: formatNumber }
  ];

  // Calculate trend analysis for a metric
  const analyzeTrend = (data: number[]): TrendAnalysis => {
    if (data.length < 2) {
      return { slope: 0, direction: 'flat', confidence: 0, prediction: data[0] || 0 };
    }

    const points = data.map((y, i) => [i, y]);
    const result = regression.linear(points);
    const slope = result.equation[0];
    const confidence = Math.abs(result.r2);
    const prediction = result.predict(data.length)[1];

    return {
      slope,
      direction: slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'flat',
      confidence,
      prediction
    };
  };

  // Perform statistical significance testing
  const performStatisticalTest = (metric: string): StatisticalTest => {
    const campaign1Data = campaigns[0].historicalMetrics?.map(m => m[metric as keyof typeof m]) || [];
    const campaign2Data = campaigns[1].historicalMetrics?.map(m => m[metric as keyof typeof m]) || [];

    const mean1 = mean(campaign1Data);
    const mean2 = mean(campaign2Data);
    const difference = mean2 - mean1;
    const percentDifference = (difference / mean1) * 100;

    // Perform t-test
    const testResult = tTest(campaign1Data, campaign2Data);
    const significant = testResult < 0.05; // 95% confidence level

    // Calculate confidence interval
    const sd1 = standardDeviation(campaign1Data);
    const sd2 = standardDeviation(campaign2Data);
    const se = Math.sqrt((sd1 * sd1) / campaign1Data.length + (sd2 * sd2) / campaign2Data.length);
    const ci = [difference - 1.96 * se, difference + 1.96 * se];

    return {
      metric,
      difference,
      percentDifference,
      significant,
      pValue: testResult,
      confidenceInterval: ci
    };
  };

  const chartData = {
    labels: campaigns.map(c => c.name),
    datasets: metrics.map(metric => ({
      label: metric.label,
      data: campaigns.map(c => c.metrics?.[metric.key as keyof typeof c.metrics] || 0),
      fill: false,
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      tension: 0.4
    }))
  };

  const trendChartData = {
    labels: campaigns[0].historicalMetrics?.map(m => new Date(m.date).toLocaleDateString()) || [],
    datasets: campaigns.map((campaign, i) => ({
      label: campaign.name,
      data: campaign.historicalMetrics?.map(m => m.conversions) || [],
      borderColor: i === 0 ? 'rgb(53, 162, 235)' : 'rgb(255, 99, 132)',
      backgroundColor: i === 0 ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
      tension: 0.3
    }))
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const metric = metrics[context.datasetIndex];
            return `${metric.label}: ${metric.format(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatNumber(value)
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div key={metric.key} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
            <div className="mt-2 space-y-2">
              {campaigns.map(campaign => {
                const value = campaign.metrics?.[metric.key as keyof typeof campaign.metrics] || 0;
                const trend = analyzeTrend(campaign.historicalMetrics?.map(m => m[metric.key as keyof typeof m]) || []);
                
                return (
                  <div key={campaign.id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{campaign.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {metric.format(value)}
                      </span>
                      <span className={`text-xs ${
                        trend.direction === 'up' ? 'text-green-600' :
                        trend.direction === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        ({trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                        {Math.abs(trend.slope * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Statistical Significance Results */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Statistical Analysis</h3>
        <div className="space-y-4">
          {metrics.map(metric => {
            const test = performStatisticalTest(metric.key);
            return (
              <div key={metric.key} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <span className="text-sm font-medium text-gray-900">{metric.label}</span>
                  <span className={`ml-2 text-xs ${
                    test.significant ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {test.significant ? '(Statistically Significant)' : '(Not Significant)'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className={`font-medium ${
                    test.percentDifference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {test.percentDifference > 0 ? '+' : ''}{test.percentDifference.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-2">
                    (p={test.pValue.toFixed(3)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Comparison</h3>
        <div className="h-80">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* Historical Trend Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Historical Trend Analysis</h3>
        <div className="h-80">
          <Line 
            data={trendChartData}
            options={{
              ...options,
              plugins: {
                ...options.plugins,
                tooltip: {
                  mode: 'index',
                  intersect: false
                }
              }
            }}
          />
        </div>
      </div>

      {/* Predictions and Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Predictions and Insights</h3>
        <div className="space-y-4">
          {metrics.map(metric => {
            const trend1 = analyzeTrend(campaigns[0].historicalMetrics?.map(m => m[metric.key as keyof typeof m]) || []);
            const trend2 = analyzeTrend(campaigns[1].historicalMetrics?.map(m => m[metric.key as keyof typeof m]) || []);
            
            return (
              <div key={metric.key} className="border-b border-gray-100 pb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{metric.label}</h4>
                <div className="grid grid-cols-2 gap-4">
                  {campaigns.map((campaign, i) => {
                    const trend = i === 0 ? trend1 : trend2;
                    return (
                      <div key={campaign.id} className="text-sm">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-gray-500 mt-1">
                          Trend: {trend.direction === 'up' ? 'Increasing' : trend.direction === 'down' ? 'Decreasing' : 'Stable'}
                          <br />
                          Confidence: {(trend.confidence * 100).toFixed(1)}%
                          <br />
                          Predicted Next Value: {metric.format(trend.prediction)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}