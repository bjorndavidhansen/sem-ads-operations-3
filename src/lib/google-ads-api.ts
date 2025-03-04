import { supabase } from './supabase';
import { rateLimiter } from './rate-limiter';
import { operationTracker } from '../hooks/use-operation-tracking';
import { ApiError, ApiErrorType, handleApiError } from '../utils/api-error-handling';
import { networkMonitor } from '../utils/network-monitoring';
import { validateGoogleAdsPayload, createApiDebugContext, logApiError } from '../utils/api-diagnostics';

interface GoogleAdsApiClientConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  loginCustomerId?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export class GoogleAdsApiClient {
  private static instance: GoogleAdsApiClient;
  private config: GoogleAdsApiClientConfig;
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly API_VERSION = 'v15';
  private readonly BASE_URL = 'https://googleads.googleapis.com';

  private constructor(config: GoogleAdsApiClientConfig) {
    this.config = config;
  }

  static getInstance(config?: GoogleAdsApiClientConfig): GoogleAdsApiClient {
    if (!GoogleAdsApiClient.instance) {
      if (!config) {
        throw new Error('GoogleAdsApiClient must be initialized with a config');
      }
      GoogleAdsApiClient.instance = new GoogleAdsApiClient(config);
    }
    return GoogleAdsApiClient.instance;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.accessToken && this.tokenExpiration && this.tokenExpiration > new Date()) {
      return this.accessToken;
    }

    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Otherwise, refresh the token
    this.refreshPromise = this.refreshAccessToken();
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError({
          message: 'Failed to refresh access token',
          type: ApiErrorType.AUTHENTICATION,
          code: 'TOKEN_REFRESH_FAILED',
          details: errorData,
          retryable: false,
          response
        });
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      
      // Set token expiration (subtract 5 minutes for safety)
      const expiresInMs = (data.expires_in - 300) * 1000;
      this.tokenExpiration = new Date(Date.now() + expiresInMs);
      
      return this.accessToken;
    } catch (error) {
      // Convert to ApiError if it's not already
      const apiError = error instanceof ApiError 
        ? error 
        : new ApiError({
            message: 'Failed to refresh access token',
            type: ApiErrorType.AUTHENTICATION,
            details: error,
            retryable: false
          });
      
      // Clear token state
      this.accessToken = null;
      this.tokenExpiration = null;
      
      throw apiError;
    }
  }

  /**
   * Make a request to the Google Ads API with enhanced monitoring and error handling
   */
  async makeRequest(
    customerId: string, 
    endpoint: string, 
    options: { 
      method: string; 
      body?: string; 
      headers?: Record<string, string>;
      operationId?: string;
      label?: string;
      timeout?: number;
    }
  ): Promise<any> {
    const { method, body, headers = {}, operationId, label, timeout = 30000 } = options;
    
    // Create debug context
    const debugContext = createApiDebugContext(customerId, endpoint, options, operationId);
    
    // Validate payload if present
    if (body) {
      const validation = validateGoogleAdsPayload(endpoint, JSON.parse(body));
      if (!validation.valid) {
        const error = new ApiError({
          message: 'Invalid request payload',
          type: ApiErrorType.VALIDATION,
          details: validation.errors,
          operationId
        });
        logApiError(error, debugContext);
        throw error;
      }
    }
    
    // Use the rate limiter to manage API requests
    return rateLimiter.enqueue(async () => {
      try {
        // Get a valid access token
        const accessToken = await this.getAccessToken();
        
        // Construct full URL
        const url = `${this.BASE_URL}/${this.API_VERSION}/customers/${customerId}/${endpoint}`;
        
        // Prepare request options
        const requestOptions: RequestInit = {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
            'login-customer-id': this.config.loginCustomerId || customerId,
            ...headers,
          },
          body,
        };
        
        // Log the request if we have an operation ID
        if (operationId) {
          operationTracker.addLog(
            operationId,
            'info',
            `API Request: ${method} ${endpoint}${label ? ` (${label})` : ''}`,
            debugContext
          );
        }
        
        // Make the request with monitoring
        const response = await networkMonitor.monitorRequest(
          url,
          requestOptions,
          { timeout, operationId }
        );
        
        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Determine if this is a rate limit error
          const isRateLimit = response.status === 429;
          
          // Create an appropriate error
          const error = new ApiError({
            message: errorData.error?.message || `API request failed with status ${response.status}`,
            type: isRateLimit ? ApiErrorType.RATE_LIMIT : ApiErrorType.UNKNOWN,
            code: errorData.error?.code || `HTTP_${response.status}`,
            details: errorData,
            retryable: isRateLimit || response.status >= 500,
            response,
            operationId
          });
          
          // Log the error
          logApiError(error, debugContext);
          
          throw error;
        }
        
        // Parse the response
        const data = await response.json();
        
        // Log success if we have an operation ID
        if (operationId) {
          operationTracker.addLog(
            operationId,
            'info',
            `API Success: ${method} ${endpoint}${label ? ` (${label})` : ''}`,
            { ...debugContext, responseStatus: response.status }
          );
        }
        
        return data;
      } catch (error) {
        // Handle and rethrow the error
        const apiError = handleApiError(error, operationId);
        logApiError(apiError, debugContext);
        throw apiError;
      }
    }, { 
      operationId, 
      label: label || `${method} ${endpoint}`,
      timeout 
    });
  }

  /**
   * Make multiple requests to the Google Ads API in parallel
   */
  async batchMakeRequests<T>(
    requests: Array<{
      customerId: string;
      endpoint: string;
      options: {
        method: string;
        body?: string;
        headers?: Record<string, string>;
        label?: string;
      };
    }>,
    batchOptions?: {
      operationId?: string;
      concurrency?: number;
      timeout?: number;
      continueOnError?: boolean;
    }
  ): Promise<Array<T>> {
    const { 
      operationId, 
      concurrency = 5, 
      timeout,
      continueOnError = false 
    } = batchOptions || {};
    
    // If we have an operation ID, log the batch request
    if (operationId) {
      operationTracker.addLog(
        operationId,
        'info',
        `Starting batch API request with ${requests.length} requests`,
        { requestCount: requests.length, concurrency }
      );
    }
    
    // Use the rate limiter's batch functionality
    return rateLimiter.batchEnqueue<T>(
      requests.map((req, index) => ({
        execute: () => this.makeRequest(
          req.customerId,
          req.endpoint,
          {
            ...req.options,
            operationId,
            label: req.options.label || `Batch ${index + 1}/${requests.length}`
          }
        ),
        label: req.options.label || `Batch ${index + 1}/${requests.length}`
      })),
      {
        operationId,
        concurrency,
        timeout,
        continueOnError,
        onProgress: operationId ? (progress) => {
          operationTracker.updateProgress(
            operationId,
            progress,
            Math.floor((requests.length * progress) / 100)
          );
        } : undefined
      }
    );
  }

  /**
   * Get campaigns for a customer
   */
  async getCampaigns(customerId: string, operationId?: string): Promise<any> {
    return this.makeRequest(
      customerId,
      'googleAds:search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign.advertising_channel_type,
              campaign.bidding_strategy_type
            FROM campaign
            ORDER BY campaign.id
          `
        }),
        operationId,
        label: 'Get Campaigns'
      }
    );
  }

  /**
   * Get ad groups for a campaign
   */
  async getAdGroups(customerId: string, campaignId: string, operationId?: string): Promise<any> {
    return this.makeRequest(
      customerId,
      'adGroups:search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: `
            SELECT
              ad_group.id,
              ad_group.name,
              ad_group.status,
              ad_group.type
            FROM ad_group
            WHERE ad_group.campaign.id = ${campaignId}
            ORDER BY ad_group.id
          `
        }),
        operationId,
        label: `Get Ad Groups for Campaign ${campaignId}`
      }
    );
  }

  /**
   * Get keywords for an ad group
   */
  async getKeywords(customerId: string, adGroupId: string, operationId?: string): Promise<any> {
    return this.makeRequest(
      customerId,
      'adGroupCriteria:search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: `
            SELECT
              ad_group_criterion.criterion_id,
              ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type,
              ad_group_criterion.status
            FROM ad_group_criterion
            WHERE 
              ad_group_criterion.type = 'KEYWORD'
              AND ad_group_criterion.ad_group.id = ${adGroupId}
            ORDER BY ad_group_criterion.criterion_id
          `
        }),
        operationId,
        label: `Get Keywords for Ad Group ${adGroupId}`
      }
    );
  }

  /**
   * Create a campaign
   */
  async createCampaign(
    customerId: string, 
    campaignData: any,
    operationId?: string
  ): Promise<any> {
    return this.makeRequest(
      customerId,
      'campaigns:mutate',
      {
        method: 'POST',
        body: JSON.stringify({
          operations: [
            {
              create: campaignData
            }
          ]
        }),
        operationId,
        label: `Create Campaign: ${campaignData.name || 'Unnamed'}`
      }
    );
  }

  /**
   * Create an ad group
   */
  async createAdGroup(
    customerId: string, 
    adGroupData: any,
    operationId?: string
  ): Promise<any> {
    return this.makeRequest(
      customerId,
      'adGroups:mutate',
      {
        method: 'POST',
        body: JSON.stringify({
          operations: [
            {
              create: adGroupData
            }
          ]
        }),
        operationId,
        label: `Create Ad Group: ${adGroupData.name || 'Unnamed'}`
      }
    );
  }

  /**
   * Create keywords in batch
   */
  async createKeywords(
    customerId: string, 
    keywords: Array<{
      adGroupId: string;
      text: string;
      matchType: string;
    }>,
    operationId?: string
  ): Promise<any> {
    return this.makeRequest(
      customerId,
      'adGroupCriteria:mutate',
      {
        method: 'POST',
        body: JSON.stringify({
          operations: keywords.map(keyword => ({
            create: {
              adGroup: `customers/${customerId}/adGroups/${keyword.adGroupId}`,
              status: 'ENABLED',
              keyword: {
                text: keyword.text,
                matchType: keyword.matchType
              }
            }
          }))
        }),
        operationId,
        label: `Create ${keywords.length} Keywords`
      }
    );
  }

  /**
   * Copy a campaign, optionally modifying settings like match type
   * @param customerId Google Ads customer ID
   * @param sourceCampaignId ID of the campaign to copy
   * @param config Configuration options for the copy
   * @param operationId Optional operation ID for tracking
   * @param previewOnly If true, only validate and return preview data without executing
   */
  async copyCampaign(
    customerId: string, 
    sourceCampaignId: string, 
    config: {
      name: string;
      matchType: 'BROAD' | 'PHRASE';
      createNegativeExactKeywords: boolean;
    },
    operationId?: string,
    previewOnly: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    newCampaignId?: string;
    operationId: string;
    restorePointId?: string;
    previewData?: {
      items: any[];
      summary: any;
    };
  }> {
    // Create a new operation ID if not provided
    if (!operationId) {
      operationId = operationTracker.createOperation('campaign_clone', {
        customerId,
        sourceCampaignId,
        ...config
      });
    }
    
    try {
      operationTracker.startOperation(operationId);
      
      // Add initial log
      operationTracker.addLog(
        operationId,
        'info',
        `Starting campaign clone operation: ${sourceCampaignId} → "${config.name}"`,
        { config }
      );
      
      // Fetch source campaign data
      operationTracker.addLog(operationId, 'info', 'Fetching source campaign data');
      
      const monitoringToken = networkMonitor.startOperation(
        'google_ads_api',
        'GET_CAMPAIGN_DATA',
        { customerId, campaignId: sourceCampaignId }
      );
      
      const sourceCampaignResponse = await this.makeRequest(
        customerId,
        'campaigns:search',
        {
          method: 'POST',
          body: JSON.stringify({
            query: `
              SELECT 
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                campaign.bidding_strategy_type,
                campaign.network_settings,
                campaign.targeting_settings,
                campaign.campaign_budget
              FROM campaign
              WHERE campaign.id = '${sourceCampaignId}'
            `
          })
        }
      );
      
      networkMonitor.endOperation(monitoringToken);
      
      if (!sourceCampaignResponse?.results?.[0]) {
        throw new Error('Source campaign not found');
      }
      
      const sourceCampaign = sourceCampaignResponse.results[0].campaign;
      
      operationTracker.addLog(
        operationId,
        'info',
        `Source campaign found: ${sourceCampaign.name}`,
        { campaignDetails: sourceCampaign }
      );
      
      // Fetch ad groups
      operationTracker.addLog(operationId, 'info', 'Fetching ad groups');
      
      const adGroupsMonitoringToken = networkMonitoring.startOperation(
        'google_ads_api',
        'GET_AD_GROUPS',
        { customerId, campaignId: sourceCampaignId }
      );
      
      const adGroupsResponse = await this.getAdGroups(customerId, sourceCampaignId);
      
      networkMonitoring.endOperation(adGroupsMonitoringToken);
      
      const adGroups = adGroupsResponse.results || [];
      
      operationTracker.addLog(
        operationId,
        'info',
        `Found ${adGroups.length} ad groups`,
        { adGroupsCount: adGroups.length }
      );
      
      // Build campaign data object for validation
      const sourceCampaignData = {
        id: sourceCampaign.id,
        name: sourceCampaign.name,
        status: sourceCampaign.status,
        advertisingChannelType: sourceCampaign.advertisingChannelType,
        biddingStrategyType: sourceCampaign.biddingStrategyType,
        networkSettings: sourceCampaign.networkSettings,
        targetingSettings: sourceCampaign.targetingSettings,
        budget: sourceCampaign.campaignBudget ? {
          amount: sourceCampaign.campaignBudget.amountMicros / 1000000,
          currency: 'USD' // Assuming USD, should be dynamically determined in production
        } : undefined,
        adGroups: []
      };
      
      // Fetch keywords for each ad group
      operationTracker.addLog(operationId, 'info', 'Fetching keywords');
      let totalKeywords = 0;
      
      for (const adGroupResult of adGroups) {
        const adGroup = adGroupResult.adGroup;
        
        const keywordsMonitoringToken = networkMonitoring.startOperation(
          'google_ads_api',
          'GET_KEYWORDS',
          { customerId, adGroupId: adGroup.id }
        );
        
        const keywordsResponse = await this.getKeywords(customerId, adGroup.id);
        
        networkMonitoring.endOperation(keywordsMonitoringToken);
        
        const keywords = keywordsResponse?.results?.map(result => ({
          id: result.adGroupCriterion.criterionId,
          text: result.adGroupCriterion.keyword.text,
          matchType: result.adGroupCriterion.keyword.matchType,
          status: result.adGroupCriterion.status
        })) || [];
        
        totalKeywords += keywords.length;
        
        sourceCampaignData.adGroups.push({
          id: adGroup.id,
          name: adGroup.name,
          status: adGroup.status,
          type: adGroup.type,
          cpcBidMicros: adGroup.cpcBidMicros,
          keywords
        });
      }
      
      operationTracker.addLog(
        operationId,
        'info',
        `Found ${totalKeywords} keywords across all ad groups`,
        { keywordsCount: totalKeywords }
      );
      
      // Fetch account context for validation
      const accountContextToken = networkMonitoring.startOperation(
        'google_ads_api',
        'GET_ACCOUNT_CONTEXT',
        { customerId }
      );
      
      const accountContextResponse = await this.makeRequest(
        customerId,
        'campaigns:search',
        {
          method: 'POST',
          body: JSON.stringify({
            query: `
              SELECT campaign.id
              FROM campaign
              WHERE campaign.status = 'ENABLED'
            `
          })
        }
      );
      
      networkMonitoring.endOperation(accountContextToken);
      
      const accountContext = {
        activeCampaignCount: accountContextResponse?.results?.length || 0
      };
      
      // Generate validation preview
      operationTracker.addLog(operationId, 'info', 'Generating validation preview');
      
      const validationService = require('../services/validation-service').validationService;
      const { items, summary } = validationService.generateCampaignClonePreview(
        sourceCampaignData,
        config,
        accountContext
      );
      
      // Check if there are any blocking errors
      const hasBlockingErrors = summary.validationResults.errors.length > 0;
      
      // If preview only or there are blocking errors, return the preview data
      if (previewOnly || hasBlockingErrors) {
        if (hasBlockingErrors) {
          operationTracker.addLog(
            operationId,
            'error',
            `Validation failed with ${summary.validationResults.errors.length} errors`,
            { validationErrors: summary.validationResults.errors }
          );
        } else {
          operationTracker.addLog(
            operationId,
            'info',
            'Preview generated successfully',
            { previewSummary: summary }
          );
        }
        
        return {
          success: !hasBlockingErrors,
          message: hasBlockingErrors 
            ? `Validation failed with ${summary.validationResults.errors.length} errors` 
            : 'Preview generated successfully',
          operationId,
          previewData: { items, summary }
        };
      }
      
      // Create restore point before making changes
      const restorePointId = operationTracker.createRestorePoint(
        operationId,
        'pre_campaign_clone',
        { sourceCampaignData },
        {
          name: 'Pre-Campaign Clone',
          description: `State before cloning campaign "${sourceCampaign.name}" to "${config.name}"`,
          resourceId: sourceCampaignId,
          resourceType: 'campaign'
        }
      );
      
      operationTracker.addLog(
        operationId,
        'info',
        'Created restore point for rollback capability',
        { restorePointId }
      );
      
      // Proceed with campaign creation
      operationTracker.addLog(operationId, 'info', 'Creating new campaign');
      
      // Copy campaign settings
      const newCampaign = {
        name: config.name,
        status: sourceCampaign.status,
        advertisingChannelType: sourceCampaign.advertisingChannelType,
        biddingStrategy: sourceCampaign.biddingStrategy,
        campaignBudget: sourceCampaign.campaignBudget,
        networkSettings: sourceCampaign.networkSettings,
        targetingSettings: sourceCampaign.targetingSettings
      };
      
      // Make campaign creation request
      const createCampaignToken = networkMonitoring.startOperation(
        'google_ads_api',
        'CREATE_CAMPAIGN',
        { customerId, campaignData: newCampaign }
      );
      
      const createCampaignResponse = await this.makeRequest(
        customerId,
        'campaigns:mutate',
        {
          method: 'POST',
          body: JSON.stringify({
            operations: [
              {
                create: newCampaign
              }
            ]
          })
        }
      );
      
      networkMonitoring.endOperation(createCampaignToken);
      
      const newCampaignId = createCampaignResponse?.results?.[0]?.resourceName?.split('/')?.[3];
      
      if (!newCampaignId) {
        throw new Error('Failed to create new campaign');
      }
      
      operationTracker.addLog(
        operationId,
        'info',
        `Campaign created with ID: ${newCampaignId}`,
        { newCampaignId }
      );
      
      // Create restore point after campaign creation
      const postCampaignRestorePointId = operationTracker.createRestorePoint(
        operationId,
        'campaign_creation',
        { campaignId: newCampaignId },
        {
          name: 'Post-Campaign Creation',
          description: `State after creating campaign "${config.name}"`,
          resourceId: newCampaignId,
          resourceType: 'campaign'
        }
      );
      
      // Clone ad groups and keywords
      operationTracker.addLog(operationId, 'info', 'Cloning ad groups and keywords');
      
      // Track progress
      let processedAdGroups = 0;
      const totalAdGroups = sourceCampaignData.adGroups.length;
      
      for (const adGroup of sourceCampaignData.adGroups) {
        // Create ad group
        const newAdGroup = {
          name: adGroup.name,
          campaign: `customers/${customerId}/campaigns/${newCampaignId}`,
          status: adGroup.status,
          type: adGroup.type,
          cpcBidMicros: adGroup.cpcBidMicros
        };
        
        const createAdGroupToken = networkMonitoring.startOperation(
          'google_ads_api',
          'CREATE_AD_GROUP',
          { customerId, adGroupData: newAdGroup }
        );
        
        const createAdGroupResponse = await this.makeRequest(
          customerId,
          'adGroups:mutate',
          {
            method: 'POST',
            body: JSON.stringify({
              operations: [
                {
                  create: newAdGroup
                }
              ]
            })
          }
        );
        
        networkMonitoring.endOperation(createAdGroupToken);
        
        const newAdGroupId = createAdGroupResponse?.results?.[0]?.resourceName?.split('/')?.[3];
        
        if (!newAdGroupId) {
          throw new Error(`Failed to create new ad group: ${adGroup.name}`);
        }
        
        // Create restore point after ad group creation
        operationTracker.createRestorePoint(
          operationId,
          'ad_group_creation',
          { adGroupId: newAdGroupId },
          {
            name: 'Post-Ad Group Creation',
            description: `State after creating ad group "${adGroup.name}"`,
            resourceId: newAdGroupId,
            resourceType: 'adGroup'
          }
        );
        
        // Clone keywords with new match type
        if (adGroup.keywords && adGroup.keywords.length > 0) {
          const createKeywordsToken = networkMonitoring.startOperation(
            'google_ads_api',
            'CREATE_KEYWORDS',
            { customerId, adGroupId: newAdGroupId, keywordsCount: adGroup.keywords.length }
          );
          
          const keywordOperations = adGroup.keywords.map(keyword => ({
            create: {
              adGroup: `customers/${customerId}/adGroups/${newAdGroupId}`,
              status: keyword.status,
              keyword: {
                text: keyword.text,
                matchType: config.matchType
              }
            }
          }));
          
          const createKeywordsResponse = await this.makeRequest(
            customerId,
            'adGroupCriteria:mutate',
            {
              method: 'POST',
              body: JSON.stringify({
                operations: keywordOperations
              })
            }
          );
          
          networkMonitoring.endOperation(createKeywordsToken);
          
          const newKeywordIds = createKeywordsResponse?.results?.map(
            result => result.resourceName
          ) || [];
          
          // Create restore point after keyword creation
          operationTracker.createRestorePoint(
            operationId,
            'keyword_creation',
            { keywordIds: newKeywordIds },
            {
              name: 'Post-Keywords Creation',
              description: `State after creating ${newKeywordIds.length} keywords`,
              resourceId: newAdGroupId,
              resourceType: 'keywords'
            }
          );
          
          // Create negative exact match keywords if requested
          if (config.createNegativeExactKeywords && config.matchType !== 'EXACT') {
            const exactKeywords = adGroup.keywords.filter(
              keyword => keyword.matchType === 'EXACT'
            );
            
            if (exactKeywords.length > 0) {
              const createNegativesToken = networkMonitoring.startOperation(
                'google_ads_api',
                'CREATE_NEGATIVE_KEYWORDS',
                { customerId, adGroupId: newAdGroupId, keywordsCount: exactKeywords.length }
              );
              
              const negativeOperations = exactKeywords.map(keyword => ({
                create: {
                  adGroup: `customers/${customerId}/adGroups/${newAdGroupId}`,
                  status: 'ENABLED',
                  negative: true,
                  keyword: {
                    text: keyword.text,
                    matchType: 'EXACT'
                  }
                }
              }));
              
              const createNegativesResponse = await this.makeRequest(
                customerId,
                'adGroupCriteria:mutate',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    operations: negativeOperations
                  })
                }
              );
              
              networkMonitoring.endOperation(createNegativesToken);
              
              const newNegativeKeywordIds = createNegativesResponse?.results?.map(
                result => result.resourceName
              ) || [];
              
              // Create restore point after negative keyword creation
              operationTracker.createRestorePoint(
                operationId,
                'keyword_creation',
                { keywordIds: newNegativeKeywordIds },
                {
                  name: 'Post-Negative Keywords Creation',
                  description: `State after creating ${newNegativeKeywordIds.length} negative keywords`,
                  resourceId: newAdGroupId,
                  resourceType: 'negativeKeywords'
                }
              );
            }
          }
        }
        
        // Update progress
        processedAdGroups++;
        const progress = Math.floor((processedAdGroups / totalAdGroups) * 100);
        operationTracker.updateProgress(operationId, progress);
      }
      
      // Complete operation
      operationTracker.completeOperation(operationId);
      
      return {
        success: true,
        message: `Campaign "${config.name}" created successfully`,
        newCampaignId,
        operationId,
        restorePointId: postCampaignRestorePointId
      };
      
    } catch (error) {
      console.error('Error in copyCampaign:', error);
      
      // Log error details
      operationTracker.addLog(
        operationId,
        'error',
        `Campaign clone failed: ${error.message}`,
        {
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code,
            details: error.details
          }
        }
      );
      
      // Mark operation as failed
      operationTracker.failOperation(operationId, {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      return {
        success: false,
        message: `Failed to clone campaign: ${error.message}`,
        operationId
      };
    }
  }

  /**
   * Copy multiple campaigns in bulk with efficient chunking
   * @param customerId Google Ads customer ID
   * @param campaignIds Array of campaign IDs to copy
   * @param config Configuration options for the copy
   * @param operationId Optional operation ID for tracking
   * @param chunkSize Size of each chunk for batch processing (default: 5)
   */
  async bulkCopyCampaigns(
    customerId: string,
    campaignIds: string[],
    config: {
      nameTemplate: string;
      matchType: 'BROAD' | 'PHRASE';
      createNegativeExactKeywords: boolean;
    },
    operationId?: string,
    chunkSize: number = 5
  ): Promise<{
    success: boolean;
    message: string;
    completedCampaigns: Array<{id: string, newCampaignId: string}>;
    failedCampaigns: Array<{id: string, error: string}>;
    operationId: string;
  }> {
    // Create a new operation ID if not provided
    if (!operationId) {
      operationId = operationTracker.createOperation('bulk_campaign_clone', {
        customerId,
        campaignIds,
        ...config
      });
    }
    
    try {
      operationTracker.startOperation(operationId);
      
      // Add initial log
      operationTracker.addLog(
        operationId,
        'info',
        `Starting bulk campaign clone operation: ${campaignIds.length} campaigns`,
        { 
          campaignCount: campaignIds.length,
          chunkSize,
          config 
        }
      );
      
      // Create restore point before bulk operation
      const restorePointId = operationTracker.createRestorePoint(
        operationId,
        'pre_bulk_campaign_clone',
        { customerId, campaignIds },
        {
          name: 'Pre-Bulk Campaign Clone',
          description: `State before cloning ${campaignIds.length} campaigns`
        }
      );
      
      // Track results
      const completedCampaigns: Array<{id: string, newCampaignId: string}> = [];
      const failedCampaigns: Array<{id: string, error: string}> = [];
      
      // Process in chunks
      const chunks = [];
      for (let i = 0; i < campaignIds.length; i += chunkSize) {
        chunks.push(campaignIds.slice(i, i + chunkSize));
      }
      
      operationTracker.addLog(
        operationId,
        'info',
        `Split operation into ${chunks.length} chunks of up to ${chunkSize} campaigns each`,
        { chunkCount: chunks.length }
      );
      
      // Process each chunk sequentially
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const chunkStartMsg = `Processing chunk ${chunkIndex + 1} of ${chunks.length} (${chunk.length} campaigns)`;
        operationTracker.addLog(operationId, 'info', chunkStartMsg);
        
        // Create a batch of promises for parallel processing within the chunk
        const chunkPromises = chunk.map(campaignId => {
          return new Promise<{id: string, newCampaignId?: string, error?: string}>(async (resolve) => {
            try {
              // Fetch campaign data to get the name
              const campaignResponse = await this.makeRequest(
                customerId,
                'campaigns:search',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    query: `
                      SELECT 
                        campaign.id,
                        campaign.name
                      FROM campaign
                      WHERE campaign.id = '${campaignId}'
                    `
                  }),
                  operationId,
                  label: `Fetch campaign ${campaignId} data`
                }
              );
              
              if (!campaignResponse?.results?.[0]) {
                throw new Error(`Campaign not found: ${campaignId}`);
              }
              
              const campaignData = campaignResponse.results[0].campaign;
              
              // Generate name for this campaign based on template
              let newName = campaignData.name;
              if (config.nameTemplate.includes('{original}')) {
                newName = config.nameTemplate.replace('{original}', campaignData.name);
              } else if (config.nameTemplate !== '{original}') {
                newName = config.nameTemplate;
              } else {
                // Apply default naming convention based on match type
                if (config.matchType === 'BROAD') {
                  newName = newName.replace('Exact', 'Broad').replace('EXACT', 'BROAD');
                } else if (config.matchType === 'PHRASE') {
                  newName = newName.replace('Exact', 'Phrase').replace('EXACT', 'PHRASE');
                }
                
                // If the name didn't change with replacements, append the match type
                if (newName === campaignData.name) {
                  newName = `${campaignData.name} - ${config.matchType === 'BROAD' ? 'Broad' : 'Phrase'} Match`;
                }
              }
              
              // Copy the campaign
              const result = await this.copyCampaign(
                customerId,
                campaignId,
                {
                  name: newName,
                  matchType: config.matchType,
                  createNegativeExactKeywords: config.createNegativeExactKeywords
                },
                operationId
              );
              
              resolve({ 
                id: campaignId, 
                newCampaignId: result.newCampaignId 
              });
              
            } catch (error) {
              operationTracker.addLog(
                operationId,
                'error',
                `Failed to copy campaign ${campaignId}: ${error.message}`,
                { error }
              );
              
              resolve({ 
                id: campaignId, 
                error: error.message || 'Unknown error'
              });
            }
          });
        });
        
        // Process chunk with rate limiting
        const chunkResults = await rateLimiter.batchEnqueue(
          // Convert promises to functions for rate limiter
          chunkPromises.map(promise => () => promise),
          {
            operationId,
            batchLabel: `Chunk ${chunkIndex + 1}/${chunks.length}`,
            concurrency: Math.min(chunk.length, 3) // Limit concurrent executions within a chunk
          }
        );
        
        // Process results from this chunk
        for (const result of chunkResults) {
          if (result.newCampaignId) {
            completedCampaigns.push({
              id: result.id,
              newCampaignId: result.newCampaignId
            });
          } else if (result.error) {
            failedCampaigns.push({
              id: result.id,
              error: result.error
            });
          }
        }
        
        // Update overall progress
        const processedCount = (chunkIndex + 1) * chunkSize;
        const progress = Math.min(Math.round((processedCount / campaignIds.length) * 100), 100);
        operationTracker.updateProgress(operationId, progress);
        
        const chunkCompleteMsg = `Completed chunk ${chunkIndex + 1}/${chunks.length}: ${chunkResults.length} campaigns processed`;
        operationTracker.addLog(operationId, 'info', chunkCompleteMsg, {
          successful: chunkResults.filter(r => r.newCampaignId).length,
          failed: chunkResults.filter(r => r.error).length
        });
      }
      
      // Complete operation
      const totalSuccessful = completedCampaigns.length;
      const totalFailed = failedCampaigns.length;
      
      operationTracker.addLog(
        operationId,
        'info',
        `Bulk campaign clone operation completed: ${totalSuccessful} successful, ${totalFailed} failed`,
        { 
          successRate: `${Math.round((totalSuccessful / campaignIds.length) * 100)}%`,
          restorePointId
        }
      );
      
      operationTracker.completeOperation(operationId);
      
      return {
        success: totalFailed === 0,
        message: `Processed ${campaignIds.length} campaigns: ${totalSuccessful} successful, ${totalFailed} failed`,
        completedCampaigns,
        failedCampaigns,
        operationId
      };
      
    } catch (error) {
      operationTracker.addLog(
        operationId,
        'error',
        `Bulk campaign clone operation failed: ${error.message}`,
        { error }
      );
      
      operationTracker.failOperation(operationId, error);
      
      throw error;
    }
  }

}

export const googleAdsApi = GoogleAdsApiClient.getInstance({
  developerToken: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  refreshToken: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN,
  loginCustomerId: import.meta.env.VITE_GOOGLE_LOGIN_CUSTOMER_ID
});