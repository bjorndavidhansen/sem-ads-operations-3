/**
 * Dashboard metric types and interfaces
 * 
 * Provides type definitions for dashboard metrics, visualizations, and data structures
 */

import { Operation, OperationStatus, LogContext } from './operation-types';

/**
 * Time range options for filtering dashboard data
 */
export type TimeRange = '1h' | '24h' | '7d' | '30d' | 'all';

/**
 * Visualization types supported by dashboard widgets
 */
export type VisualizationType = 'line' | 'bar' | 'gauge' | 'pie' | 'heatmap' | 'table';

/**
 * Trend direction for metric comparisons
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Dashboard metric identifier
 */
export type MetricId = 
  | 'success-rate' 
  | 'duration-trends' 
  | 'resource-recovery' 
  | 'error-frequency'
  | 'rollback-volume';

/**
 * Dashboard metric configuration
 */
export interface DashboardMetric {
  id: MetricId;
  title: string;
  description?: string;
  visualization: VisualizationType;
  dataSource: () => Promise<MetricData>;
  refreshInterval?: number; // milliseconds
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

/**
 * Base metric data structure
 */
export interface MetricData {
  current: number;
  comparison?: number;
  trend?: TrendDirection;
  timestamp: Date;
  unit?: string;
  additionalData?: any;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

/**
 * Time series data structure
 */
export interface TimeSeriesData extends MetricData {
  series: TimeSeriesPoint[];
}

/**
 * Categorical data point
 */
export interface CategoryPoint {
  category: string;
  value: number;
  color?: string;
}

/**
 * Categorical data structure
 */
export interface CategoryData extends MetricData {
  categories: CategoryPoint[];
}

/**
 * Filterable dashboard state
 */
export interface DashboardFilters {
  timeRange: TimeRange;
  operationTypes?: string[];
  statuses?: OperationStatus[];
  contexts?: LogContext[];
  customerId?: string;
  searchTerm?: string;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  metric: MetricId;
  title?: string;
  size: 'small' | 'medium' | 'large';
  position: {
    row: number;
    col: number;
  };
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  filters: DashboardFilters;
}

/**
 * Dashboard state
 */
export interface DashboardState {
  currentLayout: DashboardLayout;
  filters: DashboardFilters;
  metrics: Record<MetricId, MetricData>;
  loading: boolean;
  error?: Error;
}
