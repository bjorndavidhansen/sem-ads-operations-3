import { useState, useEffect } from 'react';
import { 
  OperationCount,
  SuccessRate,
  ErrorBreakdown,
  OperationType, 
  MetricsTimeframe 
} from '../types/monitoring-types';
import { getTimeframeStartDate } from '../utils/date-utils';

/**
 * Hook to fetch and process operation metrics data
 * 
 * @param operationType - The type of operation to fetch metrics for
 * @param timeframe - The timeframe to fetch metrics for
 * @returns Operation metrics data and loading state
 */
const useOperationMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): {
  operationCounts: OperationCount[] | null;
  successRates: SuccessRate[] | null;
  errorBreakdown: ErrorBreakdown[] | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const [operationCounts, setOperationCounts] = useState<OperationCount[] | null>(null);
  const [successRates, setSuccessRates] = useState<SuccessRate[] | null>(null);
  const [errorBreakdown, setErrorBreakdown] = useState<ErrorBreakdown[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOperationMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch(`/api/metrics/operations?operation=${operationType}&timeframe=${timeframe}`);
        // const data = await response.json();

        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 900));
        
        // Generate mock data based on operation type and timeframe
        const { 
          mockOperationCounts, 
          mockSuccessRates, 
          mockErrorBreakdown 
        } = generateMockOperationMetrics(operationType, timeframe);
        
        if (isMounted) {
          setOperationCounts(mockOperationCounts);
          setSuccessRates(mockSuccessRates);
          setErrorBreakdown(mockErrorBreakdown);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching operation metrics:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setIsLoading(false);
        }
      }
    };

    fetchOperationMetrics();

    return () => {
      isMounted = false;
    };
  }, [operationType, timeframe]);

  return { operationCounts, successRates, errorBreakdown, isLoading, error };
};

/**
 * Generate mock operation metrics data for testing
 * 
 * @param operationType - Type of operation
 * @param timeframe - Metrics timeframe
 * @returns Mock operation metrics data
 */
const generateMockOperationMetrics = (
  operationType: OperationType,
  timeframe: MetricsTimeframe
): {
  mockOperationCounts: OperationCount[];
  mockSuccessRates: SuccessRate[];
  mockErrorBreakdown: ErrorBreakdown[];
} => {
  // Base success rates by operation type (percentage)
  const baseSuccessRate = 
    operationType === 'campaignCreation' ? 92 :
    operationType === 'keywordUpdate' ? 96 :
    operationType === 'budgetAdjustment' ? 98 :
    operationType === 'adGroupModification' ? 94 : 95;
  
  // Base volume by operation type
  const baseVolume = 
    operationType === 'campaignCreation' ? 250 :
    operationType === 'keywordUpdate' ? 1200 :
    operationType === 'budgetAdjustment' ? 450 :
    operationType === 'adGroupModification' ? 650 : 500;
  
  // Apply timeframe multiplier
  const timeframeMultiplier = 
    timeframe === 'last24Hours' ? 0.2 :
    timeframe === 'lastWeek' ? 1 :
    timeframe === 'lastMonth' ? 4 :
    timeframe === 'lastQuarter' ? 12 : 1;
  
  const totalOperations = Math.round(baseVolume * timeframeMultiplier);
  const successfulOperations = Math.round(totalOperations * (baseSuccessRate / 100));
  const failedOperations = totalOperations - successfulOperations;
  
  // Generate operation counts by subtype
  const mockOperationCounts: OperationCount[] = [];
  
  switch (operationType) {
    case 'campaignCreation':
      mockOperationCounts.push(
        {
          name: 'Create Search Campaign',
          count: Math.round(totalOperations * 0.65),
          percentage: 65
        },
        {
          name: 'Create Display Campaign',
          count: Math.round(totalOperations * 0.25),
          percentage: 25
        },
        {
          name: 'Create Video Campaign',
          count: Math.round(totalOperations * 0.1),
          percentage: 10
        }
      );
      break;
      
    case 'keywordUpdate':
      mockOperationCounts.push(
        {
          name: 'Add Keywords',
          count: Math.round(totalOperations * 0.45),
          percentage: 45
        },
        {
          name: 'Update Bids',
          count: Math.round(totalOperations * 0.35),
          percentage: 35
        },
        {
          name: 'Change Match Types',
          count: Math.round(totalOperations * 0.20),
          percentage: 20
        }
      );
      break;
      
    case 'budgetAdjustment':
      mockOperationCounts.push(
        {
          name: 'Increase Budget',
          count: Math.round(totalOperations * 0.55),
          percentage: 55
        },
        {
          name: 'Decrease Budget',
          count: Math.round(totalOperations * 0.30),
          percentage: 30
        },
        {
          name: 'Reallocate Budget',
          count: Math.round(totalOperations * 0.15),
          percentage: 15
        }
      );
      break;
      
    case 'adGroupModification':
      mockOperationCounts.push(
        {
          name: 'Create Ad Group',
          count: Math.round(totalOperations * 0.40),
          percentage: 40
        },
        {
          name: 'Update Ad Group',
          count: Math.round(totalOperations * 0.35),
          percentage: 35
        },
        {
          name: 'Pause Ad Group',
          count: Math.round(totalOperations * 0.25),
          percentage: 25
        }
      );
      break;
  }
  
  // Generate success rates for different segments
  const mockSuccessRates: SuccessRate[] = [
    {
      name: 'Overall',
      successRate: baseSuccessRate,
      total: totalOperations,
      successful: successfulOperations,
      failed: failedOperations
    }
  ];
  
  // Add success rates by volume segment
  mockSuccessRates.push(
    {
      name: 'Small (1-10)',
      successRate: Math.min(baseSuccessRate + 2, 100),
      total: Math.round(totalOperations * 0.35),
      successful: Math.round(totalOperations * 0.35 * ((baseSuccessRate + 2) / 100)),
      failed: Math.round(totalOperations * 0.35 * (1 - (baseSuccessRate + 2) / 100))
    },
    {
      name: 'Medium (11-50)',
      successRate: baseSuccessRate,
      total: Math.round(totalOperations * 0.45),
      successful: Math.round(totalOperations * 0.45 * (baseSuccessRate / 100)),
      failed: Math.round(totalOperations * 0.45 * (1 - baseSuccessRate / 100))
    },
    {
      name: 'Large (50+)',
      successRate: Math.max(baseSuccessRate - 3.5, 75),
      total: Math.round(totalOperations * 0.2),
      successful: Math.round(totalOperations * 0.2 * ((baseSuccessRate - 3.5) / 100)),
      failed: Math.round(totalOperations * 0.2 * (1 - (baseSuccessRate - 3.5) / 100))
    }
  );
  
  // Generate error breakdown
  const mockErrorBreakdown: ErrorBreakdown[] = [];
  
  // Common error types
  const commonErrors = [
    {
      type: 'API Rate Limit',
      percentage: 12,
      description: 'Operation exceeded Google Ads API rate limits'
    },
    {
      type: 'Invalid Input',
      percentage: 18,
      description: 'User provided invalid or incomplete input data'
    },
    {
      type: 'Authentication',
      percentage: 5,
      description: 'Google Ads API authentication issues'
    }
  ];
  
  // Operation-specific errors
  switch (operationType) {
    case 'campaignCreation':
      mockErrorBreakdown.push(
        {
          type: 'Budget Validation',
          percentage: 25,
          description: 'Campaign budget does not meet minimum requirements'
        },
        {
          type: 'Duplicate Campaign',
          percentage: 20,
          description: 'Campaign with the same name already exists'
        },
        ...commonErrors
      );
      break;
      
    case 'keywordUpdate':
      mockErrorBreakdown.push(
        {
          type: 'Invalid Keyword',
          percentage: 30,
          description: 'Keyword contains invalid characters or format'
        },
        {
          type: 'Disapproved Keyword',
          percentage: 15,
          description: 'Keyword was disapproved by Google Ads policies'
        },
        ...commonErrors
      );
      break;
      
    case 'budgetAdjustment':
      mockErrorBreakdown.push(
        {
          type: 'Budget Too Low',
          percentage: 35,
          description: 'Requested budget is below minimum threshold'
        },
        {
          type: 'Campaign Not Found',
          percentage: 15,
          description: 'Target campaign does not exist or was removed'
        },
        ...commonErrors
      );
      break;
      
    case 'adGroupModification':
      mockErrorBreakdown.push(
        {
          type: 'Missing Ads',
          percentage: 25,
          description: 'Ad group requires at least one active ad'
        },
        {
          type: 'Targeting Issue',
          percentage: 20,
          description: 'Invalid targeting criteria specified'
        },
        ...commonErrors
      );
      break;
  }
  
  // Calculate error counts
  mockErrorBreakdown.forEach(errorItem => {
    errorItem.count = Math.round((errorItem.percentage / 100) * failedOperations);
  });
  
  // Sort by percentage (descending)
  mockErrorBreakdown.sort((a, b) => b.percentage - a.percentage);
  
  return {
    mockOperationCounts,
    mockSuccessRates,
    mockErrorBreakdown
  };
};

export default useOperationMetrics;
