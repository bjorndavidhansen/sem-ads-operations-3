import React, { useState } from 'react';
import { Box, Grid, Tabs, Tab, useTheme, CircularProgress, Typography, Paper } from '@mui/material';
import ApiUsageCard from './api-usage-card';
import OperationMetricsCard from './operation-metrics-card';
import PerformanceInsightsCard from './performance-insights-card';
import MetricsTimeframeSelector from './metrics-timeframe-selector';
import { OperationType, MetricsTimeframe } from '../../types/monitoring-types';
import { useApiMetrics, useOperationMetrics, usePerformanceMetrics } from '../../hooks';
import { ErrorBoundary } from '../common';

/**
 * Operations Monitoring Dashboard component
 * Provides a comprehensive view of operation metrics, API usage, and performance insights
 */
const OperationsMonitoringDashboard: React.FC = () => {
  const theme = useTheme();
  const [activeOperation, setActiveOperation] = useState<OperationType>('campaignCreation');
  const [timeframe, setTimeframe] = useState<MetricsTimeframe>('last24Hours');

  // Metrics hooks with error handling
  const { apiUsage, rateLimitEvents, isLoading: apiLoading, error: apiError } = useApiMetrics(activeOperation, timeframe);
  const { operationCounts, successRates, errorBreakdown, isLoading: opsLoading, error: opsError } = useOperationMetrics(activeOperation, timeframe);
  const { performanceMetrics, isLoading: perfLoading, error: perfError } = usePerformanceMetrics(activeOperation, timeframe);

  const isLoading = apiLoading || opsLoading || perfLoading;
  const hasError = apiError || opsError || perfError;

  const handleOperationChange = (_: React.SyntheticEvent, newValue: OperationType) => {
    setActiveOperation(newValue);
  };

  const handleTimeframeChange = (newTimeframe: MetricsTimeframe) => {
    setTimeframe(newTimeframe);
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* Dashboard Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Operations Monitoring Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Real-time metrics and insights for Google Ads operations
        </Typography>

        <Paper sx={{ p: 1 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Tabs
                value={activeOperation}
                onChange={handleOperationChange}
                sx={{ 
                  '& .MuiTabs-flexContainer': { gap: 2 }
                }}
              >
                <Tab 
                  label="Campaign Operations" 
                  value="campaignCreation" 
                  sx={{ textTransform: 'none' }}
                />
                <Tab 
                  label="Keyword Management" 
                  value="keywordUpdate" 
                  sx={{ textTransform: 'none' }}
                />
                <Tab 
                  label="Budget Controls" 
                  value="budgetAdjustment" 
                  sx={{ textTransform: 'none' }}
                />
                <Tab 
                  label="Ad Group Management" 
                  value="adGroupModification" 
                  sx={{ textTransform: 'none' }}
                />
              </Tabs>
            </Grid>
            
            <Grid item>
              <MetricsTimeframeSelector
                value={timeframe}
                onChange={handleTimeframeChange}
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Dashboard Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : hasError ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h6" color="error">
            Error loading monitoring data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {apiError?.message || opsError?.message || perfError?.message || 'Unknown error occurred'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Top row: API and Operation metrics */}
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <ApiUsageCard
                apiUsage={apiUsage}
                rateLimitEvents={rateLimitEvents}
                timeframe={timeframe}
                operationType={activeOperation}
              />
            </ErrorBoundary>
          </Grid>

          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <OperationMetricsCard
                operationCounts={operationCounts}
                successRates={successRates}
                errorBreakdown={errorBreakdown}
                timeframe={timeframe}
                operationType={activeOperation}
              />
            </ErrorBoundary>
          </Grid>

          {/* Bottom row: Performance insights */}
          <Grid item xs={12}>
            <ErrorBoundary>
              <PerformanceInsightsCard
                performanceMetrics={performanceMetrics}
                isLoading={false} // Already handled at dashboard level
                operationType={activeOperation}
                timeframe={timeframe}
              />
            </ErrorBoundary>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default OperationsMonitoringDashboard;
