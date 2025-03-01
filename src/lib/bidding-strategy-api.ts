import { supabase } from './supabase';

export interface BiddingStrategy {
  id: string;
  name: string;
  type: 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MAXIMIZE_CONVERSION_VALUE' | 'MANUAL_CPC';
  targetCpa?: number;
  targetRoas?: number;
  campaigns: string[];
}

export interface CreateBiddingStrategyInput {
  name: string;
  type: BiddingStrategy['type'];
  targetCpa?: number;
  targetRoas?: number;
  campaignIds?: string[];
}

export interface UpdateBiddingStrategyInput {
  name?: string;
  targetCpa?: number;
  targetRoas?: number;
  campaignIds?: string[];
}

class BiddingStrategyApi {
  private static instance: BiddingStrategyApi;

  private constructor() {}

  static getInstance(): BiddingStrategyApi {
    if (!BiddingStrategyApi.instance) {
      BiddingStrategyApi.instance = new BiddingStrategyApi();
    }
    return BiddingStrategyApi.instance;
  }

  async createBiddingStrategy(accountId: string, input: CreateBiddingStrategyInput): Promise<BiddingStrategy> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bidding_strategy_portfolios')
        .insert({
          google_ads_account_id: accountId,
          bsp_name: input.name,
          bsp_type: input.type,
          bsp_configuration_json: {
            targetCpa: input.targetCpa,
            targetRoas: input.targetRoas,
            campaignIds: input.campaignIds || []
          }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.bidding_strategy_portfolio_id,
        name: data.bsp_name,
        type: data.bsp_type,
        targetCpa: data.bsp_configuration_json.targetCpa,
        targetRoas: data.bsp_configuration_json.targetRoas,
        campaigns: data.bsp_configuration_json.campaignIds
      };
    } catch (error) {
      console.error('Error creating bidding strategy:', error);
      throw error;
    }
  }

  async updateBiddingStrategy(id: string, input: UpdateBiddingStrategyInput): Promise<BiddingStrategy> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bidding_strategy_portfolios')
        .update({
          bsp_name: input.name,
          bsp_configuration_json: {
            targetCpa: input.targetCpa,
            targetRoas: input.targetRoas,
            campaignIds: input.campaignIds
          }
        })
        .eq('bidding_strategy_portfolio_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.bidding_strategy_portfolio_id,
        name: data.bsp_name,
        type: data.bsp_type,
        targetCpa: data.bsp_configuration_json.targetCpa,
        targetRoas: data.bsp_configuration_json.targetRoas,
        campaigns: data.bsp_configuration_json.campaignIds
      };
    } catch (error) {
      console.error('Error updating bidding strategy:', error);
      throw error;
    }
  }

  async deleteBiddingStrategy(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('bidding_strategy_portfolios')
        .delete()
        .eq('bidding_strategy_portfolio_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bidding strategy:', error);
      throw error;
    }
  }

  async listBiddingStrategies(accountId: string): Promise<BiddingStrategy[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('bidding_strategy_portfolios')
        .select('*')
        .eq('google_ads_account_id', accountId)
        .order('bsp_name');

      if (error) throw error;

      return data.map(bsp => ({
        id: bsp.bidding_strategy_portfolio_id,
        name: bsp.bsp_name,
        type: bsp.bsp_type,
        targetCpa: bsp.bsp_configuration_json.targetCpa,
        targetRoas: bsp.bsp_configuration_json.targetRoas,
        campaigns: bsp.bsp_configuration_json.campaignIds || []
      }));
    } catch (error) {
      console.error('Error listing bidding strategies:', error);
      throw error;
    }
  }
}

export const biddingStrategyApi = BiddingStrategyApi.getInstance();