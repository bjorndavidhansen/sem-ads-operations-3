import { useState } from 'react';
import { Settings, Target, Globe, Clock, Tag, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { BiddingStrategy } from '../bidding';
import { TargetingPanel } from '../targeting/targeting-panel';
import { AdSchedule } from '../targeting/ad-schedule';
import { AudienceTargeting } from '../targeting/audience-targeting';
import { LocationTargeting } from '../targeting/location-targeting';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface CampaignSettingsProps {
  campaign: Campaign;
  onUpdate: () => void;
}

type SettingsTab = 'general' | 'bidding' | 'targeting' | 'schedule' | 'audiences' | 'locations';

export function CampaignSettings({ campaign, onUpdate }: CampaignSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: campaign.name,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate || '',
    budget: parseInt(campaign.budget.amountMicros) / 1_000_000,
    labels: campaign.labels || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await googleAdsApi.updateCampaign(campaign.id, {
        name: form.name,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        dailyBudget: form.budget,
        labels: form.labels
      });

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign settings');
      console.error('Error updating campaign settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline-block mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveTab('bidding')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'bidding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="h-4 w-4 inline-block mr-2" />
            Bidding
          </button>
          <button
            onClick={() => setActiveTab('targeting')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'targeting'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="h-4 w-4 inline-block mr-2" />
            Targeting
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 inline-block mr-2" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('audiences')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'audiences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Audiences
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="h-4 w-4 inline-block mr-2" />
            Locations
          </button>
        </nav>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Campaign['status'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="ENABLED">Enabled</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  min={form.startDate}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Daily Budget
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Labels
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.labels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        labels: form.labels.filter((_, i) => i !== index)
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const label = prompt('Enter label name:');
                    if (label) {
                      setForm({
                        ...form,
                        labels: [...form.labels, label]
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

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'bidding' && (
          <BiddingStrategy
            accountId={campaign.accountId}
            onSelect={() => {}}
            selectedStrategyId={campaign.biddingStrategyId}
          />
        )}

        {activeTab === 'targeting' && (
          <TargetingPanel
            campaignId={campaign.id}
            onSave={onUpdate}
          />
        )}

        {activeTab === 'schedule' && (
          <AdSchedule
            schedule={campaign.schedule || []}
            onChange={async (schedule) => {
              try {
                setLoading(true);
                setError(null);
                await googleAdsApi.updateCampaign(campaign.id, { schedule });
                onUpdate();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update schedule');
                console.error('Error updating schedule:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {activeTab === 'audiences' && (
          <AudienceTargeting
            audiences={campaign.audiences || []}
            onChange={async (audiences) => {
              try {
                setLoading(true);
                setError(null);
                await googleAdsApi.updateCampaign(campaign.id, { audiences });
                onUpdate();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update audiences');
                console.error('Error updating audiences:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {activeTab === 'locations' && (
          <LocationTargeting
            locations={campaign.locations || []}
            onChange={async (locations) => {
              try {
                setLoading(true);
                setError(null);
                await googleAdsApi.updateCampaign(campaign.id, { locations });
                onUpdate();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update locations');
                console.error('Error updating locations:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}