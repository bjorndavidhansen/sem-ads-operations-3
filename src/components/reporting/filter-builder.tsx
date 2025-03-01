import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import type { ReportFilter } from '../../lib/report-api';

interface FilterBuilderProps {
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
  metrics: string[];
  dimensions: string[];
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'between', label: 'Between' }
] as const;

export function FilterBuilder({ filters, onChange, metrics, dimensions }: FilterBuilderProps) {
  const addFilter = () => {
    onChange([
      ...filters,
      {
        dimension: dimensions[0] || '',
        operator: 'equals',
        value: ''
      }
    ]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    onChange(filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const formatFieldLabel = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Filters
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFilter}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      <div className="space-y-2">
        {filters.map((filter, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <select
              value={filter.dimension}
              onChange={(e) => updateFilter(index, { dimension: e.target.value })}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {[...dimensions, ...metrics].map((field) => (
                <option key={field} value={field}>
                  {formatFieldLabel(field)}
                </option>
              ))}
            </select>

            <select
              value={filter.operator}
              onChange={(e) => updateFilter(index, {
                operator: e.target.value as ReportFilter['operator']
              })}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {OPERATORS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {filter.operator === 'between' ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={Array.isArray(filter.value) ? filter.value[0] : ''}
                  onChange={(e) => updateFilter(index, {
                    value: [e.target.value, Array.isArray(filter.value) ? filter.value[1] : '']
                  })}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Min value"
                />
                <span className="text-gray-500">and</span>
                <input
                  type="text"
                  value={Array.isArray(filter.value) ? filter.value[1] : ''}
                  onChange={(e) => updateFilter(index, {
                    value: [Array.isArray(filter.value) ? filter.value[0] : '', e.target.value]
                  })}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Max value"
                />
              </div>
            ) : (
              <input
                type="text"
                value={filter.value as string}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
                className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter value"
              />
            )}

            <button
              type="button"
              onClick={() => removeFilter(index)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {filters.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              No filters added. Click "Add Filter" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}