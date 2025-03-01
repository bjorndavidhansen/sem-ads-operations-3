import { rateLimiter } from './rate-limiter';

export interface Operation<T = any> {
  id: string;
  type: string;
  params: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  result?: T;
  error?: Error;
  startTime?: Date;
  endTime?: Date;
  rollbackSteps: RollbackStep[];
}

interface RollbackStep {
  id: string;
  description: string;
  execute: () => Promise<void>;
  status: 'pending' | 'completed' | 'failed';
  error?: Error;
}

interface RestorePoint {
  id: string;
  timestamp: Date;
  operationId: string;
  state: any;
}

class OperationManager {
  private static instance: OperationManager;
  private operations: Map<string, Operation> = new Map();
  private restorePoints: Map<string, RestorePoint> = new Map();
  private subscribers: Set<(operation: Operation) => void> = new Set();

  private constructor() {}

  static getInstance(): OperationManager {
    if (!OperationManager.instance) {
      OperationManager.instance = new OperationManager();
    }
    return OperationManager.instance;
  }

  async executeOperation<T>(
    type: string,
    params: any,
    execute: () => Promise<T>,
    rollbackSteps: RollbackStep[] = []
  ): Promise<T> {
    const operationId = crypto.randomUUID();
    const operation: Operation<T> = {
      id: operationId,
      type,
      params,
      status: 'pending',
      rollbackSteps,
      startTime: new Date()
    };

    this.operations.set(operationId, operation);
    this.notifySubscribers(operation);

    try {
      // Create restore point
      const restorePoint: RestorePoint = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        operationId,
        state: await this.captureState(params)
      };
      this.restorePoints.set(restorePoint.id, restorePoint);

      // Execute operation
      operation.status = 'running';
      this.notifySubscribers(operation);

      const result = await rateLimiter.enqueue(
        () => execute(),
        { timeout: 300000 } // 5 minute timeout
      );

      operation.status = 'completed';
      operation.result = result;
      operation.endTime = new Date();
      this.notifySubscribers(operation);

      return result;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error as Error;
      operation.endTime = new Date();
      this.notifySubscribers(operation);

      // Attempt rollback
      await this.rollback(operation);

      throw error;
    }
  }

  private async rollback(operation: Operation): Promise<void> {
    console.log(`Rolling back operation ${operation.id}`);

    for (const step of operation.rollbackSteps.reverse()) {
      try {
        step.status = 'pending';
        await step.execute();
        step.status = 'completed';
      } catch (error) {
        step.status = 'failed';
        step.error = error as Error;
        console.error(`Rollback step ${step.id} failed:`, error);
      }
    }

    operation.status = 'rolled_back';
    this.notifySubscribers(operation);
  }

  private async captureState(params: any): Promise<any> {
    // Implement state capture logic based on operation type
    return {
      timestamp: new Date(),
      params: { ...params }
    };
  }

  async restoreToPoint(restorePointId: string): Promise<void> {
    const restorePoint = this.restorePoints.get(restorePointId);
    if (!restorePoint) {
      throw new Error('Restore point not found');
    }

    // Implement state restoration logic
    console.log(`Restoring to point ${restorePointId}`);
  }

  getOperation(id: string): Operation | undefined {
    return this.operations.get(id);
  }

  getOperations(): Operation[] {
    return Array.from(this.operations.values());
  }

  subscribe(callback: (operation: Operation) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(operation: Operation): void {
    this.subscribers.forEach(callback => callback(operation));
  }

  clearHistory(): void {
    this.operations.clear();
    this.restorePoints.clear();
  }
}

export const operationManager = OperationManager.getInstance();