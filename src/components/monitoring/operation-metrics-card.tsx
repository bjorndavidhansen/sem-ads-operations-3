import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Divider, 
  Grid, 
  LinearProgress,
  CircularProgress,
  useTheme 
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie 
} from 'recharts';
import { OperationType, OperationCount, SuccessRate, ErrorBreakdown, MetricsTimeframe } from '../../types/monitoring-types';

interface OperationMetricsCardProps {
  operationCounts: OperationCount[] | null;
  successRates: SuccessRate[] | null;
  errorBreakdown: ErrorBreakdown[] | null;
  timeframe: MetricsTimeframe;
  operationType: OperationType;
}

/**
 * Component for displaying operation metrics and success rates
 */
const OperationMetricsCard: React.FC<OperationMetricsCardProps> = ({
  operationCounts,
  successRates,
  errorBreakdown,
  timeframe,
  operationType
}) => {
  const theme = useTheme();
  
  // Color constants for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.secondary.main
  ];

  // Format success rate data for charts
  const getSizeSuccessData = () => {
    if (!successRates || !successRates.bySize) return [];
    
    return [
      { name: 'Small', value: successRates.bySize.small },
      { name: 'Medium', value: successRates.bySize.medium },
      { name: 'Large', value: successRates.bySize.large }
    ];
  };

  const getTimeSuccessData = () => {
    if (!successRates || !successRates.byTime) return [];
    
    return [
      { name: 'Morning', value: successRates.byTime.morning },
      { name: 'Afternoon', value: successRates.byTime.afternoon },
      { name: 'Evening', value: successRates.byTime.evening },
      { name: 'Night', value: successRates.byTime.night }
    ];
  };

  const getStatusData = () => {
    if (!operationCounts) return [];
    
    return [
      { name: 'Successful', value: operationCounts.successful },
      { name: 'Failed', value: operationCounts.failed },
      { name: 'In Progress', value: operationCounts.inProgress }
    ];
  };

  // Format error data for display
  const getFormattedErrorData = () => {
    if (!errorBreakdown) return [];
    
    return errorBreakdown.map((error, index) => ({
      ...error,
      fill: COLORS[index % COLORS.length]
    }));
  };

  const sizeSuccessData = getSizeSuccessData();
  const timeSuccessData = getTimeSuccessData();
  const statusData = getStatusData();
  const formattedErrorData = getFormattedErrorData();

  // Success rate color based on value
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return theme.palette.success.main;
    if (rate >= 85) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (!operationCounts || !successRates || !errorBreakdown) {
    return (
      <Card sx={{ height: '100%', minHeight: 400 }}>
        <CardHeader title="Operation Metrics" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No operation metrics data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="Operation Metrics" 
        subheader={`${operationType} operation success rates and error analysis`}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* Operation Summary */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Operation Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Operations
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {operationCounts.total}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Success Rate
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ mb: 1, color: getSuccessRateColor(successRates.overall) }}
                  >
                    {successRates.overall}%
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Successful
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1, color: theme.palette.success.main }}>
                    {operationCounts.successful}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Failed
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1, color: theme.palette.error.main }}>
                    {operationCounts.failed}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Overall Success Rate
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={successRates.overall} 
                  color={
                    successRates.overall >= 95 
                      ? "success" 
                      : successRates.overall >= 85 
                        ? "warning" 
                        : "error"
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
          </Grid>
          
          {/* Operation Status Distribution */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Operation Status
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          {/* Success Rate by Campaign Size */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Success Rate by Size
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sizeSuccessData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                  <Bar dataKey="value" name="Success Rate">
                    {sizeSuccessData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getSuccessRateColor(entry.value)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          {/* Error Breakdown */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Error Breakdown
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedErrorData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="errorType"
                    label={({ errorType, percentage }) => `${errorType.split(' ')[0]}: ${percentage.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {formattedErrorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${props.payload.percentage.toFixed(1)}%`, props.payload.errorType]} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          {/* Success Rate by Time of Day */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Success Rate by Time of Day
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSuccessData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                  <Legend />
                  <Bar dataKey="value" name="Success Rate">
                    {timeSuccessData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getSuccessRateColor(entry.value)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OperationMetricsCard;
