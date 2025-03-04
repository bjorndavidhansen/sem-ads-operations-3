import { ValidationRule, ValidationResult, ValidationSeverity } from '../types/validation';

/**
 * Campaign clone operation validation rules
 */

export const namingConventionRule: ValidationRule = {
  id: 'campaign-naming-convention',
  name: 'Campaign Naming Convention',
  description: 'Validates that campaign names follow the required naming conventions',
  validate: (data, context) => {
    const results: ValidationResult[] = [];
    const { name, config } = data;
    
    // Check for match type designation in name
    if (config.matchType === 'BROAD' && !name.includes('Broad')) {
      results.push({
        ruleId: 'campaign-naming-convention',
        severity: ValidationSeverity.WARNING,
        message: 'Broad match campaign name should contain "Broad" designation',
        suggestion: `Consider renaming to include "Broad" (e.g., "${name} - Broad")`
      });
    }
    
    // Check for name length
    if (name.length > 100) {
      results.push({
        ruleId: 'campaign-naming-convention',
        severity: ValidationSeverity.ERROR,
        message: 'Campaign name exceeds 100 character limit',
        suggestion: `Shorten name to less than 100 characters`
      });
    }
    
    return results;
  }
};

export const matchTypeConversionRule: ValidationRule = {
  id: 'match-type-conversion',
  name: 'Match Type Conversion',
  description: 'Validates match type conversion for keywords',
  validate: (data, context) => {
    const results: ValidationResult[] = [];
    const { sourceMatchType, targetMatchType } = data;
    
    // Check for potentially problematic conversions
    if (sourceMatchType === 'EXACT' && targetMatchType === 'BROAD') {
      results.push({
        ruleId: 'match-type-conversion',
        severity: ValidationSeverity.INFO,
        message: 'Converting from Exact to Broad match may significantly increase traffic',
        suggestion: 'Review negative keyword strategy and budget allocations'
      });
      
      // Check if creating negative exact keywords
      if (!data.createNegativeExactKeywords) {
        results.push({
          ruleId: 'match-type-conversion',
          severity: ValidationSeverity.WARNING,
          message: 'Converting to Broad match without adding negative exact keywords may cause cannibalization',
          suggestion: 'Enable negative exact keyword creation'
        });
      }
    }
    
    return results;
  }
};

export const budgetAllocationRule: ValidationRule = {
  id: 'budget-allocation',
  name: 'Budget Allocation',
  description: 'Validates budget allocation for cloned campaigns',
  validate: (data, context) => {
    const results: ValidationResult[] = [];
    const { sourceCampaignData, activeCampaignCount } = data;
    
    // Warn about budget implications
    if (activeCampaignCount > 0 && sourceCampaignData?.budget) {
      results.push({
        ruleId: 'budget-allocation',
        severity: ValidationSeverity.WARNING,
        message: `Creating a copy will allocate additional budget (${sourceCampaignData.budget.amount} ${sourceCampaignData.budget.currency})`,
        suggestion: 'Review account budget allocation after cloning'
      });
    }
    
    return results;
  }
};

export const negativeKeywordOverlapRule: ValidationRule = {
  id: 'negative-keyword-overlap',
  name: 'Negative Keyword Overlap',
  description: 'Checks for potential negative keyword conflicts',
  validate: (data, context) => {
    const results: ValidationResult[] = [];
    const { createNegativeExactKeywords, keywordCount } = data;
    
    if (createNegativeExactKeywords && keywordCount > 0) {
      results.push({
        ruleId: 'negative-keyword-overlap',
        severity: ValidationSeverity.INFO,
        message: `Will create ${keywordCount} negative exact keywords`,
        contextData: { count: keywordCount }
      });
    }
    
    return results;
  }
};

// Combine all rules into a ruleset for campaign cloning
export const campaignCloneRuleset: ValidationRule[] = [
  namingConventionRule,
  matchTypeConversionRule,
  budgetAllocationRule,
  negativeKeywordOverlapRule
];
