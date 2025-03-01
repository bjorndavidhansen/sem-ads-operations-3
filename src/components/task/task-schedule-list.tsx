import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { TaskScheduleForm } from './task-schedule-form';
import { taskScheduleApi, type TaskSchedule } from '../../lib/task-schedule-api';
import { taskTemplateApi, type TaskTemplate } from '../../lib/task-template-api';

export function TaskScheduleList() {
  const [schedules, setSchedules] = useState<TaskSchedule[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TaskSchedule | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schedulesData, templatesData] = await Promise.all([
        taskScheduleApi.listSchedules(),
        taskTemplateApi.listTemplates()
      ]);
      setSchedules(schedulesData);
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (input: any) => {
    try {
      setError(null);
      const newSchedule = await taskScheduleApi.createSchedule(input);
      setSchedules([newSchedule, ...schedules]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
      console.error('Error creating schedule:', err);
    }
  };

  const handleUpdate = async (input: any) => {
    if (!editingSchedule) return;

    try {
      setError(null);
      const updatedSchedule = await taskScheduleApi.updateSchedule(editingSchedule.id, input);
      setSchedules(schedules.map(s => 
        s.id === updatedSchedule.id ? updatedSchedule : s
      ));
      setEditingSchedule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      console.error('Error updating schedule:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await taskScheduleApi.deleteSchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
      console.error('Error deleting schedule:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (schedule: TaskSchedule) => {
    try {
      setToggling(schedule.id);
      setError(null);
      const updatedSchedule = await taskScheduleApi.updateSchedule(schedule.id, {
        isActive: !schedule.isActive
      });
      setSchedules(schedules.map(s => 
        s.id === updatedSchedule.id ? updatedSchedule : s
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
      console.error('Error toggling schedule:', err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Task Schedules</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm || templates.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

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

      {templates.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to create at least one task template before you can create a schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <TaskScheduleForm
            templates={templates}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-4 rounded-lg border border-gray-200 bg-white"
          >
            {editingSchedule?.id === schedule.id ? (
              <TaskScheduleForm
                schedule={schedule}
                templates={templates}
                onSubmit={handleUpdate}
                onCancel={() => setEditingSchedule(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{schedule.name}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      schedule.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {schedule.description && (
                    <p className="mt-1 text-sm text-gray-500">{schedule.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>Template: {schedule.template.name}</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {schedule.cronExpression}
                    </span>
                    <span>({schedule.timezone})</span>
                  </div>
                  {schedule.lastRun && (
                    <p className="mt-1 text-xs text-gray-500">
                      Last run: {new Date(schedule.lastRun).toLocaleString()}
                    </p>
                  )}
                  {schedule.nextRun && (
                    <p className="mt-1 text-xs text-gray-500">
                      Next run: {new Date(schedule.nextRun).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(schedule)}
                    disabled={toggling === schedule.id}
                    className={`p-1 ${
                      schedule.isActive
                        ? 'text-green-600 hover:text-green-800'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Power className={`h-4 w-4 ${toggling === schedule.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setEditingSchedule(schedule)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleting === schedule.id}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className={`h-4 w-4 ${deleting === schedule.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {schedules.length === 0 && !showCreateForm && templates.length > 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Clock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No schedules created. Click "Create Schedule" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}