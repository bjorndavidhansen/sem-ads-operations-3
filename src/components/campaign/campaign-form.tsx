import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { BiddingStrategy } from './bidding/bidding-strategy';
import { TargetingPanel } from './targeting/targeting-panel';
import { NamingConvention } from './naming/naming-convention';
import { MatchTypeConversion } from './match-type/match-type-conversion';
import type { CreateCampaignInput, Campaign, UpdateCampaignInput } from '../../lib/google-ads-api';
import type { KeywordMatchType } from './match-type/match-type-conversion';
import { matchTypeApi } from '../../lib/match-type-api';

interface CampaignFormProps {
  accountId: string;
  onSubmit: (data: CreateCampaignInput | UpdateCampaignInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  campaign?: Campaign;
}

const CHANNEL_TYPES = [
  'SEARCH',
  'DISPLAY',
  'VIDEO',
  'SHOPPING',
  'HOTEL',
  'DISCOVERY',
  'PERFORMANCE_MAX',
  'LOCAL',
  'SMART'
] as const;

export function CampaignForm({ accountId, onSubmit, onCancel, isLoading, campaign }: CampaignFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>(
    campaign?.budget.sharedBudgetId
  );
  const [selectedBiddingStrategyId, setSelectedBiddingStrategyId] = useState<string | undefined>(
    campaign?.biddingStrategyId
  );
  const [namingSegments, setNamingSegments] = useState([]);
  const [namingDelimiter, setNamingDelimiter] = useState('_');
  const [namingMinSegments, setNamingMinSegments] = useState(3);
  const [namingCaseFormat, setNamingCaseFormat] = useState<'upper' | 'lower' | 'sentence'>('upper');
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateCampaignInput>({
    defaultValues: campaign ? {
      name: campaign.name,
      status: campaign.status,
      advertisingChannelType: campaign.advertisingChannelType,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      dailyBudget: parseInt(campaign.budget.amountMicros) / 1_000_000,
      targetRoas: campaign.targetRoas?.targetRoas,
      targetCpa: campaign.targetCpa ? parseInt(campaign.targetCpa.targetCpaMicros) / 1_000_000 : undefined,
      locations: campaign.targeting?.locations || [],
      deviceAdjustments: campaign.targeting?.deviceAdjustments || [
        { deviceType: 'MOBILE', bidModifier: 0 },
        { deviceType: 'DESKTOP', bidModifier: 0 },
        { deviceType: 'TABLET', bidModifier: 0 }
      ],
      adSchedule: campaign.targeting?.adSchedule || [],
      audiences: campaign.targeting?.audiences || []
    } : {
      status: 'ENABLED',
      advertisingChannelType: 'SEARCH',
      startDate: new Date().toISOString().split('T')[0],
      deviceAdjustments: [
        { deviceType: 'MOBILE', bidModifier: 0 },
        { deviceType: 'DESKTOP', bidModifier: 0 },
        { deviceType: 'TABLET', bidModifier: 0 }
      ]
    }
  });

  const channelType = watch('advertisingChannelType');

  const handleMatchTypeConversion = async (targetMatchType: KeywordMatchType) => {
    if (!campaign) return;

    try {
      setError(null);
      await matchTypeApi.convertMatchTypes(accountId, [campaign.id], targetMatchType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert match types');
      console.error('Error converting match types:', err);
    }
  };

  const handleFormSubmit = (data: CreateCampaignInput) => {
    onSubmit({
      ...data,
      sharedBudgetId: selectedBudgetId,
      biddingStrategyId: selectedBiddingStrategyId,
      name: generateCampaignName(data)
    });
  };

  const generateCampaignName = (data: CreateCampaignInput) => {
    // If no naming segments are defined, use the provided name
    if (namingSegments.length === 0) {
      return data.name;
    }

    // Generate name based on naming convention
    const segments = namingSegments.map(seg => {
      if (seg.type === 'abbreviation' && seg.abbreviation) {
        return formatCase(seg.abbreviation);
      }
      return formatCase(seg.value || 'na');
    });

    // Fill with 'na' if we don't have enough segments
    while (segments.length < namingMinSegments) {
      segments.push(formatCase('na'));
    }

    return segments.join(namingDelimiter);
  };

  const formatCase = (value: string): string => {
    switch (namingCaseFormat) {
      case 'upper':
        return value.toUpperCase();
      case 'lower':
        return value.toLowerCase();
      case 'sentence':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      default:
        return value;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Campaign name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="advertisingChannelType" className="block text-sm font-medium text-gray-700">
                Campaign Type
              </label>
              <select
                id="advertisingChannelType"
                {...register('advertisingChannelType')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!!campaign}
              >
                {CHANNEL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="ENABLED">Enabled</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register('startDate', { required: 'Start date is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  {...register('endDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Naming Convention</h4>
            <NamingConvention
              segments={namingSegments}
              onChange={setNamingSegments}
              delimiter={namingDelimiter}
              onDelimiterChange={setNamingDelimiter}
              minSegments={namingMinSegments}
              onMinSegmentsChange={setNamingMinSegments}
              caseFormat={namingCaseFormat}
              onCaseFormatChange={setNamingCaseFormat}
              disabled={isLoading}
            />
          </div>

          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Bidding Strategy</h4>
            <BiddingStrategy
              accountId={accountId}
              onSelect={setSelectedBiddingStrategyId}
              selectedStrategyId={selectedBiddingStrategyId}
              disabled={isLoading}
            />
          </div>

          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Targeting</h4>
            <TargetingPanel
              campaignId={campaign?.id}
              onSave={() => {}}
              disabled={isLoading}
            />
          </div>

          {campaign?.advertisingChannelType === 'SEARCH' && (
            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Match Type Conversion</h4>
              <MatchTypeConversion
                onConvert={handleMatchTypeConversion}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (campaign ? 'Saving...' : 'Creating...') : (campaign ? 'Save Changes' : 'Create Campaign')}
        </Button>
      </div>
    </form>
  );
}