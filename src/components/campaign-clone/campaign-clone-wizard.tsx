import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorBoundary from '../common/error-boundary';
import useCampaignDuplication from '../../hooks/use-campaign-duplication';
import {
  CampaignSelectionWizard,
  CloneConfigurationStep,
  ValidationResultsStep,
  ExecutionStep
} from './index';

/**
 * Campaign Clone Wizard
 * 
 * A multi-step wizard interface for cloning campaigns with different match types.
 * Follows the intent-driven approach to automate complex operations with validation.
 */
const CampaignCloneWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const {
    // State
    selectedCampaigns,
    sourceMatchType,
    targetMatchType,
    cloneConfig,
    isValidating,
    isCloning,
    progress,
    validationResult,
    cloneResult,
    error,
    
    // Actions
    handleCampaignSelectionChange,
    handleSourceMatchTypeChange,
    handleTargetMatchTypeChange,
    updateCloneConfig,
    validateCampaigns,
    cloneCampaigns,
    resetCloneOperation
  } = useCampaignDuplication();

  // Define steps
  const steps = [
    'Select Campaigns',
    'Configure Clone',
    'Validate',
    'Execute'
  ];

  // Navigation handlers
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    resetCloneOperation();
  };

  // Step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <CampaignSelectionWizard
            accountId="123456789" // This would come from context or props in a real app
            selectedCampaigns={selectedCampaigns}
            onCampaignSelectionChange={handleCampaignSelectionChange}
            sourceMatchType={sourceMatchType}
            onSourceMatchTypeChange={handleSourceMatchTypeChange}
            targetMatchType={targetMatchType}
            onTargetMatchTypeChange={handleTargetMatchTypeChange}
          />
        );
      case 1:
        return (
          <CloneConfigurationStep
            config={cloneConfig}
            onConfigChange={updateCloneConfig}
            selectedCampaigns={selectedCampaigns}
            sourceMatchType={sourceMatchType}
            targetMatchType={targetMatchType}
          />
        );
      case 2:
        return (
          <ValidationResultsStep
            validationResult={validationResult}
            isValidating={isValidating}
            onValidateClick={validateCampaigns}
            selectedCampaignCount={selectedCampaigns.length}
          />
        );
      case 3:
        return (
          <ExecutionStep
            isCloning={isCloning}
            isCloneComplete={!!cloneResult}
            progress={progress}
            cloneResult={cloneResult}
            onExecuteClick={cloneCampaigns}
            onResetClick={handleReset}
            validationPassed={!!validationResult && validationResult.valid}
            selectedCampaignCount={selectedCampaigns.length}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (activeStep === 0) {
      return selectedCampaigns.length === 0;
    }
    if (activeStep === 2) {
      return !validationResult || !validationResult.valid;
    }
    return false;
  };

  return (
    <ErrorBoundary fallback={<Typography color="error">Failed to load campaign clone wizard.</Typography>}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Campaign Clone Operation
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" align="center" gutterBottom>
            Clone exact match campaigns to broad match with automated negative keyword management
          </Typography>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Error display */}
            {error && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" color="error">
                  {error}
                </Typography>
              </Box>
            )}
            
            {/* Step content */}
            <Box>{getStepContent(activeStep)}</Box>
            
            {/* Navigation buttons */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                disabled={activeStep === 0 || isCloning}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="outlined" 
                  onClick={handleReset}
                  disabled={isCloning}
                >
                  Reset
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  disabled={isNextDisabled() || isCloning || isValidating}
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

// Export with error boundary wrapper
export default () => (
  <ErrorBoundary fallback={<Typography color="error">Failed to load campaign clone wizard.</Typography>}>
    <CampaignCloneWizard />
  </ErrorBoundary>
);
