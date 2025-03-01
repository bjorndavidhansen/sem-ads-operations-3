import { useState } from 'react';
import { AlertCircle, Plus, X, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkScheduleProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface ScheduleOperation {
  type: 'ADD' | 'REMOVE' | 'ADJUST';
  schedule: {
    dayOfWeek: number;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    bidModifier?: number;
  };
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function BulkSchedule({ campaigns, onUpdate, onClose }: BulkScheduleProps) {
  const [operations, setOperations] = useState<ScheduleOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOperation = () => {
    setOperations([
      ...operations,
      {
        type: 'ADD',
        schedule: {
          dayOfWeek: 1,
          startHour: 9,
          startMinute: 0,
          endHour: 17,
          endMinute: 0,
          bidModifier: 0
        }
      }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<ScheduleOperation>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, ...updates } : op
    ));
  };

  const handleUpdateSchedule = (index: number, updates: Partial<ScheduleOperation['schedule']>) => {
    const operation = operations[index];
    handleUpdateOperation(index, {
      schedule: { ...operation.schedule, ...updates }
    });
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        campaigns.map(async (campaign) => {
          const currentSchedule = campaign.schedule || [];
          const newSchedule = [...currentSchedule];

          operations.forEach(op => {
            if (op.type === 'ADD') {
              newSchedule.push(op.schedule);
            } else if (op.type === 'REMOVE') {
              // Remove schedules that match the operation's schedule
              const index = newSchedule.findIndex(s =>
                s.dayOfWeek === op.schedule.dayOfWeek &&
                s.startHour === op.schedule.startHour &&
                s.startMinute === op.schedule.startMinute &&
                s.endHour === op.schedule.endHour &&
                s.endMinute === op.schedule.endMinute
              );
              if (index !== -1) {
                newSchedule.splice(index, 1);
              }
            } else if (op.type === 'ADJUST') {
              // Update bid modifier for matching schedules
              const schedule = newSchedule.find(s =>
                s.dayOfWeek === op.schedule.dayOfWeek &&
                s.startHour === op.schedule.startHour &&
                s.startMinute === op.schedule.startMinute &&
                s.endHour === op.schedule.endHour &&
                s.endMinute === op.schedule.endMinute
              );
              if (schedule) {
                schedule.bidModifier = op.schedule.bidModifier;
              }
            }
          });

          await googleAdsApi.updateCampaign(campaign.id, {
            schedule: newSchedule
          });
        })
      );

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedules');
      console.error('Error updating schedules:', err);
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
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOperation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Operation
                </label>
                <select
                  value={operation.type}
                  onChange={(e) => handleUpdateOperation(index, {
                    type: e.target.value as ScheduleOperation['type']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ADD">Add</option>
                  <option value="REMOVE">Remove</option>
                  <option value="ADJUST">Adjust Bid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Day of Week
                </label>
                <select
                  value={operation.schedule.dayOfWeek}
                  onChange={(e) => handleUpdateSchedule(index, {
                    dayOfWeek: parseInt(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {DAYS_OF_WEEK.map((day, i) => (
                    <option key={day} value={i + 1}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={operation.schedule.startHour}
                    onChange={(e) => handleUpdateSchedule(index, {
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
                    value={operation.schedule.startMinute}
                    onChange={(e) => handleUpdateSchedule(index, {
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
                    value={operation.schedule.endHour}
                    onChange={(e) => handleUpdateSchedule(index, {
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
                    value={operation.schedule.endMinute}
                    onChange={(e) => handleUpdateSchedule(index, {
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

              {operation.type !== 'REMOVE' && (
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Bid Adjustment
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      value={operation.schedule.bidModifier || 0}
                      onChange={(e) => handleUpdateSchedule(index, {
                        bidModifier: parseFloat(e.target.value)
                      })}
                      step="1"
                      min="-90"
                      max="900"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRemoveOperation(index)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {operations.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Clock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No schedule operations added. Click "Add Schedule" to get started.
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900">Preview Changes</h4>
        <div className="mt-2 space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{campaign.name}</span>
              <div className="flex items-center gap-2">
                {operations.map((op, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      op.type === 'ADD'
                        ? 'bg-green-100 text-green-800'
                        : op.type === 'REMOVE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {op.type === 'ADD' ? '+' :
                     op.type === 'REMOVE' ? '-' : '±'} {DAYS_OF_WEEK[op.schedule.dayOfWeek - 1]}{' '}
                    {formatTime(op.schedule.startHour, op.schedule.startMinute)} -{' '}
                    {formatTime(op.schedule.endHour, op.schedule.endMinute)}
                    {op.type !== 'REMOVE' && op.schedule.bidModifier !== undefined && (
                      ` (${op.schedule.bidModifier}%)`
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || operations.length === 0}
        >
          {loading ? 'Updating...' : 'Update Schedules'}
        </Button>
      </div>
    </form>
  );
}