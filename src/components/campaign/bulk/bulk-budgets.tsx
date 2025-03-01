import { useState } from 'react';
import { AlertCircle, DollarSign, Plus, X, Wallet } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import { sharedBudgetApi } from '../../../lib/shared-budget-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkBudgetsProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface BudgetAdjustment {
  type: 'PERCENTAGE' | 'FIXED' | 'SHARED';
  value: number;
  sharedBudgetId?: string;
  sharedBudgetName?: string;
}

export function BulkBudgets({ campaigns, onUpdate, onClose }: BulkBudgetsProps) {
  const [adjustment, setAdjustment] = useState<BudgetAdjustment>({
    type: 'PERCENTAGE',
    value: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSharedBudgetForm, setShowSharedBudgetForm] = useState(false);
  const [newSharedBudgetName, setNewSharedBudgetName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (adjustment.type === 'SHARED') {
        // Create new shared budget if needed
        let sharedBudgetId = adjustment.sharedBudgetId;
        
        if (!sharedBudgetId && newSharedBudgetName) {
          const totalBudget = campaigns.reduce((sum, campaign) => 
            sum + (parseInt(campaign.budget.amountMicros) / 1_000_000), 0
          );

          const newBudget = await sharedBudgetApi.createSharedBudget({
            name: newSharedBudgetName,
            amount: totalBudget,
            customerAccountId: campaigns[0].accountId
          });
          sharedBudgetId = newBudget.id;
        }

        if (!sharedBudgetId) {
          throw new Error('No shared budget selected or created');
        }

        // Update all campaigns to use the shared budget
        await Promise.all(
          campaigns.map(campaign =>
            googleAdsApi.updateCampaign(campaign.id, {
              sharedBudgetId
            })
          )
        );
      } else {
        // Apply individual budget adjustments
        await Promise.all(
          campaigns.map(campaign => {
            const currentBudget = parseInt(campaign.budget.amountMicros) / 1_000_000;
            const newBudget = adjustment.type === 'PERCENTAGE'
              ? currentBudget * (1 + adjustment.value / 100)
              : adjustment.value;

            return googleAdsApi.updateCampaign(campaign.id, {
              dailyBudget: newBudget
            });
          })
        );
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budgets');
      console.error('Error updating budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNewBudget = (currentBudget: number) => {
    if (adjustment.type === 'PERCENTAGE') {
      return currentBudget * (1 + adjustment.value / 100);
    }
    return adjustment.value;
  };

  const totalCurrentBudget = campaigns.reduce((sum, campaign) => 
    sum + (parseInt(campaign.budget.amountMicros) / 1_000_000), 0
  );

  const totalNewBudget = adjustment.type === 'SHARED'
    ? totalCurrentBudget
    : campaigns.reduce((sum, campaign) => {
        const currentBudget = parseInt(campaign.budget.amountMicros) / 1_000_000;
        return sum + calculateNewBudget(currentBudget);
      }, 0);

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
          Budget Adjustment Type
        </label>
        <select
          value={adjustment.type}
          onChange={(e) => setAdjustment({
            ...adjustment,
            type: e.target.value as BudgetAdjustment['type']
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="PERCENTAGE">Percentage Change</option>
          <option value="FIXED">Fixed Amount</option>
          <option value="SHARED">Use Shared Budget</option>
        </select>
      </div>

      {adjustment.type === 'SHARED' ? (
        <div className="space-y-4">
          {showSharedBudgetForm ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Shared Budget Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={newSharedBudgetName}
                  onChange={(e) => setNewSharedBudgetName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter budget name"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                A new shared budget will be created with the combined budget of all selected campaigns (${totalCurrentBudget.toFixed(2)}/day)
              </p>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSharedBudgetForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Shared Budget
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {adjustment.type === 'PERCENTAGE' ? 'Percentage Change' : 'New Budget Amount'}
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            {adjustment.type === 'FIXED' && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
            )}
            <input
              type="number"
              value={adjustment.value}
              onChange={(e) => setAdjustment({
                ...adjustment,
                value: parseFloat(e.target.value)
              })}
              step={adjustment.type === 'PERCENTAGE' ? 1 : 0.01}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                adjustment.type === 'FIXED' ? 'pl-7' : ''
              }`}
            />
            {adjustment.type === 'PERCENTAGE' && (
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
          {campaigns.map((campaign) => {
            const currentBudget = parseInt(campaign.budget.amountMicros) / 1_000_000;
            const newBudget = adjustment.type === 'SHARED'
              ? 'Shared'
              : calculateNewBudget(currentBudget);

            return (
              <div key={campaign.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{campaign.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    ${currentBudget.toFixed(2)}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`font-medium ${
                    adjustment.type === 'SHARED'
                      ? 'text-blue-600'
                      : newBudget > currentBudget
                      ? 'text-green-600'
                      : newBudget < currentBudget
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}>
                    {adjustment.type === 'SHARED' ? (
                      <span className="flex items-center gap-1">
                        <Wallet className="h-4 w-4" />
                        Shared
                      </span>
                    ) : (
                      `$${newBudget.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-gray-700">Total Daily Budget</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                ${totalCurrentBudget.toFixed(2)}
              </span>
              <span className="text-gray-400">→</span>
              <span className={`${
                totalNewBudget > totalCurrentBudget
                  ? 'text-green-600'
                  : totalNewBudget < totalCurrentBudget
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}>
                ${totalNewBudget.toFixed(2)}
              </span>
            </div>
          </div>
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
          {loading ? 'Updating...' : 'Update Budgets'}
        </Button>
      </div>
    </form>
  );
}