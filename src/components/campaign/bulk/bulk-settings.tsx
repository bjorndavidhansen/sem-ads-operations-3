import { useState } from 'react';
import { AlertCircle, Plus, X, Settings, Calendar, Tag } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkSettingsProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface SettingsOperation {
  type: 'NAME' | 'STATUS' | 'DATES' | 'LABELS';
  value: {
    prefix?: string;
    suffix?: string;
    status?: 'ENABLED' | 'PAUSED';
    startDate?: string;
    endDate?: string;
    labels?: {
      add?: string[];
      remove?: string[];
    };
  };
}

export function BulkSettings({ campaigns, onUpdate, onClose }: BulkSettingsProps) {
  const [operations, setOperations] = useState<SettingsOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOperation = (type: SettingsOperation['type']) => {
    setOperations([
      ...operations,
      { type, value: {} }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<SettingsOperation['value']>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, value: { ...op.value, ...updates } } : op
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        campaigns.map(async (campaign) => {
          const updates: any = {};

          operations.forEach(op => {
            switch (op.type) {
              case 'NAME':
                if (op.value.prefix || op.value.suffix) {
                  updates.name = `${op.value.prefix || ''}${campaign.name}${op.value.suffix || ''}`;
                }
                break;

              case 'STATUS':
                if (op.value.status) {
                  updates.status = op.value.status;
                }
                break;

              case 'DATES':
                if (op.value.startDate) {
                  updates.startDate = op.value.startDate;
                }
                if (op.value.endDate) {
                  updates.endDate = op.value.endDate;
                }
                break;

              case 'LABELS':
                const currentLabels = new Set(campaign.labels || []);
                if (op.value.labels?.add) {
                  op.value.labels.add.forEach(label => currentLabels.add(label));
                }
                if (op.value.labels?.remove) {
                  op.value.labels.remove.forEach(label => currentLabels.delete(label));
                }
                updates.labels = Array.from(currentLabels);
                break;
            }
          });

          if (Object.keys(updates).length > 0) {
            await googleAdsApi.updateCampaign(campaign.id, updates);
          }
        })
      );

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      console.error('Error updating settings:', err);
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

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('NAME')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Modify Names
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('STATUS')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Change Status
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('DATES')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Update Dates
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('LABELS')}
        >
          <Tag className="h-4 w-4 mr-2" />
          Manage Labels
        </Button>
      </div>

      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 space-y-4">
              {operation.type === 'NAME' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={operation.value.prefix || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        prefix: e.target.value
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Add prefix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Suffix
                    </label>
                    <input
                      type="text"
                      value={operation.value.suffix || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        suffix: e.target.value
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Add suffix"
                    />
                  </div>
                </div>
              )}

              {operation.type === 'STATUS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Status
                  </label>
                  <select
                    value={operation.value.status || ''}
                    onChange={(e) => handleUpdateOperation(index, {
                      status: e.target.value as 'ENABLED' | 'PAUSED'
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select status...</option>
                    <option value="ENABLED">Enabled</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </div>
              )}

              {operation.type === 'DATES' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={operation.value.startDate || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        startDate: e.target.value
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={operation.value.endDate || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        endDate: e.target.value
                      })}
                      min={operation.value.startDate}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {operation.type === 'LABELS' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Add Labels
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {operation.value.labels?.add?.map((label, labelIndex) => (
                        <span
                          key={labelIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => {
                              const newLabels = operation.value.labels?.add?.filter((_, i) => i !== labelIndex);
                              handleUpdateOperation(index, {
                                labels: {
                                  ...operation.value.labels,
                                  add: newLabels
                                }
                              });
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const label = prompt('Enter label to add:');
                          if (label) {
                            handleUpdateOperation(index, {
                              labels: {
                                ...operation.value.labels,
                                add: [...(operation.value.labels?.add || []), label]
                              }
                            });
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Label
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Remove Labels
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {operation.value.labels?.remove?.map((label, labelIndex) => (
                        <span
                          key={labelIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => {
                              const newLabels = operation.value.labels?.remove?.filter((_, i) => i !== labelIndex);
                              handleUpdateOperation(index, {
                                labels: {
                                  ...operation.value.labels,
                                  remove: newLabels
                                }
                              });
                            }}
                            className="ml-1 text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const label = prompt('Enter label to remove:');
                          if (label) {
                            handleUpdateOperation(index, {
                              labels: {
                                ...operation.value.labels,
                                remove: [...(operation.value.labels?.remove || []), label]
                              }
                            });
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Remove Label
                      </button>
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
            <Settings className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No settings operations added. Click one of the buttons above to get started.
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
                {operations.map((op, i) => {
                  let preview = '';
                  switch (op.type) {
                    case 'NAME':
                      preview = `${op.value.prefix || ''}[name]${op.value.suffix || ''}`;
                      break;
                    case 'STATUS':
                      preview = op.value.status || '';
                      break;
                    case 'DATES':
                      preview = [
                        op.value.startDate && `Start: ${op.value.startDate}`,
                        op.value.endDate && `End: ${op.value.endDate}`
                      ].filter(Boolean).join(', ');
                      break;
                    case 'LABELS':
                      preview = [
                        op.value.labels?.add?.length && `+${op.value.labels.add.length} labels`,
                        op.value.labels?.remove?.length && `-${op.value.labels.remove.length} labels`
                      ].filter(Boolean).join(', ');
                      break;
                  }

                  return preview ? (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {preview}
                    </span>
                  ) : null;
                })}
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
          {loading ? 'Updating...' : 'Update Settings'}
        </Button>
      </div>
    </form>
  );
}