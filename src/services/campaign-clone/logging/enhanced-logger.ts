import { CategorizedError } from '../error-types';
import { ExecutionContext, OperationStage } from '../../../types/campaignClone';
import {
  LogEntry,
  LogLevel,
  LogCategory,
  LogMetadata,
  AnalyticsEvent,
  PerformanceMetric
} from './types';

/**
 * Service interfaces for dependency injection
 */
interface AnalyticsService {
  track(event: AnalyticsEvent): Promise<void>;
}

interface MetricsCollector {
  recordMetric(metric: PerformanceMetric): Promise<void>;
  incrementCounter(name: string, tags: Record<string, string>): Promise<void>;
}

interface LogPersistenceLayer {
  store(entry: LogEntry): Promise<void>;
}

/**
 * Recovery action types for logging
 */
interface RecoveryAction {
  type: string;
  strategy: string;
  duration?: number;
}

/**
 * Enhanced Logger - Comprehensive logging system for Campaign Clone operations
 * Implements singleton pattern for consistent logging across the application
 * Integrates with analytics and provides structured error tracking
 */
export class EnhancedLogger {
  private static instance: EnhancedLogger;
  private analyticsService: AnalyticsService;
  private metricsCollector: MetricsCollector;
  private persistenceLayer: LogPersistenceLayer;

  // For testing
  static mockServices: {
    analyticsService?: AnalyticsService;
    metricsCollector?: MetricsCollector;
    persistenceLayer?: LogPersistenceLayer;
  } = {};

  private constructor() {
    // In a real implementation, these would be proper injected services
    this.analyticsService = EnhancedLogger.mockServices.analyticsService || {
      track: async () => {}
    };
    this.metricsCollector = EnhancedLogger.mockServices.metricsCollector || {
      recordMetric: async () => {},
      incrementCounter: async () => {}
    };
    this.persistenceLayer = EnhancedLogger.mockServices.persistenceLayer || {
      store: async () => {}
    };
  }

  /**
   * Get the singleton instance of the logger
   * Following singleton pattern from project guidelines
   */
  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  /**
   * Logs the start of an operation stage with enriched context
   * @param context The execution context of the operation
   * @param stage The current operation stage
   */
  async logOperationStart(
    context: ExecutionContext,
    stage: OperationStage
  ): Promise<void> {
    const entry = this.createLogEntry({
      level: 'INFO',
      category: 'OPERATION',
      message: `Starting operation stage: ${stage}`,
      context: this.extractContext(context),
      metadata: {
        operationId: context.operationId,
        stage,
        resourceCount: this.calculateResourceCount(context)
      }
    });

    await this.persistAndTrack(entry);
    await this.trackMetric('operation_start', {
      stage,
      resourceCount: entry.metadata.resourceCount
    });
  }

  /**
   * Logs errors with full context and initiates error tracking
   * Implements comprehensive error categorization from Error Handling Architecture
   * @param error The categorized error to log
   * @param context The execution context of the operation
   */
  async logError(
    error: CategorizedError,
    context: ExecutionContext
  ): Promise<void> {
    const entry = this.createLogEntry({
      level: 'ERROR',
      category: 'ERROR',
      message: error.message,
      context: {
        ...this.extractContext(context),
        errorDetails: error.context,
        stackTrace: error.stack
      },
      metadata: {
        operationId: context.operationId,
        stage: context.currentStage,
        errorCategory: error.definition.category,
        recoveryStrategy: error.recoveryStrategy
      }
    });

    await this.persistAndTrack(entry);
    await this.trackErrorMetrics(error);
  }

  /**
   * Logs recovery actions with outcome tracking
   * Part of the multi-level recovery strategies from Error Handling Architecture
   * @param action The recovery action that was attempted
   * @param context The execution context of the operation
   * @param success Whether the recovery was successful
   */
  async logRecoveryAction(
    action: RecoveryAction,
    context: ExecutionContext,
    success: boolean
  ): Promise<void> {
    const entry = this.createLogEntry({
      level: success ? 'INFO' : 'WARN',
      category: 'RECOVERY',
      message: `Recovery action ${action.type}: ${success ? 'succeeded' : 'failed'}`,
      context: {
        ...this.extractContext(context),
        actionDetails: action,
        success
      },
      metadata: {
        operationId: context.operationId,
        stage: context.currentStage,
        recoveryStrategy: action.strategy
      }
    });

    await this.persistAndTrack(entry);
    await this.trackMetric('recovery_action', {
      type: action.type,
      success: success ? 'true' : 'false',
      duration: action.duration?.toString() || '0'
    });
  }

  /**
   * Logs performance metrics with threshold checking
   * @param metric The performance metric to log
   * @param context The execution context of the operation
   */
  async logPerformanceMetric(
    metric: PerformanceMetric,
    context: ExecutionContext
  ): Promise<void> {
    const entry = this.createLogEntry({
      level: this.determineMetricSeverity(metric),
      category: 'PERFORMANCE',
      message: `Performance metric: ${metric.name} = ${metric.value}${metric.unit}`,
      context: {
        ...this.extractContext(context),
        metric
      },
      metadata: {
        operationId: context.operationId,
        stage: context.currentStage,
        duration: metric.value
      }
    });

    await this.persistAndTrack(entry);
    await this.metricsCollector.recordMetric(metric);
  }

  /**
   * Creates a standardized log entry with required fields
   * @param params Log entry parameters
   * @returns Complete log entry with ID and timestamp
   */
  private createLogEntry(params: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    return {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      ...params
    };
  }

  /**
   * Extracts relevant context from the execution context
   * @param context The execution context of the operation
   * @returns Simplified context for logging
   */
  private extractContext(context: ExecutionContext): Record<string, unknown> {
    return {
      campaigns: Array.from(context.campaignMapping.keys()),
      adGroups: Array.from(context.adGroupMapping.keys()),
      keywords: Array.from(context.keywordMapping.keys()),
      errors: context.errors.length,
      warnings: context.warnings.length
    };
  }

  /**
   * Calculates the total number of resources in the operation
   * @param context The execution context of the operation
   * @returns Total resource count
   */
  private calculateResourceCount(context: ExecutionContext): number {
    return (
      context.campaignMapping.size +
      context.adGroupMapping.size +
      context.keywordMapping.size
    );
  }

  /**
   * Persists log entry and tracks analytics event
   * Implements proper error handling with try/catch as per coding guidelines
   * @param entry Log entry to persist and track
   */
  private async persistAndTrack(entry: LogEntry): Promise<void> {
    try {
      await Promise.all([
        this.persistenceLayer.store(entry),
        this.analyticsService.track(this.transformToAnalyticsEvent(entry))
      ]);
    } catch (error) {
      // Fallback to console in case of persistence failure
      console.error('Failed to persist log entry:', error);
      console.log('Log Entry:', entry);
    }
  }

  /**
   * Generates a unique ID for each log entry
   * @returns Unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Transforms a log entry to an analytics event
   * @param entry Log entry to transform
   * @returns Analytics event for tracking
   */
  private transformToAnalyticsEvent(entry: LogEntry): AnalyticsEvent {
    return {
      eventName: `campaign_clone_${entry.category.toLowerCase()}`,
      properties: {
        ...entry.metadata,
        level: entry.level,
        message: entry.message,
        context: entry.context
      },
      timestamp: entry.timestamp
    };
  }

  /**
   * Determines the severity level of a performance metric
   * @param metric Performance metric to evaluate
   * @returns Appropriate log level based on thresholds
   */
  private determineMetricSeverity(metric: PerformanceMetric): LogLevel {
    const thresholds = this.getMetricThresholds(metric.name);
    const value = metric.value;

    if (value > thresholds.critical) return 'CRITICAL';
    if (value > thresholds.warning) return 'WARN';
    return 'INFO';
  }

  /**
   * Gets threshold values for different metrics
   * @param metricName Name of the metric
   * @returns Warning and critical thresholds
   */
  private getMetricThresholds(metricName: string): { warning: number; critical: number } {
    // Configurable thresholds based on metric type
    const thresholds: Record<string, { warning: number; critical: number }> = {
      operation_duration: { warning: 5000, critical: 10000 },
      error_rate: { warning: 0.1, critical: 0.25 },
      resource_count: { warning: 1000, critical: 5000 }
    };

    return thresholds[metricName] || { warning: Infinity, critical: Infinity };
  }

  /**
   * Tracks error-specific metrics for analysis
   * Part of the comprehensive error tracking from the Error Handling Architecture
   * @param error The categorized error to track
   */
  private async trackErrorMetrics(error: CategorizedError): Promise<void> {
    await this.metricsCollector.incrementCounter('errors_total', {
      category: error.definition.category,
      code: error.definition.code
    });

    if (error.recoveryStrategy) {
      await this.metricsCollector.incrementCounter('recovery_attempts', {
        strategy: error.recoveryStrategy
      });
    }
  }

  /**
   * Tracks generic metric with tags
   * @param name Metric name
   * @param tags Metric tags
   */
  private async trackMetric(
    name: string,
    tags: Record<string, unknown>
  ): Promise<void> {
    const stringTags: Record<string, string> = {};
    
    // Convert all tag values to strings for consistent storage
    Object.entries(tags).forEach(([key, value]) => {
      stringTags[key] = value?.toString() || '';
    });
    
    await this.metricsCollector.recordMetric({
      name,
      value: 1,
      unit: 'count',
      timestamp: new Date().toISOString(),
      tags: stringTags
    });
  }
}
