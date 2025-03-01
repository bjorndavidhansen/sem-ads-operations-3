import { operationManager, type Operation } from './operation-manager';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  requireConfirmation?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onRollback?: (operation: Operation) => void;
}

export class ErrorRecovery {
  private static instance: ErrorRecovery;

  private constructor() {}

  static getInstance(): ErrorRecovery {
    if (!ErrorRecovery.instance) {
      ErrorRecovery.instance = new ErrorRecovery();
    }
    return ErrorRecovery.instance;
  }

  async withRecovery<T>(
    operationType: string,
    params: any,
    execute: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      requireConfirmation = false,
      onRetry,
      onRollback
    } = options;

    let attempt = 0;

    while (true) {
      try {
        return await operationManager.executeOperation(
          operationType,
          params,
          execute,
          this.buildRollbackSteps(params, onRollback)
        );
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          throw error;
        }

        if (onRetry) {
          onRetry(attempt, error as Error);
        }

        if (requireConfirmation) {
          const shouldRetry = await this.confirmRetry(attempt, error as Error);
          if (!shouldRetry) {
            throw error;
          }
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  private buildRollbackSteps(params: any, onRollback?: (operation: Operation) => void) {
    // Implement rollback steps based on operation type
    return [];
  }

  private async confirmRetry(attempt: number, error: Error): Promise<boolean> {
    // In a real implementation, this would show a UI confirmation dialog
    return true;
  }

  async recoverOperation(operationId: string): Promise<void> {
    const operation = operationManager.getOperation(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    if (operation.status !== 'failed') {
      throw new Error('Operation is not in failed state');
    }

    // Implement recovery logic
    console.log(`Recovering operation ${operationId}`);
  }

  getFailedOperations(): Operation[] {
    return operationManager.getOperations().filter(op => op.status === 'failed');
  }
}

export const errorRecovery = ErrorRecovery.getInstance();