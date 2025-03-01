import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { taskApi, type AutomationTask } from '../../lib/task-api';

interface TaskDetailsProps {
  taskId: string;
}

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const [task, setTask] = useState<AutomationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskApi.getTaskDetails(taskId);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task details');
      console.error('Error loading task details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Start Time</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(task.startTime).toLocaleString()}
          </dd>
        </div>
        {task.endTime && (
          <div>
            <dt className="text-sm font-medium text-gray-500">End Time</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(task.endTime).toLocaleString()}
            </dd>
          </div>
        )}
        {task.errorMessage && (
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Error</dt>
            <dd className="mt-1 text-sm text-red-600">{task.errorMessage}</dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500">Request Details</dt>
          <dd className="mt-1 text-sm text-gray-900">
            <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md">
              {JSON.stringify(task.requestPayload, null, 2)}
            </pre>
          </dd>
        </div>
        {task.resultPayload && (
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Result Details</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded-md">
                {JSON.stringify(task.resultPayload, null, 2)}
              </pre>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}