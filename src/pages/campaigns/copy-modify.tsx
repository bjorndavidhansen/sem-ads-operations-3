import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { googleAdsApi } from '../../lib/google-ads-api';
import { useOperationTracking } from '../../hooks/use-operation-tracking';
import { useValidationPreview } from '../../hooks/use-validation-preview';
import { ChangePreview } from '../../components/operations/change-preview';
import { toast } from 'react-hot-toast';
import { Copy, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AccountSelector } from '../../components/google-ads/account-selector';
import { CampaignList } from '../../components/campaign/campaign-list';
import { NamingConvention } from '../../components/campaign/naming/naming-convention';
import { MatchTypeConverter } from '../../components/campaign/match-type/match-type-conversion';
import { OperationProgressBar } from '../../components/ui/operation-progress';
import { googleAdsApi, Campaign } from '../../lib/google-ads-api';
import { useToast } from '../../components/ui/toast';

interface CopyConfig {
  namingPattern: string;
  targetMatchType: 'BROAD' | 'PHRASE';
  addNegatives: boolean;
}

interface CopySettings {
  name: string;
  matchType: 'BROAD' | 'PHRASE';
  createNegativeExactKeywords: boolean;
}

export function CampaignCopyPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [copyConfig, setCopyConfig] = useState<CopyConfig>({
    namingPattern: '',
    targetMatchType: 'BROAD',
    addNegatives: true
  });
  const [currentStep, setCurrentStep] = useState<'select' | 'configure' | 'preview' | 'processing'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);
  const { operation } = useOperationTracking(currentOperationId || undefined);
  const { showToast } = useToast();
  const { 
    isPreviewVisible, 
    items, 
    summary, 
    isLoading: isPreviewLoading,
    error: previewError,
    generateCampaignClonePreview, 
    executeCampaignClone, 
    closePreview 
  } = useValidationPreview({
    customerId: selectedAccountId,
    onComplete: (operationId) => {
      showToast({
        title: 'Success',
        description: `Successfully copied ${selectedCampaigns.length} campaigns`,
        type: 'success'
      });
      
      // Reset state
      setSelectedCampaigns([]);
      setCurrentStep('select');
      setLoading(false);
      
      // Clear operation ID after a delay to allow viewing the completed status
      setTimeout(() => setCurrentOperationId(null), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to copy campaigns');
      setLoading(false);
      
      showToast({
        title: 'Error',
        description: error.message || 'Failed to copy campaigns. Please try again.',
        type: 'error'
      });
    }
  });

  // Monitor operation progress and update UI accordingly
  useEffect(() => {
    if (operation && currentStep === 'processing') {
      if (operation.status === 'completed') {
        showToast({
          title: 'Success',
          description: `Successfully copied ${selectedCampaigns.length} campaigns`,
          type: 'success'
        });
        
        // Reset state
        setSelectedCampaigns([]);
        setCurrentStep('select');
        setLoading(false);
        
        // Clear operation ID after a delay to allow viewing the completed status
        setTimeout(() => setCurrentOperationId(null), 3000);
      } else if (operation.status === 'failed') {
        setError(operation.error?.message || 'Failed to copy campaigns');
        setLoading(false);
        
        showToast({
          title: 'Error',
          description: operation.error?.message || 'Failed to copy campaigns. Please try again.',
          type: 'error'
        });
      }
    }
  }, [operation, currentStep, selectedCampaigns.length, showToast]);

  const validateSelection = () => {
    if (selectedCampaigns.length === 0) {
      showToast({
        title: 'Selection Required',
        description: 'Please select at least one campaign to copy.',
        type: 'error'
      });
      return false;
    }

    const nonExactMatch = selectedCampaigns.find(c => c.matchType !== 'EXACT');
    if (nonExactMatch) {
      showToast({
        title: 'Invalid Selection',
        description: 'Only exact match campaigns can be selected for conversion.',
        type: 'error'
      });
      return false;
    }

    return true;
  };

  const handleContinueToConfig = () => {
    if (validateSelection()) {
      setCurrentStep('configure');
    }
  };

  const handleContinueToPreview = () => {
    if (!copyConfig.namingPattern) {
      showToast({
        title: 'Configuration Required',
        description: 'Please specify a naming pattern for the new campaigns.',
        type: 'error'
      });
      return;
    }
    setCurrentStep('preview');
  };

  const handleCopyCampaigns = async () => {
    if (!selectedAccountId || selectedCampaigns.length === 0) {
      showToast({
        title: 'Error',
        description: 'No campaigns selected to copy',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Instead of directly copying, trigger the preview process
      await handlePreviewClick();
      
    } catch (error) {
      setError(error.message || 'Failed to copy campaigns');
      setLoading(false);
      
      showToast({
        title: 'Error',
        description: error.message || 'Failed to copy campaigns. Please try again.',
        type: 'error'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setCopyConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handlePreviewClick = async () => {
    try {
      if (!selectedAccountId || selectedCampaigns.length === 0) return;
      
      await generateCampaignClonePreview(
        selectedCampaigns.map(campaign => campaign.id),
        {
          name: copyConfig.namingPattern,
          matchType: copyConfig.targetMatchType,
          createNegativeExactKeywords: copyConfig.addNegatives
        }
      );
    } catch (error) {
      console.error('Error generating preview:', error);
      showToast({
        title: 'Error',
        description: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  const handleExecuteClick = async () => {
    try {
      if (!selectedAccountId || selectedCampaigns.length === 0) return;
      
      setLoading(true);
      
      await executeCampaignClone(
        selectedCampaigns.map(campaign => campaign.id),
        {
          name: copyConfig.namingPattern,
          matchType: copyConfig.targetMatchType,
          createNegativeExactKeywords: copyConfig.addNegatives
        }
      );
      
      // Reset selection and move to next step
      setCurrentStep('complete');
      
    } catch (error) {
      console.error('Error copying campaign:', error);
      setError(error.message || 'Failed to copy campaigns');
      setLoading(false);
      
      showToast({
        title: 'Error',
        description: `Error: ${error.message}`,
        type: 'error'
      });
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Copy & Modify Campaigns</h1>
          
          {currentStep !== 'select' && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('select')}
              disabled={loading}
            >
              Back to Selection
            </Button>
          )}
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

          {selectedAccountId && currentStep === 'select' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Select Campaigns to Copy</h2>
                <Button
                  onClick={handleContinueToConfig}
                  disabled={selectedCampaigns.length === 0 || loading}
                >
                  Continue to Configuration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <CampaignList
                customerId={selectedAccountId}
                onSelectionChange={setSelectedCampaigns}
                exactMatchOnly={true}
              />
            </div>
          )}

          {currentStep === 'configure' && (
            <div className="space-y-8 bg-white shadow rounded-lg p-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Campaign Configuration</h3>
                
                <div className="space-y-6">
                  <NamingConvention
                    value={copyConfig.namingPattern}
                    onChange={(pattern) => setCopyConfig(prev => ({ ...prev, namingPattern: pattern }))}
                  />

                  <MatchTypeConverter
                    value={copyConfig.targetMatchType}
                    onChange={(type) => setCopyConfig(prev => ({ ...prev, targetMatchType: type }))}
                  />

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={copyConfig.addNegatives}
                        onChange={(e) => setCopyConfig(prev => ({ ...prev, addNegatives: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span>Add exact match keywords as negatives to new campaigns</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleContinueToPreview}
                  disabled={!copyConfig.namingPattern}
                >
                  Continue to Preview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-8 bg-white shadow rounded-lg p-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Operation Preview</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Selected Campaigns ({selectedCampaigns.length})</h4>
                    <ul className="mt-2 space-y-2">
                      {selectedCampaigns.map(campaign => (
                        <li key={campaign.id} className="flex items-center space-x-2">
                          <span>{campaign.name}</span>
                          <ArrowRight className="h-4 w-4" />
                          <span>{copyConfig.namingPattern.replace('{original}', campaign.name)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">Configuration</h4>
                    <ul className="mt-2 space-y-1">
                      <li>Target Match Type: {copyConfig.targetMatchType}</li>
                      <li>Add Negative Keywords: {copyConfig.addNegatives ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCopyCampaigns}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Start Copy Operation'}
                  {!loading && <Copy className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="bg-white shadow rounded-lg p-6">
              {currentOperationId ? (
                <OperationProgressBar 
                  operationId={currentOperationId}
                  showDetails={true}
                  className="w-full"
                />
              ) : (
                <div className="text-center p-4">
                  <p>Initializing operation...</p>
                </div>
              )}
            </div>
          )}

          {isPreviewVisible && summary && (
            <div className="mb-8">
              <ChangePreview
                items={items}
                summary={summary}
                onConfirm={handleExecuteClick}
                onCancel={closePreview}
                loading={isPreviewLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}