import { useState } from 'react';
import { Dialog } from '../../ui/dialog';
import { CampaignAnalyzer } from './campaign-analyzer';
import { Button } from '../../ui/button';
import { BarChart2 } from 'lucide-react';

export function CampaignComparison() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog
      trigger={
        <Button variant="outline">
          <BarChart2 className="h-4 w-4 mr-2" />
          Compare Campaigns
        </Button>
      }
      title="Campaign Comparison"
      description="Compare performance and settings across campaigns"
      size="xl"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <CampaignAnalyzer />
    </Dialog>
  );
}