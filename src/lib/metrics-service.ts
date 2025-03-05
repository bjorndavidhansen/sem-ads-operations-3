/**
 * Metrics Service
 * 
 * Provides data aggregation and analysis for operation metrics,
 * with a focus on rollback operations monitoring
 */

import { 
  operationTracker, 
  OperationTracker 
} from '../hooks/use-operation-tracking';
import { 
  MetricData, 
  TimeSeriesData, 
  CategoryData,
  TimeRange,
  TrendDirection
} from '../types/dashboard-types';
import { 
  Operation, 
  OperationStatus, 
  LogContext, 
  LOG_CODES 
} from '../types/operation-types';
import { formatDistance } from 'date-fns';

/**
 * Service for collecting and aggregating operation metrics
 */
export class MetricsService {
  private static instance: MetricsService;
  private operationTracker: OperationTracker;
  private metricsCache: Map<string, { data: MetricData | TimeSeriesData | CategoryData; timestamp: Date }> = new Map();
  private readonly CACHE_TTL = 15000; // 15 seconds

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.operationTracker = operationTracker;
  }

  /**
   * Get the singleton instance of the metrics service
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Get rollback success rate metrics
   * 
   * @param {TimeRange} timeRange - Time range to calculate metrics for
   * @returns {Promise<MetricData>} Success rate metric data
   */
  async getRollbackSuccessRate(timeRange: TimeRange = '24h'): Promise<MetricData> {
    const cacheKey = `success-rate-${timeRange}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const operations = this.getOperationsInTimeRange(timeRange);
    const rollbacks = operations.filter(op => 
      op.status === 'rollback_completed' || 
      op.status === 'rollback_failed'
    );
    
    if (rollbacks.length === 0) {
      return this.cacheAndReturnMetric(cacheKey, {
        current: 1, // Default to 100% if no rollbacks
        comparison: 1,
        trend: 'neutral',
        timestamp: new Date(),
        unit: '%'
      });
    }
    
    const successful = rollbacks.filter(op => op.status === 'rollback_completed');
    const currentRate = successful.length / rollbacks.length;
    
    // Get comparison for previous time period
    const previousRate = await this.getPreviousPeriodSuccessRate(timeRange);
    const trend = this.calculateTrend(currentRate, previousRate);
    
    return this.cacheAndReturnMetric(cacheKey, {
      current: currentRate,
      comparison: previousRate,
      trend,
      timestamp: new Date(),
      unit: '%'
    });
  }

  /**
   * Get rollback duration trends
   * 
   * @param {TimeRange} timeRange - Time range to calculate metrics for
   * @returns {Promise<TimeSeriesData>} Duration trend time series
   */
  async getRollbackDurationTrends(timeRange: TimeRange = '7d'): Promise<TimeSeriesData> {
    const cacheKey = `duration-trends-${timeRange}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const operations = this.getOperationsInTimeRange(timeRange)
      .filter(op => op.status === 'rollback_completed');
    
    if (operations.length === 0) {
      return this.cacheAndReturnMetric(cacheKey, {
        current: 0,
        timestamp: new Date(),
        unit: 'ms',
        series: []
      });
    }
    
    // Calculate durations using the rollback summary
    const series = operations.map(op => {
      const summary = this.operationTracker.getRollbackSummary(op.id);
      return {
        timestamp: new Date(op.completedAt || op.updatedAt),
        value: summary.duration || 0,
        label: `${op.type} (${formatDistance(
          new Date(op.completedAt || op.updatedAt),
          new Date()
        )} ago)`
      };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate average duration
    const avgDuration = series.reduce((sum, point) => sum + point.value, 0) / series.length;
    
    return this.cacheAndReturnMetric(cacheKey, {
      current: avgDuration,
      timestamp: new Date(),
      unit: 'ms',
      series
    });
  }

  /**
   * Get resource recovery efficiency metrics
   * 
   * @param {TimeRange} timeRange - Time range to calculate metrics for
   * @returns {Promise<CategoryData>} Resource recovery category data
   */
  async getResourceRecoveryEfficiency(timeRange: TimeRange = '24h'): Promise<CategoryData> {
    const cacheKey = `resource-recovery-${timeRange}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const operations = this.getOperationsInTimeRange(timeRange)
      .filter(op => op.status === 'rollback_completed' || op.status === 'rollback_failed');
    
    if (operations.length === 0) {
      return this.cacheAndReturnMetric(cacheKey, {
        current: 1,
        timestamp: new Date(),
        unit: '%',
        categories: []
      });
    }
    
    // Analyze resource types across operations
    const resourceTypes = new Map<string, { total: number; successful: number }>();
    
    operations.forEach(op => {
      const rollbackLogs = op.logs.filter(log => log.context === 'rollback');
      
      // Count attempted resource deletions
      rollbackLogs.forEach(log => {
        if (!log.details || !log.details.resourceType) return;
        
        const resourceType = log.details.resourceType as string;
        if (!resourceTypes.has(resourceType)) {
          resourceTypes.set(resourceType, { total: 0, successful: 0 });
        }
        
        const resourceStats = resourceTypes.get(resourceType)!;
        
        if (log.code === LOG_CODES.ROLLBACK_RESOURCE_DELETED) {
          resourceStats.total++;
          resourceStats.successful++;
        } else if (log.code === LOG_CODES.ROLLBACK_RESOURCE_FAILED) {
          resourceStats.total++;
        }
      });
    });
    
    // Convert to category points
    const categories: { category: string; value: number; color?: string }[] = [];
    let overallEfficiency = 0;
    
    resourceTypes.forEach((stats, resourceType) => {
      const efficiency = stats.total > 0 ? stats.successful / stats.total : 0;
      categories.push({
        category: resourceType,
        value: efficiency,
        color: this.getColorForEfficiency(efficiency)
      });
      
      overallEfficiency += efficiency;
    });
    
    // Calculate overall efficiency
    const avgEfficiency = categories.length > 0 ? overallEfficiency / categories.length : 1;
    
    return this.cacheAndReturnMetric(cacheKey, {
      current: avgEfficiency,
      timestamp: new Date(),
      unit: '%',
      categories
    });
  }

  /**
   * Get error frequency metrics
   * 
   * @param {TimeRange} timeRange - Time range to calculate metrics for
   * @returns {Promise<CategoryData>} Error frequency category data
   */
  async getErrorFrequency(timeRange: TimeRange = '7d'): Promise<CategoryData> {
    const cacheKey = `error-frequency-${timeRange}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const operations = this.getOperationsInTimeRange(timeRange);
    const errorLogs = operations.flatMap(op => 
      op.logs.filter(log => log.level === 'error' && log.context === 'rollback')
    );
    
    if (errorLogs.length === 0) {
      return this.cacheAndReturnMetric(cacheKey, {
        current: 0,
        timestamp: new Date(),
        categories: []
      });
    }
    
    // Group errors by code
    const errorCounts = new Map<string, number>();
    errorLogs.forEach(log => {
      const code = log.code || 'UNKNOWN_ERROR';
      errorCounts.set(code, (errorCounts.get(code) || 0) + 1);
    });
    
    // Convert to category points
    const categories = Array.from(errorCounts.entries()).map(([code, count]) => ({
      category: code,
      value: count,
      color: '#DC2626' // Error red
    })).sort((a, b) => b.value - a.value); // Sort by frequency desc
    
    return this.cacheAndReturnMetric(cacheKey, {
      current: errorLogs.length,
      timestamp: new Date(),
      categories
    });
  }

  /**
   * Get rollback volume metrics over time
   * 
   * @param {TimeRange} timeRange - Time range to calculate metrics for
   * @returns {Promise<TimeSeriesData>} Rollback volume time series
   */
  async getRollbackVolume(timeRange: TimeRange = '30d'): Promise<TimeSeriesData> {
    const cacheKey = `rollback-volume-${timeRange}`;
    const cached = this.getCachedMetric(cacheKey);
    if (cached) return cached;

    const operations = this.getOperationsInTimeRange(timeRange)
      .filter(op => op.status.includes('rollback'));
    
    if (operations.length === 0) {
      return this.cacheAndReturnMetric(cacheKey, {
        current: 0,
        timestamp: new Date(),
        series: []
      });
    }
    
    // Group by day
    const volumeByDay = new Map<string, number>();
    operations.forEach(op => {
      const date = new Date(op.createdAt);
      const day = date.toISOString().split('T')[0];
      volumeByDay.set(day, (volumeByDay.get(day) || 0) + 1);
    });
    
    // Convert to time series
    const series = Array.from(volumeByDay.entries())
      .map(([day, count]) => ({
        timestamp: new Date(day),
        value: count,
        label: day
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return this.cacheAndReturnMetric(cacheKey, {
      current: operations.length,
      timestamp: new Date(),
      series
    });
  }

  /**
   * Get operations that occured within the specified time range
   * 
   * @param {TimeRange} timeRange - Time range to filter operations
   * @returns {Operation[]} Filtered operations
   */
  private getOperationsInTimeRange(timeRange: TimeRange): Operation[] {
    const now = new Date();
    let cutoff = new Date();
    
    switch (timeRange) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      case 'all':
        cutoff = new Date(0); // Beginning of time
        break;
    }
    
    return this.operationTracker.getAllOperations()
      .filter(op => new Date(op.createdAt) >= cutoff);
  }

  /**
   * Calculate a trend direction based on current and previous values
   * 
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {TrendDirection} Trend direction
   */
  private calculateTrend(current: number, previous: number): TrendDirection {
    if (Math.abs(current - previous) < 0.05) return 'neutral'; // Within 5% is considered neutral
    return current > previous ? 'up' : 'down';
  }

  /**
   * Get color based on efficiency value
   * 
   * @param {number} efficiency - Efficiency value (0-1)
   * @returns {string} CSS color
   */
  private getColorForEfficiency(efficiency: number): string {
    if (efficiency >= 0.9) return '#10B981'; // Green
    if (efficiency >= 0.7) return '#FBBF24'; // Yellow
    return '#DC2626'; // Red
  }

  /**
   * Calculate the success rate for the previous time period
   * 
   * @param {TimeRange} currentTimeRange - Current time range
   * @returns {Promise<number>} Previous period success rate
   */
  private async getPreviousPeriodSuccessRate(currentTimeRange: TimeRange): Promise<number> {
    // In a real implementation, this would fetch historical data
    // For now, return a simulated value
    const defaultRates: Record<TimeRange, number> = {
      '1h': 0.92,
      '24h': 0.88,
      '7d': 0.85,
      '30d': 0.83,
      'all': 0.80
    };
    
    return defaultRates[currentTimeRange];
  }

  /**
   * Get cached metric if available and not expired
   * 
   * @param {string} key - Cache key
   * @returns {any} Cached metric or undefined
   */
  private getCachedMetric<T extends MetricData | TimeSeriesData | CategoryData>(key: string): T | undefined {
    const cached = this.metricsCache.get(key);
    if (!cached) return undefined;
    
    // Check if expired
    if (new Date().getTime() - cached.timestamp.getTime() > this.CACHE_TTL) {
      this.metricsCache.delete(key);
      return undefined;
    }
    
    return cached.data as T;
  }

  /**
   * Cache metric and return it
   * 
   * @param {string} key - Cache key
   * @param {T} data - Metric data
   * @returns {T} The same data (for method chaining)
   */
  private cacheAndReturnMetric<T extends MetricData | TimeSeriesData | CategoryData>(key: string, data: T): T {
    this.metricsCache.set(key, {
      data,
      timestamp: new Date()
    });
    return data;
  }
}

export const metricsService = MetricsService.getInstance();
