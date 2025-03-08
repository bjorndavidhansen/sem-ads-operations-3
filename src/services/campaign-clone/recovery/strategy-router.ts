import { CategorizedError, RecoveryStrategy } from '../error-types';
import { StateManager } from '../state-manager';
import { RateLimitManager } from '../../rate-limit-service';
import { ExecutionContext } from '../../../types/campaignClone';

/**
 * Defines the interface for all recovery handlers
 * Each recovery strategy will implement this interface
 */
export interface RecoveryHandler {
  execute(error: CategorizedError, context: ExecutionContext): Promise<void>;
}

/**
 * Handles retry operations with exponential backoff
 * Implements API Resilience requirements for transient failures
 */
export class RetryHandler implements RecoveryHandler {
  constructor(private rateLimitManager: RateLimitManager) {}

  async execute(error: CategorizedError, context: ExecutionContext): Promise<void> {
    const backoffTime = this.calculateBackoff(error.context.retryCount || 0);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    await this.rateLimitManager.queueRequest(async () => {
      await this.retryOperation(error, context);
    });
  }

  private calculateBackoff(retryCount: number): number {
    const base = 1000; // 1 second
    const maxBackoff = 32000; // 32 seconds
    const backoff = Math.min(
      maxBackoff,
      base * Math.pow(2, retryCount)
    );
    return backoff + Math.random() * 1000; // Add jitter
  }

  private async retryOperation(
    error: CategorizedError,
    context: ExecutionContext
  ): Promise<void> {
    const { operationId, stage } = error.context;
    await context.stateManager.restoreState(stage);
  }
}

/**
 * Handles rollback operations for partial and full rollbacks
 * Implements restore point verification from Error Handling Architecture
 */
export class RollbackHandler implements RecoveryHandler {
  constructor(private stateManager: StateManager) {}

  async execute(error: CategorizedError, context: ExecutionContext): Promise<void> {
    const rollbackStage = this.determineRollbackStage(error);
    await this.stateManager.rollbackTo(rollbackStage, context);
  }

  private determineRollbackStage(error: CategorizedError): string {
    return error.context.lastStableState || 'VALIDATION';
  }
}

/**
 * Handles cases requiring manual intervention
 * Routes to notification systems and incident tracking
 */
export class ManualInterventionHandler implements RecoveryHandler {
  async execute(error: CategorizedError, context: ExecutionContext): Promise<void> {
    await this.notifyOperationsTeam(error);
    await this.createIncident(error, context);
  }

  private async notifyOperationsTeam(error: CategorizedError): Promise<void> {
    // Implementation will integrate with notification system
  }

  private async createIncident(
    error: CategorizedError,
    context: ExecutionContext
  ): Promise<void> {
    // Implementation will create incident ticket
  }
}

/**
 * RecoveryRouter - Routes errors to appropriate recovery strategies
 * Follows singleton pattern for consistent error handling across the application
 * Implements multi-level recovery strategies from Error Handling Architecture
 */
export class RecoveryRouter {
  private static instance: RecoveryRouter;
  private handlers: Map<RecoveryStrategy, RecoveryHandler>;

  private constructor(
    private stateManager: StateManager,
    private rateLimitManager: RateLimitManager
  ) {
    this.handlers = new Map([
      ['IMMEDIATE_RETRY', new RetryHandler(rateLimitManager)],
      ['DELAYED_RETRY', new RetryHandler(rateLimitManager)],
      ['PARTIAL_ROLLBACK', new RollbackHandler(stateManager)],
      ['FULL_ROLLBACK', new RollbackHandler(stateManager)],
      ['MANUAL_INTERVENTION', new ManualInterventionHandler()]
    ]);
  }

  static getInstance(
    stateManager: StateManager,
    rateLimitManager: RateLimitManager
  ): RecoveryRouter {
    if (!RecoveryRouter.instance) {
      RecoveryRouter.instance = new RecoveryRouter(stateManager, rateLimitManager);
    }
    return RecoveryRouter.instance;
  }

  async executeRecovery(
    error: CategorizedError,
    context: ExecutionContext
  ): Promise<void> {
    const handler = this.handlers.get(error.recoveryStrategy);
    
    if (!handler) {
      throw new Error(`No handler found for recovery strategy: ${error.recoveryStrategy}`);
    }

    try {
      await handler.execute(error, context);
    } catch (recoveryError) {
      throw new Error(`Recovery failed: ${recoveryError.message}`);
    }
  }
}
