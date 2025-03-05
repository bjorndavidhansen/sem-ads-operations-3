import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Checkbox, 
  Chip,
  CircularProgress, 
  Divider, 
  FormControlLabel, 
  Grid, 
  IconButton, 
  InputAdornment, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemSecondaryAction, 
  ListItemText, 
  Paper, 
  TextField, 
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Campaign, CampaignSelectionFilter, CampaignStatus, MatchType } from '../../types/campaign-types';
import campaignService from '../../lib/campaign-service';
import { ErrorBoundary } from '../common/error-boundary';

interface CampaignSelectionWizardProps {
  accountId: string;
  selectedCampaigns: Campaign[];
  onCampaignSelectionChange: (campaigns: Campaign[]) => void;
  sourceMatchType: MatchType;
  onSourceMatchTypeChange: (matchType: MatchType) => void;
  targetMatchType: MatchType;
  onTargetMatchTypeChange: (matchType: MatchType) => void;
}

/**
 * Campaign Selection Wizard Component
 * 
 * Allows users to search, filter, and select campaigns for cloning operations.
 * Displays campaign performance metrics and validates selection compatibility.
 */
const CampaignSelectionWizard: React.FC<CampaignSelectionWizardProps> = ({
  accountId,
  selectedCampaigns,
  onCampaignSelectionChange,
  sourceMatchType,
  onSourceMatchTypeChange,
  targetMatchType,
  onTargetMatchTypeChange
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CampaignSelectionFilter>({
    status: ['enabled'],
  });

  // Load campaigns from the service
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const fetchedCampaigns = await campaignService.fetchCampaigns(accountId);
        setCampaigns(fetchedCampaigns);
        applyFilters(fetchedCampaigns, filters, searchTerm);
      } catch (err) {
        setError('Failed to load campaigns. Please try again.');
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [accountId]);

  // Apply filters and search
  const applyFilters = (
    campaignList: Campaign[],
    filterCriteria: CampaignSelectionFilter,
    search: string
  ) => {
    let result = [...campaignList];

    // Apply status filter
    if (filterCriteria.status && filterCriteria.status.length > 0) {
      result = result.filter(campaign => 
        filterCriteria.status?.includes(campaign.status)
      );
    }

    // Apply labels filter
    if (filterCriteria.labels && filterCriteria.labels.length > 0) {
      result = result.filter(campaign => 
        campaign.labels.some(label => filterCriteria.labels?.includes(label))
      );
    }

    // Apply search term
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(campaign => 
        campaign.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCampaigns(result);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<CampaignSelectionFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(campaigns, updatedFilters, searchTerm);
  };

  // Handle search term changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    applyFilters(campaigns, filters, newSearchTerm);
  };

  // Toggle campaign selection
  const toggleCampaignSelection = (campaign: Campaign) => {
    const isSelected = selectedCampaigns.some(c => c.id === campaign.id);
    
    if (isSelected) {
      onCampaignSelectionChange(selectedCampaigns.filter(c => c.id !== campaign.id));
    } else {
      onCampaignSelectionChange([...selectedCampaigns, campaign]);
    }
  };

  // Check if a campaign is valid for selection based on match type
  const isCampaignValid = (campaign: Campaign): boolean => {
    // Check if all keywords in the campaign match the source match type
    return campaign.adGroups.every(adGroup => 
      adGroup.keywords.every(keyword => keyword.matchType === sourceMatchType)
    );
  };

  // Render campaign list item
  const renderCampaignItem = (campaign: Campaign) => {
    const isSelected = selectedCampaigns.some(c => c.id === campaign.id);
    const isValid = isCampaignValid(campaign);
    
    // Calculate total metrics for the campaign
    const totalImpressions = campaign.adGroups.flatMap(ag => 
      ag.keywords.map(k => k.performanceMetrics?.impressions || 0)
    ).reduce((sum, current) => sum + current, 0);
    
    const totalClicks = campaign.adGroups.flatMap(ag => 
      ag.keywords.map(k => k.performanceMetrics?.clicks || 0)
    ).reduce((sum, current) => sum + current, 0);
    
    const totalConversions = campaign.adGroups.flatMap(ag => 
      ag.keywords.map(k => k.performanceMetrics?.conversions || 0)
    ).reduce((sum, current) => sum + current, 0);
    
    const keywordCount = campaign.adGroups.reduce(
      (sum, adGroup) => sum + adGroup.keywords.length, 0
    );

    return (
      <ListItem 
        key={campaign.id}
        button 
        onClick={() => isValid && toggleCampaignSelection(campaign)}
        selected={isSelected}
        disabled={!isValid}
        divider
      >
        <ListItemIcon>
          <Checkbox 
            checked={isSelected}
            disabled={!isValid}
            onChange={() => isValid && toggleCampaignSelection(campaign)}
            color="primary"
          />
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box display="flex" alignItems="center">
              <Typography variant="subtitle1">{campaign.name}</Typography>
              {!isValid && (
                <Chip 
                  icon={<ErrorIcon />} 
                  label="Incompatible Match Type" 
                  size="small" 
                  color="error"
                  style={{ marginLeft: 8 }}
                />
              )}
              <Chip 
                label={campaign.status} 
                size="small" 
                color={campaign.status === 'enabled' ? 'success' : 'default'}
                style={{ marginLeft: 8 }}
              />
            </Box>
          }
          secondary={
            <Grid container spacing={2} style={{ marginTop: 4 }}>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">
                  Keywords: {keywordCount}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">
                  Impressions: {totalImpressions.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">
                  Clicks: {totalClicks.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">
                  Conversions: {totalConversions.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          }
        />
        
        {campaign.labels.length > 0 && (
          <Box mr={2} display="flex" flexWrap="wrap" gap={0.5} maxWidth={200}>
            {campaign.labels.map(label => (
              <Chip 
                key={label} 
                label={label} 
                size="small" 
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </ListItem>
    );
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load campaign selection.</Typography>}>
      <Card>
        <CardHeader 
          title="Select Campaigns to Clone" 
          subheader="Choose the campaigns you want to clone and convert"
        />
        
        <CardContent>
          <Grid container spacing={3}>
            {/* Match Type Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="source-match-type-label">Source Match Type</InputLabel>
                <Select
                  labelId="source-match-type-label"
                  value={sourceMatchType}
                  onChange={(e) => onSourceMatchTypeChange(e.target.value as MatchType)}
                  label="Source Match Type"
                >
                  <MenuItem value="exact">Exact Match</MenuItem>
                  <MenuItem value="phrase">Phrase Match</MenuItem>
                  <MenuItem value="broad">Broad Match</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="target-match-type-label">Target Match Type</InputLabel>
                <Select
                  labelId="target-match-type-label"
                  value={targetMatchType}
                  onChange={(e) => onTargetMatchTypeChange(e.target.value as MatchType)}
                  label="Target Match Type"
                >
                  <MenuItem value="exact">Exact Match</MenuItem>
                  <MenuItem value="phrase">Phrase Match</MenuItem>
                  <MenuItem value="broad">Broad Match</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Search and Filter */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton 
                  aria-label="filter list" 
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{ marginLeft: 8 }}
                >
                  <FilterListIcon />
                </IconButton>
              </Box>
              
              {/* Filter Panel */}
              {filterOpen && (
                <Paper style={{ padding: 16, marginBottom: 16 }}>
                  <Typography variant="subtitle1" gutterBottom>Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                          labelId="status-filter-label"
                          multiple
                          value={filters.status || []}
                          onChange={(e) => handleFilterChange({ 
                            status: e.target.value as CampaignStatus[] 
                          })}
                          renderValue={(selected) => (
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {(selected as CampaignStatus[]).map((value) => (
                                <Chip key={value} label={value} />
                              ))}
                            </Box>
                          )}
                        >
                          <MenuItem value="enabled">Enabled</MenuItem>
                          <MenuItem value="paused">Paused</MenuItem>
                          <MenuItem value="removed">Removed</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="labels-filter-label">Labels</InputLabel>
                        <Select
                          labelId="labels-filter-label"
                          multiple
                          value={filters.labels || []}
                          onChange={(e) => handleFilterChange({ 
                            labels: e.target.value as string[] 
                          })}
                          renderValue={(selected) => (
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {(selected as string[]).map((value) => (
                                <Chip key={value} label={value} />
                              ))}
                            </Box>
                          )}
                        >
                          {/* Extract unique labels from all campaigns */}
                          {Array.from(new Set(campaigns.flatMap(c => c.labels))).map(label => (
                            <MenuItem key={label} value={label}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Grid>
            
            {/* Campaign List */}
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                style={{ maxHeight: 400, overflow: 'auto' }}
              >
                {loading ? (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height={200}
                  >
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height={200}
                  >
                    <Typography color="error">{error}</Typography>
                  </Box>
                ) : filteredCampaigns.length === 0 ? (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height={200}
                  >
                    <Typography variant="body1">No campaigns found.</Typography>
                  </Box>
                ) : (
                  <List>
                    {filteredCampaigns.map(campaign => renderCampaignItem(campaign))}
                  </List>
                )}
              </Paper>
            </Grid>
            
            {/* Selection Summary */}
            <Grid item xs={12}>
              <Paper variant="outlined" style={{ padding: 16 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Campaigns: {selectedCampaigns.length}
                </Typography>
                
                {selectedCampaigns.length > 0 && (
                  <>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedCampaigns.map(campaign => (
                        <Chip 
                          key={campaign.id}
                          label={campaign.name}
                          onDelete={() => toggleCampaignSelection(campaign)}
                          color="primary"
                        />
                      ))}
                    </Box>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="body2">
                        Total Keywords: {selectedCampaigns.reduce(
                          (sum, campaign) => sum + campaign.adGroups.reduce(
                            (agSum, adGroup) => agSum + adGroup.keywords.length, 0
                          ), 0
                        )}
                      </Typography>
                      
                      <Typography variant="body2">
                        Total Ad Groups: {selectedCampaigns.reduce(
                          (sum, campaign) => sum + campaign.adGroups.length, 0
                        )}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default CampaignSelectionWizard;
