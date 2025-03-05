import { useState, useCallback } from 'react';
import { 
  Campaign, 
  CloneOperation, 
  CampaignCloneConfig, 
  CampaignValidationResult,
  MatchType
} from '../types/campaign-types';
import campaignService from '../lib/campaign-service';

/**
 * Custom hook for handling campaign duplication operations
 * Provides state and functions for the complete campaign cloning workflow
 */
export const useCampaignDuplication = () => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [sourceMatchType, setSourceMatchType] = useState<MatchType>('exact');
  const [targetMatchType, setTargetMatchType] = useState<MatchType>('broad');
  const [isValidating, setIsValidating] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<CampaignValidationResult | null>(null);
  const [cloneConfig, setCloneConfig] = useState<CampaignCloneConfig>({
    sourceMatchType: 'exact',
    targetMatchType: 'broad',
    addNegativeKeywords: true,
    namingPattern: "{originalName} - {targetMatchType}",
    adjustBids: true,
    bidAdjustmentFactor: 0.8,
    includeAdGroups: true,
    includeAds: true,
    includeExtensions: true,
    updateFinalUrls: false
  });
  const [cloneResult, setCloneResult] = useState<{
    success: boolean;
    createdCampaignIds: string[];
    errors: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update selected campaigns
   */
  const handleCampaignSelectionChange = useCallback((campaigns: Campaign[]) => {
    setSelectedCampaigns(campaigns);
    // Reset validation when selection changes
    setValidationResult(null);
  }, []);

  /**
   * Update source match type
   */
  const handleSourceMatchTypeChange = useCallback((matchType: MatchType) => {
    setSourceMatchType(matchType);
    setCloneConfig(prev => ({
      ...prev,
      sourceMatchType: matchType
    }));
    // Reset validation when match type changes
    setValidationResult(null);
  }, []);

  /**
   * Update target match type
   */
  const handleTargetMatchTypeChange = useCallback((matchType: MatchType) => {
    setTargetMatchType(matchType);
    setCloneConfig(prev => ({
      ...prev,
      targetMatchType: matchType
    }));
    // Reset validation when match type changes
    setValidationResult(null);
  }, []);

  /**
   * Update clone configuration
   */
  const updateCloneConfig = useCallback((updates: Partial<CampaignCloneConfig>) => {
    setCloneConfig(prev => ({
      ...prev,
      ...updates
    }));
    // Reset validation when config changes
    setValidationResult(null);
  }, []);

  /**
   * Validate selected campaigns for cloning
   */
  const validateCampaigns = useCallback(async () => {
    if (selectedCampaigns.length === 0) {
      setError('No campaigns selected');
      return null;
    }

    setIsValidating(true);
    setError(null);

    try {
      const campaignIds = selectedCampaigns.map(c => c.id);
      const result = await campaignService.validateCampaignsForCloning(
        campaignIds,
        cloneConfig
      );
      
      setValidationResult(result);
      return result;
    } catch (err) {
      setError('Validation failed: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [selectedCampaigns, cloneConfig]);

  /**
   * Execute the campaign clone operation
   */
  const cloneCampaigns = useCallback(async () => {
    if (selectedCampaigns.length === 0) {
      setError('No campaigns selected');
      return;
    }

    // Validate first if not already validated
    if (!validationResult) {
      const result = await validateCampaigns();
      if (!result || !result.valid) {
        setError('Validation failed. Please resolve issues before cloning.');
        return;
      }
    } else if (!validationResult.valid) {
      setError('Please resolve validation issues before cloning.');
      return;
    }

    setIsCloning(true);
    setProgress(0);
    setError(null);

    try {
      // Create a clone operation object
      const operation: CloneOperation = {
        id: `clone_${Date.now()}`,
        sourceCampaignIds: selectedCampaigns.map(c => c.id),
        config: cloneConfig,
        status: 'in_progress',
        progress: 0,
        createdCampaignIds: [],
        errors: [],
        createdAt: new Date().toISOString(),
        userId: 'current-user' // In a real app, this would come from auth context
      };

      // Execute the cloning operation
      const result = await campaignService.cloneCampaigns(
        operation,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      setCloneResult(result);
      return result;
    } catch (err) {
      setError('Cloning failed: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    } finally {
      setIsCloning(false);
      setProgress(100); // Ensure progress is complete
    }
  }, [selectedCampaigns, cloneConfig, validationResult, validateCampaigns]);

  /**
   * Reset the clone operation state
   */
  const resetCloneOperation = useCallback(() => {
    setSelectedCampaigns([]);
    setValidationResult(null);
    setCloneResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    // State
    selectedCampaigns,
    sourceMatchType,
    targetMatchType,
    cloneConfig,
    isValidating,
    isCloning,
    progress,
    validationResult,
    cloneResult,
    error,
    
    // Actions
    handleCampaignSelectionChange,
    handleSourceMatchTypeChange,
    handleTargetMatchTypeChange,
    updateCloneConfig,
    validateCampaigns,
    cloneCampaigns,
    resetCloneOperation
  };
};

export default useCampaignDuplication;
