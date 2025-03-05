import { useState, useEffect } from 'react';
import { 
  ApiMetricsData, 
  OperationType, 
  MetricsTimeframe, 
  ApiUsageData 
} from '../types/monitoring-types';
import { getOperationLogs } from '../lib/operation-log-service';
import { formatDate } from '../utils/date-utils';

/**
 * Hook to fetch and process API metrics data
 * @param operationType - Type of operation to get metrics for
 * @param timeframe - Time range for the metrics
 * @returns API metrics data including usage, rate limits, and response times
 */
export function useApiMetrics(
  operationType: OperationType,
  timeframe: MetricsTimeframe
): ApiMetricsData {
  const [apiMetrics, setApiMetrics] = useState<ApiMetricsData>({
    apiUsage: null,
    rateLimitEvents: null,
    averageResponseTime: null,
    isLoadingApiMetrics: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const fetchApiMetrics = async () => {
      try {
        setApiMetrics(prev => ({ ...prev, isLoadingApiMetrics: true }));
        
        // In a real implementation, this would call your API service
        // For now, we'll simulate the data with realistic patterns
        
        // Get date range based on timeframe
        const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
        
        // Mock API usage data with realistic patterns
        const mockApiUsage = generateMockApiUsageData(
          startDate, 
          endDate, 
          operationType
        );
        
        // Calculate rate limit events (would come from actual logs in production)
        const mockRateLimitEvents = Math.floor(Math.random() * 5);
        
        // Calculate average response time
        const avgResponseTime = mockApiUsage.reduce(
          (sum, item) => sum + item.averageResponseTime, 
          0
        ) / mockApiUsage.length;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isMounted) {
          setApiMetrics({
            apiUsage: mockApiUsage,
            rateLimitEvents: mockRateLimitEvents,
            averageResponseTime: avgResponseTime,
            isLoadingApiMetrics: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setApiMetrics({
            apiUsage: null,
            rateLimitEvents: null,
            averageResponseTime: null,
            isLoadingApiMetrics: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    };
    
    fetchApiMetrics();
    
    return () => {
      isMounted = false;
    };
  }, [operationType, timeframe]);
  
  return apiMetrics;
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
 * Generate mock API usage data that follows realistic patterns
 */
function generateMockApiUsageData(
  startDate: Date, 
  endDate: Date, 
  operationType: OperationType
): ApiUsageData[] {
  const data: ApiUsageData[] = [];
  const interval = getIntervalFromDateRange(startDate, endDate);
  
  // Base values that vary by operation type
  const baseValues = {
    campaignClone: {
      requests: 150,
      successRate: 0.95,
      readRatio: 0.3,
      avgResponseTime: 250
    },
    budgetUpdate: {
      requests: 80,
      successRate: 0.98,
      readRatio: 0.4,
      avgResponseTime: 150
    },
    bidAdjustment: {
      requests: 200,
      successRate: 0.92,
      readRatio: 0.25,
      avgResponseTime: 180
    }
  };
  
  const base = baseValues[operationType];
  let currentDate = new Date(startDate);
  
  // Create pattern with daily/hourly fluctuations
  while (currentDate <= endDate) {
    // Add randomness and time-of-day patterns
    const hourOfDay = currentDate.getHours();
    const dayOfWeek = currentDate.getDay();
    
    // More activity during business hours, less on weekends
    const timeMultiplier = (hourOfDay >= 9 && hourOfDay <= 17) ? 1.5 : 0.7;
    const dayMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.2;
    
    // Apply random variance (+/- 20%)
    const randomFactor = 0.8 + (Math.random() * 0.4);
    
    // Calculate metrics for this time point
    const requestCount = Math.round(base.requests * timeMultiplier * dayMultiplier * randomFactor);
    const successRatio = base.successRate * (0.95 + (Math.random() * 0.1)); // 95-105% of base success rate
    const successfulRequests = Math.round(requestCount * successRatio);
    const failedRequests = requestCount - successfulRequests;
    
    // Calculate read/write split
    const readRequests = Math.round(requestCount * base.readRatio);
    const writeRequests = requestCount - readRequests;
    
    // Response time with random variance
    const responseTime = base.avgResponseTime * (0.9 + (Math.random() * 0.3));
    
    data.push({
      timestamp: currentDate.toISOString(),
      requests: requestCount,
      successfulRequests,
      failedRequests,
      readRequests,
      writeRequests,
      averageResponseTime: responseTime
    });
    
    // Increment date based on interval
    if (interval === 'hour') {
      currentDate.setHours(currentDate.getHours() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return data;
}

/**
 * Determine appropriate interval based on date range
 */
function getIntervalFromDateRange(startDate: Date, endDate: Date): 'hour' | 'day' {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 3 ? 'hour' : 'day';
}
