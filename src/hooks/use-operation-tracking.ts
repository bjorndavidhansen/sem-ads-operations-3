import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type OperationStatus = 'pending' | 'in_progress' | 'running' | 'completed' | 'failed' | 'canceled';
export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface OperationLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
}

export interface OperationError {
  message: string;
  code?: string;
  details?: any;
}

export interface RestorePoint {
  id: string;
  timestamp: Date;
  type: string;
  data: any;
  metadata?: {
    name: string;
    description: string;
    resourceId?: string;
    resourceType?: string;
  };
}

export interface Operation {
  id: string;
  type: string;
  status: OperationStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  logs: OperationLog[];
  error?: OperationError;
  metadata: any;
  restorePoints: RestorePoint[];
}

class OperationTracker {
  private static instance: OperationTracker;
  private operations: Map<string, Operation> = new Map();
  private listeners: Map<string, Set<(operation: Operation) => void>> = new Map();
  
  private constructor() {}
  
  static getInstance(): OperationTracker {
    if (!OperationTracker.instance) {
      OperationTracker.instance = new OperationTracker();
    }
    return OperationTracker.instance;
  }
  
  /**
   * Create a new operation
   */
  createOperation(type: string, metadata: any = {}): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: Operation = {
      id,
      type,
      status: 'pending',
      progress: 0,
      logs: [],
      metadata,
      restorePoints: []
    };
    
    this.operations.set(id, operation);
    this.notifyListeners(id);
    
    return id;
  }
  
  /**
   * Get an operation by ID
   */
  getOperation(id: string): Operation | undefined {
    return this.operations.get(id);
  }
  
  /**
   * Start an operation
   */
  startOperation(id: string): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.status = 'running';
    operation.progress = 0;
    operation.startTime = new Date();
    
    this.addLog(id, 'info', 'Operation started');
    this.notifyListeners(id);
  }
  
  /**
   * Update operation progress
   */
  updateProgress(id: string, progress: number): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.progress = Math.min(Math.max(progress, 0), 100);
    this.notifyListeners(id);
  }
  
  /**
   * Complete an operation
   */
  completeOperation(id: string): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.status = 'completed';
    operation.progress = 100;
    operation.endTime = new Date();
    
    this.addLog(id, 'info', 'Operation completed');
    this.notifyListeners(id);
  }
  
  /**
   * Mark an operation as failed
   */
  failOperation(id: string, error: OperationError): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.status = 'failed';
    operation.error = error;
    operation.endTime = new Date();
    
    this.addLog(id, 'error', `Operation failed: ${error.message}`, error);
    this.notifyListeners(id);
  }
  
  /**
   * Cancel an operation
   */
  cancelOperation(id: string): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    operation.status = 'canceled';
    operation.endTime = new Date();
    
    this.addLog(id, 'info', 'Operation canceled');
    this.notifyListeners(id);
  }
  
  /**
   * Add a log entry to an operation
   */
  addLog(id: string, level: LogLevel, message: string, details?: any): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    const log: OperationLog = {
      timestamp: new Date(),
      level,
      message,
      details
    };
    
    operation.logs.push(log);
    this.notifyListeners(id);
  }
  
  /**
   * Create a restore point for an operation
   */
  createRestorePoint(
    operationId: string, 
    type: string, 
    data: any, 
    metadata?: {
      name: string;
      description: string;
      resourceId?: string;
      resourceType?: string;
    }
  ): string {
    const operation = this.operations.get(operationId);
    if (!operation) throw new Error(`Operation ${operationId} not found`);
    
    const restorePoint: RestorePoint = {
      id: `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      data,
      metadata
    };
    
    operation.restorePoints.push(restorePoint);
    this.addLog(
      operationId, 
      'info', 
      `Restore point created: ${metadata?.name || type}`,
      { restorePointId: restorePoint.id }
    );
    this.notifyListeners(operationId);
    
    return restorePoint.id;
  }
  
  /**
   * Get restore points for an operation
   */
  getRestorePoints(operationId: string): RestorePoint[] {
    const operation = this.operations.get(operationId);
    if (!operation) return [];
    
    return [...operation.restorePoints];
  }
  
  /**
   * Get a specific restore point
   */
  getRestorePoint(operationId: string, restorePointId: string): RestorePoint | undefined {
    const operation = this.operations.get(operationId);
    if (!operation) return undefined;
    
    return operation.restorePoints.find(rp => rp.id === restorePointId);
  }
  
  /**
   * Get the latest restore point of a specific type
   */
  getLatestRestorePoint(operationId: string, type?: string): RestorePoint | undefined {
    const operation = this.operations.get(operationId);
    if (!operation) return undefined;
    
    const restorePoints = type
      ? operation.restorePoints.filter(rp => rp.type === type)
      : operation.restorePoints;
    
    if (restorePoints.length === 0) return undefined;
    
    return restorePoints.reduce((latest, current) => 
      latest.timestamp > current.timestamp ? latest : current
    );
  }
  
  /**
   * Get all operations with optional filtering
   */
  getOperations(options: {
    type?: string;
    status?: OperationStatus;
    limit?: number;
    offset?: number;
    includeCompleted?: boolean;
    sortBy?: keyof Operation;
    sortDirection?: 'asc' | 'desc';
  } = {}): Operation[] {
    let operations = Array.from(this.operations.values());
    
    // Filter by type
    if (options.type) {
      operations = operations.filter(op => op.type === options.type);
    }
    
    // Filter by status
    if (options.status) {
      operations = operations.filter(op => op.status === options.status);
    }
    
    // Filter out completed operations if specified
    if (options.includeCompleted === false) {
      operations = operations.filter(op => op.status !== 'completed');
    }
    
    // Sort operations
    const sortBy = options.sortBy || 'startTime';
    const sortDirection = options.sortDirection || 'desc';
    
    operations.sort((a, b) => {
      const aValue = a[sortBy as keyof Operation];
      const bValue = b[sortBy as keyof Operation];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply limit and offset
    if (options.offset !== undefined && options.limit !== undefined) {
      operations = operations.slice(options.offset, options.offset + options.limit);
    } else if (options.limit !== undefined) {
      operations = operations.slice(0, options.limit);
    }
    
    return operations;
  }
  
  /**
   * Get logs for an operation
   */
  getOperationLogs(operationId: string): OperationLog[] {
    const operation = this.operations.get(operationId);
    if (!operation) return [];
    
    return [...operation.logs];
  }
  
  /**
   * Create a retry operation based on a failed operation
   */
  retryOperation(
    originalOperationId: string,
    newType: string,
    metadata: any = {}
  ): string {
    const originalOperation = this.operations.get(originalOperationId);
    if (!originalOperation) {
      throw new Error(`Original operation ${originalOperationId} not found`);
    }
    
    // Create new operation ID
    const retryId = `op_retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Merge metadata with original operation data
    const combinedMetadata = {
      ...metadata,
      originalOperationId,
      originalType: originalOperation.type,
      retryOf: originalOperationId,
      retryTime: new Date()
    };
    
    // Create the new operation
    const retryOperation: Operation = {
      id: retryId,
      type: newType,
      status: 'pending',
      progress: 0,
      logs: [],
      metadata: combinedMetadata,
      restorePoints: []
    };
    
    this.operations.set(retryId, retryOperation);
    
    // Add log entries
    this.addLog(retryId, 'info', `Retry operation created for ${originalOperationId}`);
    this.addLog(originalOperationId, 'info', `Retry operation ${retryId} created`, { retryId });
    
    this.notifyListeners(retryId);
    this.notifyListeners(originalOperationId);
    
    return retryId;
  }
  
  /**
   * Subscribe to operation updates
   */
  subscribe(id: string, callback: (operation: Operation) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    
    this.listeners.get(id)!.add(callback);
    
    // Call the callback immediately with the current state
    const operation = this.operations.get(id);
    if (operation) {
      callback(operation);
    }
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }
  
  /**
   * Notify all listeners for an operation
   */
  private notifyListeners(id: string): void {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    const listeners = this.listeners.get(id);
    if (!listeners) return;
    
    listeners.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('Error in operation listener:', error);
      }
    });
  }
}

export const operationTracker = OperationTracker.getInstance();

/**
 * Hook for tracking operation progress and status
 */
export function useOperationTracking(operationId?: string) {
  const [operation, setOperation] = useState<Operation | undefined>(
    operationId ? operationTracker.getOperation(operationId) : undefined
  );
  
  useEffect(() => {
    if (!operationId) {
      setOperation(undefined);
      return;
    }
    
    const unsubscribe = operationTracker.subscribe(operationId, setOperation);
    
    return () => {
      unsubscribe();
    };
  }, [operationId]);
  
  const createOperation = useCallback((type: string, metadata: any = {}): string => {
    return operationTracker.createOperation(type, metadata);
  }, []);
  
  const startOperation = useCallback((id: string): void => {
    operationTracker.startOperation(id);
  }, []);
  
  const updateProgress = useCallback((id: string, progress: number): void => {
    operationTracker.updateProgress(id, progress);
  }, []);
  
  const completeOperation = useCallback((id: string): void => {
    operationTracker.completeOperation(id);
  }, []);
  
  const failOperation = useCallback((id: string, error: OperationError): void => {
    operationTracker.failOperation(id, error);
  }, []);
  
  const cancelOperation = useCallback((id: string): void => {
    operationTracker.cancelOperation(id);
  }, []);
  
  const addLog = useCallback((id: string, level: LogLevel, message: string, details?: any): void => {
    operationTracker.addLog(id, level, message, details);
  }, []);
  
  const createRestorePoint = useCallback((
    id: string, 
    type: string, 
    data: any, 
    metadata?: { name: string; description: string; resourceId?: string; resourceType?: string; }
  ): string => {
    return operationTracker.createRestorePoint(id, type, data, metadata);
  }, []);
  
  const getRestorePoints = useCallback((id: string): RestorePoint[] => {
    return operationTracker.getRestorePoints(id);
  }, []);
  
  const getLatestRestorePoint = useCallback((id: string, type?: string): RestorePoint | undefined => {
    return operationTracker.getLatestRestorePoint(id, type);
  }, []);
  
  const getOperations = useCallback((options: {
    type?: string;
    status?: OperationStatus;
    limit?: number;
    offset?: number;
    includeCompleted?: boolean;
    sortBy?: keyof Operation;
    sortDirection?: 'asc' | 'desc';
  } = {}): Operation[] => {
    return operationTracker.getOperations(options);
  }, []);
  
  const getOperation = useCallback((id: string): Operation | undefined => {
    return operationTracker.getOperation(id);
  }, []);
  
  const getOperationLogs = useCallback((id: string): OperationLog[] => {
    return operationTracker.getOperationLogs(id);
  }, []);
  
  const retryOperation = useCallback((
    originalOperationId: string,
    newType: string,
    metadata: any = {}
  ): string => {
    return operationTracker.retryOperation(originalOperationId, newType, metadata);
  }, []);
  
  return {
    operation,
    createOperation,
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    cancelOperation,
    addLog,
    createRestorePoint,
    getRestorePoints,
    getLatestRestorePoint,
    getOperations,
    getOperation,
    getOperationLogs,
    retryOperation
  };
}
