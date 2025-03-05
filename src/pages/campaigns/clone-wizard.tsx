import React from 'react';
import CampaignCloneWizard from '../../components/campaign-clone/campaign-clone-wizard';

/**
 * Campaign Clone Wizard Page
 * 
 * A page wrapper for the Campaign Clone Wizard component
 */
const CampaignCloneWizardPage: React.FC = () => {
  return (
    <div className="campaign-clone-wizard-page">
      <CampaignCloneWizard />
    </div>
  );
};

export default CampaignCloneWizardPage;
