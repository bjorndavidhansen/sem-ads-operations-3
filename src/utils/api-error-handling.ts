import { operationTracker } from '../hooks/use-operation-tracking';

// API Error types
export enum ApiErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

// API Error class
export class ApiError extends Error {
  type: ApiErrorType;
  code?: string;
  details?: any;
  retryable: boolean;
  response?: Response;
  operationId?: string;

  constructor({
    message,
    type = ApiErrorType.UNKNOWN,
    code,
    details,
    retryable = false,
    response,
    operationId
  }: {
    message: string;
    type?: ApiErrorType;
    code?: string;
    details?: any;
    retryable?: boolean;
    response?: Response;
    operationId?: string;
  }) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.response = response;
    this.operationId = operationId;

    // Log to operation tracker if operationId is provided
    if (operationId) {
      operationTracker.addLog(operationId, 'error', message, {
        type,
        code,
        details,
        retryable
      });
    }
  }
}

// Function to categorize Google Ads API errors
export function categorizeGoogleAdsError(error: any): ApiErrorType {
  // Handle response errors
  if (error.response) {
    const status = error.response.status;
    
    // Rate limiting errors
    if (status === 429) {
      return ApiErrorType.RATE_LIMIT;
    }
    
    // Authentication errors
    if (status === 401) {
      return ApiErrorType.AUTHENTICATION;
    }
    
    // Authorization errors
    if (status === 403) {
      return ApiErrorType.AUTHORIZATION;
    }
    
    // Not found errors
    if (status === 404) {
      return ApiErrorType.NOT_FOUND;
    }
    
    // Validation errors
    if (status === 400) {
      return ApiErrorType.VALIDATION;
    }
    
    // Server errors
    if (status >= 500) {
      return ApiErrorType.SERVER_ERROR;
    }
  }
  
  // Network errors
  if (error.message && (
    error.message.includes('network') || 
    error.message.includes('connection') ||
    error.message.includes('offline')
  )) {
    return ApiErrorType.NETWORK_ERROR;
  }
  
  // Timeout errors
  if (error.message && error.message.includes('timeout')) {
    return ApiErrorType.TIMEOUT;
  }
  
  // Default to unknown
  return ApiErrorType.UNKNOWN;
}

// Function to determine if an error is retryable
export function isRetryableError(error: any): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  
  const errorType = categorizeGoogleAdsError(error);
  
  // These error types are generally retryable
  return [
    ApiErrorType.RATE_LIMIT,
    ApiErrorType.NETWORK_ERROR,
    ApiErrorType.TIMEOUT,
    ApiErrorType.SERVER_ERROR
  ].includes(errorType);
}

// Function to extract error details from Google Ads API response
export function extractGoogleAdsErrorDetails(error: any): {
  message: string;
  code?: string;
  details?: any;
} {
  let message = 'An unknown error occurred';
  let code: string | undefined;
  let details: any = undefined;
  
  // Handle response errors
  if (error.response) {
    try {
      const data = error.response.data || {};
      
      // Extract error message
      if (data.error && data.error.message) {
        message = data.error.message;
      } else if (data.message) {
        message = data.message;
      }
      
      // Extract error code
      if (data.error && data.error.code) {
        code = data.error.code;
      } else if (data.code) {
        code = data.code;
      }
      
      // Extract error details
      if (data.error && data.error.details) {
        details = data.error.details;
      } else if (data.details) {
        details = data.details;
      } else if (data.error) {
        details = data.error;
      } else {
        details = data;
      }
    } catch (e) {
      console.error('Error parsing Google Ads API error response:', e);
    }
  } else if (error.message) {
    message = error.message;
    code = error.code;
    details = error.details || error;
  }
  
  return { message, code, details };
}

// Function to create an ApiError from a Google Ads API error
export function createApiErrorFromGoogleAdsError(error: any, operationId?: string): ApiError {
  const errorType = categorizeGoogleAdsError(error);
  const { message, code, details } = extractGoogleAdsErrorDetails(error);
  const retryable = isRetryableError(error);
  
  return new ApiError({
    message,
    type: errorType,
    code,
    details,
    retryable,
    response: error.response,
    operationId
  });
}

// Function to handle API errors consistently
export function handleApiError(error: any, operationId?: string): ApiError {
  // If it's already an ApiError, just return it
  if (error instanceof ApiError) {
    return error;
  }
  
  // Create a new ApiError from the error
  return createApiErrorFromGoogleAdsError(error, operationId);
}

// Function to create a user-friendly error message
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.type) {
    case ApiErrorType.RATE_LIMIT:
      return 'Rate limit exceeded. Please try again later.';
    
    case ApiErrorType.AUTHENTICATION:
      return 'Authentication failed. Please sign in again.';
    
    case ApiErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    
    case ApiErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    
    case ApiErrorType.VALIDATION:
      return `Validation error: ${error.message}`;
    
    case ApiErrorType.SERVER_ERROR:
      return 'A server error occurred. Our team has been notified.';
    
    case ApiErrorType.NETWORK_ERROR:
      return 'Network error. Please check your internet connection.';
    
    case ApiErrorType.TIMEOUT:
      return 'The request timed out. Please try again.';
    
    default:
      return error.message || 'An unknown error occurred.';
  }
}
