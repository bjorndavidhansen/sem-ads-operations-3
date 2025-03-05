import { useState, useCallback } from 'react';
import { googleAdsApi } from '../lib/google-ads-api';
import { ValidationService } from '../services/validation-service';
import { useOperationTracking } from './use-operation-tracking';

export interface ValidationPreviewOptions {
  customerId?: string;
  onComplete?: (operationId: string) => void;
  onError?: (error: Error) => void;
}

export interface CloneSettings {
  name: string;
  matchType: string;
  createNegativeExactKeywords: boolean;
}

export function useValidationPreview(options: ValidationPreviewOptions = {}) {
  const [state, setState] = useState({
    isPreviewVisible: false,
    items: [],
    summary: null,
    isLoading: false,
    error: null
  });
  
  const { 
    isPreviewVisible, 
    items, 
    summary, 
    isLoading, 
    error 
  } = state;
  
  const { 
    createOperation, 
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    addLog,
    createRestorePoint
  } = useOperationTracking();
  
  const validationService = ValidationService.getInstance();
  
  /**
   * Generate preview for campaign clone operation
   */
  const generateCampaignClonePreview = useCallback(async (
    campaignIds: string | string[],
    config: CloneSettings
  ) => {
    if (!options.customerId) {
      throw new Error('Customer ID is required for validation preview');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Convert single ID to array for consistent handling
      const campaignIdArray = Array.isArray(campaignIds) ? campaignIds : [campaignIds];
      const previews = [];
      
      // Create a combined summary
      const combinedSummary = {
        totalCampaigns: campaignIdArray.length,
        totalAdGroups: 0,
        totalKeywords: 0,
        totalNegativeKeywords: 0,
        validationStatus: 'valid',
        validationMessages: [] as string[]
      };
      
      // Process each campaign to get preview data
      for (const campaignId of campaignIdArray) {
        // Fetch campaign data
        const campaignResponse = await googleAdsApi.makeRequest(
          options.customerId,
          'campaigns:search',
          {
            method: 'POST',
            body: JSON.stringify({
              query: `
                SELECT 
                  campaign.id,
                  campaign.name,
                  campaign.status,
                  campaign.advertising_channel_type,
                  campaign.bidding_strategy_type
                FROM campaign
                WHERE campaign.id = '${campaignId}'
              `
            })
          }
        );
        
        if (!campaignResponse?.results?.[0]) {
          throw new Error(`Campaign not found: ${campaignId}`);
        }
        
        const campaignData = campaignResponse.results[0].campaign;
        
        // Get ad groups for this campaign
        const adGroupsResponse = await googleAdsApi.makeRequest(
          options.customerId,
          'ad_groups:search',
          {
            method: 'POST',
            body: JSON.stringify({
              query: `
                SELECT 
                  ad_group.id,
                  ad_group.name,
                  ad_group.status,
                  ad_group.type
                FROM ad_group
                WHERE ad_group.campaign = 'customers/${options.customerId}/campaigns/${campaignId}'
              `
            })
          }
        );
        
        const adGroups = adGroupsResponse?.results || [];
        
        // Get keywords count for this campaign
        const keywordsResponse = await googleAdsApi.makeRequest(
          options.customerId,
          'keywords:search',
          {
            method: 'POST',
            body: JSON.stringify({
              query: `
                SELECT 
                  ad_group_criterion.criterion_id
                FROM ad_group_criterion
                WHERE ad_group_criterion.type = 'KEYWORD'
                AND ad_group_criterion.negative = FALSE
                AND ad_group_criterion.ad_group IN (
                  SELECT ad_group.resource_name 
                  FROM ad_group 
                  WHERE ad_group.campaign = 'customers/${options.customerId}/campaigns/${campaignId}'
                )
              `
            })
          }
        );
        
        const keywordsCount = keywordsResponse?.results?.length || 0;
        
        // Generate name for this campaign based on pattern
        let newName = campaignData.name;
        if (config.matchType === 'BROAD') {
          newName = newName.replace('Exact', 'Broad').replace('EXACT', 'BROAD');
        } else if (config.matchType === 'PHRASE') {
          newName = newName.replace('Exact', 'Phrase').replace('EXACT', 'PHRASE');
        }
        
        // If the name didn't change with replacements, append the match type
        if (newName === campaignData.name) {
          newName = `${campaignData.name} - ${config.matchType === 'BROAD' ? 'Broad' : 'Phrase'} Match`;
        }
        
        // If a custom name was provided, use it
        if (config.name && config.name !== '{original}') {
          if (config.name.includes('{original}')) {
            newName = config.name.replace('{original}', campaignData.name);
          } else {
            newName = config.name;
          }
        }
        
        // Generate preview for this campaign
        const campaignPreview = {
          sourceId: campaignId,
          sourceName: campaignData.name,
          targetName: newName,
          matchType: config.matchType,
          adGroupsCount: adGroups.length,
          keywordsCount: keywordsCount,
          negativeKeywordsCount: config.createNegativeExactKeywords ? keywordsCount : 0,
          validationMessages: []
        };
        
        // Perform validation checks
        if (newName.length > 150) {
          campaignPreview.validationMessages.push('Campaign name exceeds maximum length of 150 characters');
          combinedSummary.validationStatus = 'invalid';
          combinedSummary.validationMessages.push(`Campaign "${campaignData.name}": Name too long`);
        }
        
        if (newName === campaignData.name) {
          campaignPreview.validationMessages.push('New campaign name is identical to source campaign');
          combinedSummary.validationStatus = 'warning';
          combinedSummary.validationMessages.push(`Campaign "${campaignData.name}": Identical name`);
        }
        
        previews.push(campaignPreview);
        
        // Update combined summary
        combinedSummary.totalAdGroups += adGroups.length;
        combinedSummary.totalKeywords += keywordsCount;
        combinedSummary.totalNegativeKeywords += config.createNegativeExactKeywords ? keywordsCount : 0;
      }
      
      // Set state with preview data
      setState({
        isLoading: false,
        isPreviewVisible: true,
        items: previews,
        summary: combinedSummary,
        error: null
      });
      
    } catch (error) {
      console.error('Error generating preview:', error);
      setState({
        isLoading: false,
        isPreviewVisible: false,
        items: [],
        summary: null,
        error
      });
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }, [options.customerId, options.onError]);
  
  /**
   * Execute campaign clone after preview confirmation
   */
  const executeCampaignClone = useCallback(async (
    campaignIds: string | string[],
    config: CloneSettings
  ) => {
    if (!options.customerId) {
      throw new Error('Customer ID is required for campaign clone');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Convert single ID to array for consistent handling
      const campaignIdArray = Array.isArray(campaignIds) ? campaignIds : [campaignIds];
      
      // Determine if we should use bulk API (for more than 3 campaigns)
      const useBulkApi = campaignIdArray.length > 3;
      
      // Create operation for tracking
      const operationId = createOperation('campaign_clone', {
        customerId: options.customerId,
        campaignIds: campaignIdArray,
        config,
        totalItems: campaignIdArray.length,
        completedItems: 0,
        useBulkApi
      });
      
      // Start operation
      startOperation(operationId);
      addLog(operationId, 'info', `Starting campaign clone operation for ${campaignIdArray.length} campaigns`);
      addLog(operationId, 'info', `Using ${useBulkApi ? 'bulk' : 'sequential'} processing method`);
      
      // Create restore point before modifying anything
      const restorePointId = createRestorePoint(
        operationId, 
        'pre_campaign_clone', 
        {
          customerId: options.customerId,
          campaignIds: campaignIdArray
        },
        {
          name: 'Pre-clone restore point',
          description: 'Automatic restore point created before campaign clone operation'
        }
      );
      
      addLog(operationId, 'info', `Created restore point: ${restorePointId}`);
      
      let result;
      
      if (useBulkApi) {
        // For bulk operations, use the new bulk copy API with chunking
        addLog(operationId, 'info', `Using bulk API with chunking for ${campaignIdArray.length} campaigns`);
        
        result = await googleAdsApi.bulkCopyCampaigns(
          options.customerId,
          campaignIdArray,
          {
            nameTemplate: config.name === '' ? '{original}' : config.name,
            matchType: config.matchType as 'BROAD' | 'PHRASE',
            createNegativeExactKeywords: config.createNegativeExactKeywords
          },
          operationId,
          5 // Default chunk size of 5 campaigns
        );
        
        // Success/failure reporting
        const successCount = result.completedCampaigns.length;
        const failCount = result.failedCampaigns.length;
        
        if (failCount > 0) {
          addLog(
            operationId, 
            'warning', 
            `Operation completed with ${failCount} failures out of ${campaignIdArray.length} campaigns`,
            { 
              failedCampaigns: result.failedCampaigns,
              successRate: `${Math.round((successCount / campaignIdArray.length) * 100)}%`
            }
          );
        } else {
          addLog(
            operationId,
            'info',
            'All campaigns successfully cloned',
            { successCount }
          );
        }
      } else {
        // For small numbers of campaigns, use the original sequential approach
        addLog(operationId, 'info', 'Using sequential processing for small batch');
        
        const completedCampaigns = [];
        const failedCampaigns = [];
        
        // Process each campaign
        for (let i = 0; i < campaignIdArray.length; i++) {
          const campaignId = campaignIdArray[i];
          
          try {
            addLog(operationId, 'info', `Processing campaign ${i + 1} of ${campaignIdArray.length}: ${campaignId}`);
            
            // Fetch campaign data to get the name
            const campaignResponse = await googleAdsApi.makeRequest(
              options.customerId,
              'campaigns:search',
              {
                method: 'POST',
                body: JSON.stringify({
                  query: `
                    SELECT 
                      campaign.id,
                      campaign.name
                    FROM campaign
                    WHERE campaign.id = '${campaignId}'
                  `
                })
              }
            );
            
            if (!campaignResponse?.results?.[0]) {
              throw new Error(`Campaign not found: ${campaignId}`);
            }
            
            const campaignData = campaignResponse.results[0].campaign;
            
            // Generate name for this campaign based on pattern
            let newName = campaignData.name;
            if (config.matchType === 'BROAD') {
              newName = newName.replace('Exact', 'Broad').replace('EXACT', 'BROAD');
            } else if (config.matchType === 'PHRASE') {
              newName = newName.replace('Exact', 'Phrase').replace('EXACT', 'PHRASE');
            }
            
            // If the name didn't change with replacements, append the match type
            if (newName === campaignData.name) {
              newName = `${campaignData.name} - ${config.matchType === 'BROAD' ? 'Broad' : 'Phrase'} Match`;
            }
            
            // If a custom name was provided, use it
            if (config.name && config.name !== '{original}') {
              if (config.name.includes('{original}')) {
                newName = config.name.replace('{original}', campaignData.name);
              } else {
                newName = config.name;
              }
            }
            
            // Copy the campaign
            const copyResult = await googleAdsApi.copyCampaign(
              options.customerId,
              campaignId,
              {
                name: newName,
                matchType: config.matchType,
                createNegativeExactKeywords: config.createNegativeExactKeywords
              },
              operationId
            );
            
            completedCampaigns.push({
              id: campaignId,
              newCampaignId: copyResult.newCampaignId
            });
            
            // Update progress
            addLog(operationId, 'info', `Successfully copied campaign: ${campaignId} -> ${newName}`);
            updateProgress(operationId, Math.round(((i + 1) / campaignIdArray.length) * 100));
            
          } catch (error) {
            failedCampaigns.push({
              id: campaignId,
              error: error.message
            });
            
            addLog(operationId, 'error', `Failed to copy campaign ${campaignId}: ${error.message}`);
            // Continue with next campaign instead of failing the entire operation
          }
        }
        
        // Prepare result object similar to bulk API
        result = {
          success: failedCampaigns.length === 0,
          message: `Processed ${campaignIdArray.length} campaigns: ${completedCampaigns.length} successful, ${failedCampaigns.length} failed`,
          completedCampaigns,
          failedCampaigns,
          operationId
        };
      }
      
      // Mark operation as complete
      completeOperation(operationId);
      addLog(operationId, 'info', 'Campaign clone operation completed');
      
      // Close preview
      setState(prev => ({
        ...prev,
        isPreviewVisible: false,
        isLoading: false
      }));
      
      if (options.onComplete) {
        options.onComplete(operationId);
      }
      
    } catch (error) {
      console.error('Error executing campaign clone:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error
      }));
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }, [
    createOperation,
    startOperation,
    updateProgress,
    completeOperation,
    addLog,
    createRestorePoint,
    options.customerId,
    options.onComplete,
    options.onError
  ]);
  
  /**
   * Close the preview without taking action
   */
  const closePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewVisible: false
    }));
  }, []);
  
  return {
    isPreviewVisible,
    items,
    summary,
    isLoading,
    error,
    generateCampaignClonePreview,
    executeCampaignClone,
    closePreview
  };
}
