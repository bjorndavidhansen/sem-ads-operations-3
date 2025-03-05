import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeValidationPreview } from '../operations/real-time-validation-preview';
import { useOperationTracking } from '../../hooks/use-operation-tracking';
import { vi } from 'vitest';

// Mock the operation tracking hook
vi.mock('../../hooks/use-operation-tracking', () => ({
  useOperationTracking: vi.fn()
}));

describe('RealTimeValidationPreview', () => {
  const mockOperation = {
    id: 'op_test',
    type: 'bulk_campaign_clone',
    status: 'failed',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    progress: 30,
    metadata: {
      customerId: '123456789',
      completedCampaigns: [],
      totalCampaigns: 5,
      failedCampaigns: [
        { id: 'c1', name: 'Campaign 1' },
        { id: 'c2', name: 'Campaign 2' }
      ],
      chunkSize: 5,
      config: {
        name: '{original} - Broad',
        matchType: 'BROAD',
        createNegativeExactKeywords: true
      }
    }
  };
  
  const mockLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Operation started',
      details: {}
    },
    {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Failed due to rate limit exceeded',
      details: {
        error: 'Rate limit exceeded'
      }
    }
  ];
  
  beforeEach(() => {
    (useOperationTracking as any).mockReturnValue({
      getOperation: vi.fn(() => mockOperation),
      getOperationLogs: vi.fn(() => mockLogs)
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('renders correctly with operation details', async () => {
    render(<RealTimeValidationPreview operationId="op_test" />);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/operation validation/i)).toBeInTheDocument();
    });
  });
  
  test('detects rate limit issues', async () => {
    render(<RealTimeValidationPreview operationId="op_test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/issue.*detected/i)).toBeInTheDocument();
      expect(screen.getByText(/api limit/i)).toBeInTheDocument();
      expect(screen.getByText(/rate limiting issues/i)).toBeInTheDocument();
    });
  });
  
  test('offers auto-fix options for fixable issues', async () => {
    render(<RealTimeValidationPreview operationId="op_test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/auto-fix/i)).toBeInTheDocument();
    });
  });
  
  test('calls onFixProposed when auto-fix is clicked', async () => {
    const mockOnFixProposed = vi.fn();
    render(
      <RealTimeValidationPreview 
        operationId="op_test" 
        onFixProposed={mockOnFixProposed} 
      />
    );
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/auto-fix/i)).toBeInTheDocument();
    });
    
    // Click the auto-fix button
    fireEvent.click(screen.getByText(/auto-fix/i));
    
    // Confirm the fix dialog
    fireEvent.click(screen.getByText(/apply/i));
    
    // Check if the callback was called with correct data
    await waitFor(() => {
      expect(mockOnFixProposed).toHaveBeenCalledWith(expect.objectContaining({
        type: 'reduce_chunk_size',
        data: expect.objectContaining({
          operationId: 'op_test',
          proposedChunkSize: expect.any(Number)
        })
      }));
    });
  });
  
  test('shows no issues when operation is successful', async () => {
    // Override the getOperation mock for this test only
    (useOperationTracking as any).mockReturnValue({
      getOperation: vi.fn(() => ({
        ...mockOperation,
        status: 'completed',
        progress: 100,
        metadata: {
          ...mockOperation.metadata,
          failedCampaigns: []
        }
      })),
      getOperationLogs: vi.fn(() => [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Operation started',
          details: {}
        },
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Operation completed successfully',
          details: {}
        }
      ])
    });
    
    render(<RealTimeValidationPreview operationId="op_test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/no issues detected/i)).toBeInTheDocument();
    });
  });
  
  test('refreshes validation when refresh button is clicked', async () => {
    render(<RealTimeValidationPreview operationId="op_test" />);
    
    // Wait for initial validation to complete
    await waitFor(() => {
      expect(screen.getByText(/operation validation/i)).toBeInTheDocument();
    });
    
    // Mock a change in the operation data
    (useOperationTracking as any).mockReturnValue({
      getOperation: vi.fn(() => ({
        ...mockOperation,
        status: 'completed',
        progress: 100
      })),
      getOperationLogs: vi.fn(() => [
        ...mockLogs,
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Some operations recovered',
          details: {}
        }
      ])
    });
    
    // Click the refresh button
    fireEvent.click(screen.getByText(/refresh/i));
    
    // Check if validation was refreshed
    await waitFor(() => {
      // This would now show "No issues detected" based on our mocked data change
      expect(useOperationTracking().getOperation).toHaveBeenCalledTimes(2);
    });
  });
});
