/**
 * Monitoring and metrics types for the monitoring dashboard
 */

// Operation types supported by the monitoring dashboard
export type OperationType = 
  | 'campaignCreation' 
  | 'keywordUpdate' 
  | 'budgetAdjustment' 
  | 'adGroupModification';

// Available timeframes for metrics filtering
export type MetricsTimeframe = 
  | 'last24Hours' 
  | 'lastWeek' 
  | 'lastMonth' 
  | 'lastQuarter';

// API Usage metrics structure
export interface ApiUsageMetric {
  timestamp: string;
  count: number;
  quota: number;
  endpoint: string;
}

export interface ApiUsageData {
  metrics: ApiUsageMetric[];
  totalRequests: number;
  quotaUtilization: number;
  topEndpoints: {
    endpoint: string;
    count: number;
    percentage: number;
  }[];
}

export interface RateLimitEvent {
  timestamp: string;
  endpoint: string;
  duration: number;
  quotaExceeded: boolean;
}

// Operation metrics structure
export interface OperationCount {
  name: string;
  count: number;
  percentage: number;
}

export interface SuccessRate {
  name: string;
  successRate: number;
  total: number;
  successful: number;
  failed: number;
}

export interface ErrorBreakdown {
  type: string;
  count: number;
  percentage: number;
  description: string;
}

// Performance metrics structure
export interface PerformanceMetricPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
}

export interface PerformanceInsight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
}

export interface PerformanceMetrics {
  avgResponseTime: ComparisonMetric;
  throughput: ComparisonMetric;
  errorRate: ComparisonMetric;
  trends: PerformanceMetricPoint[];
  insights: PerformanceInsight[];
  recommendations: string;
}

// Monitoring dashboard configuration
export interface MonitoringDashboardConfig {
  defaultOperation: OperationType;
  defaultTimeframe: MetricsTimeframe;
  refreshInterval: number; // in milliseconds
  enableAutoRefresh: boolean;
}
