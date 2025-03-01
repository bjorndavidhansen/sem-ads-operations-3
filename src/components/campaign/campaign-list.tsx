import { memo, useCallback, useMemo } from 'react';
import { VirtualList } from '../ui/virtual-list';
import { ErrorBoundary } from '../error-boundary';
import { usePerformance } from '../../hooks/use-performance';
import { memoWithPrevious } from '../../utils/memoization';
// ... rest of imports

export const CampaignList = memo(function CampaignList() {
  usePerformance({ componentName: 'CampaignList' });

  // ... existing state and handlers

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      // Add other sort fields
      return 0;
    });
  }, [campaigns, sortField, sortDirection]);

  const renderCampaign = useCallback((campaign: Campaign) => {
    return (
      <CampaignRow
        campaign={campaign}
        selected={selectedCampaigns.has(campaign.id)}
        onSelect={handleSelect}
        onEdit={handleEdit}
      />
    );
  }, [selectedCampaigns, handleSelect, handleEdit]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* ... header content */}
        
        <VirtualList
          items={sortedCampaigns}
          renderItem={renderCampaign}
          itemHeight={80}
          className="h-[calc(100vh-200px)]"
          onEndReached={loadMoreCampaigns}
        />
      </div>
    </ErrorBoundary>
  );
});

const CampaignRow = memo(function CampaignRow({
  campaign,
  selected,
  onSelect,
  onEdit
}: {
  campaign: Campaign;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (campaign: Campaign) => void;
}) {
  // ... row rendering logic
});