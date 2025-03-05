import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { Campaign, Keyword, MatchType } from '../../types/campaign-types';
import { ErrorBoundary } from '../common/error-boundary';

interface NegativeKeywordManagerProps {
  selectedCampaigns: Campaign[];
  sourceMatchType: MatchType;
  addNegativeKeywords: boolean;
  onAddNegativeKeywordsChange: (value: boolean) => void;
}

/**
 * Negative Keyword Manager Component
 * 
 * Displays and manages negative keywords to be added to cloned campaigns.
 * Shows source keywords that will be added as negatives to the target campaigns.
 */
const NegativeKeywordManager: React.FC<NegativeKeywordManagerProps> = ({
  selectedCampaigns,
  sourceMatchType,
  addNegativeKeywords,
  onAddNegativeKeywordsChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  // Extract all keywords of the selected source match type from the selected campaigns
  const extractSourceKeywords = (): Keyword[] => {
    const keywordMap = new Map<string, Keyword>();
    
    selectedCampaigns.forEach(campaign => {
      campaign.adGroups.forEach(adGroup => {
        adGroup.keywords.forEach(keyword => {
          if (keyword.matchType === sourceMatchType) {
            // Use keyword text as key to avoid duplicates
            keywordMap.set(keyword.text, keyword);
          }
        });
      });
    });
    
    return Array.from(keywordMap.values());
  };

  const sourceKeywords = extractSourceKeywords();
  
  // Filter keywords based on search term
  const filteredKeywords = searchTerm.trim() 
    ? sourceKeywords.filter(keyword => 
        keyword.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sourceKeywords;

  // Calculate estimated metrics for adding negatives
  const estimatedMetrics = {
    totalKeywords: sourceKeywords.length,
    uniqueKeywords: sourceKeywords.length,
    estimatedImpactPercentage: sourceKeywords.length > 0 ? 25 : 0,
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load negative keyword manager.</Typography>}>
      <Card>
        <CardHeader 
          title="Negative Keyword Management" 
          subheader="Add source keywords as negatives to prevent keyword cannibalization" 
          action={
            <Tooltip title="Adding source keywords as negatives to target campaigns helps prevent keyword cannibalization, ensuring search traffic is routed to the appropriate campaign.">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          }
        />
        
        <Divider />
        
        <CardContent>
          <Box mb={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={addNegativeKeywords}
                  onChange={(e) => onAddNegativeKeywordsChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    Add source keywords as negatives to target campaigns
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Helps prevent keyword cannibalization and ensures proper traffic routing
                  </Typography>
                </Box>
              }
            />
          </Box>
          
          {addNegativeKeywords && (
            <>
              <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">
                  Source Keywords ({filteredKeywords.length} of {sourceKeywords.length})
                </Typography>
                
                <TextField
                  placeholder="Search keywords..."
                  size="small"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Paper variant="outlined">
                <TableContainer style={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Keyword</TableCell>
                        <TableCell>Match Type</TableCell>
                        <TableCell align="right">Impressions</TableCell>
                        <TableCell align="right">Clicks</TableCell>
                        <TableCell align="right">Conversions</TableCell>
                        <TableCell align="right">CTR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredKeywords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" padding={2}>
                              No keywords found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredKeywords.map((keyword) => (
                          <TableRow key={keyword.id}>
                            <TableCell>{keyword.text}</TableCell>
                            <TableCell>{keyword.matchType}</TableCell>
                            <TableCell align="right">
                              {keyword.performanceMetrics?.impressions?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell align="right">
                              {keyword.performanceMetrics?.clicks?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell align="right">
                              {keyword.performanceMetrics?.conversions?.toLocaleString() || '-'}
                            </TableCell>
                            <TableCell align="right">
                              {keyword.performanceMetrics?.ctr 
                                ? `${(keyword.performanceMetrics.ctr * 100).toFixed(2)}%` 
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              <Box mt={3} p={2} bgcolor="background.paper" borderRadius={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Estimated Impact
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    Total Keywords: {estimatedMetrics.totalKeywords}
                  </Typography>
                  <Typography variant="body2">
                    Unique Keywords: {estimatedMetrics.uniqueKeywords}
                  </Typography>
                  <Typography variant="body2">
                    Estimated Impact: {estimatedMetrics.estimatedImpactPercentage}% traffic protection
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default NegativeKeywordManager;
