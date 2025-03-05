import { OperationDetail, OperationType, OperationLog } from '../types/monitoring-types';

/**
 * Service for tracking and retrieving operation logs and metrics
 */
class OperationLogService {
  private static instance: OperationLogService;
  
  // In a real implementation, this would connect to a database or API
  private operationLogs: OperationDetail[] = [];
  
  private constructor() {
    // Initialize with some sample data for testing
    this.generateSampleData();
  }
  
  /**
   * Gets the singleton instance of the service
   */
  public static getInstance(): OperationLogService {
    if (!OperationLogService.instance) {
      OperationLogService.instance = new OperationLogService();
    }
    return OperationLogService.instance;
  }
  
  /**
   * Records a new operation
   * @param type - Type of operation
   * @param campaignCount - Number of campaigns in the operation
   * @returns Operation ID
   */
  public startOperation(type: OperationType, campaignCount: number): string {
    const operationId = `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    this.operationLogs.push({
      id: operationId,
      type,
      status: 'in-progress',
      startTime: new Date().toISOString(),
      campaignCount,
      successCount: 0,
      failureCount: 0,
      logs: [{
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Started ${type} operation with ${campaignCount} campaigns`
      }]
    });
    
    return operationId;
  }
  
  /**
   * Update an operation's status
   * @param operationId - ID of the operation to update
   * @param status - New status
   * @param successCount - Number of successful campaigns
   * @param failureCount - Number of failed campaigns
   */
  public updateOperationStatus(
    operationId: string,
    status: 'success' | 'failed' | 'in-progress',
    successCount: number,
    failureCount: number
  ): void {
    const operation = this.operationLogs.find(op => op.id === operationId);
    
    if (operation) {
      operation.status = status;
      operation.successCount = successCount;
      operation.failureCount = failureCount;
      
      if (status !== 'in-progress') {
        operation.endTime = new Date().toISOString();
      }
      
      operation.logs.push({
        timestamp: new Date().toISOString(),
        level: status === 'success' ? 'info' : 'error',
        message: `Operation ${status} with ${successCount} successful and ${failureCount} failed campaigns`
      });
    }
  }
  
  /**
   * Add a log entry to an operation
   * @param operationId - ID of the operation
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional data to include
   */
  public addLogEntry(
    operationId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    data?: any
  ): void {
    const operation = this.operationLogs.find(op => op.id === operationId);
    
    if (operation) {
      operation.logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        data
      });
    }
  }
  
  /**
   * Get all operations
   * @param type - Optional filter by operation type
   * @param status - Optional filter by status
   * @param startDate - Optional filter by start date
   * @param endDate - Optional filter by end date
   * @returns List of operations
   */
  public getOperations(
    type?: OperationType,
    status?: 'success' | 'failed' | 'in-progress',
    startDate?: Date,
    endDate?: Date
  ): OperationDetail[] {
    let filteredLogs = [...this.operationLogs];
    
    if (type) {
      filteredLogs = filteredLogs.filter(op => op.type === type);
    }
    
    if (status) {
      filteredLogs = filteredLogs.filter(op => op.status === status);
    }
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(op => new Date(op.startTime) >= startDate);
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(op => new Date(op.startTime) <= endDate);
    }
    
    return filteredLogs;
  }
  
  /**
   * Get a specific operation by ID
   * @param operationId - ID of the operation to retrieve
   * @returns Operation details or null if not found
   */
  public getOperation(operationId: string): OperationDetail | null {
    const operation = this.operationLogs.find(op => op.id === operationId);
    return operation || null;
  }
  
  /**
   * Get operation logs for a specific operation
   * @param operationId - ID of the operation
   * @returns Array of log entries
   */
  public getOperationLogs(operationId: string): OperationLog[] {
    const operation = this.operationLogs.find(op => op.id === operationId);
    return operation ? operation.logs : [];
  }
  
  /**
   * Generates sample data for testing the dashboard
   * This would be removed in production
   */
  private generateSampleData(): void {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Sample successful campaign clone operation
    this.operationLogs.push({
      id: 'op-sample-1',
      type: 'campaignClone',
      status: 'success',
      startTime: yesterday.toISOString(),
      endTime: yesterday.toISOString(),
      campaignCount: 25,
      successCount: 23,
      failureCount: 2,
      logs: [
        {
          timestamp: yesterday.toISOString(),
          level: 'info',
          message: 'Started campaign clone operation with 25 campaigns'
        },
        {
          timestamp: new Date(yesterday.getTime() + 60000).toISOString(),
          level: 'warning',
          message: 'Rate limit approaching, slowing down requests'
        },
        {
          timestamp: new Date(yesterday.getTime() + 120000).toISOString(),
          level: 'error',
          message: 'Failed to clone campaign: Invalid campaign structure',
          data: { campaignId: '12345678' }
        },
        {
          timestamp: new Date(yesterday.getTime() + 180000).toISOString(),
          level: 'error',
          message: 'Failed to clone campaign: Rate limit exceeded',
          data: { campaignId: '87654321' }
        },
        {
          timestamp: new Date(yesterday.getTime() + 300000).toISOString(),
          level: 'info',
          message: 'Operation completed with 23 successful and 2 failed campaigns'
        }
      ]
    });
    
    // Sample failed campaign clone operation
    this.operationLogs.push({
      id: 'op-sample-2',
      type: 'campaignClone',
      status: 'failed',
      startTime: twoDaysAgo.toISOString(),
      endTime: twoDaysAgo.toISOString(),
      campaignCount: 50,
      successCount: 12,
      failureCount: 38,
      logs: [
        {
          timestamp: twoDaysAgo.toISOString(),
          level: 'info',
          message: 'Started campaign clone operation with 50 campaigns'
        },
        {
          timestamp: new Date(twoDaysAgo.getTime() + 30000).toISOString(),
          level: 'warning',
          message: 'Large operation detected, using reduced chunk size'
        },
        {
          timestamp: new Date(twoDaysAgo.getTime() + 60000).toISOString(),
          level: 'error',
          message: 'Multiple rate limit errors, operation paused',
          data: { retryAfter: '30 seconds' }
        },
        {
          timestamp: new Date(twoDaysAgo.getTime() + 120000).toISOString(),
          level: 'error',
          message: 'Operation failed due to excessive rate limiting'
        }
      ]
    });
    
    // Sample in-progress operation
    this.operationLogs.push({
      id: 'op-sample-3',
      type: 'campaignClone',
      status: 'in-progress',
      startTime: new Date(now.getTime() - 300000).toISOString(), // 5 minutes ago
      campaignCount: 15,
      successCount: 8,
      failureCount: 1,
      logs: [
        {
          timestamp: new Date(now.getTime() - 300000).toISOString(),
          level: 'info',
          message: 'Started campaign clone operation with 15 campaigns'
        },
        {
          timestamp: new Date(now.getTime() - 240000).toISOString(),
          level: 'info',
          message: 'Processing campaigns in chunks of 5'
        },
        {
          timestamp: new Date(now.getTime() - 180000).toISOString(),
          level: 'info',
          message: 'Completed first chunk: 5 successful'
        },
        {
          timestamp: new Date(now.getTime() - 120000).toISOString(),
          level: 'error',
          message: 'Failed to clone campaign: Invalid campaign structure',
          data: { campaignId: '55555555' }
        },
        {
          timestamp: new Date(now.getTime() - 60000).toISOString(),
          level: 'info',
          message: 'Completed second chunk: 3 successful, 1 failed'
        }
      ]
    });
    
    // Add some older operations for historical data
    for (let i = 3; i < 20; i++) {
      const opDate = new Date(now);
      opDate.setDate(opDate.getDate() - (i % 10));
      opDate.setHours(opDate.getHours() - (i % 24));
      
      const campaignCount = 10 + (i % 30);
      const success = Math.random() > 0.2;
      const successCount = success 
        ? campaignCount - Math.floor(campaignCount * 0.1)
        : Math.floor(campaignCount * 0.3);
      const failureCount = campaignCount - successCount;
      
      this.operationLogs.push({
        id: `op-sample-${i + 1}`,
        type: 'campaignClone',
        status: success ? 'success' : 'failed',
        startTime: opDate.toISOString(),
        endTime: new Date(opDate.getTime() + 300000).toISOString(),
        campaignCount,
        successCount,
        failureCount,
        logs: [
          {
            timestamp: opDate.toISOString(),
            level: 'info',
            message: `Started campaign clone operation with ${campaignCount} campaigns`
          },
          {
            timestamp: new Date(opDate.getTime() + 300000).toISOString(),
            level: success ? 'info' : 'error',
            message: `Operation ${success ? 'completed' : 'failed'} with ${successCount} successful and ${failureCount} failed campaigns`
          }
        ]
      });
    }
  }
}

// API exports
const operationLogService = OperationLogService.getInstance();

/**
 * Start tracking a new operation
 * @param type - Type of operation
 * @param campaignCount - Number of campaigns
 * @returns Operation ID
 */
export function startOperation(type: OperationType, campaignCount: number): string {
  return operationLogService.startOperation(type, campaignCount);
}

/**
 * Update an operation's status
 * @param operationId - ID of the operation to update
 * @param status - New status
 * @param successCount - Number of successful campaigns
 * @param failureCount - Number of failed campaigns
 */
export function updateOperationStatus(
  operationId: string,
  status: 'success' | 'failed' | 'in-progress',
  successCount: number,
  failureCount: number
): void {
  operationLogService.updateOperationStatus(operationId, status, successCount, failureCount);
}

/**
 * Add a log entry to an operation
 * @param operationId - ID of the operation
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional data
 */
export function addOperationLog(
  operationId: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  data?: any
): void {
  operationLogService.addLogEntry(operationId, level, message, data);
}

/**
 * Get operations filtered by criteria
 * @param type - Optional filter by operation type
 * @param status - Optional filter by status
 * @param startDate - Optional filter by start date
 * @param endDate - Optional filter by end date
 * @returns Array of operations
 */
export function getOperations(
  type?: OperationType,
  status?: 'success' | 'failed' | 'in-progress',
  startDate?: Date,
  endDate?: Date
): OperationDetail[] {
  return operationLogService.getOperations(type, status, startDate, endDate);
}

/**
 * Get a specific operation by ID
 * @param operationId - ID of the operation
 * @returns Operation details or null if not found
 */
export function getOperation(operationId: string): OperationDetail | null {
  return operationLogService.getOperation(operationId);
}

/**
 * Get logs for a specific operation
 * @param operationId - ID of the operation
 * @returns Array of log entries
 */
export function getOperationLogs(operationId: string): OperationLog[] {
  return operationLogService.getOperationLogs(operationId);
}
