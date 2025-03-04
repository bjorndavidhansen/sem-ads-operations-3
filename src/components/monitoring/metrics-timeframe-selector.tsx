import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { MetricsTimeframe } from '../../types/monitoring-types';

interface MetricsTimeframeSelectorProps {
  value: MetricsTimeframe;
  onChange: (timeframe: MetricsTimeframe) => void;
}

/**
 * Component for selecting the timeframe for metrics visualization
 */
const MetricsTimeframeSelector: React.FC<MetricsTimeframeSelectorProps> = ({ 
  value, 
  onChange 
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>, 
    newValue: MetricsTimeframe | null
  ) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <Typography variant="body1" sx={{ mr: 2 }}>
        Timeframe:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="timeframe selection"
        size="small"
      >
        <ToggleButton value="last24Hours" aria-label="last 24 hours">
          Last 24 Hours
        </ToggleButton>
        <ToggleButton value="lastWeek" aria-label="last week">
          Last Week
        </ToggleButton>
        <ToggleButton value="lastMonth" aria-label="last month">
          Last Month
        </ToggleButton>
        <ToggleButton value="lastQuarter" aria-label="last quarter">
          Last Quarter
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default MetricsTimeframeSelector;
