import { useState } from 'react';
import { AlertTriangle, Plus, X, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import type { AdExtension } from '../../../lib/ad-group-api';

interface AdExtensionFormProps {
  extension?: AdExtension;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const EXTENSION_TYPES = [
  { value: 'SITELINK', label: 'Sitelink Extension' },
  { value: 'CALLOUT', label: 'Callout Extension' },
  { value: 'STRUCTURED_SNIPPET', label: 'Structured Snippet' },
  { value: 'CALL', label: 'Call Extension' },
  { value: 'PRICE', label: 'Price Extension' }
] as const;

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function AdExtensionForm({ extension, onSubmit, onCancel }: AdExtensionFormProps) {
  const [type, setType] = useState<AdExtension['type']>(extension?.type || 'SITELINK');
  const [text, setText] = useState(extension?.text || '');
  const [startDate, setStartDate] = useState(extension?.startDate || '');
  const [endDate, setEndDate] = useState(extension?.endDate || '');
  const [schedules, setSchedules] = useState<AdExtension['schedules']>(extension?.schedules || []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!text.trim()) {
        throw new Error('Extension text is required');
      }

      const data = {
        type,
        text: text.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        schedules: schedules.length > 0 ? schedules : undefined
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save extension');
      console.error('Error saving extension:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        dayOfWeek: 1,
        startHour: 9,
        startMinute: 0,
        endHour: 17,
        endMinute: 0
      }
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, updates: Partial<AdExtension['schedules'][0]>) => {
    setSchedules(schedules.map((schedule, i) =>
      i === index ? { ...schedule, ...updates } : schedule
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
          Extension Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AdExtension['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={!!extension} // Can't change type after creation
        >
          {EXTENSION_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Text
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date (Optional)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Schedules (Optional)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSchedule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        <div className="mt-2 space-y-4">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    Schedule {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Day of Week
                </label>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => updateSchedule(index, {
                    dayOfWeek: parseInt(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {DAYS_OF_WEEK.map((day, i) => (
                    <option key={day} value={i + 1}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={schedule.startHour}
                      onChange={(e) => updateSchedule(index, {
                        startHour: parseInt(e.target.value)
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <select
                      value={schedule.startMinute}
                      onChange={(e) => updateSchedule(index, {
                        startMinute: parseInt(e.target.value)
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {[0, 15, 30, 45].map((minute) => (
                        <option key={minute} value={minute}>
                          :{minute.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={schedule.endHour}
                      onChange={(e) => updateSchedule(index, {
                        endHour: parseInt(e.target.value)
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                    <select
                      value={schedule.endMinute}
                      onChange={(e) => updateSchedule(index, {
                        endMinute: parseInt(e.target.value)
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {[0, 15, 30, 45].map((minute) => (
                        <option key={minute} value={minute}>
                          :{minute.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          {loading ? 'Saving...' : (extension ? 'Update Extension' : 'Add Extension')}
        </Button>
      </div>
    </form>
  );
}