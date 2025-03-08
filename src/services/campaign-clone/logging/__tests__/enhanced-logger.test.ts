import { EnhancedLogger } from '../enhanced-logger';
import { CategorizedError } from '../../error-types';
import { ExecutionContext, OperationStage } from '../../../../types/campaignClone';
import { PerformanceMetric } from '../types';

describe('EnhancedLogger', () => {
  // Mock services
  const mockAnalyticsService = {
    track: jest.fn().mockResolvedValue(undefined)
  };

  const mockMetricsCollector = {
    recordMetric: jest.fn().mockResolvedValue(undefined),
    incrementCounter: jest.fn().mockResolvedValue(undefined)
  };

  const mockPersistenceLayer = {
    store: jest.fn().mockResolvedValue(undefined)
  };

  // Mock context
  const mockContext: ExecutionContext = {
    operationId: 'test-operation-id',
    currentStage: 'EXECUTION' as OperationStage,
    campaignMapping: new Map([['campaign1', { id: 'c1' }]]),
    adGroupMapping: new Map([['adgroup1', { id: 'ag1' }]]),
    keywordMapping: new Map([['keyword1', { id: 'k1' }]]),
    errors: [],
    warnings: [],
    stateManager: { rollbackTo: jest.fn(), restoreState: jest.fn() }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock services for testing
    EnhancedLogger.mockServices = {
      analyticsService: mockAnalyticsService,
      metricsCollector: mockMetricsCollector,
      persistenceLayer: mockPersistenceLayer
    };
  });

  describe('Singleton Pattern', () => {
    test('getInstance always returns the same instance', () => {
      const instance1 = EnhancedLogger.getInstance();
      const instance2 = EnhancedLogger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Operation Logging', () => {
    test('logOperationStart creates and persists log entry', async () => {
      const logger = EnhancedLogger.getInstance();
      await logger.logOperationStart(mockContext, 'VALIDATION');

      // Verify log entry was stored
      expect(mockPersistenceLayer.store).toHaveBeenCalledTimes(1);
      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('INFO');
      expect(storedEntry.category).toBe('OPERATION');
      expect(storedEntry.message).toContain('VALIDATION');
      expect(storedEntry.metadata.operationId).toBe(mockContext.operationId);
      expect(storedEntry.metadata.resourceCount).toBe(3); // 1 campaign + 1 ad group + 1 keyword

      // Verify analytics event was tracked
      expect(mockAnalyticsService.track).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Logging', () => {
    test('logError logs categorized errors with context', async () => {
      const error = new CategorizedError({
        code: 'CAMPAIGN_CREATION_FAILED',
        category: 'API_ERROR',
        recoveryStrategy: 'RETRY',
        context: { campaignId: 'c1', attemptCount: 1 }
      });

      const logger = EnhancedLogger.getInstance();
      await logger.logError(error, mockContext);

      // Verify log entry was stored
      expect(mockPersistenceLayer.store).toHaveBeenCalledTimes(1);
      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('ERROR');
      expect(storedEntry.category).toBe('ERROR');
      expect(storedEntry.context.errorDetails).toEqual(error.context);
      expect(storedEntry.metadata.errorCategory).toBe(error.definition.category);
      expect(storedEntry.metadata.recoveryStrategy).toBe(error.recoveryStrategy);

      // Verify error metrics were tracked
      expect(mockMetricsCollector.incrementCounter).toHaveBeenCalledTimes(2);
      expect(mockMetricsCollector.incrementCounter).toHaveBeenCalledWith('errors_total', {
        category: error.definition.category,
        code: error.definition.code
      });
      expect(mockMetricsCollector.incrementCounter).toHaveBeenCalledWith('recovery_attempts', {
        strategy: error.recoveryStrategy
      });
    });
  });

  describe('Recovery Logging', () => {
    test('logRecoveryAction logs recovery attempts and outcomes', async () => {
      const recoveryAction = {
        type: 'RETRY',
        strategy: 'IMMEDIATE_RETRY',
        duration: 1500
      };

      const logger = EnhancedLogger.getInstance();
      await logger.logRecoveryAction(recoveryAction, mockContext, true);

      // Verify log entry was stored
      expect(mockPersistenceLayer.store).toHaveBeenCalledTimes(1);
      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('INFO'); // Success = INFO
      expect(storedEntry.category).toBe('RECOVERY');
      expect(storedEntry.context.actionDetails).toEqual(recoveryAction);
      expect(storedEntry.context.success).toBe(true);
      expect(storedEntry.metadata.recoveryStrategy).toBe(recoveryAction.strategy);

      // Verify recovery metrics were tracked
      expect(mockMetricsCollector.recordMetric).toHaveBeenCalledTimes(1);
      const metricCall = mockMetricsCollector.recordMetric.mock.calls[0][0];
      expect(metricCall.name).toBe('recovery_action');
      expect(metricCall.tags.type).toBe(recoveryAction.type);
      expect(metricCall.tags.success).toBe('true');
    });

    test('logRecoveryAction logs failed recovery attempts as warnings', async () => {
      const recoveryAction = {
        type: 'ROLLBACK',
        strategy: 'FULL_ROLLBACK',
        duration: 2500
      };

      const logger = EnhancedLogger.getInstance();
      await logger.logRecoveryAction(recoveryAction, mockContext, false);

      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('WARN'); // Failure = WARN
      expect(storedEntry.context.success).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    test('logPerformanceMetric logs metrics with severity level', async () => {
      const metric: PerformanceMetric = {
        name: 'operation_duration',
        value: 6000, // Above warning threshold (5000)
        unit: 'ms',
        timestamp: new Date().toISOString(),
        tags: { stage: 'EXECUTION' }
      };

      const logger = EnhancedLogger.getInstance();
      await logger.logPerformanceMetric(metric, mockContext);

      // Verify log entry was stored
      expect(mockPersistenceLayer.store).toHaveBeenCalledTimes(1);
      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('WARN'); // Above warning threshold
      expect(storedEntry.category).toBe('PERFORMANCE');
      expect(storedEntry.context.metric).toEqual(metric);
      expect(storedEntry.metadata.duration).toBe(metric.value);

      // Verify metric was recorded
      expect(mockMetricsCollector.recordMetric).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.recordMetric).toHaveBeenCalledWith(metric);
    });

    test('logPerformanceMetric handles critical thresholds', async () => {
      const metric: PerformanceMetric = {
        name: 'operation_duration',
        value: 15000, // Above critical threshold (10000)
        unit: 'ms',
        timestamp: new Date().toISOString(),
        tags: { stage: 'EXECUTION' }
      };

      const logger = EnhancedLogger.getInstance();
      await logger.logPerformanceMetric(metric, mockContext);

      const storedEntry = mockPersistenceLayer.store.mock.calls[0][0];
      expect(storedEntry.level).toBe('CRITICAL'); // Above critical threshold
    });
  });

  describe('Error Handling', () => {
    test('handles persistence failures gracefully', async () => {
      // Mock console methods temporarily
      const originalConsoleError = console.error;
      const originalConsoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();

      try {
        // Make persistence layer fail
        mockPersistenceLayer.store.mockRejectedValueOnce(new Error('Storage failure'));

        const logger = EnhancedLogger.getInstance();
        await logger.logOperationStart(mockContext, 'VALIDATION');

        // Verify failure was logged to console
        expect(console.error).toHaveBeenCalledWith(
          'Failed to persist log entry:',
          expect.any(Error)
        );
        expect(console.log).toHaveBeenCalledWith(
          'Log Entry:',
          expect.objectContaining({
            level: 'INFO',
            category: 'OPERATION'
          })
        );
      } finally {
        // Restore console methods
        console.error = originalConsoleError;
        console.log = originalConsoleLog;
      }
    });
  });
});
