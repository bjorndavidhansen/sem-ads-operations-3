import { useState } from 'react';
import { Settings, Plus, X, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '../../ui/button';

interface NamingSegment {
  id: string;
  type: 'abbreviation' | 'text';
  value: string;
  abbreviation?: string;
}

interface NamingConventionProps {
  segments: NamingSegment[];
  onChange: (segments: NamingSegment[]) => void;
  delimiter: string;
  onDelimiterChange: (delimiter: string) => void;
  minSegments: number;
  onMinSegmentsChange: (count: number) => void;
  caseFormat: 'upper' | 'lower' | 'sentence';
  onCaseFormatChange: (format: 'upper' | 'lower' | 'sentence') => void;
  disabled?: boolean;
}

export function NamingConvention({
  segments,
  onChange,
  delimiter,
  onDelimiterChange,
  minSegments,
  onMinSegmentsChange,
  caseFormat,
  onCaseFormatChange,
  disabled
}: NamingConventionProps) {
  const [showSettings, setShowSettings] = useState(false);

  const addSegment = () => {
    onChange([
      ...segments,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        value: ''
      }
    ]);
  };

  const removeSegment = (id: string) => {
    onChange(segments.filter(seg => seg.id !== id));
  };

  const updateSegment = (id: string, updates: Partial<NamingSegment>) => {
    onChange(
      segments.map(seg =>
        seg.id === id ? { ...seg, ...updates } : seg
      )
    );
  };

  const moveSegment = (id: string, direction: 'up' | 'down') => {
    const index = segments.findIndex(seg => seg.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === segments.length - 1)
    ) {
      return;
    }

    const newSegments = [...segments];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
    onChange(newSegments);
  };

  const formatSegmentValue = (value: string): string => {
    switch (caseFormat) {
      case 'upper':
        return value.toUpperCase();
      case 'lower':
        return value.toLowerCase();
      case 'sentence':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      default:
        return value;
    }
  };

  const previewName = () => {
    const formattedSegments = segments.map(seg => {
      if (seg.type === 'abbreviation' && seg.abbreviation) {
        return formatSegmentValue(seg.abbreviation);
      }
      return formatSegmentValue(seg.value || 'na');
    });

    // Fill with 'na' if we don't have enough segments
    while (formattedSegments.length < minSegments) {
      formattedSegments.push(formatSegmentValue('na'));
    }

    return formattedSegments.join(delimiter);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">Naming Convention</h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md ${
              showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <Button
          size="sm"
          onClick={addSegment}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Segment
        </Button>
      </div>

      {showSettings && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delimiter
              </label>
              <select
                value={delimiter}
                onChange={(e) => onDelimiterChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                <option value="_">Underscore (_)</option>
                <option value="-">Hyphen (-)</option>
                <option value=".">Period (.)</option>
                <option value="|">Vertical Bar (|)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Case Format
              </label>
              <select
                value={caseFormat}
                onChange={(e) => onCaseFormatChange(e.target.value as 'upper' | 'lower' | 'sentence')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={disabled}
              >
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="sentence">Sentence case</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Segments
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={minSegments}
              onChange={(e) => onMinSegmentsChange(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={disabled}
            />
            <p className="mt-1 text-sm text-gray-500">
              If fewer segments are defined, "na" will be used to fill the remaining slots
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={segment.type}
                  onChange={(e) => updateSegment(segment.id, {
                    type: e.target.value as 'abbreviation' | 'text'
                  })}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={disabled}
                >
                  <option value="text">Text</option>
                  <option value="abbreviation">Abbreviation</option>
                </select>

                <input
                  type="text"
                  value={segment.value}
                  onChange={(e) => updateSegment(segment.id, { value: e.target.value })}
                  placeholder={segment.type === 'abbreviation' ? 'Full text' : 'Segment text'}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={disabled}
                />
              </div>

              {segment.type === 'abbreviation' && (
                <div className="flex items-center gap-4">
                  <div className="w-40" />
                  <input
                    type="text"
                    value={segment.abbreviation || ''}
                    onChange={(e) => updateSegment(segment.id, { abbreviation: e.target.value })}
                    placeholder="Abbreviation"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={disabled}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveSegment(segment.id, 'up')}
                disabled={disabled || index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveSegment(segment.id, 'down')}
                disabled={disabled || index === segments.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => removeSegment(segment.id)}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {segments.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              No segments added. Click "Add Segment" to start building your naming convention.
            </p>
          </div>
        )}
      </div>

      {segments.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <p className="font-mono text-sm">{previewName()}</p>
        </div>
      )}
    </div>
  );
}