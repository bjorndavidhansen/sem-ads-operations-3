import React, { useState, useEffect, useMemo } from 'react';
import { 
  DashboardFilters, 
  TimeRange,
  MetricData,
  TimeSeriesData,
  CategoryData
} from '../../types/dashboard-types';
import { metricsService } from '../../lib/metrics-service';
import KPICard from './kpi-card';

/**
 * Rollback Dashboard Component
 * 
 * Main dashboard for monitoring rollback operations
 */
export const RollbackDashboard: React.FC = () => {
  // Dashboard state
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [filters, setFilters] = useState<DashboardFilters>({
    timeRange: '24h',
    operationTypes: [],
    statuses: [],
    contexts: ['rollback'],
    searchTerm: ''
  });
  
  // Metrics state
  const [successRate, setSuccessRate] = useState<MetricData | null>(null);
  const [durationTrends, setDurationTrends] = useState<TimeSeriesData | null>(null);
  const [resourceRecovery, setResourceRecovery] = useState<CategoryData | null>(null);
  const [errorFrequency, setErrorFrequency] = useState<CategoryData | null>(null);
  const [rollbackVolume, setRollbackVolume] = useState<TimeSeriesData | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refresh timer reference
  const refreshInterval = 15000; // 15 seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      
      // Update state with fetched data
      setSuccessRate(successRateData);
      setDurationTrends(durationTrendsData);
      setResourceRecovery(resourceRecoveryData);
      setErrorFrequency(errorFrequencyData);
      setRollbackVolume(rollbackVolumeData);
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setFilters(prev => ({ ...prev, timeRange: newRange }));
  };
  
  // Effect to load data on mount and when time range changes
  useEffect(() => {
    loadDashboardData();
    
    // Set up refresh interval
    const intervalId = setInterval(loadDashboardData, refreshInterval);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [timeRange, filters, refreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: loadDashboardData is intentionally omitted to avoid infinite loops
  
  // Calculate time since last refresh
  const refreshTimeAgo = useMemo(() => {
    const seconds = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  }, [lastRefresh]);
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rollback Operations Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            {/* Time range selector */}
            <div className="flex bg-white rounded-md shadow-sm">
              {(['1h', '24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleTimeRangeChange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Refresh button */}
            <button
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-100"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <svg
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </div>
        
        {/* Last refresh indicator */}
        <div className="text-xs text-gray-500 mb-4 text-right">
          Last updated: {refreshTimeAgo}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error.message || 'An error occurred loading dashboard data'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* KPI cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPICard
            title="Rollback Success Rate"
            value={successRate?.current || 0}
            comparison={successRate?.comparison}
            trend={successRate?.trend}
            format="percentage"
            threshold={90}
            loading={loading}
          />
          
          <KPICard
            title="Avg Rollback Duration"
            value={durationTrends?.current || 0}
            format="time"
            loading={loading}
          />
          
          <KPICard
            title="Resource Recovery Rate"
            value={resourceRecovery?.current || 0}
            comparison={resourceRecovery?.comparison}
            trend={resourceRecovery?.trend}
            format="percentage"
            threshold={95}
            loading={loading}
          />
        </div>
        
        {/* Charts placeholder - to be implemented */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 h-80">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Rollback Duration Trends</h3>
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
              <p className="text-gray-500">Duration chart will be displayed here</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 h-80">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Resource Recovery by Type</h3>
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
              <p className="text-gray-500">Resource recovery chart will be displayed here</p>
            </div>
          </div>
        </div>
        
        {/* More metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Error Frequency</h3>
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : errorFrequency?.categories && errorFrequency.categories.length > 0 ? (
              <div className="space-y-2">
                {errorFrequency.categories.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{category.category}</span>
                    <span className="text-sm font-medium text-red-600">{category.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No errors recorded in this time period</p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Rollback Volume</h3>
            <div className="flex items-center">
              <KPICard
                title="Total Rollbacks"
                value={rollbackVolume?.current || 0}
                format="number"
                loading={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Footer with disclaimer */}
        <div className="text-xs text-gray-500 mt-8 text-center">
          Data refreshes automatically every 15 seconds. 
          <button onClick={loadDashboardData} className="ml-1 text-blue-600 hover:underline">
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RollbackDashboard;
