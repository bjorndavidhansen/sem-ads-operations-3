import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OperationRecoveryDashboard } from '../operations/operation-recovery-dashboard';
import { operationTracker } from '../../hooks/use-operation-tracking';
import { googleAdsApi } from '../../lib/google-ads-api';

// Mock the Google Ads API
vi.mock('../../lib/google-ads-api', () => ({
  googleAdsApi: {
    bulkCopyCampaigns: vi.fn().mockResolvedValue({
      successful: 2,
      failed: 0,
      total: 2
    })
  }
}));

// Render helper with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Bulk Operation Recovery', () => {
  // Sample operation data
  const sampleFailedOperation = {
    id: 'test-operation-1',
    type: 'campaign_clone',
    status: 'failed',
    progress: 75,
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: new Date(Date.now() - 3000000),   // 50 mins ago
    logs: [
      { timestamp: new Date(Date.now() - 3600000), level: 'info', message: 'Operation started' },
      { timestamp: new Date(Date.now() - 3300000), level: 'info', message: 'Processing campaigns' },
      { timestamp: new Date(Date.now() - 3000000), level: 'error', message: 'Error: Rate limit exceeded' }
    ],
    error: { message: 'Operation partially failed' },
    metadata: {
      customerId: '123456789',
      campaignIds: ['c1', 'c2', 'c3', 'c4'],
      completedCampaigns: [{ id: 'c1' }, { id: 'c2' }],
      failedCampaigns: [
        { id: 'c3', error: 'API Error: Rate limit exceeded' },
        { id: 'c4', error: 'API Error: Invalid operation' }
      ],
      config: {
        nameTemplate: '{original}_test',
        matchType: 'BROAD',
        createNegativeExactKeywords: true
      }
    },
    restorePoints: []
  };

  const sampleCompletedOperation = {
    id: 'test-operation-2',
    type: 'campaign_clone',
    status: 'completed',
    progress: 100,
    startTime: new Date(Date.now() - 7200000), // 2 hours ago
    endTime: new Date(Date.now() - 7000000),   // 1 hour 56 mins ago
    logs: [
      { timestamp: new Date(Date.now() - 7200000), level: 'info', message: 'Operation started' },
      { timestamp: new Date(Date.now() - 7100000), level: 'info', message: 'Processing campaigns' },
      { timestamp: new Date(Date.now() - 7000000), level: 'info', message: 'Operation completed successfully' }
    ],
    metadata: {
      customerId: '123456789',
      campaignIds: ['c5', 'c6'],
      completedCampaigns: [{ id: 'c5' }, { id: 'c6' }],
      failedCampaigns: [],
      config: {
        nameTemplate: '{original}_prod',
        matchType: 'PHRASE',
        createNegativeExactKeywords: false
      }
    },
    restorePoints: []
  };

  // Setup and teardown
  beforeEach(() => {
    // Add test operations to the tracker
    const createOp = operationTracker.createOperation;
    
    // Override createOperation for test setup
    // @ts-ignore - for testing
    operationTracker.createOperation = (type: string, metadata: any = {}) => {
      const opId = `test-op-${Date.now()}`;
      // @ts-ignore - for testing
      operationTracker.operations = new Map([
        ['test-operation-1', sampleFailedOperation],
        ['test-operation-2', sampleCompletedOperation],
        [opId, { id: opId, type, status: 'pending', progress: 0, logs: [], metadata, restorePoints: [] }]
      ]);
      return opId;
    };
    
    // @ts-ignore - for testing
    operationTracker.getOperations = () => {
      return [sampleFailedOperation, sampleCompletedOperation];
    };
    
    // @ts-ignore - for testing
    operationTracker.getOperation = (id: string) => {
      if (id === 'test-operation-1') return sampleFailedOperation;
      if (id === 'test-operation-2') return sampleCompletedOperation;
      return undefined;
    };
    
    // @ts-ignore - for testing
    operationTracker.getOperationLogs = (id: string) => {
      if (id === 'test-operation-1') return sampleFailedOperation.logs;
      if (id === 'test-operation-2') return sampleCompletedOperation.logs;
      return [];
    };
    
    // @ts-ignore - for testing
    operationTracker.retryOperation = vi.fn().mockImplementation((originalId, newType, metadata) => {
      const retryId = `retry-${originalId}-${Date.now()}`;
      return retryId;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the operations dashboard with operations list', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Operations Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Campaign Clone')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('should show operation details when an operation is selected', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Click on the details button for the failed operation
    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Operation Details')).toBeInTheDocument();
      expect(screen.getByText('Campaign Clone')).toBeInTheDocument();
      expect(screen.getByText('Account ID:')).toBeInTheDocument();
      expect(screen.getByText('123456789')).toBeInTheDocument();
    });
  });

  it('should enable retry for failed operations', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Find and click the retry button
    const retryButtons = screen.getAllByText('Retry Failed');
    fireEvent.click(retryButtons[0]);
    
    await waitFor(() => {
      // Verify the retry operation was created
      expect(operationTracker.retryOperation).toHaveBeenCalled();
      
      // Verify bulkCopyCampaigns was called with the failed campaign IDs
      expect(googleAdsApi.bulkCopyCampaigns).toHaveBeenCalledWith(
        '123456789',
        ['c3', 'c4'],
        {
          nameTemplate: '{original}_test',
          matchType: 'BROAD',
          createNegativeExactKeywords: true
        },
        expect.any(String),
        3 // Chunk size
      );
    });
  });

  it('should filter operations by type', async () => {
    // Mock getOperations to simulate filtering
    // @ts-ignore - for testing
    operationTracker.getOperations = vi.fn().mockImplementation((options) => {
      if (options.type === 'campaign_clone') {
        return [sampleFailedOperation, sampleCompletedOperation];
      }
      if (options.status === 'failed') {
        return [sampleFailedOperation];
      }
      return [];
    });
    
    renderWithRouter(<OperationRecoveryDashboard operationType="campaign_clone" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Campaign Clone').length).toBeGreaterThan(0);
      expect(operationTracker.getOperations).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'campaign_clone' })
      );
    });
  });

  it('should calculate success rate correctly', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    await waitFor(() => {
      // Failed operation has 2 successful and 2 failed = 50% success rate
      expect(screen.getByText('50%')).toBeInTheDocument();
      
      // Completed operation has 2 successful and 0 failed = 100% success rate
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('renders operation list and allows filtering by type', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Check if operations are rendered
    expect(screen.getByText('Campaign Clone Operations')).toBeInTheDocument();
    expect(screen.getByText(/filter by type/i)).toBeInTheDocument();
    
    // Check if operation table is rendered
    expect(screen.getByText('Operation Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Initially both operations should be visible
    expect(screen.getAllByRole('row').length).toBe(3); // +1 for header row
    
    // Filter operations by type
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'campaign_clone' } });
    
    // Both operations should still be visible as they have the same type
    expect(screen.getAllByRole('row').length).toBe(3);
  });

  it('shows operation details when an operation is selected', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Click on the first operation in the list
    fireEvent.click(screen.getAllByRole('row')[1]);
    
    // Check if operation details are shown
    await waitFor(() => {
      expect(screen.getByText(/operation details/i)).toBeInTheDocument();
      expect(screen.getByText(/progress/i)).toBeInTheDocument();
      expect(screen.getByText(/campaign 1/i)).toBeInTheDocument();
    });
  });

  it('shows retry button for failed operations and enables retry', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Click on the failed operation
    fireEvent.click(screen.getAllByRole('row')[2]);
    
    // Check if retry button is shown
    await waitFor(() => {
      const retryButton = screen.getByText(/retry operation/i);
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });
    
    // Click the retry button
    fireEvent.click(screen.getByText(/retry operation/i));
    
    // Check if retry function was called
    await waitFor(() => {
      expect(operationTracker.retryOperation).toHaveBeenCalled();
      expect(googleAdsApi.bulkCopyCampaigns).toHaveBeenCalled();
    });
  });

  it('calculates success rate correctly', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Success rate for op_1 should be 100%
    fireEvent.click(screen.getAllByRole('row')[1]);
    await waitFor(() => {
      // Look for the 100% success text
      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
    
    // Success rate for op_2 should be 0% 
    fireEvent.click(screen.getAllByRole('row')[2]);
    await waitFor(() => {
      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/i)).toBeInTheDocument();
    });
  });

  it('renders validation preview for selected operation', async () => {
    renderWithRouter(<OperationRecoveryDashboard />);
    
    // Click on an operation
    fireEvent.click(screen.getAllByRole('row')[1]);
    
    // Check if validation preview is rendered
    await waitFor(() => {
      expect(screen.getByTestId('mock-validation-preview')).toBeInTheDocument();
    });
  });

  it('retries operations with reduced chunk size when fix is applied', async () => {
    const mockOnRetry = vi.fn();
    renderWithRouter(<OperationRecoveryDashboard onRetry={mockOnRetry} />);
    
    // Select an operation
    fireEvent.click(screen.getAllByRole('row')[2]);
    
    // Get the instance of RealTimeValidationPreview that was rendered
    const validationPreviewProps = (vi.mocked(require('../operations/real-time-validation-preview').RealTimeValidationPreview).mock.calls[0][0]);
    
    // Simulate onFixProposed being called from the validation preview
    await validationPreviewProps.onFixProposed({
      type: 'reduce_chunk_size',
      data: {
        operationId: 'test-operation-1',
        originalChunkSize: 5,
        proposedChunkSize: 2
      }
    });
    
    // Check if the right methods were called with the right parameters
    expect(mockOnRetry).toHaveBeenCalled();
    expect(googleAdsApi.bulkCopyCampaigns).toHaveBeenCalledWith(
      '123456789',
      expect.any(Array),
      expect.any(Object),
      expect.stringContaining('retry_test-operation-1'),
      2 // Verify chunk size is passed correctly
    );
  });
});
