import { supabase } from './supabase';

export interface Keyword {
  id: string;
  adGroupId: string;
  text: string;
  matchType: 'EXACT' | 'PHRASE' | 'BROAD';
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  cpcBidMicros?: string;
  labels: string[];
  metrics?: {
    clicks: number;
    impressions: number;
    cost: number;
    conversions: number;
    averagePosition: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NegativeKeyword {
  id: string;
  adGroupId: string;
  text: string;
  matchType: 'EXACT' | 'PHRASE' | 'BROAD';
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeywordInput {
  adGroupId: string;
  text: string;
  matchType: Keyword['matchType'];
  cpcBidMicros?: string;
  labels?: string[];
}

export interface UpdateKeywordInput {
  text?: string;
  matchType?: Keyword['matchType'];
  status?: Keyword['status'];
  cpcBidMicros?: string;
  labels?: string[];
}

export interface CreateNegativeKeywordInput {
  adGroupId: string;
  text: string;
  matchType: NegativeKeyword['matchType'];
}

class KeywordApi {
  private static instance: KeywordApi;

  private constructor() {}

  static getInstance(): KeywordApi {
    if (!KeywordApi.instance) {
      KeywordApi.instance = new KeywordApi();
    }
    return KeywordApi.instance;
  }

  async createKeyword(input: CreateKeywordInput): Promise<Keyword> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('keywords')
        .insert({
          ad_group_id: input.adGroupId,
          text: input.text,
          match_type: input.matchType,
          status: 'ENABLED',
          cpc_bid_micros: input.cpcBidMicros,
          labels: input.labels || []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.keyword_id,
        adGroupId: data.ad_group_id,
        text: data.text,
        matchType: data.match_type,
        status: data.status,
        cpcBidMicros: data.cpc_bid_micros,
        labels: data.labels,
        metrics: data.metrics_json,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating keyword:', error);
      throw error;
    }
  }

  async updateKeyword(id: string, input: UpdateKeywordInput): Promise<Keyword> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.text) updates.text = input.text;
      if (input.matchType) updates.match_type = input.matchType;
      if (input.status) updates.status = input.status;
      if (input.cpcBidMicros) updates.cpc_bid_micros = input.cpcBidMicros;
      if (input.labels) updates.labels = input.labels;

      const { data, error } = await supabase
        .from('keywords')
        .update(updates)
        .eq('keyword_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.keyword_id,
        adGroupId: data.ad_group_id,
        text: data.text,
        matchType: data.match_type,
        status: data.status,
        cpcBidMicros: data.cpc_bid_micros,
        labels: data.labels,
        metrics: data.metrics_json,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating keyword:', error);
      throw error;
    }
  }

  async createNegativeKeyword(input: CreateNegativeKeywordInput): Promise<NegativeKeyword> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('negative_keywords')
        .insert({
          ad_group_id: input.adGroupId,
          text: input.text,
          match_type: input.matchType
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.negative_keyword_id,
        adGroupId: data.ad_group_id,
        text: data.text,
        matchType: data.match_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating negative keyword:', error);
      throw error;
    }
  }

  async deleteNegativeKeyword(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('negative_keywords')
        .delete()
        .eq('negative_keyword_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting negative keyword:', error);
      throw error;
    }
  }

  async listKeywords(adGroupId: string): Promise<Keyword[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('ad_group_id', adGroupId)
        .order('text');

      if (error) throw error;

      return data.map(keyword => ({
        id: keyword.keyword_id,
        adGroupId: keyword.ad_group_id,
        text: keyword.text,
        matchType: keyword.match_type,
        status: keyword.status,
        cpcBidMicros: keyword.cpc_bid_micros,
        labels: keyword.labels,
        metrics: keyword.metrics_json,
        createdAt: keyword.created_at,
        updatedAt: keyword.updated_at
      }));
    } catch (error) {
      console.error('Error listing keywords:', error);
      throw error;
    }
  }

  async listNegativeKeywords(adGroupId: string): Promise<NegativeKeyword[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('negative_keywords')
        .select('*')
        .eq('ad_group_id', adGroupId)
        .order('text');

      if (error) throw error;

      return data.map(keyword => ({
        id: keyword.negative_keyword_id,
        adGroupId: keyword.ad_group_id,
        text: keyword.text,
        matchType: keyword.match_type,
        createdAt: keyword.created_at,
        updatedAt: keyword.updated_at
      }));
    } catch (error) {
      console.error('Error listing negative keywords:', error);
      throw error;
    }
  }
}

export const keywordApi = KeywordApi.getInstance();