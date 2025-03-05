import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { CampaignCloneConfig, MatchType } from '../../types/campaign-types';
import ErrorBoundary from '../common/error-boundary';
import NegativeKeywordManager from './negative-keyword-manager';

interface CloneConfigurationStepProps {
  config: CampaignCloneConfig;
  onConfigChange: (updates: Partial<CampaignCloneConfig>) => void;
  selectedCampaigns: any[]; // Should match Campaign[] but simplified for error avoidance
  sourceMatchType: MatchType;
  targetMatchType: MatchType;
}

/**
 * Clone Configuration Step component
 * 
 * Allows users to configure the campaign cloning operation settings
 * including naming patterns, bid adjustments, and other options.
 */
const CloneConfigurationStep: React.FC<CloneConfigurationStepProps> = ({
  config,
  onConfigChange,
  selectedCampaigns,
  sourceMatchType,
  targetMatchType,
}) => {
  const handleNamingPatternChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ namingPattern: event.target.value });
  };

  const handleBidAdjustmentToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ adjustBids: event.target.checked });
  };

  const handleBidAdjustmentFactorChange = (_event: Event, newValue: number | number[]) => {
    onConfigChange({ bidAdjustmentFactor: newValue as number });
  };

  const handleNegativeKeywordsToggle = (value: boolean) => {
    onConfigChange({ addNegativeKeywords: value });
  };

  const handleToggleAdsInclude = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ includeAds: event.target.checked });
  };

  const handleToggleExtensionsInclude = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ includeExtensions: event.target.checked });
  };

  const handleFinalUrlsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ updateFinalUrls: event.target.checked });
  };

  const handleFinalUrlPatternChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ finalUrlPattern: event.target.value });
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load configuration options.</Typography>}>
      <Box sx={{ my: 2 }}>
        <Grid container spacing={3}>
          {/* Naming Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Campaign Naming" 
                subheader="Configure how the cloned campaigns will be named"
              />
              <Divider />
              <CardContent>
                <TextField
                  fullWidth
                  label="Naming Pattern"
                  value={config.namingPattern}
                  onChange={handleNamingPatternChange}
                  helperText="Use {originalName}, {sourceMatchType}, and {targetMatchType} as placeholders"
                  variant="outlined"
                  margin="normal"
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Original: "Brand Campaign - Exact"<br />
                    Cloned: "{config.namingPattern
                      .replace('{originalName}', 'Brand Campaign - Exact')
                      .replace('{sourceMatchType}', sourceMatchType.charAt(0).toUpperCase() + sourceMatchType.slice(1))
                      .replace('{targetMatchType}', targetMatchType.charAt(0).toUpperCase() + targetMatchType.slice(1))
                    }"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bid Adjustments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Bid Adjustments" 
                subheader="Configure bid changes for the cloned campaigns"
                action={
                  <Tooltip title="Adjust bids in the cloned campaigns based on match type performance differences">
                    <IconButton size="small">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              <Divider />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.adjustBids}
                        onChange={handleBidAdjustmentToggle}
                        color="primary"
                      />
                    }
                    label="Adjust bids in cloned campaigns"
                  />
                  
                  {config.adjustBids && (
                    <Box sx={{ mt: 2 }}>
                      <Typography gutterBottom>
                        Bid Adjustment Factor: {config.bidAdjustmentFactor ? 
                          `${(config.bidAdjustmentFactor * 100).toFixed(0)}%` : '80%'}
                      </Typography>
                      <Slider
                        value={config.bidAdjustmentFactor || 0.8}
                        onChange={handleBidAdjustmentFactorChange}
                        step={0.05}
                        marks={[
                          { value: 0.5, label: '50%' },
                          { value: 1, label: '100%' },
                          { value: 1.5, label: '150%' },
                        ]}
                        min={0.5}
                        max={1.5}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                      />
                      <FormHelperText>
                        Adjust bids based on expected performance differences between match types.
                        For example, broad match typically requires lower bids than exact match.
                      </FormHelperText>
                    </Box>
                  )}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Options */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Additional Options" 
                subheader="Configure what to include in the cloned campaigns"
              />
              <Divider />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeAds}
                        onChange={handleToggleAdsInclude}
                        color="primary"
                      />
                    }
                    label="Include ads"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeExtensions}
                        onChange={handleToggleExtensionsInclude}
                        color="primary"
                      />
                    }
                    label="Include ad extensions"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.updateFinalUrls}
                        onChange={handleFinalUrlsToggle}
                        color="primary"
                      />
                    }
                    label="Update final URLs"
                  />
                  
                  {config.updateFinalUrls && (
                    <Box sx={{ mt: 2, ml: 4 }}>
                      <TextField
                        fullWidth
                        label="URL Pattern"
                        value={config.finalUrlPattern || ''}
                        onChange={handleFinalUrlPatternChange}
                        helperText="Use {originalUrl} as placeholder for the original URL"
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Negative Keywords */}
          <Grid item xs={12}>
            <NegativeKeywordManager
              selectedCampaigns={selectedCampaigns}
              sourceMatchType={sourceMatchType}
              addNegativeKeywords={config.addNegativeKeywords}
              onAddNegativeKeywordsChange={handleNegativeKeywordsToggle}
            />
          </Grid>
        </Grid>
      </Box>
    </ErrorBoundary>
  );
};

export default CloneConfigurationStep;
