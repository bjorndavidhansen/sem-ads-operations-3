import { jStat } from 'jstat';
import { operationTracker } from '../hooks/use-operation-tracking';

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
  minimumDelay: number;
  retryLimit: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  backoffFactor: number;
}

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  retryCount: number;
  priority: number;
  timestamp: number;
  operationId?: string;
  label?: string;
  onProgress?: (progress: number) => void;
}

export interface RateLimiterStats {
  queueLength: number;
  activeRequests: number;
  requestsInLastMinute: number;
  estimatedTimeToCompletion: number;
  retryRate: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private requestHistory: number[] = [];
  private processing = false;
  private retryHistory: { success: number; failure: number } = { success: 0, failure: 0 };
  private paused = false;
  private lastRequestTime = 0;

  // Default configuration based on project requirements
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 3000, // 50 requests per second
    maxConcurrentRequests: 5,
    minimumDelay: 100, // Minimum delay between requests in ms
    retryLimit: 3,
    initialRetryDelay: 1000, // 1 second
    maxRetryDelay: 60000, // 60 seconds
    backoffFactor: 2
  };

  private constructor() {
    // Initialize rate limiter
    setInterval(() => this.cleanupHistory(), 60000); // Clean up history every minute
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private cleanupHistory() {
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter(
      timestamp => now - timestamp < 60000 // Keep requests from the last minute
    );
  }

  private canMakeRequest(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    return (
      !this.paused &&
      this.activeRequests < this.config.maxConcurrentRequests &&
      this.requestHistory.length < this.config.maxRequestsPerMinute &&
      timeSinceLastRequest >= this.config.minimumDelay
    );
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        if (!this.canMakeRequest()) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Sort queue by priority and timestamp
        this.queue.sort((a, b) => 
          b.priority - a.priority || a.timestamp - b.timestamp
        );

        const request = this.queue.shift()!;
        this.activeRequests++;
        this.requestHistory.push(Date.now());
        this.lastRequestTime = Date.now();

        // Update operation progress if operationId is provided
        if (request.operationId) {
          const operation = operationTracker.getOperation(request.operationId);
          if (operation) {
            const queueLength = this.queue.length + this.activeRequests;
            const progress = queueLength > 0 
              ? (request.timestamp - this.queue[this.queue.length - 1]?.timestamp) / 
                (request.timestamp - this.queue[0]?.timestamp)
              : 1;
            
            operationTracker.addLog(request.operationId, 'info', 
              `Processing request: ${request.label || 'Unnamed request'}`, 
              { queuePosition: this.activeRequests, totalInQueue: queueLength }
            );
            
            if (request.onProgress) {
              request.onProgress(progress);
            }
          }
        }

        try {
          await request.execute();
          this.retryHistory.success++;
        } catch (error) {
          this.retryHistory.failure++;
          
          if (request.retryCount < this.config.retryLimit) {
            const delay = this.calculateRetryDelay(request.retryCount);
            
            if (request.operationId) {
              operationTracker.addLog(
                request.operationId, 
                'warning',
                `Request failed, retrying in ${Math.round(delay / 1000)}s (attempt ${request.retryCount + 1}/${this.config.retryLimit + 1})`,
                { error }
              );
            }
            
            // Requeue with exponential backoff
            setTimeout(() => {
              this.queue.push({
                ...request,
                retryCount: request.retryCount + 1,
                timestamp: Date.now()
              });
              this.processQueue().catch(() => {});
            }, delay);
          } else {
            if (request.operationId) {
              operationTracker.addLog(
                request.operationId,
                'error',
                `Request failed after ${this.config.retryLimit + 1} attempts`,
                { error }
              );
            }
            console.error('Request failed after maximum retries:', error);
          }
        } finally {
          this.activeRequests--;
        }

        // Respect minimum delay between requests
        if (this.config.minimumDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.minimumDelay));
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    // Calculate base delay with exponential backoff
    const baseDelay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.backoffFactor, retryCount),
      this.config.maxRetryDelay
    );

    // Add jitter to prevent thundering herd (±20% randomization)
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
    return baseDelay + jitter;
  }

  private calculatePriority(options?: { urgent?: boolean }): number {
    if (options?.urgent) return 2;
    return 1;
  }

  async enqueue<T>(
    execute: () => Promise<T>,
    options?: {
      urgent?: boolean;
      timeout?: number;
      operationId?: string;
      label?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 9);
      
      // Log the request if part of an operation
      if (options?.operationId) {
        operationTracker.addLog(
          options.operationId,
          'info',
          `Queued request: ${options.label || 'Unnamed request'}`,
          { requestId, queueLength: this.queue.length }
        );
      }
      
      const request: QueuedRequest = {
        id: requestId,
        execute: async () => {
          try {
            const result = await execute();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        retryCount: 0,
        priority: this.calculatePriority(options),
        timestamp: Date.now(),
        operationId: options?.operationId,
        label: options?.label,
        onProgress: options?.onProgress
      };

      this.queue.push(request);
      this.processQueue().catch(() => {});

      if (options?.timeout) {
        setTimeout(() => {
          const index = this.queue.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.queue.splice(index, 1);
            
            if (options.operationId) {
              operationTracker.addLog(
                options.operationId,
                'error',
                `Request timed out: ${options.label || 'Unnamed request'}`,
                { requestId, timeout: options.timeout }
              );
            }
            
            reject(new Error('Request timeout'));
          }
        }, options.timeout);
      }
    });
  }

  // Batch multiple requests together
  async batchEnqueue<T>(
    requests: Array<() => Promise<any>>,
    options?: {
      urgent?: boolean;
      timeout?: number;
      operationId?: string;
      batchLabel?: string;
      concurrency?: number;
    }
  ): Promise<T[]> {
    const concurrency = options?.concurrency || this.config.maxConcurrentRequests;
    const results: T[] = [];
    const batchSize = requests.length;
    
    if (options?.operationId) {
      operationTracker.addLog(
        options.operationId,
        'info',
        `Starting batch of ${batchSize} requests: ${options.batchLabel || 'Unnamed batch'}`,
        { batchSize, concurrency }
      );
    }
    
    // Process in chunks based on concurrency
    for (let i = 0; i < requests.length; i += concurrency) {
      const chunk = requests.slice(i, i + concurrency);
      const chunkPromises = chunk.map((request, index) => 
        this.enqueue<T>(
          request,
          {
            ...options,
            label: `${options?.batchLabel || 'Batch'} ${i + index + 1}/${batchSize}`,
            onProgress: (progress) => {
              if (options?.operationId) {
                const overallProgress = ((i + index) + progress) / batchSize;
                operationTracker.updateProgress(options.operationId, overallProgress * 100);
              }
            }
          }
        )
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      if (options?.operationId) {
        const progress = Math.min(((i + concurrency) / batchSize) * 100, 100);
        operationTracker.updateProgress(options.operationId, progress);
        operationTracker.addLog(
          options.operationId,
          'info',
          `Completed ${Math.min(i + concurrency, batchSize)}/${batchSize} requests`,
          { progress }
        );
      }
    }
    
    if (options?.operationId) {
      operationTracker.addLog(
        options.operationId,
        'info',
        `Completed batch of ${batchSize} requests: ${options.batchLabel || 'Unnamed batch'}`,
        { success: true }
      );
    }
    
    return results;
  }

  // Update rate limit configuration
  updateConfig(config: Partial<RateLimitConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  // Get current queue statistics
  getStats(): RateLimiterStats {
    const queueLength = this.queue.length;
    const activeRequests = this.activeRequests;
    const requestsInLastMinute = this.requestHistory.length;
    
    // Calculate estimated time to completion
    const totalRequests = queueLength + activeRequests;
    const requestsPerSecond = Math.min(
      this.config.maxRequestsPerMinute / 60,
      this.config.maxConcurrentRequests * (1000 / this.config.minimumDelay)
    );
    
    const estimatedTimeToCompletion = totalRequests > 0
      ? totalRequests / requestsPerSecond
      : 0;
    
    // Calculate retry rate
    const totalAttempts = this.retryHistory.success + this.retryHistory.failure;
    const retryRate = totalAttempts > 0
      ? this.retryHistory.failure / totalAttempts
      : 0;
    
    return {
      queueLength,
      activeRequests,
      requestsInLastMinute,
      estimatedTimeToCompletion,
      retryRate
    };
  }

  // Pause processing
  pause() {
    this.paused = true;
  }

  // Resume processing
  resume() {
    this.paused = false;
    this.processQueue().catch(() => {});
  }

  // Clear the queue
  clearQueue() {
    this.queue = [];
  }
  
  // Reset statistics
  resetStats() {
    this.retryHistory = { success: 0, failure: 0 };
  }
}

export const rateLimiter = RateLimiter.getInstance();