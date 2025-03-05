import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { VirtualList } from '../ui/virtual-list';
import { ErrorBoundary } from '../error-boundary';
import { usePerformance } from '../../hooks/use-performance';
import { memoWithPrevious } from '../../utils/memoization';
import { googleAdsApi, Campaign, ListCampaignsOptions } from '../../lib/google-ads-api';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/toast';

interface CampaignListProps {
  customerId: string;
  onSelectionChange: (campaigns: Campaign[]) => void;
  exactMatchOnly?: boolean;
}

export const CampaignList = memo(function CampaignList({
  customerId,
  onSelectionChange,
  exactMatchOnly = false
}: CampaignListProps) {
  usePerformance({ componentName: 'CampaignList' });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState(new Set<string>());
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async (options: ListCampaignsOptions = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const filter = exactMatchOnly 
        ? "campaign_criterion.keyword.match_type = 'EXACT'" 
        : undefined;
      
      const response = await googleAdsApi.listCampaigns(customerId, {
        ...options,
        filter
      });

      setCampaigns(prev => 
        options.pageToken 
          ? [...prev, ...response.results]
          : response.results
      );
      setNextPageToken(response.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      showToast({
        title: 'Error',
        description: 'Failed to fetch campaigns. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [customerId, exactMatchOnly, showToast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const loadMoreCampaigns = useCallback(() => {
    if (nextPageToken && !loading) {
      fetchCampaigns({ pageToken: nextPageToken });
    }
  }, [nextPageToken, loading, fetchCampaigns]);

  const handleSelect = useCallback((id: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedCampaignsList = useMemo(() => 
    campaigns.filter(c => selectedCampaigns.has(c.id)),
    [campaigns, selectedCampaigns]
  );

  useEffect(() => {
    onSelectionChange(selectedCampaignsList);
  }, [selectedCampaignsList, onSelectionChange]);

  const renderCampaign = useCallback((campaign: Campaign) => {
    const isExactMatch = campaign.matchType === 'EXACT';
    
    return (
      <div className="flex items-center p-4 border-b hover:bg-gray-50">
        <Checkbox
          checked={selectedCampaigns.has(campaign.id)}
          onCheckedChange={() => handleSelect(campaign.id)}
          aria-label={`Select ${campaign.name}`}
        />
        
        <div className="ml-4 flex-grow">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">{campaign.name}</h3>
            <Badge variant={campaign.status === 'ENABLED' ? 'success' : 'warning'}>
              {campaign.status}
            </Badge>
            {isExactMatch && (
              <Badge variant="info">EXACT MATCH</Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-500 mt-1">
            <span>Keywords: {campaign.keywordCount || 0}</span>
            <span className="mx-2">•</span>
            <span>Clicks: {campaign.metrics?.clicks || 0}</span>
            <span className="mx-2">•</span>
            <span>Cost: ${campaign.metrics?.cost.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    );
  }, [selectedCampaigns, handleSelect]);

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold">Campaigns</h2>
            <p className="text-sm text-gray-500">
              {selectedCampaigns.size} selected
            </p>
          </div>
        </div>
        
        <VirtualList
          items={campaigns}
          renderItem={renderCampaign}
          itemHeight={80}
          className="h-[calc(100vh-200px)]"
          onEndReached={loadMoreCampaigns}
        />
        
        {loading && (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner" />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});