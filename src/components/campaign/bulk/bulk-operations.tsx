import { useState } from 'react';
import { AlertCircle, Play, Pause, DollarSign, Tag, Settings, Target, Clock, Download, Upload, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { BulkBidding } from './bulk-bidding';
import { BulkBudgets } from './bulk-budgets';
import { BulkKeywords } from './bulk-keywords';
import { BulkAdCopy } from './bulk-ad-copy';
import { BulkLabels } from './bulk-labels';
import { BulkSettings } from './bulk-settings';
import { BulkTargeting } from './bulk-targeting';
import { BulkSchedule } from './bulk-schedule';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkOperationsProps {
  selectedCampaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

type BulkOperationType = 'bidding' | 'budgets' | 'keywords' | 'adCopy' | 'labels' | 'settings' | 'targeting' | 'schedule';

export function BulkOperations({ selectedCampaigns, onUpdate, onClose }: BulkOperationsProps) {
  const [activeOperation, setActiveOperation] = useState<BulkOperationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkStatusUpdate = async (status: 'ENABLED' | 'PAUSED') => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        selectedCampaigns.map(campaign =>
          googleAdsApi.updateCampaign(campaign.id, { status })
        )
      );

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign status');
      console.error('Error updating campaign status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = selectedCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      type: campaign.advertisingChannelType,
      budget: parseInt(campaign.budget.amountMicros) / 1_000_000,
      metrics: campaign.metrics
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Bulk Operations ({selectedCampaigns.length} campaigns selected)
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleBulkStatusUpdate('ENABLED')}
                disabled={loading}
              >
                <Play className="h-4 w-4 mr-2" />
                Enable All
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkStatusUpdate('PAUSED')}
                disabled={loading}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause All
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('bidding')}
                disabled={loading}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Modify Bids
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('budgets')}
                disabled={loading}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Modify Budgets
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('keywords')}
                disabled={loading}
              >
                <Tag className="h-4 w-4 mr-2" />
                Manage Keywords
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('adCopy')}
                disabled={loading}
              >
                <Settings className="h-4 w-4 mr-2" />
                Update Ad Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('labels')}
                disabled={loading}
              >
                <Tag className="h-4 w-4 mr-2" />
                Manage Labels
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('settings')}
                disabled={loading}
              >
                <Settings className="h-4 w-4 mr-2" />
                Campaign Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('targeting')}
                disabled={loading}
              >
                <Target className="h-4 w-4 mr-2" />
                Targeting
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveOperation('schedule')}
                disabled={loading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Ad Schedule
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            )}

            {!loading && activeOperation === 'bidding' && (
              <BulkBidding
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'budgets' && (
              <BulkBudgets
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'keywords' && (
              <BulkKeywords
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'adCopy' && (
              <BulkAdCopy
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'labels' && (
              <BulkLabels
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'settings' && (
              <BulkSettings
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'targeting' && (
              <BulkTargeting
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && activeOperation === 'schedule' && (
              <BulkSchedule
                campaigns={selectedCampaigns}
                onUpdate={onUpdate}
                onClose={() => setActiveOperation(null)}
              />
            )}

            {!loading && !activeOperation && (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <h3 className="text-sm font-medium text-gray-900">Select an operation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose an operation from the options above to modify multiple campaigns at once.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}