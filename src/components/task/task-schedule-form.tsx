import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import type { TaskTemplate } from '../../lib/task-template-api';
import type { TaskSchedule, CreateTaskScheduleInput } from '../../lib/task-schedule-api';

interface TaskScheduleFormProps {
  schedule?: TaskSchedule;
  templates: TaskTemplate[];
  onSubmit: (data: CreateTaskScheduleInput) => Promise<void>;
  onCancel: () => void;
}

const COMMON_CRON_EXPRESSIONS = [
  { value: '0 0 * * *', label: 'Daily at midnight' },
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 17 * * *', label: 'Daily at 5 PM' },
  { value: '0 0 * * 1', label: 'Weekly on Monday at midnight' },
  { value: '0 0 1 * *', label: 'Monthly on the 1st at midnight' },
  { value: '0 0 1,15 * *', label: 'Twice a month (1st and 15th)' },
  { value: '0 0 1 1 *', label: 'Yearly on January 1st at midnight' }
];

export function TaskScheduleForm({ schedule, templates, onSubmit, onCancel }: TaskScheduleFormProps) {
  const [name, setName] = useState(schedule?.name || '');
  const [description, setDescription] = useState(schedule?.description || '');
  const [templateId, setTemplateId] = useState(schedule?.template.id || templates[0]?.id || '');
  const [cronExpression, setCronExpression] = useState(schedule?.cronExpression || '0 0 * * *');
  const [timezone, setTimezone] = useState(schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [configuration, setConfiguration] = useState<string>(
    schedule ? JSON.stringify(schedule.configuration, null, 2) : '{}'
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      let parsedConfig: Record<string, any>;
      try {
        parsedConfig = JSON.parse(configuration);
      } catch (err) {
        setError('Invalid JSON configuration');
        return;
      }

      await onSubmit({
        name,
        description,
        templateId,
        cronExpression,
        timezone,
        configuration: parsedConfig
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Schedule Name
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
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="template" className="block text-sm font-medium text-gray-700">
          Task Template
        </label>
        <select
          id="template"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cronExpression" className="block text-sm font-medium text-gray-700">
          Schedule (Cron Expression)
        </label>
        <div className="mt-1 space-y-2">
          <input
            type="text"
            id="cronExpression"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
          <select
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Common schedules...</option>
            {COMMON_CRON_EXPRESSIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          {Intl.supportedValuesOf('timeZone').map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="configuration" className="block text-sm font-medium text-gray-700">
          Configuration Override (JSON)
        </label>
        <textarea
          id="configuration"
          value={configuration}
          onChange={(e) => setConfiguration(e.target.value)}
          rows={10}
          className="mt-1 block w-full font-mono rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
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
          {loading ? 'Saving...' : (schedule ? 'Update Schedule' : 'Create Schedule')}
        </Button>
      </div>
    </form>
  );
}