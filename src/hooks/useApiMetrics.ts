import { useState, useEffect } from 'react';
import { 
  ApiUsageData,
  RateLimitEvent,
  OperationType, 
  MetricsTimeframe 
} from '../types/monitoring-types';
import { getTimeframeStartDate } from '../utils/date-utils';

/**
 * Hook to fetch and process API metrics data
 * 
 * @param operationType - The type of operation to fetch metrics for
 * @param timeframe - The timeframe to fetch metrics for
 * @returns API metrics data and loading state
 */
const useApiMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): {
  apiUsage: ApiUsageData | null;
  rateLimitEvents: RateLimitEvent[] | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const [apiUsage, setApiUsage] = useState<ApiUsageData | null>(null);
  const [rateLimitEvents, setRateLimitEvents] = useState<RateLimitEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchApiMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch(`/api/metrics/api-usage?operation=${operationType}&timeframe=${timeframe}`);
        // const data = await response.json();

        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock data based on operation type and timeframe
        const { mockApiUsage, mockRateLimitEvents } = generateMockApiMetrics(operationType, timeframe);
        
        if (isMounted) {
          setApiUsage(mockApiUsage);
          setRateLimitEvents(mockRateLimitEvents);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching API metrics:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setIsLoading(false);
        }
      }
    };

    fetchApiMetrics();

    return () => {
      isMounted = false;
    };
  }, [operationType, timeframe]);

  return { apiUsage, rateLimitEvents, isLoading, error };
};

/**
 * Generate mock API metrics data for testing
 * 
 * @param operationType - Type of operation
 * @param timeframe - Metrics timeframe
 * @returns Mock API usage data and rate limit events
 */
const generateMockApiMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): {
  mockApiUsage: ApiUsageData;
  mockRateLimitEvents: RateLimitEvent[];
} => {
  // Calculate number of data points based on timeframe
  let dataPoints = 24;
  const startDate = getTimeframeStartDate(timeframe);
  const endDate = new Date();
  
  switch (timeframe) {
    case 'last24Hours':
      dataPoints = 24;
      break;
    case 'lastWeek':
      dataPoints = 7;
      break;
    case 'lastMonth':
      dataPoints = 30;
      break;
    case 'lastQuarter':
      dataPoints = 90;
      break;
  }

  // Define endpoints based on operation type
  const endpoints = {
    campaignCreation: ['campaigns.get', 'campaigns.create', 'adGroups.create', 'keywords.create'],
    keywordUpdate: ['keywords.get', 'keywords.update', 'searchTerms.get'],
    budgetAdjustment: ['campaigns.get', 'campaigns.update', 'budgets.get', 'budgets.update'],
    adGroupModification: ['adGroups.get', 'adGroups.update', 'ads.update']
  };

  const operationEndpoints = endpoints[operationType] || ['api.generic'];
  
  // Base quota and usage values that vary by operation type
  const baseQuota = 
    operationType === 'campaignCreation' ? 10000 :
    operationType === 'keywordUpdate' ? 15000 :
    operationType === 'budgetAdjustment' ? 8000 :
    operationType === 'adGroupModification' ? 12000 : 10000;
  
  const baseUsagePercentage = 
    operationType === 'campaignCreation' ? 0.65 :
    operationType === 'keywordUpdate' ? 0.78 :
    operationType === 'budgetAdjustment' ? 0.45 :
    operationType === 'adGroupModification' ? 0.58 : 0.50;
  
  // Generate metrics data points
  const metrics = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(startDate);
    
    if (timeframe === 'last24Hours') {
      date.setHours(date.getHours() + i);
    } else {
      date.setDate(date.getDate() + Math.floor(i * (endDate.getTime() - startDate.getTime()) / (dataPoints * 86400000)));
    }
    
    // Add some random variation
    const randomFactor = 0.3;
    const randomVariation = () => (1 + (Math.random() * randomFactor * 2 - randomFactor));
    
    // Generate a random endpoint from the operation-specific list
    const endpoint = operationEndpoints[Math.floor(Math.random() * operationEndpoints.length)];
    
    // Calculate count with daily and weekly patterns
    let baseCount = baseQuota * baseUsagePercentage * randomVariation();
    
    // Add daily pattern (higher during business hours)
    if (timeframe === 'last24Hours') {
      const hour = date.getHours();
      // Business hours boost (9am-5pm)
      if (hour >= 9 && hour <= 17) {
        baseCount *= 1.5;
      }
      // Night time reduction (10pm-6am)
      if (hour >= 22 || hour <= 6) {
        baseCount *= 0.4;
      }
    }
    
    // Add weekly pattern (lower on weekends)
    if (timeframe !== 'last24Hours') {
      const day = date.getDay();
      // Weekend reduction (Saturday and Sunday)
      if (day === 0 || day === 6) {
        baseCount *= 0.6;
      }
    }
    
    return {
      timestamp: date.toISOString(),
      count: Math.round(baseCount),
      quota: baseQuota,
      endpoint
    };
  });

  // Calculate total requests and top endpoints
  const totalRequests = metrics.reduce((sum, metric) => sum + metric.count, 0);
  
  // Group by endpoint and calculate counts
  const endpointCounts: Record<string, number> = {};
  metrics.forEach(metric => {
    if (!endpointCounts[metric.endpoint]) {
      endpointCounts[metric.endpoint] = 0;
    }
    endpointCounts[metric.endpoint] += metric.count;
  });
  
  // Create sorted top endpoints array
  const topEndpoints = Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({
      endpoint,
      count,
      percentage: (count / totalRequests) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate mock rate limit events (more for high-usage operations)
  const rateLimitEventCount = 
    operationType === 'campaignCreation' ? 3 :
    operationType === 'keywordUpdate' ? 5 :
    operationType === 'budgetAdjustment' ? 1 :
    operationType === 'adGroupModification' ? 2 : 0;
  
  const mockRateLimitEvents: RateLimitEvent[] = Array.from(
    { length: rateLimitEventCount },
    (_, i) => {
      const date = new Date(startDate);
      date.setHours(date.getHours() + Math.floor(Math.random() * (endDate.getTime() - startDate.getTime()) / 3600000));
      
      return {
        timestamp: date.toISOString(),
        endpoint: operationEndpoints[Math.floor(Math.random() * operationEndpoints.length)],
        duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
        quotaExceeded: Math.random() > 0.3 // 70% chance of quota exceeded vs. rate limited
      };
    }
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    mockApiUsage: {
      metrics,
      totalRequests,
      quotaUtilization: (totalRequests / (baseQuota * dataPoints)) * 100,
      topEndpoints
    },
    mockRateLimitEvents
  };
};

export default useApiMetrics;
