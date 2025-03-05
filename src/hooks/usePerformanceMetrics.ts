import { useState, useEffect } from 'react';
import { 
  PerformanceMetrics, 
  OperationType, 
  MetricsTimeframe,
  PerformanceInsight
} from '../types/monitoring-types';
import { formatDate } from '../utils/date-utils';

/**
 * Hook to fetch and process performance metrics data
 * 
 * @param operationType - The type of operation to fetch metrics for
 * @param timeframe - The timeframe to fetch metrics for (e.g., 'last24Hours', 'lastWeek')
 * @returns Performance metrics data and loading state
 */
const usePerformanceMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): {
  performanceMetrics: PerformanceMetrics | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPerformanceMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch(`/api/metrics/performance?operation=${operationType}&timeframe=${timeframe}`);
        // const data = await response.json();

        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data based on operation type and timeframe
        const mockData = generateMockPerformanceMetrics(operationType, timeframe);
        
        if (isMounted) {
          setPerformanceMetrics(mockData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching performance metrics:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setIsLoading(false);
        }
      }
    };

    fetchPerformanceMetrics();

    return () => {
      isMounted = false;
    };
  }, [operationType, timeframe]);

  return { performanceMetrics, isLoading, error };
};

/**
 * Generate mock performance metrics data for testing
 * 
 * @param operationType - The type of operation
 * @param timeframe - The timeframe for metrics
 * @returns Mock performance metrics data
 */
const generateMockPerformanceMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): PerformanceMetrics => {
  // Calculate number of data points based on timeframe
  let dataPoints = 24;
  let startDate = new Date();
  
  switch (timeframe) {
    case 'last24Hours':
      dataPoints = 24;
      startDate.setHours(startDate.getHours() - 24);
      break;
    case 'lastWeek':
      dataPoints = 7;
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'lastMonth':
      dataPoints = 30;
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'lastQuarter':
      dataPoints = 90;
      startDate.setDate(startDate.getDate() - 90);
      break;
  }

  // Generate trend data
  const trends = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(startDate);
    
    if (timeframe === 'last24Hours') {
      date.setHours(date.getHours() + i);
    } else {
      date.setDate(date.getDate() + i);
    }
    
    // Base values that vary by operation type
    let baseResponseTime = 
      operationType === 'campaignCreation' ? 450 :
      operationType === 'keywordUpdate' ? 300 :
      operationType === 'budgetAdjustment' ? 200 :
      operationType === 'adGroupModification' ? 350 : 250;
      
    let baseThroughput = 
      operationType === 'campaignCreation' ? 18 :
      operationType === 'keywordUpdate' ? 35 :
      operationType === 'budgetAdjustment' ? 45 :
      operationType === 'adGroupModification' ? 25 : 30;
      
    let baseErrorRate = 
      operationType === 'campaignCreation' ? 4.5 :
      operationType === 'keywordUpdate' ? 2.8 :
      operationType === 'budgetAdjustment' ? 1.5 :
      operationType === 'adGroupModification' ? 3.2 : 2.5;
    
    // Add some random variation
    const randomFactor = 0.2;
    const randomVariation = () => (1 + (Math.random() * randomFactor * 2 - randomFactor));
    
    // Add a slight trend over time
    const trendFactor = 0.005;
    const timeTrend = 1 - (i * trendFactor); // Response time and error rates generally decrease over time
    const throughputTrend = 1 + (i * trendFactor); // Throughput generally increases
    
    return {
      timestamp: date.toISOString(),
      responseTime: Math.round(baseResponseTime * randomVariation() * timeTrend),
      throughput: parseFloat((baseThroughput * randomVariation() * throughputTrend).toFixed(1)),
      errorRate: parseFloat((baseErrorRate * randomVariation() * timeTrend).toFixed(1)),
    };
  });

  // Calculate current and previous metrics
  const halfIndex = Math.floor(trends.length / 2);
  const recentData = trends.slice(halfIndex);
  const previousData = trends.slice(0, halfIndex);
  
  const calculateAverage = (array: any[], key: string) => {
    return array.reduce((sum, item) => sum + item[key], 0) / array.length;
  };
  
  const currentResponseTime = calculateAverage(recentData, 'responseTime');
  const previousResponseTime = calculateAverage(previousData, 'responseTime');
  
  const currentThroughput = calculateAverage(recentData, 'throughput');
  const previousThroughput = calculateAverage(previousData, 'throughput');
  
  const currentErrorRate = calculateAverage(recentData, 'errorRate');
  const previousErrorRate = calculateAverage(previousData, 'errorRate');

  // Generate insights based on the data
  const insights: PerformanceInsight[] = [];
  
  // Response time insight
  const responseTimeDiff = ((currentResponseTime - previousResponseTime) / previousResponseTime) * 100;
  if (Math.abs(responseTimeDiff) > 5) {
    insights.push({
      type: responseTimeDiff < 0 ? 'positive' : 'negative',
      text: `Response time has ${responseTimeDiff < 0 ? 'decreased' : 'increased'} by ${Math.abs(responseTimeDiff).toFixed(1)}% compared to the previous period.`
    });
  }
  
  // Throughput insight
  const throughputDiff = ((currentThroughput - previousThroughput) / previousThroughput) * 100;
  if (Math.abs(throughputDiff) > 5) {
    insights.push({
      type: throughputDiff > 0 ? 'positive' : 'negative',
      text: `Operation throughput has ${throughputDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(throughputDiff).toFixed(1)}% compared to the previous period.`
    });
  }
  
  // Error rate insight
  const errorRateDiff = ((currentErrorRate - previousErrorRate) / previousErrorRate) * 100;
  if (Math.abs(errorRateDiff) > 5) {
    insights.push({
      type: errorRateDiff < 0 ? 'positive' : 'negative',
      text: `Error rate has ${errorRateDiff < 0 ? 'decreased' : 'increased'} by ${Math.abs(errorRateDiff).toFixed(1)}% compared to the previous period.`
    });
  }
  
  // Peak usage insight
  const peakResponseTime = Math.max(...trends.map(t => t.responseTime));
  insights.push({
    type: 'neutral',
    text: `Peak response time of ${peakResponseTime}ms was observed during this period.`
  });
  
  // Add a generic insight based on operation type
  switch (operationType) {
    case 'campaignCreation':
      insights.push({
        type: 'neutral',
        text: 'Campaign creation operations are more resource-intensive and typically have higher response times.'
      });
      break;
    case 'keywordUpdate':
      insights.push({
        type: 'neutral',
        text: 'Keyword updates are processed in batches and may show occasional throughput spikes.'
      });
      break;
    case 'budgetAdjustment':
      insights.push({
        type: 'neutral',
        text: 'Budget adjustments have consistently low error rates and quick response times.'
      });
      break;
    case 'adGroupModification':
      insights.push({
        type: 'neutral',
        text: 'Ad group modifications involve multiple API calls which may affect overall response time.'
      });
      break;
  }
  
  // Generate recommendations based on metrics
  let recommendations = '';
  
  if (currentErrorRate > 5) {
    recommendations = `Consider implementing additional error handling and retry logic for ${operationType} operations to reduce the current ${currentErrorRate.toFixed(1)}% error rate.`;
  } else if (currentResponseTime > 400) {
    recommendations = `${operationType} operations are showing high response times. Consider optimizing API calls or implementing request batching to improve performance.`;
  } else if (currentThroughput < 20) {
    recommendations = `${operationType} throughput is lower than expected. Review rate limiting configuration and consider increasing concurrency for these operations.`;
  } else {
    recommendations = `Current ${operationType} performance metrics are within expected ranges. Continue monitoring for any significant changes in response time or error rates.`;
  }

  return {
    avgResponseTime: {
      current: currentResponseTime,
      previous: previousResponseTime
    },
    throughput: {
      current: currentThroughput,
      previous: previousThroughput
    },
    errorRate: {
      current: currentErrorRate,
      previous: previousErrorRate
    },
    trends,
    insights,
    recommendations
  };
};

export default usePerformanceMetrics;
