import { operationTracker, RestorePoint } from '../hooks/use-operation-tracking';
import { googleAdsApi } from '../lib/google-ads-api';

/**
 * Service for managing operation rollbacks
 */
export class RollbackService {
  private static instance: RollbackService;
  
  private constructor() {}
  
  static getInstance(): RollbackService {
    if (!RollbackService.instance) {
      RollbackService.instance = new RollbackService();
    }
    return RollbackService.instance;
  }
  
  /**
   * Execute a rollback for an operation
   */
  async rollbackOperation(
    operationId: string, 
    restorePointId?: string, 
    options?: { 
      force?: boolean; 
      customerId?: string; 
      silent?: boolean;
    }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Get the operation
      const operation = operationTracker.getOperation(operationId);
      if (!operation) {
        throw new Error(`Operation ${operationId} not found`);
      }
      
      // Get the restore point
      let restorePoint: RestorePoint | undefined;
      
      if (restorePointId) {
        // Get specific restore point
        restorePoint = operation.restorePoints.find(rp => rp.id === restorePointId);
        if (!restorePoint) {
          throw new Error(`Restore point ${restorePointId} not found`);
        }
      } else {
        // Get latest restore point
        if (operation.restorePoints.length === 0) {
          throw new Error('No restore points available for this operation');
        }
        
        restorePoint = operation.restorePoints.reduce((latest, current) => 
          latest.timestamp > current.timestamp ? latest : current
        );
      }
      
      // Log rollback attempt
      if (!options?.silent) {
        operationTracker.addLog(
          operationId,
          'info',
          `Attempting rollback using restore point: ${restorePoint.metadata?.name || restorePoint.type}`,
          { restorePointId: restorePoint.id }
        );
      }
      
      // Handle different restore point types
      switch (restorePoint.type) {
        case 'campaign_creation':
          return await this.rollbackCampaignCreation(
            restorePoint,
            options?.customerId || operation.metadata.customerId
          );
        
        case 'campaign_update':
          return await this.rollbackCampaignUpdate(
            restorePoint,
            options?.customerId || operation.metadata.customerId
          );
          
        case 'ad_group_creation':
          return await this.rollbackAdGroupCreation(
            restorePoint,
            options?.customerId || operation.metadata.customerId
          );
          
        case 'keyword_creation':
          return await this.rollbackKeywordCreation(
            restorePoint,
            options?.customerId || operation.metadata.customerId
          );
          
        default:
          throw new Error(`Unsupported restore point type: ${restorePoint.type}`);
      }
      
    } catch (error) {
      console.error('Rollback error:', error);
      return {
        success: false,
        message: `Failed to execute rollback: ${error.message}`,
        details: error
      };
    }
  }
  
  /**
   * Rollback a campaign creation
   */
  private async rollbackCampaignCreation(
    restorePoint: RestorePoint,
    customerId: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const campaignId = restorePoint.metadata?.resourceId;
      
      if (!campaignId) {
        throw new Error('Campaign ID not found in restore point');
      }
      
      // Make campaign removal request
      await googleAdsApi.makeRequest(
        customerId,
        'campaigns:mutate',
        {
          method: 'POST',
          body: JSON.stringify({
            operations: [
              {
                remove: campaignId
              }
            ]
          })
        }
      );
      
      return {
        success: true,
        message: `Successfully removed campaign ${campaignId}`,
        details: { campaignId }
      };
      
    } catch (error) {
      throw new Error(`Failed to rollback campaign creation: ${error.message}`);
    }
  }
  
  /**
   * Rollback a campaign update
   */
  private async rollbackCampaignUpdate(
    restorePoint: RestorePoint,
    customerId: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const { previousState } = restorePoint.data;
      
      if (!previousState || !previousState.id) {
        throw new Error('Previous campaign state not found in restore point');
      }
      
      // Create update operation
      const updateOperation = {
        update: {
          ...previousState,
          resourceName: `customers/${customerId}/campaigns/${previousState.id}`
        },
        updateMask: {
          paths: Object.keys(previousState).filter(key => key !== 'id' && key !== 'resourceName')
        }
      };
      
      // Make update request
      await googleAdsApi.makeRequest(
        customerId,
        'campaigns:mutate',
        {
          method: 'POST',
          body: JSON.stringify({
            operations: [updateOperation]
          })
        }
      );
      
      return {
        success: true,
        message: `Successfully restored campaign ${previousState.id} to previous state`,
        details: { campaignId: previousState.id }
      };
      
    } catch (error) {
      throw new Error(`Failed to rollback campaign update: ${error.message}`);
    }
  }
  
  /**
   * Rollback an ad group creation
   */
  private async rollbackAdGroupCreation(
    restorePoint: RestorePoint,
    customerId: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const adGroupId = restorePoint.metadata?.resourceId;
      
      if (!adGroupId) {
        throw new Error('Ad group ID not found in restore point');
      }
      
      // Make ad group removal request
      await googleAdsApi.makeRequest(
        customerId,
        'adGroups:mutate',
        {
          method: 'POST',
          body: JSON.stringify({
            operations: [
              {
                remove: adGroupId
              }
            ]
          })
        }
      );
      
      return {
        success: true,
        message: `Successfully removed ad group ${adGroupId}`,
        details: { adGroupId }
      };
      
    } catch (error) {
      throw new Error(`Failed to rollback ad group creation: ${error.message}`);
    }
  }
  
  /**
   * Rollback keyword creation
   */
  private async rollbackKeywordCreation(
    restorePoint: RestorePoint,
    customerId: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const keywordIds = restorePoint.data.keywordIds;
      
      if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
        throw new Error('Keyword IDs not found in restore point');
      }
      
      // Create operations
      const operations = keywordIds.map(id => ({
        remove: id
      }));
      
      // Make keyword removal request
      await googleAdsApi.makeRequest(
        customerId,
        'adGroupCriteria:mutate',
        {
          method: 'POST',
          body: JSON.stringify({ operations })
        }
      );
      
      return {
        success: true,
        message: `Successfully removed ${keywordIds.length} keywords`,
        details: { keywordIds, count: keywordIds.length }
      };
      
    } catch (error) {
      throw new Error(`Failed to rollback keyword creation: ${error.message}`);
    }
  }
}

export const rollbackService = RollbackService.getInstance();
