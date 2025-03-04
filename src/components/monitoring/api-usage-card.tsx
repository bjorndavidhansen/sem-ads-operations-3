import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Divider, 
  Grid, 
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatDate } from '../../utils/date-utils';
import { ApiUsageData, RateLimitEvent, MetricsTimeframe, OperationType } from '../../types/monitoring-types';

interface ApiUsageCardProps {
  apiUsage: ApiUsageData | null;
  rateLimitEvents: RateLimitEvent[] | null;
  timeframe: MetricsTimeframe;
  operationType: OperationType;
}

/**
 * Component for displaying API usage metrics
 */
const ApiUsageCard: React.FC<ApiUsageCardProps> = ({
  apiUsage,
  rateLimitEvents,
  timeframe,
  operationType
}) => {
  const theme = useTheme();

  // Format data for charts
  const getFormattedData = () => {
    if (!apiUsage) return [];
    
    return apiUsage.map(item => ({
      ...item,
      date: formatDate(item.timestamp),
      time: new Date(item.timestamp).toLocaleTimeString([], { 
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

  const formattedData = getFormattedData();
  const xAxisKey = getXAxisFormat();

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', minHeight: 400 }}>
        <CardHeader title="API Usage Metrics" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!apiUsage || apiUsage.length === 0) {
    return (
      <Card sx={{ height: '100%', minHeight: 400 }}>
        <CardHeader title="API Usage Metrics" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No API usage data available for the selected timeframe
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="API Usage Metrics" 
        subheader={`${operationType} operation API metrics`}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${rateLimitEvents?.length || 0} rate limit events`} 
              color={rateLimitEvents && rateLimitEvents.length > 0 ? "warning" : "success"}
              size="small"
            />
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* API Request Volume */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              API Request Volume
            </Typography>
            <Box sx={{ height: 200, mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="requests" 
                    name="Total Requests" 
                    fill={theme.palette.primary.main} 
                  />
                  <Bar 
                    dataKey="successfulRequests" 
                    name="Successful" 
                    fill={theme.palette.success.main} 
                  />
                  <Bar 
                    dataKey="failedRequests" 
                    name="Failed" 
                    fill={theme.palette.error.main} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          {/* Read/Write Split & Response Time */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Read/Write Split
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="readRequests" 
                    name="Read Requests" 
                    stackId="a" 
                    fill={theme.palette.info.main} 
                  />
                  <Bar 
                    dataKey="writeRequests" 
                    name="Write Requests" 
                    stackId="a" 
                    fill={theme.palette.warning.main} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Average Response Time (ms)
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="averageResponseTime" 
                    name="Response Time" 
                    stroke={theme.palette.secondary.main} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ApiUsageCard;
