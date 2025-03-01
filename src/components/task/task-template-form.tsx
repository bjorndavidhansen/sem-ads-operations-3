import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import type { TaskTemplate, CreateTaskTemplateInput } from '../../lib/task-template-api';

interface TaskTemplateFormProps {
  template?: TaskTemplate;
  onSubmit: (data: CreateTaskTemplateInput) => Promise<void>;
  onCancel: () => void;
}

const TASK_TYPES = [
  { value: 'COPY_CAMPAIGN', label: 'Copy Campaign' },
  { value: 'CONVERT_MATCH_TYPES', label: 'Match Type Conversion' },
  { value: 'CREATE_BSP', label: 'Create Bidding Strategy' }
] as const;

export function TaskTemplateForm({ template, onSubmit, onCancel }: TaskTemplateFormProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [type, setType] = useState<TaskTemplate['type']>(template?.type || 'COPY_CAMPAIGN');
  const [configuration, setConfiguration] = useState<string>(
    template ? JSON.stringify(template.configuration, null, 2) : '{}'
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
        type,
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
          Template Name
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
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Task Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as TaskTemplate['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {TASK_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="configuration" className="block text-sm font-medium text-gray-700">
          Configuration (JSON)
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
          {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
        </Button>
      </div>
    </form>
  );
}