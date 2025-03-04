// src/lib/rate-limiter.ts  
/\*\*  
 \* Rate limiter for Google Ads API to prevent quota exhaustion  
 \*/  
export interface RateLimitOptions {  
  /\*\* Maximum requests per minute (Google Ads API default is 3,000) \*/  
  requestsPerMinute?: number;  
  /\*\* Maximum concurrent requests (recommended 5-10) \*/  
  maxConcurrent?: number;  
  /\*\* Minimum delay between requests in ms \*/  
  minDelay?: number;  
  /\*\* Max retry attempts for failed requests \*/  
  maxRetries?: number;  
  /\*\* Initial backoff time in ms \*/  
  initialBackoff?: number;  
  /\*\* Maximum backoff time in ms \*/  
  maxBackoff?: number;  
}

export class RateLimiter {  
  private queue: Array\<{  
    execute: () \=\> Promise\<any\>;  
    resolve: (value: any) \=\> void;  
    reject: (reason: any) \=\> void;  
    retries: number;  
  }\> \= \[\];  
  private activeRequests \= 0;  
  private requestsThisMinute \= 0;  
  private minuteTimer: NodeJS.Timeout | null \= null;  
  private processingQueue \= false;

  constructor(private options: RateLimitOptions \= {}) {  
    // Set defaults if not provided  
    this.options \= {  
      requestsPerMinute: 3000,  
      maxConcurrent: 5,  
      minDelay: 100,  
      maxRetries: 3,  
      initialBackoff: 1000,  
      maxBackoff: 60000,  
      ...options,  
    };

    // Reset requests counter every minute  
    this.minuteTimer \= setInterval(() \=\> {  
      this.requestsThisMinute \= 0;  
    }, 60000);  
  }

  async executeRequest\<T\>(execute: () \=\> Promise\<T\>): Promise\<T\> {  
    return new Promise\<T\>((resolve, reject) \=\> {  
      // Add request to queue  
      this.queue.push({  
        execute,  
        resolve: resolve as (value: any) \=\> void,  
        reject,  
        retries: 0  
      });

      // Process queue if not already processing  
      if (\!this.processingQueue) {  
        this.processQueue();  
      }  
    });  
  }

  private async processQueue() {  
    if (this.processingQueue) return;  
    this.processingQueue \= true;

    while (this.queue.length \> 0\) {  
      // Check if we can make more requests  
      if (  
        this.activeRequests \>= this.options.maxConcurrent\! ||  
        this.requestsThisMinute \>= this.options.requestsPerMinute\!  
      ) {  
        // Wait and try again  
        await new Promise(resolve \=\> setTimeout(resolve, this.options.minDelay\!));  
        continue;  
      }

      // Get next request from queue  
      const request \= this.queue.shift();  
      if (\!request) continue;

      this.activeRequests++;  
      this.requestsThisMinute++;

      try {  
        const result \= await request.execute();  
        request.resolve(result);  
      } catch (error: any) {  
        // Check if error is rate limiting related  
        const isRateLimitError \=   
          error?.response?.status \=== 429 ||   
          error?.message?.includes('RESOURCE\_EXHAUSTED') ||  
          error?.message?.includes('RATE\_LIMIT\_EXCEEDED');

        // Retry logic  
        if (isRateLimitError && request.retries \< this.options.maxRetries\!) {  
          const backoff \= Math.min(  
            this.options.initialBackoff\! \* Math.pow(2, request.retries),  
            this.options.maxBackoff\!  
          );  
            
          console.warn(\`Rate limit hit, retrying in ${backoff}ms (attempt ${request.retries \+ 1}/${this.options.maxRetries})\`);  
            
          // Wait for backoff period  
          await new Promise(resolve \=\> setTimeout(resolve, backoff));  
            
          // Re-queue the request with incremented retry count  
          this.queue.push({  
            ...request,  
            retries: request.retries \+ 1  
          });  
        } else {  
          // Max retries exceeded or other error  
          request.reject(error);  
        }  
      } finally {  
        this.activeRequests--;  
          
        // Add minimum delay between requests  
        await new Promise(resolve \=\> setTimeout(resolve, this.options.minDelay\!));  
      }  
    }

    this.processingQueue \= false;  
  }

  dispose() {  
    if (this.minuteTimer) {  
      clearInterval(this.minuteTimer);  
    }  
  }  
}

// Create singleton instance  
export const rateLimiter \= new RateLimiter();

// src/lib/google-ads-api.ts  
// Add these imports at the top of the file  
import { rateLimiter } from './rate-limiter';

// Update the GoogleAdsApi class with token refresh and rate limiting  
export class GoogleAdsApi {  
  private static instance: GoogleAdsApi;  
  // Add other existing properties...

  // Update the getAccessToken method to handle token refresh  
  async getAccessToken(): Promise\<string\> {  
    try {  
      const { data: { user }, error: authError } \= await supabase.auth.getUser();  
      if (authError || \!user) {  
        throw new Error('User not authenticated');  
      }

      const { data: account, error: accountError } \= await supabase  
        .from('google\_ads\_accounts')  
        .select('oauth\_credentials\_json')  
        .eq('user\_id', user.id)  
        .single();

      if (accountError || \!account) {  
        throw new Error('Google Ads account not found');  
      }

      const credentials \= account.oauth\_credentials\_json;  
        
      // Check if token is expired (expires\_in is in seconds)  
      const isExpired \= credentials.expiry\_date \< Date.now();

      if (isExpired) {  
        console.log('Token expired, refreshing...');  
          
        // Implement token refresh using the refresh\_token  
        const refreshResult \= await this.refreshToken(credentials.refresh\_token);  
          
        // Update stored credentials  
        await supabase  
          .from('google\_ads\_accounts')  
          .update({  
            oauth\_credentials\_json: refreshResult,  
            updated\_at: new Date().toISOString()  
          })  
          .eq('user\_id', user.id);  
          
        return refreshResult.access\_token;  
      }

      return credentials.access\_token;  
    } catch (error) {  
      console.error('Error getting access token:', error);  
      throw error;  
    }  
  }  
    
  // Add a new method to refresh tokens  
  private async refreshToken(refreshToken: string): Promise\<any\> {  
    try {  
      // This would typically be a server-side call due to client\_secret requirements  
      // For frontend implementation, you might need a proxy endpoint  
      const response \= await fetch('YOUR\_TOKEN\_REFRESH\_ENDPOINT', {  
        method: 'POST',  
        headers: {  
          'Content-Type': 'application/json'  
        },  
        body: JSON.stringify({  
          refresh\_token: refreshToken,  
          client\_id: import.meta.env.VITE\_GOOGLE\_CLIENT\_ID,  
          // client\_secret should be kept server-side  
          grant\_type: 'refresh\_token'  
        })  
      });  
        
      if (\!response.ok) {  
        throw new Error(\`Token refresh failed: ${response.statusText}\`);  
      }  
        
      const tokenData \= await response.json();  
        
      // Update expiry\_date  
      tokenData.expiry\_date \= Date.now() \+ (tokenData.expires\_in \* 1000);  
        
      return tokenData;  
    } catch (error) {  
      console.error('Error refreshing token:', error);  
      throw error;  
    }  
  }

  // Update API methods to use the rate limiter  
  // Example for listCampaigns method:  
  async listCampaigns(accountId: string, options?: { status?: string }): Promise\<Campaign\[\]\> {  
    return rateLimiter.executeRequest(async () \=\> {  
      try {  
        const accessToken \= await this.getAccessToken();  
          
        // Existing implementation...  
          
      } catch (error) {  
        console.error('Error listing campaigns:', error);  
        throw error;  
      }  
    });  
  }  
    
  // Similarly update other API methods to use rateLimiter.executeRequest

  // Example for the critical copyCampaigns method:  
  async copyCampaigns(  
    accountId: string,   
    campaignIds: string\[\],   
    options?: {   
      namingConvention?: NamingConfiguration,  
      matchType?: KeywordMatchType,  
      createNegatives?: boolean  
    }  
  ): Promise\<Campaign\[\]\> {  
    // Create a batched operation that respects rate limits  
    const batchSize \= 5; // Process 5 campaigns at a time  
    const results: Campaign\[\] \= \[\];  
      
    // Process in batches  
    for (let i \= 0; i \< campaignIds.length; i \+= batchSize) {  
      const batch \= campaignIds.slice(i, i \+ batchSize);  
        
      // Process each campaign in the batch with rate limiting  
      const batchResults \= await Promise.all(  
        batch.map(campaignId \=\>   
          rateLimiter.executeRequest(async () \=\> {  
            try {  
              const accessToken \= await this.getAccessToken();  
                
              // Existing implementation for single campaign copy...  
              // Apply naming convention if provided  
              // Apply match type conversion if provided  
              // Create negative keywords if specified  
                
              // Return the copied campaign  
              return {} as Campaign; // Replace with actual implementation  
                
            } catch (error) {  
              console.error(\`Error copying campaign ${campaignId}:\`, error);  
              throw error;  
            }  
          })  
        )  
      );  
        
      results.push(...batchResults);  
    }  
      
    return results;  
  }  
}

// src/components/ui/progress-tracker.tsx  
import React, { useState, useEffect } from 'react';

export interface ProgressTrackerProps {  
  /\*\* Current progress percentage (0-100) \*/  
  progress: number;  
  /\*\* Operation status message \*/  
  statusMessage: string;  
  /\*\* Optional description of current step \*/  
  currentStep?: string;  
  /\*\* Optional estimated time remaining in seconds \*/  
  estimatedTimeRemaining?: number;  
  /\*\* Whether the operation is complete \*/  
  isComplete?: boolean;  
  /\*\* Whether the operation has an error \*/  
  hasError?: boolean;  
  /\*\* Optional error message \*/  
  errorMessage?: string;  
}

export function ProgressTracker({  
  progress,  
  statusMessage,  
  currentStep,  
  estimatedTimeRemaining,  
  isComplete \= false,  
  hasError \= false,  
  errorMessage  
}: ProgressTrackerProps) {  
  // Format time remaining  
  const formatTimeRemaining \= (seconds: number): string \=\> {  
    if (seconds \< 60\) {  
      return \`${seconds} seconds\`;  
    } else if (seconds \< 3600\) {  
      return \`${Math.floor(seconds / 60)} minutes\`;  
    } else {  
      return \`${Math.floor(seconds / 3600)} hours, ${Math.floor((seconds % 3600\) / 60)} minutes\`;  
    }  
  };

  return (  
    \<div className="w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm"\>  
      \<div className="flex justify-between items-center mb-2"\>  
        \<span className="text-sm font-medium text-gray-700"\>  
          {isComplete ? 'Operation Complete' : statusMessage}  
        \</span\>  
        {estimatedTimeRemaining \!== undefined && \!isComplete && \!hasError && (  
          \<span className="text-xs text-gray-500"\>  
            Est. time remaining: {formatTimeRemaining(estimatedTimeRemaining)}  
          \</span\>  
        )}  
      \</div\>  
        
      \<div className="w-full bg-gray-200 rounded-full h-2.5 mb-2"\>  
        \<div   
          className={\`h-2.5 rounded-full ${  
            hasError ? 'bg-red-600' : isComplete ? 'bg-green-600' : 'bg-blue-600'  
          }\`}  
          style={{ width: \`${progress}%\` }}  
        \>\</div\>  
      \</div\>  
        
      {currentStep && \!isComplete && \!hasError && (  
        \<p className="text-xs text-gray-500 mt-1"\>  
          Current step: {currentStep}  
        \</p\>  
      )}  
        
      {hasError && (  
        \<div className="mt-2 text-sm text-red-600"\>  
          {errorMessage || 'An error occurred during the operation'}  
        \</div\>  
      )}  
        
      {isComplete && (  
        \<p className="text-sm text-green-700 mt-1"\>  
          Operation completed successfully  
        \</p\>  
      )}  
    \</div\>  
  );  
}

// Example usage in a Campaign Clone Operation component:  
//   
// function CampaignCloneOperation() {  
//   const \[progress, setProgress\] \= useState(0);  
//   const \[statusMessage, setStatusMessage\] \= useState('Preparing operation...');  
//   const \[currentStep, setCurrentStep\] \= useState('');  
//   const \[estimatedTimeRemaining, setEstimatedTimeRemaining\] \= useState(0);  
//   const \[isComplete, setIsComplete\] \= useState(false);  
//   const \[hasError, setHasError\] \= useState(false);  
//   const \[errorMessage, setErrorMessage\] \= useState('');  
//  
//   // ... operation logic that updates these state values  
//  
//   return (  
//     \<div\>  
//       \<h2\>Campaign Clone Operation\</h2\>  
//       \<ProgressTracker  
//         progress={progress}  
//         statusMessage={statusMessage}  
//         currentStep={currentStep}  
//         estimatedTimeRemaining={estimatedTimeRemaining}  
//         isComplete={isComplete}  
//         hasError={hasError}  
//         errorMessage={errorMessage}  
//       /\>  
//       {/\* Rest of component \*/}  
//     \</div\>  
//   );  
// }