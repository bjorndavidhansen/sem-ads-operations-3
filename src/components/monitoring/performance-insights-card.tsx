import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Divider, 
  Grid, 
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  PerformanceMetrics, 
  OperationType, 
  MetricsTimeframe, 
  PerformanceInsight,
  PerformanceMetricPoint
} from '../../types/monitoring-types';
import { formatDate } from '../../utils/date-utils';

interface PerformanceInsightsCardProps {
  performanceMetrics: PerformanceMetrics | null;
  isLoading: boolean;
  operationType: OperationType;
  timeframe: MetricsTimeframe;
}

/**
 * Component for displaying performance insights and trends
 */
const PerformanceInsightsCard: React.FC<PerformanceInsightsCardProps> = ({
  performanceMetrics,
  isLoading,
  operationType,
  timeframe
}) => {
  const theme = useTheme();

  // Format data for trend charts
  const getFormattedTrendData = () => {
    if (!performanceMetrics || !performanceMetrics.trends) return [];
    
    return performanceMetrics.trends.map((point: PerformanceMetricPoint) => ({
      ...point,
      date: formatDate(point.timestamp),
      time: new Date(point.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  };

  // Get X-axis format based on timeframe
  const getXAxisFormat = () => {
    switch (timeframe) {
      case 'last24Hours':
        return 'time';
      default:
        return 'date';
    }
  };

  // Get icon for each insight type
  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'negative':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'neutral':
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
    }
  };

  // Get trend icon and color for performance change
  const getTrendIcon = (current: number, previous: number) => {
    const percentChange = ((current - previous) / previous) * 100;
    
    if (Math.abs(percentChange) < 3) {
      return <TrendingFlatIcon sx={{ color: theme.palette.text.secondary }} />;
    }
    
    if (percentChange > 0) {
      // For response time and error rate, up is bad
      const isMetricWorsening = 
        (current === performanceMetrics?.avgResponseTime.current) || 
        (current === performanceMetrics?.errorRate.current);
      
      return isMetricWorsening ? 
        <TrendingUpIcon sx={{ color: theme.palette.error.main }} /> : 
        <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    }
    
    // For response time and error rate, down is good
    const isMetricImproving = 
      (current === performanceMetrics?.avgResponseTime.current) || 
      (current === performanceMetrics?.errorRate.current);
    
    return isMetricImproving ? 
      <TrendingDownIcon sx={{ color: theme.palette.success.main }} /> : 
      <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
  };

  const trendData = getFormattedTrendData();
  const xAxisKey = getXAxisFormat();

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', minHeight: 400 }}>
        <CardHeader title="Performance Insights" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!performanceMetrics) {
    return (
      <Card sx={{ height: '100%', minHeight: 400 }}>
        <CardHeader title="Performance Insights" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Performance Insights" 
        subheader={`${operationType} performance metrics and recommendations`}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          {/* Performance Metrics Summary */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Performance Metrics
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  {getTrendIcon(
                    performanceMetrics.avgResponseTime.current,
                    performanceMetrics.avgResponseTime.previous
                  )}
                </Grid>
                <Grid item xs>
                  <Typography variant="body2" component="div">
                    Response Time
                  </Typography>
                  <Typography variant="h6" component="div">
                    {performanceMetrics.avgResponseTime.current.toFixed(0)} ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.abs(
                      ((performanceMetrics.avgResponseTime.current - performanceMetrics.avgResponseTime.previous) / 
                      performanceMetrics.avgResponseTime.previous) * 100
                    ).toFixed(1)}% {
                      performanceMetrics.avgResponseTime.current > performanceMetrics.avgResponseTime.previous
                        ? 'increase'
                        : 'decrease'
                    } from previous period
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  {getTrendIcon(
                    performanceMetrics.throughput.current,
                    performanceMetrics.throughput.previous
                  )}
                </Grid>
                <Grid item xs>
                  <Typography variant="body2" component="div">
                    Throughput
                  </Typography>
                  <Typography variant="h6" component="div">
                    {performanceMetrics.throughput.current.toFixed(1)}/min
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.abs(
                      ((performanceMetrics.throughput.current - performanceMetrics.throughput.previous) / 
                      performanceMetrics.throughput.previous) * 100
                    ).toFixed(1)}% {
                      performanceMetrics.throughput.current > performanceMetrics.throughput.previous
                        ? 'increase'
                        : 'decrease'
                    } from previous period
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid item>
                  {getTrendIcon(
                    performanceMetrics.errorRate.current,
                    performanceMetrics.errorRate.previous
                  )}
                </Grid>
                <Grid item xs>
                  <Typography variant="body2" component="div">
                    Error Rate
                  </Typography>
                  <Typography 
                    variant="h6" 
                    component="div"
                    sx={{ 
                      color: performanceMetrics.errorRate.current < 3 
                        ? theme.palette.success.main
                        : performanceMetrics.errorRate.current < 8
                          ? theme.palette.warning.main
                          : theme.palette.error.main
                    }}
                  >
                    {performanceMetrics.errorRate.current.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.abs(
                      ((performanceMetrics.errorRate.current - performanceMetrics.errorRate.previous) / 
                      performanceMetrics.errorRate.previous) * 100
                    ).toFixed(1)}% {
                      performanceMetrics.errorRate.current > performanceMetrics.errorRate.previous
                        ? 'increase'
                        : 'decrease'
                    } from previous period
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          {/* Performance Trend Chart */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2" gutterBottom>
              Performance Trends
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="responseTime"
                    name="Response Time (ms)"
                    stroke={theme.palette.primary.main}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="throughput"
                    name="Throughput (ops/min)"
                    stroke={theme.palette.success.main}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="errorRate"
                    name="Error Rate (%)"
                    stroke={theme.palette.error.main}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          {/* Insights and Recommendations */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Performance Insights
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <List dense disablePadding>
                {performanceMetrics.insights.map((insight, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ pb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getInsightIcon(insight.type)}
                    </ListItemIcon>
                    <ListItemText primary={insight.text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Recommendations
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: '100%',
                backgroundColor: theme.palette.info.light,
                color: theme.palette.info.contrastText
              }}
            >
              <Box display="flex" alignItems="flex-start">
                <InfoIcon sx={{ mr: 1, mt: 0.5 }} />
                <Typography variant="body2">
                  {performanceMetrics.recommendations}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceInsightsCard;
