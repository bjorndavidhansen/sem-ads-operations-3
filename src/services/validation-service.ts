import { ValidationRule, ValidationResult, ValidationSeverity, ChangePreviewItem, ValidationSummary } from '../types/validation';
import { campaignCloneRuleset } from '../utils/validation-rules';

/**
 * Service for validating and generating change previews
 */
export class ValidationService {
  private static instance: ValidationService;
  private rules: Map<string, ValidationRule> = new Map();
  
  private constructor() {
    // Register default rules
    this.registerRules(campaignCloneRuleset);
  }
  
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }
  
  /**
   * Register validation rules
   */
  registerRules(rules: ValidationRule[]): void {
    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }
  
  /**
   * Get a validation rule by ID
   */
  getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }
  
  /**
   * Apply validation rules to data
   */
  validate(data: any, ruleIds?: string[], context?: any): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Determine which rules to apply
    const rulesToApply = ruleIds
      ? ruleIds.map(id => this.rules.get(id)).filter(Boolean) as ValidationRule[]
      : Array.from(this.rules.values());
    
    // Apply each rule
    for (const rule of rulesToApply) {
      const ruleResults = rule.validate(data, context);
      results.push(...ruleResults);
    }
    
    return results;
  }
  
  /**
   * Generate change preview for campaign cloning
   */
  generateCampaignClonePreview(
    sourceCampaignData: any, 
    copyConfig: { 
      name: string; 
      matchType: 'BROAD' | 'PHRASE'; 
      createNegativeExactKeywords: boolean; 
    },
    accountContext?: any
  ): { items: ChangePreviewItem[], summary: ValidationSummary } {
    const previewItems: ChangePreviewItem[] = [];
    const now = new Date();
    let totalKeywords = 0;
    
    // Create campaign preview item
    const campaignItem: ChangePreviewItem = {
      id: `preview-campaign-${now.getTime()}`,
      entityType: 'campaign',
      name: copyConfig.name,
      before: {
        name: sourceCampaignData.name,
        status: sourceCampaignData.status,
        budget: sourceCampaignData.budget
      },
      after: {
        name: copyConfig.name,
        status: sourceCampaignData.status,
        budget: sourceCampaignData.budget
      },
      impacts: []
    };
    
    // Validate campaign data
    const campaignValidationResults = this.validate(
      { 
        name: copyConfig.name, 
        config: copyConfig,
        sourceCampaignData,
        activeCampaignCount: accountContext?.activeCampaignCount || 0
      }
    );
    
    campaignItem.validationResults = campaignValidationResults;
    
    // Add budget impact if available
    if (sourceCampaignData.budget) {
      campaignItem.impacts?.push({
        id: 'budget-impact',
        type: 'budget',
        description: `Additional budget allocation of ${sourceCampaignData.budget.amount} ${sourceCampaignData.budget.currency}`,
        severity: ValidationSeverity.INFO,
        metrics: [
          {
            name: 'Budget',
            value: sourceCampaignData.budget.amount,
            unit: sourceCampaignData.budget.currency,
            trend: 'up'
          }
        ]
      });
    }
    
    previewItems.push(campaignItem);
    
    // Create ad group previews
    if (sourceCampaignData.adGroups) {
      sourceCampaignData.adGroups.forEach((adGroup: any, index: number) => {
        const adGroupItem: ChangePreviewItem = {
          id: `preview-adgroup-${now.getTime()}-${index}`,
          entityType: 'adGroup',
          name: adGroup.name,
          before: {
            name: adGroup.name,
            status: adGroup.status
          },
          after: {
            name: adGroup.name,
            status: adGroup.status
          }
        };
        
        previewItems.push(adGroupItem);
        
        // Create keyword previews
        if (adGroup.keywords) {
          totalKeywords += adGroup.keywords.length;
          
          adGroup.keywords.forEach((keyword: any, kIndex: number) => {
            const keywordItem: ChangePreviewItem = {
              id: `preview-keyword-${now.getTime()}-${index}-${kIndex}`,
              entityType: 'keyword',
              name: keyword.text,
              before: {
                text: keyword.text,
                matchType: keyword.matchType
              },
              after: {
                text: keyword.text,
                matchType: copyConfig.matchType
              },
              impacts: [
                {
                  id: 'match-type-change',
                  type: 'matchType',
                  description: `Match type will change from ${keyword.matchType} to ${copyConfig.matchType}`,
                  severity: ValidationSeverity.INFO
                }
              ]
            };
            
            // Validate match type conversion
            const keywordValidationResults = this.validate(
              {
                sourceMatchType: keyword.matchType,
                targetMatchType: copyConfig.matchType,
                createNegativeExactKeywords: copyConfig.createNegativeExactKeywords
              },
              ['match-type-conversion']
            );
            
            keywordItem.validationResults = keywordValidationResults;
            previewItems.push(keywordItem);
            
            // If creating negative keywords, add them to preview
            if (copyConfig.createNegativeExactKeywords && keyword.matchType === 'EXACT') {
              const negativeKeywordItem: ChangePreviewItem = {
                id: `preview-neg-keyword-${now.getTime()}-${index}-${kIndex}`,
                entityType: 'negativeKeyword',
                name: keyword.text,
                before: undefined,
                after: {
                  text: keyword.text,
                  matchType: 'EXACT',
                  negative: true
                }
              };
              
              previewItems.push(negativeKeywordItem);
            }
          });
        }
      });
    }
    
    // Validate for negative keyword overlap
    const negativeKeywordResults = this.validate(
      {
        createNegativeExactKeywords: copyConfig.createNegativeExactKeywords,
        keywordCount: totalKeywords
      },
      ['negative-keyword-overlap']
    );
    
    // Build summary
    const summary: ValidationSummary = {
      totalChanges: previewItems.length,
      validationResults: {
        errors: [],
        warnings: [],
        info: []
      },
      entityBreakdown: {
        campaigns: previewItems.filter(i => i.entityType === 'campaign').length,
        adGroups: previewItems.filter(i => i.entityType === 'adGroup').length,
        keywords: previewItems.filter(i => i.entityType === 'keyword').length,
        negativeKeywords: previewItems.filter(i => i.entityType === 'negativeKeyword').length
      },
      timestamp: now
    };
    
    // Collect all validation results for summary
    for (const item of previewItems) {
      if (item.validationResults) {
        for (const result of item.validationResults) {
          if (result.severity === ValidationSeverity.ERROR) {
            summary.validationResults.errors.push(result);
          } else if (result.severity === ValidationSeverity.WARNING) {
            summary.validationResults.warnings.push(result);
          } else {
            summary.validationResults.info.push(result);
          }
        }
      }
    }
    
    // Add negative keyword results to summary
    for (const result of negativeKeywordResults) {
      if (result.severity === ValidationSeverity.ERROR) {
        summary.validationResults.errors.push(result);
      } else if (result.severity === ValidationSeverity.WARNING) {
        summary.validationResults.warnings.push(result);
      } else {
        summary.validationResults.info.push(result);
      }
    }
    
    return { items: previewItems, summary };
  }
}

export const validationService = ValidationService.getInstance();
