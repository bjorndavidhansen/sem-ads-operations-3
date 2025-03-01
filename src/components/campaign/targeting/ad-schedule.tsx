import { useState } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';

interface AdScheduleEntry {
  id: string;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  bidModifier?: number;
}

interface AdScheduleProps {
  schedule: AdScheduleEntry[];
  onChange: (schedule: AdScheduleEntry[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function AdSchedule({ schedule, onChange, disabled }: AdScheduleProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const addScheduleEntry = (entry: Omit<AdScheduleEntry, 'id'>) => {
    onChange([
      ...schedule,
      {
        ...entry,
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
    setShowAddForm(false);
  };

  const removeScheduleEntry = (id: string) => {
    onChange(schedule.filter((entry) => entry.id !== id));
  };

  const updateBidModifier = (id: string, bidModifier: number) => {
    onChange(
      schedule.map((entry) =>
        entry.id === id ? { ...entry, bidModifier } : entry
      )
    );
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Ad Schedule</h3>
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {showAddForm && (
        <AddScheduleForm
          onSubmit={addScheduleEntry}
          onCancel={() => setShowAddForm(false)}
          disabled={disabled}
        />
      )}

      <div className="space-y-2">
        {schedule.length > 0 ? (
          schedule.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-4">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {DAYS_OF_WEEK[entry.dayOfWeek]}
                </span>
                <span className="text-sm text-gray-600">
                  {formatTime(entry.startHour, entry.startMinute)} -{' '}
                  {formatTime(entry.endHour, entry.endMinute)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Bid adjustment:</label>
                  <input
                    type="number"
                    value={entry.bidModifier || 0}
                    onChange={(e) =>
                      updateBidModifier(entry.id, Number(e.target.value))
                    }
                    min="-90"
                    max="900"
                    step="1"
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <button
                  onClick={() => removeScheduleEntry(entry.id)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No schedules added. Click "Add Schedule" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function AddScheduleForm({
  onSubmit,
  onCancel,
  disabled,
}: {
  onSubmit: (entry: Omit<AdScheduleEntry, 'id'>) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(17);
  const [endMinute, setEndMinute] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      dayOfWeek,
      startHour,
      startMinute,
      endHour,
      endMinute,
      bidModifier: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Day</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={disabled}
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
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
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                {[0, 15, 30, 45].map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
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
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={endMinute}
                onChange={(e) => setEndMinute(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                {[0, 15, 30, 45].map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={disabled}>
          Add Schedule
        </Button>
      </div>
    </form>
  );
}