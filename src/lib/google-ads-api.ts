import { supabase } from './supabase';
import { rateLimiter } from './rate-limiter';

export interface GoogleAdsApiError {
  code: string;
  message: string;
  status: string;
  details: any[];
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  averageCpc: number;
  ctr: number;
  conversionRate: number;
}

export interface SharedBudget {
  id: string;
  name: string;
  amountMicros: string;
  campaigns: Campaign[];
}

export interface Campaign {
  resourceName: string;
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  advertisingChannelType: string;
  startDate: string;
  endDate?: string;
  budget: {
    amountMicros: string;
    isShared?: boolean;
    sharedBudgetId?: string;
  };
  targetRoas?: {
    targetRoas: number;
  };
  targetCpa?: {
    targetCpaMicros: string;
  };
  metrics?: CampaignMetrics;
  historicalMetrics?: {
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
  }[];
}

export interface CreateCampaignInput {
  name: string;
  advertisingChannelType: string;
  status: 'ENABLED' | 'PAUSED';
  startDate: string;
  endDate?: string;
  dailyBudget: number;
  sharedBudgetId?: string;
  targetRoas?: number;
  targetCpa?: number;
}

export interface UpdateCampaignInput {
  name?: string;
  status?: 'ENABLED' | 'PAUSED';
  startDate?: string;
  endDate?: string;
  dailyBudget?: number;
  sharedBudgetId?: string | null;
  targetRoas?: number;
  targetCpa?: number;
}

export interface CreateSharedBudgetInput {
  name: string;
  amount: number;
  campaignIds?: string[];
}

export interface UpdateSharedBudgetInput {
  name?: string;
  amount?: number;
}

export interface ListCampaignsResponse {
  results: Campaign[];
  nextPageToken?: string;
}

export interface ListSharedBudgetsResponse {
  results: SharedBudget[];
  nextPageToken?: string;
}

class GoogleAdsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details: any[]
  ) {
    super(message);
    this.name = 'GoogleAdsApiError';
  }

  static fromResponse(response: any): GoogleAdsApiError {
    return new GoogleAdsApiError(
      response.message || 'Unknown error',
      response.code || 'UNKNOWN',
      response.status || 500,
      response.details || []
    );
  }

  isRetryable(): boolean {
    const retryableCodes = [
      'RESOURCE_EXHAUSTED',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'INTERNAL'
    ];
    return retryableCodes.includes(this.code);
  }
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private async refreshToken(customerId: string): Promise<string> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: account, error: accountError } = await supabase
      .from('google_ads_accounts')
      .select('oauth_credentials_json, refresh_token')
      .eq('google_customer_id', customerId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Google Ads account not found');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    // Update stored credentials
    await supabase
      .from('google_ads_accounts')
      .update({
        oauth_credentials_json: {
          ...account.oauth_credentials_json,
          access_token: data.access_token,
          expires_at: Date.now() + (data.expires_in * 1000)
        }
      })
      .eq('google_customer_id', customerId);

    return data.access_token;
  }

  async getAccessToken(customerId: string): Promise<string> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: account, error: accountError } = await supabase
      .from('google_ads_accounts')
      .select('oauth_credentials_json')
      .eq('google_customer_id', customerId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Google Ads account not found');
    }

    const credentials = account.oauth_credentials_json;
    const isExpired = Date.now() >= credentials.expires_at - 300000; // 5 minute buffer

    if (!isExpired) {
      return credentials.access_token;
    }

    // Refresh token if needed
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken(customerId)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }
}

class GoogleAdsApiClient {
  private static instance: GoogleAdsApiClient;
  private baseUrl = 'https://googleads.googleapis.com/v15';
  private developerToken: string;
  private tokenManager: TokenManager;

  private constructor() {
    this.developerToken = import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!this.developerToken) {
      throw new Error('Google Ads Developer Token is not configured');
    }
    this.tokenManager = TokenManager.getInstance();
  }

  static getInstance(): GoogleAdsApiClient {
    if (!GoogleAdsApiClient.instance) {
      GoogleAdsApiClient.instance = new GoogleAdsApiClient();
    }
    return GoogleAdsApiClient.instance;
  }

  private async makeRequest(
    customerId: string,
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<any> {
    try {
      const accessToken = await this.tokenManager.getAccessToken(customerId);

      const response = await rateLimiter.enqueue(
        () => fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json'
          }
        }),
        { timeout: 30000 }
      );

      if (!response.ok) {
        const error = await response.json();
        throw GoogleAdsApiError.fromResponse(error);
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof GoogleAdsApiError &&
        error.isRetryable() &&
        retryCount < 3
      ) {
        return this.makeRequest(customerId, endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  async createCampaign(customerId: string, input: CreateCampaignInput): Promise<void> {
    await this.makeRequest(
      customerId,
      `/customers/${customerId}/campaigns:mutate`,
      {
        method: 'POST',
        body: JSON.stringify({
          operations: [{
            create: {
              campaign: {
                name: input.name,
                status: input.status,
                advertisingChannelType: input.advertisingChannelType,
                startDate: input.startDate,
                endDate: input.endDate,
                campaignBudget: input.sharedBudgetId ? {
                  resourceName: `customers/${customerId}/campaignBudgets/${input.sharedBudgetId}`
                } : {
                  amountMicros: (input.dailyBudget * 1_000_000).toString(),
                  deliveryMethod: 'STANDARD'
                },
                ...(input.targetRoas && {
                  targetRoas: {
                    targetRoas: input.targetRoas
                  }
                }),
                ...(input.targetCpa && {
                  targetCpa: {
                    targetCpaMicros: (input.targetCpa * 1_000_000).toString()
                  }
                })
              }
            }
          }]
        })
      }
    );
  }

  // ... (keep all other existing methods)
}

export const googleAdsApi = GoogleAdsApiClient.getInstance();