import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { alertApi, type CreateAlertInput, type AlertThreshold } from '../../../lib/alert-api';

interface AlertFormProps {
  campaignId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const METRICS = [
  { value: 'CPC', label: 'Cost per Click' },
  { value: 'CTR', label: 'Click-through Rate' },
  { value: 'CONVERSION_RATE', label: 'Conversion Rate' },
  { value: 'COST', label: 'Total Cost' },
  { value: 'BUDGET_UTILIZATION', label: 'Budget Utilization' }
] as const;

const TIMEFRAMES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
] as const;

export function AlertForm({ campaignId, onSubmit, onCancel }: AlertFormProps) {
  const [type, setType] = useState<CreateAlertInput['type']>('PERFORMANCE');
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([{
    metric: 'CPC',
    condition: 'ABOVE',
    value: 0,
    timeframe: 'DAILY'
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await alertApi.createAlert({
        campaignId,
        type,
        thresholds
      });

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
      console.error('Error creating alert:', err);
    } finally {
      setLoading(false);
    }
  };

  const addThreshold = () => {
    setThresholds([
      ...thresholds,
      {
        metric: 'CPC',
        condition: 'ABOVE',
        value: 0,
        timeframe: 'DAILY'
      }
    ]);
  };

  const removeThreshold = (index: number) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };

  const updateThreshold = (index: number, updates: Partial<AlertThreshold>) => {
    setThresholds(thresholds.map((threshold, i) =>
      i === index ? { ...threshold, ...updates } : threshold
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Alert Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CreateAlertInput['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="PERFORMANCE">Performance</option>
          <option value="BUDGET">Budget</option>
          <option value="CONVERSION">Conversion</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Thresholds</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addThreshold}
          >
            Add Threshold
          </Button>
        </div>

        {thresholds.map((threshold, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Metric
                </label>
                <select
                  value={threshold.metric}
                  onChange={(e) => updateThreshold(index, {
                    metric: e.target.value as AlertThreshold['metric']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {METRICS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  value={threshold.condition}
                  onChange={(e) => updateThreshold(index, {
                    condition: e.target.value as AlertThreshold['condition']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ABOVE">Above</option>
                  <option value="BELOW">Below</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  value={threshold.value}
                  onChange={(e) => updateThreshold(index, {
                    value: parseFloat(e.target.value)
                  })}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeframe
                </label>
                <select
                  value={threshold.timeframe}
                  onChange={(e) => updateThreshold(index, {
                    timeframe: e.target.value as AlertThreshold['timeframe']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {TIMEFRAMES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {thresholds.length > 1 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeThreshold(index)}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Alert'}
        </Button>
      </div>
    </form>
  );
}