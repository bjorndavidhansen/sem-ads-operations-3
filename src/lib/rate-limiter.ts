import { jStat } from 'jstat';

interface RateLimitConfig {
  maxRequestsPerSecond: number;
  maxConcurrentRequests: number;
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
}

export class RateLimiter {
  private static instance: RateLimiter;
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private requestHistory: number[] = [];
  private processing = false;

  private config: RateLimitConfig = {
    maxRequestsPerSecond: 10,
    maxConcurrentRequests: 5,
    retryLimit: 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    backoffFactor: 2
  };

  private constructor() {
    // Initialize rate limiter
    setInterval(() => this.cleanupHistory(), 1000);
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
      timestamp => now - timestamp < 1000
    );
  }

  private canMakeRequest(): boolean {
    return (
      this.activeRequests < this.config.maxConcurrentRequests &&
      this.requestHistory.length < this.config.maxRequestsPerSecond
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

        try {
          const result = await request.execute();
          this.activeRequests--;
          return result;
        } catch (error) {
          this.activeRequests--;

          if (request.retryCount < this.config.retryLimit) {
            const delay = this.calculateRetryDelay(request.retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));

            this.queue.push({
              ...request,
              retryCount: request.retryCount + 1,
              timestamp: Date.now()
            });
          } else {
            throw error;
          }
        }
      }
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

    // Add jitter to prevent thundering herd
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
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
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
        timestamp: Date.now()
      };

      this.queue.push(request);
      this.processQueue().catch(() => {});

      if (options?.timeout) {
        setTimeout(() => {
          const index = this.queue.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Request timeout'));
          }
        }, options.timeout);
      }
    });
  }

  // Update rate limit configuration
  updateConfig(config: Partial<RateLimitConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Get current queue statistics
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      requestsInLastSecond: this.requestHistory.length
    };
  }

  // Clear the queue
  clearQueue() {
    this.queue = [];
  }
}

export const rateLimiter = RateLimiter.getInstance();