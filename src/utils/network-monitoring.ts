import { ApiError, ApiErrorType } from './api-error-handling';
import { redactSensitiveInfo } from './api-diagnostics';

interface NetworkStats {
  startTime: number;
  endTime?: number;
  duration?: number;
  bytesSent?: number;
  bytesReceived?: number;
  status?: number;
  error?: string;
}

interface RequestMonitorOptions {
  timeout?: number;
  retryCount?: number;
  operationId?: string;
}

/**
 * Monitors network requests and provides detailed diagnostics
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private stats: Map<string, NetworkStats> = new Map();
  
  private constructor() {}
  
  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }
  
  /**
   * Wraps a fetch request with monitoring
   */
  async monitorRequest(
    url: string,
    options: RequestInit,
    monitorOptions: RequestMonitorOptions = {}
  ): Promise<Response> {
    const requestId = Math.random().toString(36).substring(7);
    const { timeout = 30000, retryCount = 0, operationId } = monitorOptions;
    
    this.stats.set(requestId, {
      startTime: Date.now()
    });
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Add signal to options
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      // Log request details
      console.log('[Network Monitor] Request Start', {
        requestId,
        url,
        method: options.method,
        operationId,
        options: redactSensitiveInfo(fetchOptions)
      });
      
      // Make the request
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Update stats
      const stats = this.stats.get(requestId)!;
      stats.endTime = Date.now();
      stats.duration = stats.endTime - stats.startTime;
      stats.status = response.status;
      
      // Clone response to get size
      const clone = response.clone();
      const body = await clone.text();
      stats.bytesReceived = new TextEncoder().encode(body).length;
      
      // Log response details
      console.log('[Network Monitor] Request Complete', {
        requestId,
        duration: stats.duration,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        operationId
      });
      
      return response;
      
    } catch (error) {
      // Update error stats
      const stats = this.stats.get(requestId)!;
      stats.endTime = Date.now();
      stats.duration = stats.endTime - stats.startTime;
      stats.error = error instanceof Error ? error.message : String(error);
      
      // Log error details
      console.error('[Network Monitor] Request Failed', {
        requestId,
        duration: stats.duration,
        error: stats.error,
        operationId
      });
      
      // Handle timeout
      if (error.name === 'AbortError') {
        throw new ApiError({
          message: `Request timed out after ${timeout}ms`,
          type: ApiErrorType.TIMEOUT,
          retryable: true,
          operationId
        });
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError({
          message: 'Network request failed',
          type: ApiErrorType.NETWORK,
          retryable: true,
          operationId
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Get stats for a specific request
   */
  getRequestStats(requestId: string): NetworkStats | undefined {
    return this.stats.get(requestId);
  }
  
  /**
   * Clear old stats to prevent memory leaks
   */
  clearOldStats(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [requestId, stats] of this.stats.entries()) {
      if (now - stats.startTime > maxAgeMs) {
        this.stats.delete(requestId);
      }
    }
  }
}

export const networkMonitor = NetworkMonitor.getInstance();
