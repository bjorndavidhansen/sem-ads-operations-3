/**
 * Type definitions for campaign operations, including clone operation
 */

export type MatchType = 'exact' | 'phrase' | 'broad';

export type CampaignStatus = 'enabled' | 'paused' | 'removed';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget: {
    amount: number;
    deliveryMethod: 'standard' | 'accelerated';
  };
  targetRoas?: number;
  bidStrategy: 'manual_cpc' | 'target_roas' | 'maximize_conversions';
  networkSettings: {
    targetGoogleSearch: boolean;
    targetSearchNetwork: boolean;
    targetContentNetwork: boolean;
    targetPartnerSearchNetwork: boolean;
  };
  adGroups: AdGroup[];
  labels: string[];
  startDate: string;
  endDate?: string;
  createdAt: string;
  accountId: string;
}

export interface AdGroup {
  id: string;
  name: string;
  status: 'enabled' | 'paused' | 'removed';
  cpcBid?: number;
  keywords: Keyword[];
  ads: Ad[];
}

export interface Keyword {
  id: string;
  text: string;
  matchType: MatchType;
  status: 'enabled' | 'paused' | 'removed';
  cpcBid?: number;
  finalUrls?: string[];
  finalMobileUrls?: string[];
  finalAppUrls?: AppUrl[];
  trackingUrlTemplate?: string;
  performanceMetrics?: KeywordPerformanceMetrics;
}

export interface Ad {
  id: string;
  type: 'text' | 'responsive_search' | 'expanded_text';
  headlines: AdTextAsset[];
  descriptions: AdTextAsset[];
  path1?: string;
  path2?: string;
  finalUrls: string[];
  finalMobileUrls?: string[];
  finalAppUrls?: AppUrl[];
  trackingUrlTemplate?: string;
}

export interface AdTextAsset {
  text: string;
  pinned?: boolean;
}

export interface AppUrl {
  os: 'ANDROID' | 'IOS';
  url: string;
}

export interface KeywordPerformanceMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  averageCpc: number;
  ctr: number;
  averagePosition?: number;
}

export interface CampaignCloneConfig {
  sourceMatchType: MatchType;
  targetMatchType: MatchType;
  addNegativeKeywords: boolean;
  namingPattern: string; // e.g., "{originalName} - {targetMatchType}"
  adjustBids: boolean;
  bidAdjustmentFactor?: number; // e.g., 0.8 for 80% of original bids
  includeAdGroups: boolean;
  includeAds: boolean;
  includeExtensions: boolean;
  updateFinalUrls: boolean;
  finalUrlPattern?: string;
}

export interface CloneOperation {
  id: string;
  sourceCampaignIds: string[];
  config: CampaignCloneConfig;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  createdCampaignIds: string[];
  errors: OperationError[];
  createdAt: string;
  completedAt?: string;
  userId: string;
}

export interface OperationError {
  code: string;
  message: string;
  entityId?: string;
  entityType?: 'campaign' | 'adGroup' | 'keyword' | 'ad';
  severity: 'warning' | 'error';
  recoverable: boolean;
  timestamp: string;
}

export interface CampaignValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  estimatedImpact?: {
    newKeywords: number;
    newAdGroups: number;
    newCampaigns: number;
    estimatedCost: number;
  };
}

export interface ValidationIssue {
  code: string;
  message: string;
  entityId?: string;
  entityType?: 'campaign' | 'adGroup' | 'keyword' | 'ad';
  severity: 'warning' | 'error';
}

export type CampaignSelectionFilter = {
  name?: string;
  status?: CampaignStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  labels?: string[];
  performanceThresholds?: {
    minClicks?: number;
    minConversions?: number;
    minImpressions?: number;
    minCtr?: number;
  };
};
