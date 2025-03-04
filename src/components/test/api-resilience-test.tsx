import React, { useState } from 'react';
import { GoogleAdsApiClient } from '../../lib/google-ads-api';
import { operationTracker } from '../../hooks/use-operation-tracking';
import { OperationProgressBar, OperationsDashboard } from '../operation-progress';
import { ApiError, ApiErrorType } from '../../utils/api-error-handling';

// Mock configuration for testing
const TEST_CONFIG = {
  developerToken: 'test_developer_token',
  clientId: 'test_client_id',
  clientSecret: 'test_client_secret',
  refreshToken: 'test_refresh_token',
};

// Mock API client for testing
const apiClient = GoogleAdsApiClient.getInstance(TEST_CONFIG);

const ApiResilienceTest: React.FC = () => {
  const [operationId, setOperationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>('1234567890');
  const [requestCount, setRequestCount] = useState<number>(10);
  const [concurrency, setConcurrency] = useState<number>(3);
  const [failureRate, setFailureRate] = useState<number>(20);
  const [delayMs, setDelayMs] = useState<number>(1000);

  // Function to simulate successful API requests
  const simulateSuccessfulRequest = async (index: number, opId: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Log progress
    operationTracker.addLog(
      opId,
      'info',
      `Request ${index} completed successfully`,
      { requestIndex: index }
    );
    
    return { success: true, index };
  };

  // Function to simulate failed API requests
  const simulateFailedRequest = async (index: number, opId: string, retryable: boolean = true) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Create error type
    const errorType = retryable 
      ? ApiErrorType.RATE_LIMIT 
      : ApiErrorType.VALIDATION;
    
    // Log error
    operationTracker.addLog(
      opId,
      'error',
      `Request ${index} failed with ${errorType}`,
      { requestIndex: index, errorType }
    );
    
    // Throw error
    throw new ApiError({
      message: `Simulated error for request ${index}`,
      type: errorType,
      code: retryable ? 'RESOURCE_EXHAUSTED' : 'INVALID_ARGUMENT',
      details: { requestIndex: index },
      retryable,
      operationId: opId
    });
  };

  // Function to run a test batch of API requests
  const runBatchTest = async () => {
    // Create a new operation
    const opId = operationTracker.createOperation('bulk_operation', {
      customerId,
      userId: 'test_user',
      requestCount,
      concurrency
    });
    
    setOperationId(opId);
    operationTracker.startOperation(opId);
    
    try {
      // Create an array of request functions
      const requests = Array.from({ length: requestCount }).map((_, index) => ({
        customerId,
        endpoint: `test_endpoint_${index}`,
        options: {
          method: 'GET',
          label: `Test Request ${index + 1}/${requestCount}`
        }
      }));
      
      // Execute batch requests
      await apiClient.batchMakeRequests(
        requests,
        {
          operationId: opId,
          concurrency,
          continueOnError: true
        }
      );
      
      operationTracker.completeOperation(opId);
    } catch (error) {
      operationTracker.failOperation(opId, {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof ApiError ? error.code : 'UNKNOWN',
        details: error
      });
    }
  };

  // Function to simulate a single API request with potential failure
  const simulateSingleRequest = async () => {
    // Create a new operation
    const opId = operationTracker.createOperation('bulk_operation', {
      customerId,
      userId: 'test_user',
      requestCount: 1
    });
    
    setOperationId(opId);
    operationTracker.startOperation(opId);
    
    try {
      // Determine if this request should fail based on failure rate
      const shouldFail = Math.random() * 100 < failureRate;
      
      if (shouldFail) {
        // Determine if the failure should be retryable (50/50 chance)
        const retryable = Math.random() > 0.5;
        await simulateFailedRequest(1, opId, retryable);
      } else {
        await simulateSuccessfulRequest(1, opId);
      }
      
      operationTracker.completeOperation(opId);
    } catch (error) {
      operationTracker.failOperation(opId, {
        message: error instanceof ApiError ? error.message : 'Unknown error',
        code: error instanceof ApiError ? error.code : 'UNKNOWN',
        details: error
      });
    }
  };

  // Function to cancel the current operation
  const cancelOperation = () => {
    if (operationId) {
      operationTracker.cancelOperation(operationId, 'User cancelled operation');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Resilience Testing</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Requests
              </label>
              <input
                type="number"
                value={requestCount}
                onChange={(e) => setRequestCount(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concurrency
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Failure Rate (%)
              </label>
              <input
                type="number"
                value={failureRate}
                onChange={(e) => setFailureRate(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay (ms)
              </label>
              <input
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                min={100}
                max={10000}
                step={100}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mt-6 space-x-4">
            <button
              onClick={runBatchTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Run Batch Test
            </button>
            
            <button
              onClick={simulateSingleRequest}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Single Request
            </button>
            
            {operationId && (
              <button
                onClick={cancelOperation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Operation
              </button>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Current Operation</h2>
          
          {operationId ? (
            <OperationProgressBar
              operationId={operationId}
              showDetails={true}
              onCancel={cancelOperation}
            />
          ) : (
            <div className="border rounded-lg p-4 text-gray-500 text-center">
              No active operation. Start a test to see progress.
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Operations</h2>
        <OperationsDashboard 
          showDetails={true}
          limit={5}
          onCancelOperation={cancelOperation}
        />
      </div>
    </div>
  );
};

export default ApiResilienceTest;
