import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CampaignValidationResult, ValidationIssue } from '../../types/campaign-types';
import ErrorBoundary from '../common/error-boundary';

interface ValidationResultsStepProps {
  validationResult: CampaignValidationResult | null;
  isValidating: boolean;
  onValidateClick: () => void;
  selectedCampaignCount: number;
}

/**
 * Validation Results Step component
 * 
 * Displays the results of campaign validation, including errors, warnings,
 * and estimated impact of the cloning operation.
 */
const ValidationResultsStep: React.FC<ValidationResultsStepProps> = ({
  validationResult,
  isValidating,
  onValidateClick,
  selectedCampaignCount,
}) => {
  const [showWarnings, setShowWarnings] = React.useState(false);

  const toggleWarnings = () => {
    setShowWarnings(!showWarnings);
  };

  // Render a validation issue (error or warning)
  const renderIssue = (issue: ValidationIssue, index: number) => {
    const icon = issue.severity === 'error' ? 
      <ErrorIcon color="error" /> : 
      <WarningIcon color="warning" />;
    
    return (
      <ListItem key={index} divider>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText
          primary={issue.message}
          secondary={issue.entityId ? `Entity ID: ${issue.entityId}` : undefined}
        />
        <Chip 
          label={issue.code} 
          variant="outlined" 
          size="small" 
          color={issue.severity === 'error' ? 'error' : 'warning'} 
        />
      </ListItem>
    );
  };

  // Render summary card with validation status
  const renderStatusSummary = () => {
    if (!validationResult) return null;
    
    const { valid, issues, warnings } = validationResult;
    let status;
    
    if (valid && warnings.length === 0) {
      status = (
        <Alert 
          icon={<CheckCircleIcon fontSize="inherit" />} 
          severity="success"
          sx={{ mb: 2 }}
        >
          Validation passed successfully. You can proceed with the cloning operation.
        </Alert>
      );
    } else if (valid) {
      status = (
        <Alert 
          icon={<WarningIcon fontSize="inherit" />} 
          severity="warning"
          sx={{ mb: 2 }}
        >
          Validation passed with {warnings.length} warning{warnings.length !== 1 ? 's' : ''}. 
          You can proceed, but review the warnings below.
        </Alert>
      );
    } else {
      status = (
        <Alert 
          icon={<ErrorIcon fontSize="inherit" />} 
          severity="error"
          sx={{ mb: 2 }}
        >
          Validation failed with {issues.length} error{issues.length !== 1 ? 's' : ''}. 
          Please fix the issues before proceeding.
        </Alert>
      );
    }
    
    return status;
  };

  // Render estimated impact of the clone operation
  const renderImpactAssessment = () => {
    if (!validationResult || !validationResult.estimatedImpact) return null;
    
    const { estimatedImpact } = validationResult;
    
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardHeader 
          title="Estimated Impact" 
          subheader="Projected resources that will be created"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center" p={1}>
                <Typography variant="h4" color="primary">
                  {estimatedImpact.newCampaigns}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  New Campaigns
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center" p={1}>
                <Typography variant="h4" color="primary">
                  {estimatedImpact.newAdGroups}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  New Ad Groups
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center" p={1}>
                <Typography variant="h4" color="primary">
                  {estimatedImpact.newKeywords.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  New Keywords
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center" p={1}>
                <Typography variant="h4" color="primary">
                  ${estimatedImpact.estimatedCost.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Est. Daily Cost
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load validation results.</Typography>}>
      <Box sx={{ my: 2 }}>
        {/* Validation Button */}
        {!validationResult && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Ready to validate {selectedCampaignCount} selected campaign{selectedCampaignCount !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Click validate to check for potential issues before cloning
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={onValidateClick}
              disabled={isValidating || selectedCampaignCount === 0}
            >
              {isValidating ? 'Validating...' : 'Validate Campaigns'}
            </Button>
          </Box>
        )}
        
        {/* Validation Results */}
        {validationResult && (
          <>
            {/* Status Summary */}
            {renderStatusSummary()}
            
            {/* Impact Assessment */}
            {renderImpactAssessment()}
            
            {/* Issues (if any) */}
            {validationResult.issues.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardHeader 
                  title={`${validationResult.issues.length} Error${validationResult.issues.length !== 1 ? 's' : ''}`}
                  subheader="These issues must be fixed before proceeding"
                  avatar={<ErrorIcon color="error" />}
                />
                <Divider />
                <List>
                  {validationResult.issues.map((issue, index) => renderIssue(issue, index))}
                </List>
              </Card>
            )}
            
            {/* Warnings (if any) */}
            {validationResult.warnings.length > 0 && (
              <Card>
                <CardHeader
                  title={`${validationResult.warnings.length} Warning${validationResult.warnings.length !== 1 ? 's' : ''}`}
                  subheader="You can proceed, but reviewing these is recommended"
                  avatar={<WarningIcon color="warning" />}
                  action={
                    <IconButton onClick={toggleWarnings}>
                      <ExpandMoreIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <Collapse in={showWarnings}>
                  <List>
                    {validationResult.warnings.map((warning, index) => renderIssue(warning, index))}
                  </List>
                </Collapse>
              </Card>
            )}
            
            {/* Revalidate Button */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={onValidateClick}
                disabled={isValidating}
              >
                {isValidating ? 'Validating...' : 'Revalidate'}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default ValidationResultsStep;
