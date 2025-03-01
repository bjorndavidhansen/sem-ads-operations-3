import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { MetricSelector } from './metric-selector';
import { DimensionSelector } from './dimension-selector';
import { DateRangePicker } from './date-range-picker';
import { FilterBuilder } from './filter-builder';
import type { Report } from '../../lib/report-api';

interface ReportFormProps {
  report?: Report;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
] as const;

export function ReportForm({ report, onSubmit, onCancel }: ReportFormProps) {
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [metrics, setMetrics] = useState<string[]>(report?.metrics || []);
  const [dimensions, setDimensions] = useState<string[]>(report?.dimensions || []);
  const [dateRange, setDateRange] = useState(report?.dateRange || { start: '', end: '' });
  const [filters, setFilters] = useState(report?.filters || []);
  const [schedule, setSchedule] = useState(report?.schedule || null);
  const [showSchedule, setShowSchedule] = useState(!!report?.schedule);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!name.trim()) {
        throw new Error('Report name is required');
      }

      if (metrics.length === 0) {
        throw new Error('At least one metric is required');
      }

      if (dimensions.length === 0) {
        throw new Error('At least one dimension is required');
      }

      if (!dateRange.start || !dateRange.end) {
        throw new Error('Date range is required');
      }

      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        metrics,
        dimensions,
        filters,
        dateRange,
        schedule: showSchedule ? schedule : undefined
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
      console.error('Error saving report:', err);
    } finally {
      setLoading(false);
    }
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Report Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <MetricSelector
        selectedMetrics={metrics}
        onChange={setMetrics}
      />

      <DimensionSelector
        selectedDimensions={dimensions}
        onChange={setDimensions}
      />

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />

      <FilterBuilder
        filters={filters}
        onChange={setFilters}
        metrics={metrics}
        dimensions={dimensions}
      />

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Schedule (Optional)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSchedule(!showSchedule)}
          >
            {showSchedule ? 'Remove Schedule' : 'Add Schedule'}
          </Button>
        </div>

        {showSchedule && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <select
                  value={schedule?.frequency || 'daily'}
                  onChange={(e) => setSchedule({
                    ...schedule,
                    frequency: e.target.value as typeof FREQUENCIES[number]['value']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {FREQUENCIES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {schedule?.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Day of Week
                  </label>
                  <select
                    value={schedule.dayOfWeek || 1}
                    onChange={(e) => setSchedule({
                      ...schedule,
                      dayOfWeek: parseInt(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                      <option key={day} value={i + 1}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {schedule?.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Day of Month
                  </label>
                  <select
                    value={schedule.dayOfMonth || 1}
                    onChange={(e) => setSchedule({
                      ...schedule,
                      dayOfMonth: parseInt(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <input
                  type="time"
                  value={schedule?.time || '00:00'}
                  onChange={(e) => setSchedule({
                    ...schedule,
                    time: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  value={schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                  onChange={(e) => setSchedule({
                    ...schedule,
                    timezone: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Intl.supportedValuesOf('timeZone').map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipients
              </label>
              <div className="mt-2 space-y-2">
                {(schedule?.recipients || []).map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setSchedule({
                        ...schedule,
                        recipients: schedule.recipients.map((r, i) =>
                          i === index ? e.target.value : r
                        )
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setSchedule({
                        ...schedule,
                        recipients: schedule.recipients.filter((_, i) => i !== index)
                      })}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSchedule({
                    ...schedule,
                    recipients: [...(schedule?.recipients || []), '']
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
            </div>
          </div>
        )}
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
          {loading ? 'Saving...' : (report ? 'Update Report' : 'Create Report')}
        </Button>
      </div>
    </form>
  );
}