import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { reportApi } from '../../lib/report-api';

interface MetricSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
}

export function MetricSelector({ selectedMetrics, onChange }: MetricSelectorProps) {
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await reportApi.getAvailableMetrics();
      setAvailableMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMetric = (metric: string) => {
    if (!selectedMetrics.includes(metric)) {
      onChange([...selectedMetrics, metric]);
    }
  };

  const removeMetric = (metric: string) => {
    onChange(selectedMetrics.filter(m => m !== metric));
  };

  const formatMetricLabel = (metric: string) => {
    return metric
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Metrics
        </label>
        {error && (
          <div className="mt-1 text-sm text-red-600">
            <AlertTriangle className="inline-block h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedMetrics.map((metric) => (
          <span
            key={metric}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
          >
            {formatMetricLabel(metric)}
            <button
              type="button"
              onClick={() => removeMetric(metric)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableMetrics
          .filter(metric => !selectedMetrics.includes(metric))
          .map((metric) => (
            <button
              key={metric}
              onClick={() => addMetric(metric)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              {formatMetricLabel(metric)}
            </button>
          ))}
      </div>
    </div>
  );
}