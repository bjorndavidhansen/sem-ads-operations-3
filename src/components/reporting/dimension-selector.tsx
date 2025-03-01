import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { reportApi } from '../../lib/report-api';

interface DimensionSelectorProps {
  selectedDimensions: string[];
  onChange: (dimensions: string[]) => void;
}

export function DimensionSelector({ selectedDimensions, onChange }: DimensionSelectorProps) {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);
      const dimensions = await reportApi.getAvailableDimensions();
      setAvailableDimensions(dimensions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dimensions');
      console.error('Error loading dimensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDimension = (dimension: string) => {
    if (!selectedDimensions.includes(dimension)) {
      onChange([...selectedDimensions, dimension]);
    }
  };

  const removeDimension = (dimension: string) => {
    onChange(selectedDimensions.filter(d => d !== dimension));
  };

  const formatDimensionLabel = (dimension: string) => {
    return dimension
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dimensions
        </label>
        {error && (
          <div className="mt-1 text-sm text-red-600">
            <AlertTriangle className="inline-block h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedDimensions.map((dimension) => (
          <span
            key={dimension}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
          >
            {formatDimensionLabel(dimension)}
            <button
              type="button"
              onClick={() => removeDimension(dimension)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableDimensions
          .filter(dimension => !selectedDimensions.includes(dimension))
          .map((dimension) => (
            <button
              key={dimension}
              onClick={() => addDimension(dimension)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              {formatDimensionLabel(dimension)}
            </button>
          ))}
      </div>
    </div>
  );
}