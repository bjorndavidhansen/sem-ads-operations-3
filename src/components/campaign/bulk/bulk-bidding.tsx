import { useState } from 'react';
import { AlertCircle, DollarSign, Plus, X, Target } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import { biddingStrategyApi } from '../../../lib/bidding-strategy-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkBiddingProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface BiddingAdjustment {
  type: 'STRATEGY' | 'TARGET_CPA' | 'TARGET_ROAS' | 'MANUAL_CPC';
  value: number;
  strategyId?: string;
}

export function BulkBidding({ campaigns, onUpdate, onClose }: BulkBiddingProps) {
  const [adjustment, setAdjustment] = useState<BiddingAdjustment>({
    type: 'MANUAL_CPC',
    value: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      switch (adjustment.type) {
        case 'STRATEGY':
          if (!adjustment.strategyId && !newStrategyName) {
            throw new Error('No bidding strategy selected or created');
          }

          let strategyId = adjustment.strategyId;

          if (!strategyId && newStrategyName) {
            // Create new bidding strategy
            const newStrategy = await biddingStrategyApi.createBiddingStrategy(
              campaigns[0].accountId,
              {
                name: newStrategyName,
                type: 'TARGET_CPA',
                targetCpa: adjustment.value,
                campaignIds: campaigns.map(c => c.id)
              }
            );
            strategyId = newStrategy.id;
          }

          // Update all campaigns to use the bidding strategy
          await Promise.all(
            campaigns.map(campaign =>
              googleAdsApi.updateCampaign(campaign.id, {
                biddingStrategyId: strategyId
              })
            )
          );
          break;

        case 'TARGET_CPA':
          await Promise.all(
            campaigns.map(campaign =>
              googleAdsApi.updateCampaign(campaign.id, {
                targetCpa: adjustment.value
              })
            )
          );
          break;

        case 'TARGET_ROAS':
          await Promise.all(
            campaigns.map(campaign =>
              googleAdsApi.updateCampaign(campaign.id, {
                targetRoas: adjustment.value
              })
            )
          );
          break;

        case 'MANUAL_CPC':
          // Update CPC bids for all keywords in all campaigns
          await Promise.all(
            campaigns.map(async (campaign) => {
              const adGroups = await googleAdsApi.listAdGroups(campaign.id);
              
              await Promise.all(
                adGroups.map(async (adGroup) => {
                  const keywords = await googleAdsApi.listKeywords(adGroup.id);
                  
                  await Promise.all(
                    keywords.map(keyword =>
                      googleAdsApi.updateKeyword(keyword.id, {
                        cpcBidMicros: (adjustment.value * 1_000_000).toString()
                      })
                    )
                  );
                })
              );
            })
          );
          break;
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bidding settings');
      console.error('Error updating bidding settings:', err);
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
        <label className="block text-sm font-medium text-gray-700">
          Bidding Type
        </label>
        <select
          value={adjustment.type}
          onChange={(e) => setAdjustment({
            ...adjustment,
            type: e.target.value as BiddingAdjustment['type']
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="MANUAL_CPC">Manual CPC</option>
          <option value="TARGET_CPA">Target CPA</option>
          <option value="TARGET_ROAS">Target ROAS</option>
          <option value="STRATEGY">Use Bidding Strategy</option>
        </select>
      </div>

      {adjustment.type === 'STRATEGY' ? (
        <div className="space-y-4">
          {showStrategyForm ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Strategy Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter strategy name"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Target CPA
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={adjustment.value}
                    onChange={(e) => setAdjustment({
                      ...adjustment,
                      value: parseFloat(e.target.value)
                    })}
                    step="0.01"
                    min="0"
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowStrategyForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Strategy
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {adjustment.type === 'MANUAL_CPC' ? 'Max CPC Bid' :
             adjustment.type === 'TARGET_CPA' ? 'Target CPA' :
             'Target ROAS'}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {adjustment.type === 'TARGET_ROAS' ? '' : '$'}
              </span>
            </div>
            <input
              type="number"
              value={adjustment.value}
              onChange={(e) => setAdjustment({
                ...adjustment,
                value: parseFloat(e.target.value)
              })}
              step={adjustment.type === 'TARGET_ROAS' ? '0.1' : '0.01'}
              min="0"
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                adjustment.type === 'TARGET_ROAS' ? '' : 'pl-7'
              }`}
            />
            {adjustment.type === 'TARGET_ROAS' && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900">Preview Changes</h4>
        <div className="mt-2 space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{campaign.name}</span>
              <div className="flex items-center gap-2">
                {adjustment.type === 'STRATEGY' ? (
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {newStrategyName || 'Shared Strategy'}
                  </span>
                ) : (
                  adjustment.type === 'TARGET_ROAS' ? (
                    `${adjustment.value}%`
                  ) : (
                    `$${adjustment.value.toFixed(2)}`
                  )
                )}
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
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Bidding'}
        </Button>
      </div>
    </form>
  );
}