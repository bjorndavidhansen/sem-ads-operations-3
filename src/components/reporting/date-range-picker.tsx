import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

interface DateRangePickerProps {
  value: {
    start: string;
    end: string;
  };
  onChange: (range: { start: string; end: string }) => void;
}

const PRESETS = [
  { label: 'Today', getValue: () => {
    const now = new Date();
    return { start: now.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Yesterday', getValue: () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] };
  }},
  { label: 'Last 7 days', getValue: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Last 30 days', getValue: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'This month', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Last month', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }},
  { label: 'This quarter', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Last quarter', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
    const end = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }},
  { label: 'This year', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }},
  { label: 'Last year', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }}
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onChange(preset.getValue());
    setShowPresets(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date Range
        </label>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPresets(!showPresets)}
            className="w-48"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Select Range
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>

          {showPresets && (
            <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            min={value.start}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}