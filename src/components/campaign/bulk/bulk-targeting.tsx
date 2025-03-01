import { useState } from 'react';
import { AlertCircle, Plus, X, Globe, Users, Target } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkTargetingProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface TargetingOperation {
  type: 'LOCATION' | 'AUDIENCE' | 'DEVICE';
  action: 'ADD' | 'REMOVE' | 'ADJUST';
  target: {
    id?: string;
    name: string;
    type?: string;
    bidModifier?: number;
  };
}

export function BulkTargeting({ campaigns, onUpdate, onClose }: BulkTargetingProps) {
  const [operations, setOperations] = useState<TargetingOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'LOCATION' | 'AUDIENCE'>('LOCATION');

  const handleAddOperation = (type: TargetingOperation['type']) => {
    setOperations([
      ...operations,
      { type, action: 'ADD', target: { name: '' } }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<TargetingOperation>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, ...updates } : op
    ));
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call the Google Ads API
      // For now, we'll use mock data
      const results = searchType === 'LOCATION' ? [
        { id: '1', name: 'United States' },
        { id: '2', name: 'Canada' },
        { id: '3', name: 'United Kingdom' }
      ] : [
        { id: '1', name: 'In-market - Software', type: 'IN_MARKET' },
        { id: '2', name: 'Affinity - Technology', type: 'AFFINITY' },
        { id: '3', name: 'Custom - Website Visitors', type: 'CUSTOM' }
      ];

      setSearchResults(
        results.filter(r =>
          r.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        campaigns.map(async (campaign) => {
          const locationOperations = operations.filter(op => op.type === 'LOCATION');
          const audienceOperations = operations.filter(op => op.type === 'AUDIENCE');
          const deviceOperations = operations.filter(op => op.type === 'DEVICE');

          if (locationOperations.length > 0) {
            const currentLocations = campaign.locations || [];
            const newLocations = [...currentLocations];

            locationOperations.forEach(op => {
              if (op.action === 'ADD') {
                newLocations.push({
                  id: op.target.id!,
                  name: op.target.name,
                  targetingStatus: 'TARGETING',
                  bidModifier: op.target.bidModifier
                });
              } else if (op.action === 'REMOVE') {
                const index = newLocations.findIndex(l => l.id === op.target.id);
                if (index !== -1) {
                  newLocations.splice(index, 1);
                }
              } else if (op.action === 'ADJUST') {
                const location = newLocations.find(l => l.id === op.target.id);
                if (location) {
                  location.bidModifier = op.target.bidModifier;
                }
              }
            });

            await googleAdsApi.updateCampaign(campaign.id, {
              locations: newLocations
            });
          }

          if (audienceOperations.length > 0) {
            const currentAudiences = campaign.audiences || [];
            const newAudiences = [...currentAudiences];

            audienceOperations.forEach(op => {
              if (op.action === 'ADD') {
                newAudiences.push({
                  id: op.target.id!,
                  name: op.target.name,
                  type: op.target.type!,
                  bidModifier: op.target.bidModifier
                });
              } else if (op.action === 'REMOVE') {
                const index = newAudiences.findIndex(a => a.id === op.target.id);
                if (index !== -1) {
                  newAudiences.splice(index, 1);
                }
              } else if (op.action === 'ADJUST') {
                const audience = newAudiences.find(a => a.id === op.target.id);
                if (audience) {
                  audience.bidModifier = op.target.bidModifier;
                }
              }
            });

            await googleAdsApi.updateCampaign(campaign.id, {
              audiences: newAudiences
            });
          }

          if (deviceOperations.length > 0) {
            const currentDevices = campaign.deviceAdjustments || [];
            const newDevices = [...currentDevices];

            deviceOperations.forEach(op => {
              if (op.action === 'ADJUST') {
                const device = newDevices.find(d => d.deviceType === op.target.name);
                if (device) {
                  device.bidModifier = op.target.bidModifier!;
                } else {
                  newDevices.push({
                    deviceType: op.target.name,
                    bidModifier: op.target.bidModifier!
                  });
                }
              }
            });

            await googleAdsApi.updateCampaign(campaign.id, {
              deviceAdjustments: newDevices
            });
          }
        })
      );

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update targeting');
      console.error('Error updating targeting:', err);
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
          onClick={() => handleAddOperation('LOCATION')}
        >
          <Globe className="h-4 w-4 mr-2" />
          Add Location
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('AUDIENCE')}
        >
          <Users className="h-4 w-4 mr-2" />
          Add Audience
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddOperation('DEVICE')}
        >
          <Target className="h-4 w-4 mr-2" />
          Device Adjustment
        </Button>
      </div>

      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={operation.type}
                  onChange={(e) => handleUpdateOperation(index, {
                    type: e.target.value as TargetingOperation['type']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="LOCATION">Location</option>
                  <option value="AUDIENCE">Audience</option>
                  <option value="DEVICE">Device</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <select
                  value={operation.action}
                  onChange={(e) => handleUpdateOperation(index, {
                    action: e.target.value as TargetingOperation['action']
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
                  {operation.type === 'DEVICE' ? 'Device' : 'Target'}
                </label>
                {operation.type === 'DEVICE' ? (
                  <select
                    value={operation.target.name}
                    onChange={(e) => handleUpdateOperation(index, {
                      target: { ...operation.target, name: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="MOBILE">Mobile</option>
                    <option value="DESKTOP">Desktop</option>
                    <option value="TABLET">Tablet</option>
                  </select>
                ) : (
                  <div className="mt-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={`Search ${operation.type.toLowerCase()}s...`}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                        <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {searchResults.map((result) => (
                            <li
                              key={result.id}
                              className="relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                              onClick={() => {
                                handleUpdateOperation(index, {
                                  target: {
                                    id: result.id,
                                    name: result.name,
                                    type: result.type
                                  }
                                });
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                            >
                              <div className="flex items-center">
                                <span className="block truncate">{result.name}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {operation.action === 'ADJUST' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bid Adjustment
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      value={operation.target.bidModifier || 0}
                      onChange={(e) => handleUpdateOperation(index, {
                        target: {
                          ...operation.target,
                          bidModifier: parseFloat(e.target.value)
                        }
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
            <Target className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No targeting operations added. Click one of the buttons above to get started.
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
                      op.action === 'ADD'
                        ? 'bg-green-100 text-green-800'
                        : op.action === 'REMOVE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {op.action === 'ADD' ? '+' :
                     op.action === 'REMOVE' ? '-' : '±'} {op.target.name}
                    {op.action === 'ADJUST' && ` (${op.target.bidModifier}%)`}
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
          {loading ? 'Updating...' : 'Update Targeting'}
        </Button>
      </div>
    </form>
  );
}