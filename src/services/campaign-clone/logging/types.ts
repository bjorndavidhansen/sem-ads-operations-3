import { ErrorCategory, RecoveryStrategy } from '../error-types';
import { OperationStage } from '../../../types/campaignClone';

/**
 * Log severity levels following standard logging conventions
 * Used for filtering and alerting based on severity
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/**
 * Categories of log entries for easier filtering and analysis
 */
export type LogCategory = 'OPERATION' | 'ERROR' | 'RECOVERY' | 'PERFORMANCE';

/**
 * Structured log entry with standardized fields
 * Ensures consistent logging format across the application
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context: Record<string, unknown>;
  metadata: LogMetadata;
}

/**
 * Standardized metadata for all log entries
 * Enables advanced filtering and aggregation
 */
export interface LogMetadata {
  operationId: string;
  stage: OperationStage;
  duration?: number;
  resourceCount?: number;
  errorCategory?: ErrorCategory;
  recoveryStrategy?: RecoveryStrategy;
}

/**
 * Analytics event structure for integration with monitoring
 */
export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Performance metric structure for monitoring system performance
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percentage';
  timestamp: string;
  tags: Record<string, string>;
}

/**
 * Configuration options for the log persistence layer
 */
export interface LogPersistenceOptions {
  retentionDays: number;
  maxEntriesPerOperation: number;
  compressionEnabled: boolean;
}
