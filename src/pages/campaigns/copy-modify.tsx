import { useState } from 'react';
import { Copy, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AccountSelector } from '../../components/google-ads/account-selector';
import { CampaignForm } from '../../components/campaign/campaign-form';
import { BiddingStrategy } from '../../components/campaign/bidding/bidding-strategy';
import { NamingConvention } from '../../components/campaign/naming/naming-convention';
import { googleAdsApi } from '../../lib/google-ads-api';
import type { Campaign } from '../../lib/google-ads-api';

export function CampaignCopyPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCopyCampaigns = async () => {
    if (!selectedAccountId || selectedCampaigns.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      await googleAdsApi.copyCampaigns(
        selectedAccountId,
        selectedCampaigns.map(c => c.id)
      );

      setSelectedCampaigns([]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy campaigns');
      console.error('Error copying campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Copy & Modify Campaigns</h1>
        </div>

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
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Select Google Ads Account</h2>
            <AccountSelector
              onSelect={(account) => {
                setSelectedAccountId(account.id);
                setSelectedCampaigns([]);
              }}
              selectedAccountId={selectedAccountId}
            />
          </div>

          {selectedAccountId && !showForm && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Select Campaigns to Copy</h2>
                <Button
                  onClick={() => setShowForm(true)}
                  disabled={selectedCampaigns.length === 0 || loading}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {loading ? 'Copying...' : 'Copy Selected'}
                </Button>
              </div>

              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Select</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCampaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campaign.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {campaign.advertisingChannelType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${parseInt(campaign.budget.amountMicros) / 1_000_000}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedCampaigns(campaigns => 
                              campaigns.filter(c => c.id !== campaign.id)
                            )}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedAccountId && showForm && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <CampaignForm
                  accountId={selectedAccountId}
                  onSubmit={handleCopyCampaigns}
                  onCancel={() => setShowForm(false)}
                  isLoading={loading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}