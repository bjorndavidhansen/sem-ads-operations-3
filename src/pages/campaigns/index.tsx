import { useState } from 'react';
import { AccountSelector } from '../../components/google-ads/account-selector';
import { CampaignManager } from '../../components/campaign/campaign-manager';

export function CampaignsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>();

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Google Ads Account</h2>
          <AccountSelector
            onSelect={(account) => setSelectedAccountId(account.id)}
            selectedAccountId={selectedAccountId}
          />
        </div>

        {selectedAccountId && (
          <CampaignManager accountId={selectedAccountId} />
        )}
      </div>
    </div>
  );
}