/**
 * Campaign Validation Service
 * 
 * Validates campaign operations before execution to prevent errors
 * and ensure compliance with best practices.
 */
import { 
  Campaign,
  CampaignCloneConfig, 
  CampaignValidationResult,
  ValidationIssue,
  MatchType
} from '../types/campaign-types';

/**
 * Validate a list of campaigns for the clone operation
 * 
 * @param campaigns List of campaigns to validate
 * @param config Clone operation configuration
 * @returns Validation result with issues and warnings
 */
export const validateCampaignsForCloning = (
  campaigns: Campaign[],
  config: CampaignCloneConfig
): CampaignValidationResult => {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  
  // Check if any campaigns are provided
  if (campaigns.length === 0) {
    issues.push({
      code: 'NO_CAMPAIGNS',
      message: 'No campaigns selected for cloning',
      severity: 'error'
    });
    
    return {
      valid: false,
      issues,
      warnings
    };
  }
  
  // Track counts for impact assessment
  let totalKeywords = 0;
  let totalAdGroups = 0;
  
  // Validate each campaign
  campaigns.forEach(campaign => {
    // Check campaign status
    if (campaign.status === 'removed') {
      warnings.push({
        code: 'REMOVED_CAMPAIGN',
        message: `Campaign "${campaign.name}" is in removed state`,
        entityId: campaign.id,
        entityType: 'campaign',
        severity: 'warning'
      });
    }
    
    // Check for existing campaign with the same name as the target
    const newName = generateCloneName(
      campaign.name,
      config.namingPattern,
      config.sourceMatchType,
      config.targetMatchType
    );
    
    // This would actually query the API in a real implementation
    if (newName.includes('Duplicate')) {
      issues.push({
        code: 'DUPLICATE_NAME',
        message: `A campaign with the name "${newName}" already exists`,
        entityId: campaign.id,
        entityType: 'campaign',
        severity: 'error'
      });
    }
    
    // Check keyword match types
    let keywordsWithWrongMatchType = 0;
    
    campaign.adGroups.forEach(adGroup => {
      totalAdGroups++;
      totalKeywords += adGroup.keywords.length;
      
      adGroup.keywords.forEach(keyword => {
        if (keyword.matchType !== config.sourceMatchType) {
          keywordsWithWrongMatchType++;
        }
      });
    });
    
    // Add warning if there are keywords with the wrong match type
    if (keywordsWithWrongMatchType > 0) {
      warnings.push({
        code: 'WRONG_MATCH_TYPE',
        message: `Campaign "${campaign.name}" has ${keywordsWithWrongMatchType} keywords that are not ${config.sourceMatchType} match`,
        entityId: campaign.id,
        entityType: 'campaign',
        severity: 'warning'
      });
    }
    
    // Check for empty ad groups (no keywords)
    const emptyAdGroups = campaign.adGroups.filter(adGroup => adGroup.keywords.length === 0);
    if (emptyAdGroups.length > 0) {
      warnings.push({
        code: 'EMPTY_ADGROUPS',
        message: `Campaign "${campaign.name}" has ${emptyAdGroups.length} ad groups with no keywords`,
        entityId: campaign.id,
        entityType: 'campaign',
        severity: 'warning'
      });
    }
    
    // Check for ad groups with no ads
    const adGroupsWithNoAds = campaign.adGroups.filter(adGroup => adGroup.ads.length === 0);
    if (adGroupsWithNoAds.length > 0) {
      warnings.push({
        code: 'NO_ADS',
        message: `Campaign "${campaign.name}" has ${adGroupsWithNoAds.length} ad groups with no ads`,
        entityId: campaign.id,
        entityType: 'campaign',
        severity: 'warning'
      });
    }
  });
  
  // Calculate estimated cost impact based on keyword volume and bid adjustments
  const averageCostPerKeyword = 0.75; // This would be calculated from historical data
  let estimatedCost = totalKeywords * averageCostPerKeyword;
  
  // Adjust cost based on bid adjustment factor if applicable
  if (config.adjustBids && config.bidAdjustmentFactor) {
    estimatedCost *= config.bidAdjustmentFactor;
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    estimatedImpact: {
      newKeywords: totalKeywords,
      newAdGroups: totalAdGroups,
      newCampaigns: campaigns.length,
      estimatedCost
    }
  };
};

/**
 * Generate a name for the cloned campaign based on the pattern
 * 
 * @param originalName Original campaign name
 * @param pattern Naming pattern
 * @param sourceMatchType Source match type
 * @param targetMatchType Target match type
 * @returns Generated campaign name
 */
export const generateCloneName = (
  originalName: string,
  pattern: string,
  sourceMatchType: MatchType,
  targetMatchType: MatchType
): string => {
  return pattern
    .replace('{originalName}', originalName)
    .replace('{sourceMatchType}', formatMatchType(sourceMatchType))
    .replace('{targetMatchType}', formatMatchType(targetMatchType));
};

/**
 * Format match type for display (capitalize first letter)
 * 
 * @param matchType Match type to format
 * @returns Formatted match type
 */
export const formatMatchType = (matchType: MatchType): string => {
  return matchType.charAt(0).toUpperCase() + matchType.slice(1);
};

export default {
  validateCampaignsForCloning,
  generateCloneName,
  formatMatchType
};
