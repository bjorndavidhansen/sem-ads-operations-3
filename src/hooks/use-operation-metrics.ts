import { useState, useEffect } from 'react';
import { 
  OperationMetricsData, 
  OperationType, 
  MetricsTimeframe,
  OperationSuccessRate,
  ErrorBreakdown,
  PerformanceMetrics,
  PerformanceTrendPoint,
  PerformanceInsight
} from '../types/monitoring-types';

/**
 * Hook to fetch and process operation metrics data for monitoring dashboard
 * @param operationType - Type of operation to get metrics for
 * @param timeframe - Time range for the metrics
 * @returns Operation metrics including success rates, error breakdowns, and performance data
 */
export function useOperationMetrics(
  operationType: OperationType,
  timeframe: MetricsTimeframe
): OperationMetricsData {
  const [metrics, setMetrics] = useState<OperationMetricsData>({
    operationCounts: null,
    successRates: null,
    errorBreakdown: null,
    performanceMetrics: null,
    isLoadingOperationMetrics: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchOperationMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, isLoadingOperationMetrics: true }));
        
        // In a real implementation, this would fetch from your operation tracking service
        // For now, we'll generate realistic mock data
        
        // Get date range for the timeframe
        const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
        
        // Generate mock data based on operation type and timeframe
        const mockData = generateMockOperationMetrics(operationType, startDate, endDate);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isMounted) {
          setMetrics({
            ...mockData,
            isLoadingOperationMetrics: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setMetrics({
            operationCounts: null,
            successRates: null,
            errorBreakdown: null,
            performanceMetrics: null,
            isLoadingOperationMetrics: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    };
    
    fetchOperationMetrics();
    
    return () => {
      isMounted = false;
    };
  }, [operationType, timeframe]);
  
  return metrics;
}

/**
 * Helper function to get date range from timeframe
 */
function getDateRangeFromTimeframe(timeframe: MetricsTimeframe): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (timeframe) {
    case 'last24Hours':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case 'last7Days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last30Days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'custom':
      // For demo purposes, default to last 14 days if custom
      startDate.setDate(startDate.getDate() - 14);
      break;
  }
  
  return { startDate, endDate };
}

/**
 * Generate mock operation metrics data with realistic patterns
 */
function generateMockOperationMetrics(
  operationType: OperationType,
  startDate: Date,
  endDate: Date
): Omit<OperationMetricsData, 'isLoadingOperationMetrics' | 'error'> {
  // Base metrics that vary by operation type
  const baseMetrics = {
    campaignClone: {
      operationCount: 120,
      successRate: 94,
      responseTime: 450,
      throughput: 4.5,
      errorRate: 6
    },
    budgetUpdate: {
      operationCount: 200,
      successRate: 97,
      responseTime: 320,
      throughput: 7.2,
      errorRate: 3
    },
    bidAdjustment: {
      operationCount: 180,
      successRate: 91,
      responseTime: 380,
      throughput: 5.8,
      errorRate: 9
    }
  };
  
  const base = baseMetrics[operationType];
  
  // Operation counts with success/failure breakdown
  const total = base.operationCount;
  const successful = Math.round(total * (base.successRate / 100));
  const failed = total - successful;
  const inProgress = Math.round(total * 0.05); // Assume 5% are in progress
  
  // Success rates by campaign size
  const successRates: OperationSuccessRate = {
    overall: base.successRate,
    bySize: {
      small: Math.min(99, base.successRate + 3),    // Small campaigns have higher success
      medium: base.successRate,                      // Medium campaigns = baseline
      large: Math.max(80, base.successRate - 5)      // Large campaigns have lower success
    },
    byTime: {
      morning: Math.min(99, base.successRate + 2),    // Morning = better performance
      afternoon: base.successRate,                     // Afternoon = baseline
      evening: Math.max(85, base.successRate - 3),     // Evening = slightly worse
      night: Math.max(82, base.successRate - 4)        // Night = worst performance
    }
  };
  
  // Generate error breakdown
  const errorBreakdown: ErrorBreakdown[] = generateErrorBreakdown(operationType, failed);
  
  // Generate performance trends
  const trends = generatePerformanceTrends(operationType, startDate, endDate);
  
  // Calculate current and previous period metrics
  const midpoint = Math.floor(trends.length / 2);
  const currentPeriodTrends = trends.slice(midpoint);
  const previousPeriodTrends = trends.slice(0, midpoint);
  
  const avgCurrentResponseTime = currentPeriodTrends.reduce((sum, point) => 
    sum + point.responseTime, 0) / currentPeriodTrends.length;
    
  const avgPreviousResponseTime = previousPeriodTrends.reduce((sum, point) => 
    sum + point.responseTime, 0) / previousPeriodTrends.length;
  
  const avgCurrentThroughput = currentPeriodTrends.reduce((sum, point) => 
    sum + point.throughput, 0) / currentPeriodTrends.length;
    
  const avgPreviousThroughput = previousPeriodTrends.reduce((sum, point) => 
    sum + point.throughput, 0) / previousPeriodTrends.length;
  
  const avgCurrentErrorRate = currentPeriodTrends.reduce((sum, point) => 
    sum + point.errorRate, 0) / currentPeriodTrends.length;
    
  const avgPreviousErrorRate = previousPeriodTrends.reduce((sum, point) => 
    sum + point.errorRate, 0) / previousPeriodTrends.length;
  
  // Generate insights based on trends
  const insights = generateInsights(
    avgCurrentResponseTime, 
    avgPreviousResponseTime,
    avgCurrentThroughput,
    avgPreviousThroughput,
    avgCurrentErrorRate,
    avgPreviousErrorRate,
    operationType
  );
  
  // Generate recommendation based on insights
  const recommendation = generateRecommendation(
    insights, 
    operationType, 
    avgCurrentErrorRate
  );
  
  return {
    operationCounts: {
      total,
      successful,
      failed,
      inProgress
    },
    successRates,
    errorBreakdown,
    performanceMetrics: {
      avgResponseTime: {
        current: avgCurrentResponseTime,
        previous: avgPreviousResponseTime
      },
      throughput: {
        current: avgCurrentThroughput,
        previous: avgPreviousThroughput
      },
      errorRate: {
        current: avgCurrentErrorRate,
        previous: avgPreviousErrorRate
      },
      trends,
      insights,
      recommendations: recommendation
    }
  };
}

/**
 * Generate error breakdown based on operation type
 */
function generateErrorBreakdown(
  operationType: OperationType, 
  totalErrors: number
): ErrorBreakdown[] {
  // Define common error types and their typical distributions
  const errorTypes = {
    campaignClone: [
      { type: 'Rate Limit Exceeded', weight: 40 },
      { type: 'Invalid Campaign Structure', weight: 25 },
      { type: 'Token Expired', weight: 15 },
      { type: 'Network Error', weight: 10 },
      { type: 'Permission Denied', weight: 5 },
      { type: 'Other', weight: 5 }
    ],
    budgetUpdate: [
      { type: 'Invalid Budget Value', weight: 45 },
      { type: 'Rate Limit Exceeded', weight: 20 },
      { type: 'Campaign Not Found', weight: 15 },
      { type: 'Network Error', weight: 10 },
      { type: 'Other', weight: 10 }
    ],
    bidAdjustment: [
      { type: 'Invalid Bid Value', weight: 35 },
      { type: 'Rate Limit Exceeded', weight: 25 },
      { type: 'Keyword Not Found', weight: 20 },
      { type: 'Network Error', weight: 10 },
      { type: 'Permission Denied', weight: 5 },
      { type: 'Other', weight: 5 }
    ]
  };
  
  const selectedErrors = errorTypes[operationType];
  const totalWeight = selectedErrors.reduce((sum, error) => sum + error.weight, 0);
  
  // Distribute errors according to weights
  return selectedErrors.map(error => {
    const percentage = error.weight / totalWeight;
    const count = Math.round(totalErrors * percentage);
    
    return {
      errorType: error.type,
      count,
      percentage: percentage * 100
    };
  });
}

/**
 * Generate performance trend data with realistic patterns
 */
function generatePerformanceTrends(
  operationType: OperationType,
  startDate: Date,
  endDate: Date
): PerformanceTrendPoint[] {
  const trends: PerformanceTrendPoint[] = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine interval based on date range
  const interval = daysDiff <= 3 ? 'hour' : 'day';
  const dataPoints = interval === 'hour' ? 24 : daysDiff;
  
  // Base metrics that vary by operation type
  const baseMetrics = {
    campaignClone: {
      responseTime: 450,
      throughput: 4.5,
      errorRate: 6
    },
    budgetUpdate: {
      responseTime: 320,
      throughput: 7.2,
      errorRate: 3
    },
    bidAdjustment: {
      responseTime: 380,
      throughput: 5.8,
      errorRate: 9
    }
  };
  
  const base = baseMetrics[operationType];
  let currentDate = new Date(startDate);
  
  // Create data points with some variability and trends
  for (let i = 0; i < dataPoints; i++) {
    // Add some randomness and time-based patterns
    const hourOfDay = currentDate.getHours();
    const dayOfWeek = currentDate.getDay();
    
    // Response time is higher during peak hours
    const timeMultiplier = (hourOfDay >= 9 && hourOfDay <= 17) ? 1.2 : 0.9;
    
    // Error rates are higher on weekends (less monitoring)
    const errorMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 0.9;
    
    // Add trend pattern - gradual improvement over time
    const trendFactor = 0.95 + (i / dataPoints * 0.1); // 5% improvement over time period
    
    // Random variance
    const randomFactor = 0.85 + (Math.random() * 0.3);
    
    // Calculate metrics
    const responseTime = base.responseTime * timeMultiplier * randomFactor * trendFactor;
    const throughput = base.throughput * (1/timeMultiplier) * (0.9 + Math.random() * 0.2);
    const errorRate = base.errorRate * errorMultiplier * randomFactor * (2 - trendFactor);
    
    trends.push({
      timestamp: currentDate.toISOString(),
      responseTime,
      throughput,
      errorRate
    });
    
    // Increment date based on interval
    if (interval === 'hour') {
      currentDate.setHours(currentDate.getHours() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return trends;
}

/**
 * Generate insights based on performance metrics
 */
function generateInsights(
  currentResponseTime: number,
  previousResponseTime: number,
  currentThroughput: number,
  previousThroughput: number,
  currentErrorRate: number,
  previousErrorRate: number,
  operationType: OperationType
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  // Response time insights
  const responseTimeChange = ((currentResponseTime - previousResponseTime) / previousResponseTime) * 100;
  if (responseTimeChange < -10) {
    insights.push({
      text: `Response time improved by ${Math.abs(responseTimeChange).toFixed(1)}%`,
      type: 'positive'
    });
  } else if (responseTimeChange > 10) {
    insights.push({
      text: `Response time degraded by ${responseTimeChange.toFixed(1)}%`,
      type: 'negative'
    });
  }
  
  // Throughput insights
  const throughputChange = ((currentThroughput - previousThroughput) / previousThroughput) * 100;
  if (throughputChange > 10) {
    insights.push({
      text: `Operation throughput increased by ${throughputChange.toFixed(1)}%`,
      type: 'positive'
    });
  } else if (throughputChange < -10) {
    insights.push({
      text: `Operation throughput decreased by ${Math.abs(throughputChange).toFixed(1)}%`,
      type: 'negative'
    });
  }
  
  // Error rate insights
  const errorRateChange = ((currentErrorRate - previousErrorRate) / previousErrorRate) * 100;
  if (errorRateChange < -10) {
    insights.push({
      text: `Error rate reduced by ${Math.abs(errorRateChange).toFixed(1)}%`,
      type: 'positive'
    });
  } else if (errorRateChange > 10) {
    insights.push({
      text: `Error rate increased by ${errorRateChange.toFixed(1)}%`,
      type: 'negative'
    });
  }
  
  // Operation-specific insights
  if (operationType === 'campaignClone') {
    if (currentErrorRate > 5) {
      insights.push({
        text: 'Campaign structure validation issues detected',
        type: 'negative'
      });
    }
    if (currentResponseTime > 500) {
      insights.push({
        text: 'Large campaign clone operations may be hitting resource limits',
        type: 'negative'
      });
    }
  }
  
  // Add general insights
  if (currentErrorRate < 3) {
    insights.push({
      text: 'Operation success rate is excellent',
      type: 'positive'
    });
  }
  
  if (currentResponseTime < previousResponseTime && currentThroughput > previousThroughput) {
    insights.push({
      text: 'Overall system performance is improving',
      type: 'positive'
    });
  }
  
  return insights;
}

/**
 * Generate recommendations based on insights
 */
function generateRecommendation(
  insights: PerformanceInsight[],
  operationType: OperationType,
  errorRate: number
): string {
  // Count negative insights
  const negativeInsights = insights.filter(insight => insight.type === 'negative');
  
  if (negativeInsights.length === 0) {
    return 'System is performing optimally. Continue monitoring for any changes in performance patterns.';
  }
  
  // Generate operation-specific recommendations
  if (operationType === 'campaignClone') {
    if (errorRate > 10) {
      return 'High error rate detected. Consider reducing default chunk size from 5 to 3 campaigns and implementing pre-validation checks on campaign structure before cloning.';
    }
    
    if (errorRate > 5) {
      return 'Moderate error rate detected. Review campaign validation logic and consider adding more detailed validation steps. Check for rate limit errors and adjust concurrent operation limits if needed.';
    }
    
    return 'Minor performance issues detected. Consider scheduled maintenance window for large campaign operations to avoid business hour congestion.';
  }
  
  // Generic recommendations
  if (errorRate > 10) {
    return 'System performance requires attention. Review error logs, consider scaling API resources, and implement additional error handling.';
  }
  
  return 'Some performance issues detected. Monitor trends and implement optimizations if metrics continue to degrade.';
}
