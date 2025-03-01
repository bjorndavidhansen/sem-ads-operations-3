import { useState } from 'react';
import { AlertCircle, Plus, X, Tag } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkLabelsProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface LabelOperation {
  type: 'ADD' | 'REMOVE';
  label: string;
}

export function BulkLabels({ campaigns, onUpdate, onClose }: BulkLabelsProps) {
  const [operations, setOperations] = useState<LabelOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOperation = () => {
    setOperations([...operations, { type: 'ADD', label: '' }]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<LabelOperation>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, ...updates } : op
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        campaigns.map(async (campaign) => {
          const currentLabels = new Set(campaign.labels || []);

          // Process add operations first
          const labelsToAdd = operations
            .filter(op => op.type === 'ADD')
            .map(op => op.label);

          // Then process remove operations
          const labelsToRemove = operations
            .filter(op => op.type === 'REMOVE')
            .map(op => op.label);

          const newLabels = [
            ...Array.from(currentLabels).filter(label => !labelsToRemove.includes(label)),
            ...labelsToAdd
          ];

          await googleAdsApi.updateCampaign(campaign.id, {
            labels: newLabels
          });
        })
      );

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update labels');
      console.error('Error updating labels:', err);
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
          Add Label Operation
        </Button>
      </div>

      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <select
              value={operation.type}
              onChange={(e) => handleUpdateOperation(index, {
                type: e.target.value as LabelOperation['type']
              })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="ADD">Add Label</option>
              <option value="REMOVE">Remove Label</option>
            </select>

            <div className="flex-1">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={operation.label}
                  onChange={(e) => handleUpdateOperation(index, {
                    label: e.target.value
                  })}
                  className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter label"
                  required
                />
              </div>
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
            <Tag className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No label operations added. Click "Add Label Operation" to get started.
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
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {op.type === 'ADD' ? '+' : '-'} {op.label}
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
          {loading ? 'Updating...' : 'Update Labels'}
        </Button>
      </div>
    </form>
  );
}