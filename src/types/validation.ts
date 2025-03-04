/**
 * Types related to validation and change preview functionality
 */

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (data: any, context?: any) => ValidationResult[];
}

export interface ValidationResult {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  contextData?: any;
  suggestion?: string;
}

export interface ChangePreviewItem {
  id: string;
  entityType: 'campaign' | 'adGroup' | 'keyword' | 'negativeKeyword';
  name: string;
  before?: any;
  after: any;
  validationResults?: ValidationResult[];
  impacts?: ChangeImpact[];
}

export interface ChangeImpact {
  id: string;
  type: 'budget' | 'quality' | 'matchType' | 'targeting';
  description: string;
  severity: ValidationSeverity;
  metrics?: {
    name: string;
    value: number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

export interface ValidationSummary {
  totalChanges: number;
  validationResults: {
    errors: ValidationResult[];
    warnings: ValidationResult[];
    info: ValidationResult[];
  };
  entityBreakdown: {
    campaigns: number;
    adGroups: number;
    keywords: number;
    negativeKeywords: number;
  };
  timestamp: Date;
}
