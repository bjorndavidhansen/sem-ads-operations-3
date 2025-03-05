/**
 * Hook for managing rollback dashboard state and data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DashboardFilters, 
  TimeRange,
  MetricData,
  TimeSeriesData,
  CategoryData,
  DashboardState,
  DashboardLayout
} from '../types/dashboard-types';
import { metricsService } from '../lib/metrics-service';

// Default dashboard layout
const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  filters: {
    timeRange: '24h',
    contexts: ['rollback']
  },
  widgets: [
    {
      id: 'success-rate',
      metric: 'success-rate',
      title: 'Success Rate',
      size: 'medium',
      position: { row: 0, col: 0 }
    },
    {
      id: 'duration-trends',
      metric: 'duration-trends',
      title: 'Duration Trends',
      size: 'large',
      position: { row: 1, col: 0 }
    },
    {
      id: 'resource-recovery',
      metric: 'resource-recovery',
      title: 'Resource Recovery',
      size: 'medium',
      position: { row: 0, col: 1 }
    },
    {
      id: 'error-frequency',
      metric: 'error-frequency',
      title: 'Error Frequency',
      size: 'medium',
      position: { row: 2, col: 0 }
    },
    {
      id: 'rollback-volume',
      metric: 'rollback-volume',
      title: 'Rollback Volume',
      size: 'medium',
      position: { row: 2, col: 1 }
    }
  ]
};

/**
 * Hook for managing rollback dashboard data and state
 */
export const useRollbackDashboard = (initialLayout?: DashboardLayout) => {
  // Dashboard state
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    currentLayout: initialLayout || DEFAULT_LAYOUT,
    filters: initialLayout?.filters || DEFAULT_LAYOUT.filters,
    metrics: {},
    loading: true
  });
  
  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(15000); // 15 seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  /**
   * Fetch metrics data based on current filters
   */
  const fetchMetricsData = useCallback(async () => {
    setDashboardState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const { timeRange } = dashboardState.filters;
      
      // Fetch all metrics in parallel
      const [
        successRateData,
        durationTrendsData,
        resourceRecoveryData,
        errorFrequencyData,
        rollbackVolumeData
      ] = await Promise.all([
        metricsService.getRollbackSuccessRate(timeRange),
        metricsService.getRollbackDurationTrends(timeRange),
        metricsService.getResourceRecoveryEfficiency(timeRange),
        metricsService.getErrorFrequency(timeRange),
        metricsService.getRollbackVolume(timeRange)
      ]);
      
      // Update metrics state
      setDashboardState(prev => ({
        ...prev,
        metrics: {
          'success-rate': successRateData,
          'duration-trends': durationTrendsData,
          'resource-recovery': resourceRecoveryData,
          'error-frequency': errorFrequencyData,
          'rollback-volume': rollbackVolumeData
        },
        loading: false
      }));
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setDashboardState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Failed to fetch metrics') 
      }));
    }
  }, [dashboardState.filters]);
  
  /**
   * Update dashboard filters
   */
  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);
  
  /**
   * Change time range and refetch data
   */
  const changeTimeRange = useCallback((newRange: TimeRange) => {
    updateFilters({ timeRange: newRange });
  }, [updateFilters]);
  
  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);
  
  /**
   * Change refresh interval
   */
  const changeRefreshInterval = useCallback((interval: number) => {
    setRefreshInterval(interval);
  }, []);
  
  /**
   * Apply a new dashboard layout
   */
  const applyLayout = useCallback((layout: DashboardLayout) => {
    setDashboardState(prev => ({
      ...prev,
      currentLayout: layout,
      filters: layout.filters
    }));
  }, []);
  
  /**
   * Reset dashboard to default layout
   */
  const resetToDefault = useCallback(() => {
    applyLayout(DEFAULT_LAYOUT);
  }, [applyLayout]);
  
  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchMetricsData();
  }, [dashboardState.filters, fetchMetricsData]);
  
  // Effect to handle auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const intervalId = setInterval(fetchMetricsData, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, refreshInterval, fetchMetricsData]);
  
  return {
    ...dashboardState,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    fetchMetricsData,
    updateFilters,
    changeTimeRange,
    toggleAutoRefresh,
    changeRefreshInterval,
    applyLayout,
    resetToDefault
  };
};

export default useRollbackDashboard;
