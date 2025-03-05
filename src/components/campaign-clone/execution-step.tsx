import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorBoundary from '../common/error-boundary';

interface ExecutionStepProps {
  isCloning: boolean;
  isCloneComplete: boolean;
  progress: number;
  cloneResult: {
    success: boolean;
    createdCampaignIds: string[];
    errors: any[];
  } | null;
  onExecuteClick: () => void;
  onResetClick: () => void;
  validationPassed: boolean;
  selectedCampaignCount: number;
}

/**
 * Execution Step component
 * 
 * Displays the execution controls and progress for the campaign cloning operation.
 * Shows results after completion including created campaigns and any errors.
 */
const ExecutionStep: React.FC<ExecutionStepProps> = ({
  isCloning,
  isCloneComplete,
  progress,
  cloneResult,
  onExecuteClick,
  onResetClick,
  validationPassed,
  selectedCampaignCount,
}) => {
  const [showErrors, setShowErrors] = useState(true);

  const toggleErrors = () => {
    setShowErrors(!showErrors);
  };

  // Format time from milliseconds
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Execution preparation state
  const renderPreparation = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" gutterBottom>
        Ready to Clone {selectedCampaignCount} Campaign{selectedCampaignCount !== 1 ? 's' : ''}
      </Typography>
      
      {!validationPassed ? (
        <Alert severity="warning" sx={{ mb: 2, mx: 'auto', maxWidth: 500 }}>
          Please complete validation before executing the clone operation.
        </Alert>
      ) : (
        <Typography variant="body2" color="textSecondary" paragraph>
          The operation will create {selectedCampaignCount} new campaign{selectedCampaignCount !== 1 ? 's' : ''} with the configured settings.
          This may take several minutes to complete.
        </Typography>
      )}
      
      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        onClick={onExecuteClick}
        disabled={!validationPassed || isCloning || selectedCampaignCount === 0}
        size="large"
      >
        Execute Clone Operation
      </Button>
    </Box>
  );

  // In-progress state
  const renderProgress = () => (
    <Box sx={{ py: 3 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Cloning in Progress
      </Typography>
      
      <Box sx={{ px: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="textSecondary">{`${Math.round(progress)}%`}</Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Please wait while we clone your campaigns. This may take several minutes.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PauseIcon />}
          disabled
        >
          Pause (Coming Soon)
        </Button>
      </Box>
    </Box>
  );

  // Completed state
  const renderCompleted = () => {
    if (!cloneResult) return null;
    
    const { success, createdCampaignIds, errors } = cloneResult;
    
    return (
      <Box sx={{ py: 2 }}>
        {success ? (
          <Alert 
            icon={<CheckCircleIcon fontSize="inherit" />} 
            severity="success"
            sx={{ mb: 3 }}
          >
            Campaign cloning completed successfully!
          </Alert>
        ) : (
          <Alert 
            icon={<ErrorIcon fontSize="inherit" />} 
            severity="error"
            sx={{ mb: 3 }}
          >
            Campaign cloning completed with {errors.length} error{errors.length !== 1 ? 's' : ''}.
          </Alert>
        )}
        
        {/* Created Campaigns Summary */}
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Created Campaigns" 
            subheader={`${createdCampaignIds.length} campaign${createdCampaignIds.length !== 1 ? 's' : ''} created`}
          />
          <Divider />
          <CardContent>
            {createdCampaignIds.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No campaigns were created.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {createdCampaignIds.map((id) => (
                  <Grid item key={id}>
                    <Chip 
                      label={id} 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
        
        {/* Errors (if any) */}
        {errors.length > 0 && (
          <Card>
            <CardHeader 
              title={`Errors (${errors.length})`}
              subheader="These errors occurred during the clone operation"
              action={
                <IconButton onClick={toggleErrors}>
                  {showErrors ? <RefreshIcon /> : <RefreshIcon />}
                </IconButton>
              }
            />
            <Divider />
            <Collapse in={showErrors}>
              <List>
                {errors.map((error, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={error.error || "Unknown error"}
                      secondary={error.campaignId ? `Campaign ID: ${error.campaignId}` : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Card>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onResetClick}
            startIcon={<RefreshIcon />}
          >
            Start New Clone Operation
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load execution step.</Typography>}>
      <Box sx={{ my: 2 }}>
        {!isCloning && !isCloneComplete && renderPreparation()}
        {isCloning && renderProgress()}
        {isCloneComplete && renderCompleted()}
      </Box>
    </ErrorBoundary>
  );
};

export default ExecutionStep;
