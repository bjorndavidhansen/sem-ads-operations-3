import React, { useState } from 'react';
import RollbackDashboard from '../components/dashboard/rollback-dashboard';
import { useRollbackDashboard } from '../hooks/use-rollback-dashboard';
import { TimeRange } from '../types/dashboard-types';
import KPICard from '../components/dashboard/kpi-card';

/**
 * Rollback Monitoring Page
 * 
 * Full page component that houses the rollback monitoring dashboard
 * and related functionality
 */
const RollbackMonitoringPage: React.FC = () => {
  // Dashboard state using the custom hook
  const {
    metrics,
    filters,
    loading,
    error,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    fetchMetricsData,
    changeTimeRange,
    toggleAutoRefresh,
    changeRefreshInterval
  } = useRollbackDashboard();
  
  // State for displaying additional info panel
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false);
  
  // Calculate time since last refresh
  const getRefreshTimeAgo = (): string => {
    const seconds = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Page header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Rollback Monitoring Dashboard</h1>
          
          <div className="flex items-center space-x-3">
            {/* Time range buttons */}
            <div className="hidden md:flex bg-gray-100 rounded-md shadow-sm">
              {(['1h', '24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filters.timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => changeTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Mobile time range dropdown */}
            <div className="md:hidden">
              <select
                className="bg-gray-100 rounded-md shadow-sm px-3 py-1.5 text-sm font-medium"
                value={filters.timeRange}
                onChange={(e) => changeTimeRange(e.target.value as TimeRange)}
              >
                <option value="1h">1h</option>
                <option value="24h">24h</option>
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="all">all</option>
              </select>
            </div>
            
            {/* Info button */}
            <button
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              aria-label="Dashboard Information"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
            
            {/* Refresh button */}
            <button
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200"
              onClick={fetchMetricsData}
              disabled={loading}
            >
              <svg
                className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`}
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
      </header>
      
      {/* Main content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-6">
        {/* Info panel (conditionally shown) */}
        {showInfoPanel && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-700">Dashboard Information</h3>
                <div className="mt-2 text-sm text-blue-600">
                  <p>This dashboard provides real-time monitoring of rollback operations.</p>
                  <p className="mt-1">Data refreshes automatically every {refreshInterval / 1000} seconds.</p>
                  <p className="mt-1">Last refresh: {getRefreshTimeAgo()}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm text-blue-700 hover:underline"
                    onClick={() => setShowInfoPanel(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
        
        {/* Top KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Success Rate"
            value={metrics['success-rate']?.current || 0}
            comparison={metrics['success-rate']?.comparison}
            trend={metrics['success-rate']?.trend}
            format="percentage"
            threshold={90}
            loading={loading}
          />
          
          <KPICard
            title="Avg Duration"
            value={metrics['duration-trends']?.current || 0}
            format="time"
            loading={loading}
          />
          
          <KPICard
            title="Recovery Rate"
            value={metrics['resource-recovery']?.current || 0}
            comparison={metrics['resource-recovery']?.comparison}
            trend={metrics['resource-recovery']?.trend}
            format="percentage"
            threshold={95}
            loading={loading}
          />
          
          <KPICard
            title="Total Rollbacks"
            value={metrics['rollback-volume']?.current || 0}
            format="number"
            loading={loading}
          />
        </div>
        
        {/* Main dashboard */}
        <RollbackDashboard />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {getRefreshTimeAgo()}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center">
              <label htmlFor="auto-refresh" className="text-sm text-gray-700 mr-2">
                Auto-refresh
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onChange={toggleAutoRefresh}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${
                  autoRefreshEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${
                  autoRefreshEnabled ? 'translate-x-4' : ''
                }`}></div>
              </div>
            </div>
            
            {/* Refresh interval selector (only shown when auto-refresh is on) */}
            {autoRefreshEnabled && (
              <div className="flex items-center">
                <label htmlFor="refresh-interval" className="text-sm text-gray-700 mr-2">
                  Interval
                </label>
                <select
                  id="refresh-interval"
                  className="text-sm border-gray-300 rounded-md shadow-sm"
                  value={refreshInterval}
                  onChange={(e) => changeRefreshInterval(parseInt(e.target.value))}
                >
                  <option value="5000">5s</option>
                  <option value="15000">15s</option>
                  <option value="30000">30s</option>
                  <option value="60000">1m</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RollbackMonitoringPage;
