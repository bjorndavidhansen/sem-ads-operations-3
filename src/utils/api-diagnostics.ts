/**
 * API Diagnostics Utility
 * 
 * This utility provides diagnostic functions for API troubleshooting,
 * including request validation, response analysis, and error logging.
 */

import { ApiError, ApiErrorType } from './api-error-handling';

/**
 * Redacts sensitive information from request/response objects for safe logging
 */
export function redactSensitiveInfo(obj: any): any {
  if (!obj) return obj;
  
  const sensitiveKeys = [
    'authorization', 'developer-token', 'client_secret', 'refresh_token', 
    'access_token', 'password', 'secret', 'key'
  ];
  
  if (typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in result) {
    if (typeof result[key] === 'object') {
      result[key] = redactSensitiveInfo(result[key]);
    } else if (
      typeof result[key] === 'string' && 
      sensitiveKeys.some(sk => key.toLowerCase().includes(sk))
    ) {
      result[key] = '[REDACTED]';
    }
  }
  
  return result;
}

/**
 * Validates a Google Ads API request payload against known schemas
 */
export function validateGoogleAdsPayload(
  endpoint: string, 
  payload: any
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Basic validation for all requests
  if (!payload) {
    errors.push('Payload is empty');
    return { valid: false, errors };
  }
  
  // Endpoint-specific validation
  if (endpoint.includes('campaigns:mutate')) {
    if (!payload.operations || !Array.isArray(payload.operations)) {
      errors.push('Missing or invalid operations array');
    } else {
      // Validate each operation
      payload.operations.forEach((op: any, index: number) => {
        if (!op.create && !op.update && !op.remove) {
          errors.push(`Operation ${index} missing action (create/update/remove)`);
        }
        
        if (op.create && !op.create.name) {
          errors.push(`Operation ${index} missing required field 'name'`);
        }
      });
    }
  }
  
  // Add more endpoint-specific validations as needed
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Creates a debug context object for API requests
 */
export function createApiDebugContext(
  customerId: string,
  endpoint: string,
  options: any,
  operationId?: string
): Record<string, any> {
  return {
    timestamp: new Date().toISOString(),
    customerId,
    endpoint,
    method: options.method,
    operationId,
    // Safely redact sensitive info before logging
    headers: redactSensitiveInfo(options.headers),
    bodyPreview: options.body ? 
      JSON.stringify(JSON.parse(options.body)).substring(0, 500) + 
      (JSON.stringify(JSON.parse(options.body)).length > 500 ? '...' : '') : 
      undefined
  };
}

/**
 * Logs detailed API error information
 */
export function logApiError(
  error: any,
  context: Record<string, any>
): void {
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Unknown',
    code: error instanceof ApiError ? error.code : 'UNKNOWN',
    type: error instanceof ApiError ? error.type : ApiErrorType.UNKNOWN,
    stack: error instanceof Error ? error.stack : undefined,
    context
  };
  
  console.error('[API ERROR]', JSON.stringify(errorDetails, null, 2));
  
  // In a production environment, you might want to send this to a logging service
  // logToService(errorDetails);
}

/**
 * Checks API version compatibility
 */
export function checkApiVersionCompatibility(version: string): boolean {
  const supportedVersions = ['v14', 'v15'];
  return supportedVersions.includes(version);
}

/**
 * Validates OAuth token scopes
 */
export function validateTokenScopes(
  scopes: string[]
): { valid: boolean; missing?: string[] } {
  const requiredScopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/cloud-platform'
  ];
  
  const missing = requiredScopes.filter(scope => !scopes.includes(scope));
  
  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  };
}
