import { RecoveryRouter, RetryHandler, RollbackHandler } from '../strategy-router';
import { CategorizedError } from '../../error-types';
import { StateManager } from '../../state-manager';
import { RateLimitManager } from '../../../rate-limit-service';
import { ExecutionContext } from '../../../../types/campaignClone';

describe('RecoveryRouter', () => {
  // Mock dependencies
  const mockStateManager = {
    rollbackTo: jest.fn(),
    restoreState: jest.fn()
  } as unknown as StateManager;

  const mockRateLimitManager = {
    queueRequest: jest.fn((callback) => callback())
  } as unknown as RateLimitManager;

  const mockContext: ExecutionContext = {
    operationId: 'test-op-123',
    currentStage: 'VALIDATION',
    campaignMapping: new Map(),
    adGroupMapping: new Map(),
    keywordMapping: new Map(),
    errors: [],
    warnings: [],
    stateManager: mockStateManager
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      const instance2 = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      expect(instance1).toBe(instance2);
    });
  });

  describe('RetryHandler', () => {
    test('implements exponential backoff with jitter', async () => {
      const error = new CategorizedError({
        code: 'RATE_LIMIT_EXCEEDED',
        category: 'API_LIMIT',
        recoveryStrategy: 'DELAYED_RETRY',
        context: { retryCount: 2 }
      });

      const router = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      const execution = router.executeRecovery(error, mockContext);
      
      // Fast-forward past backoff
      jest.advanceTimersByTime(4000);
      await execution;

      expect(mockStateManager.restoreState).toHaveBeenCalledWith('VALIDATION');
      expect(mockRateLimitManager.queueRequest).toHaveBeenCalled();
    });
  });

  describe('RollbackHandler', () => {
    test('executes rollback to last stable state', async () => {
      const error = new CategorizedError({
        code: 'CAMPAIGN_CREATION_FAILED',
        category: 'API_ERROR',
        recoveryStrategy: 'PARTIAL_ROLLBACK',
        context: { lastStableState: 'VALIDATION' }
      });

      const router = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      await router.executeRecovery(error, mockContext);

      expect(mockStateManager.rollbackTo)
        .toHaveBeenCalledWith('VALIDATION', mockContext);
    });
  });

  describe('Error Handling', () => {
    test('throws error for unknown recovery strategy', async () => {
      const error = new CategorizedError({
        code: 'TEST_ERROR',
        category: 'SYSTEM',
        recoveryStrategy: 'UNKNOWN_STRATEGY' as any,
        context: {}
      });

      const router = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      await expect(router.executeRecovery(error, mockContext))
        .rejects
        .toThrow('No handler found for recovery strategy: UNKNOWN_STRATEGY');
    });

    test('propagates handler execution errors', async () => {
      mockStateManager.rollbackTo.mockRejectedValueOnce(new Error('Rollback failed'));

      const error = new CategorizedError({
        code: 'TEST_ERROR',
        category: 'SYSTEM',
        recoveryStrategy: 'FULL_ROLLBACK',
        context: {}
      });

      const router = RecoveryRouter.getInstance(mockStateManager, mockRateLimitManager);
      await expect(router.executeRecovery(error, mockContext))
        .rejects
        .toThrow('Recovery failed: Rollback failed');
    });
  });
});
