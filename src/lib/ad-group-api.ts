import { supabase } from './supabase';

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  type: 'SEARCH' | 'DISPLAY' | 'VIDEO';
  cpcBidMicros?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  adGroupId: string;
  type: 'TEXT' | 'RESPONSIVE_SEARCH' | 'IMAGE' | 'VIDEO';
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  finalUrls: string[];
  headlines?: string[];
  descriptions?: string[];
  path1?: string;
  path2?: string;
  imageUrl?: string;
  videoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdExtension {
  id: string;
  adGroupId: string;
  type: 'SITELINK' | 'CALLOUT' | 'STRUCTURED_SNIPPET' | 'CALL' | 'PRICE';
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  text: string;
  startDate?: string;
  endDate?: string;
  schedules?: {
    dayOfWeek: number;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdGroupInput {
  campaignId: string;
  name: string;
  type: AdGroup['type'];
  cpcBidMicros?: string;
  labels?: string[];
}

export interface UpdateAdGroupInput {
  name?: string;
  status?: AdGroup['status'];
  cpcBidMicros?: string;
  labels?: string[];
}

export interface CreateAdInput {
  adGroupId: string;
  type: Ad['type'];
  finalUrls: string[];
  headlines?: string[];
  descriptions?: string[];
  path1?: string;
  path2?: string;
  imageUrl?: string;
  videoId?: string;
}

export interface UpdateAdInput {
  status?: Ad['status'];
  finalUrls?: string[];
  headlines?: string[];
  descriptions?: string[];
  path1?: string;
  path2?: string;
  imageUrl?: string;
  videoId?: string;
}

export interface CreateAdExtensionInput {
  adGroupId: string;
  type: AdExtension['type'];
  text: string;
  startDate?: string;
  endDate?: string;
  schedules?: AdExtension['schedules'];
}

export interface UpdateAdExtensionInput {
  status?: AdExtension['status'];
  text?: string;
  startDate?: string;
  endDate?: string;
  schedules?: AdExtension['schedules'];
}

class AdGroupApi {
  private static instance: AdGroupApi;

  private constructor() {}

  static getInstance(): AdGroupApi {
    if (!AdGroupApi.instance) {
      AdGroupApi.instance = new AdGroupApi();
    }
    return AdGroupApi.instance;
  }

  async createAdGroup(input: CreateAdGroupInput): Promise<AdGroup> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ad_groups')
        .insert({
          campaign_id: input.campaignId,
          name: input.name,
          type: input.type,
          status: 'ENABLED',
          cpc_bid_micros: input.cpcBidMicros,
          labels: input.labels || []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.ad_group_id,
        campaignId: data.campaign_id,
        name: data.name,
        status: data.status,
        type: data.type,
        cpcBidMicros: data.cpc_bid_micros,
        labels: data.labels,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating ad group:', error);
      throw error;
    }
  }

  async updateAdGroup(id: string, input: UpdateAdGroupInput): Promise<AdGroup> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.status) updates.status = input.status;
      if (input.cpcBidMicros) updates.cpc_bid_micros = input.cpcBidMicros;
      if (input.labels) updates.labels = input.labels;

      const { data, error } = await supabase
        .from('ad_groups')
        .update(updates)
        .eq('ad_group_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.ad_group_id,
        campaignId: data.campaign_id,
        name: data.name,
        status: data.status,
        type: data.type,
        cpcBidMicros: data.cpc_bid_micros,
        labels: data.labels,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating ad group:', error);
      throw error;
    }
  }

  async createAd(input: CreateAdInput): Promise<Ad> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ads')
        .insert({
          ad_group_id: input.adGroupId,
          type: input.type,
          status: 'ENABLED',
          final_urls: input.finalUrls,
          headlines: input.headlines,
          descriptions: input.descriptions,
          path1: input.path1,
          path2: input.path2,
          image_url: input.imageUrl,
          video_id: input.videoId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.ad_id,
        adGroupId: data.ad_group_id,
        type: data.type,
        status: data.status,
        finalUrls: data.final_urls,
        headlines: data.headlines,
        descriptions: data.descriptions,
        path1: data.path1,
        path2: data.path2,
        imageUrl: data.image_url,
        videoId: data.video_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  }

  async updateAd(id: string, input: UpdateAdInput): Promise<Ad> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.status) updates.status = input.status;
      if (input.finalUrls) updates.final_urls = input.finalUrls;
      if (input.headlines) updates.headlines = input.headlines;
      if (input.descriptions) updates.descriptions = input.descriptions;
      if (input.path1) updates.path1 = input.path1;
      if (input.path2) updates.path2 = input.path2;
      if (input.imageUrl) updates.image_url = input.imageUrl;
      if (input.videoId) updates.video_id = input.videoId;

      const { data, error } = await supabase
        .from('ads')
        .update(updates)
        .eq('ad_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.ad_id,
        adGroupId: data.ad_group_id,
        type: data.type,
        status: data.status,
        finalUrls: data.final_urls,
        headlines: data.headlines,
        descriptions: data.descriptions,
        path1: data.path1,
        path2: data.path2,
        imageUrl: data.image_url,
        videoId: data.video_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  async createAdExtension(input: CreateAdExtensionInput): Promise<AdExtension> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ad_extensions')
        .insert({
          ad_group_id: input.adGroupId,
          type: input.type,
          status: 'ENABLED',
          text: input.text,
          start_date: input.startDate,
          end_date: input.endDate,
          schedules: input.schedules
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.extension_id,
        adGroupId: data.ad_group_id,
        type: data.type,
        status: data.status,
        text: data.text,
        startDate: data.start_date,
        endDate: data.end_date,
        schedules: data.schedules,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating ad extension:', error);
      throw error;
    }
  }

  async updateAdExtension(id: string, input: UpdateAdExtensionInput): Promise<AdExtension> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.status) updates.status = input.status;
      if (input.text) updates.text = input.text;
      if (input.startDate) updates.start_date = input.startDate;
      if (input.endDate) updates.end_date = input.endDate;
      if (input.schedules) updates.schedules = input.schedules;

      const { data, error } = await supabase
        .from('ad_extensions')
        .update(updates)
        .eq('extension_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.extension_id,
        adGroupId: data.ad_group_id,
        type: data.type,
        status: data.status,
        text: data.text,
        startDate: data.start_date,
        endDate: data.end_date,
        schedules: data.schedules,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating ad extension:', error);
      throw error;
    }
  }

  async listAdGroups(campaignId: string): Promise<AdGroup[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ad_groups')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (error) throw error;

      return data.map(group => ({
        id: group.ad_group_id,
        campaignId: group.campaign_id,
        name: group.name,
        status: group.status,
        type: group.type,
        cpcBidMicros: group.cpc_bid_micros,
        labels: group.labels,
        createdAt: group.created_at,
        updatedAt: group.updated_at
      }));
    } catch (error) {
      console.error('Error listing ad groups:', error);
      throw error;
    }
  }

  async listAds(adGroupId: string): Promise<Ad[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('ad_group_id', adGroupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(ad => ({
        id: ad.ad_id,
        adGroupId: ad.ad_group_id,
        type: ad.type,
        status: ad.status,
        finalUrls: ad.final_urls,
        headlines: ad.headlines,
        descriptions: ad.descriptions,
        path1: ad.path1,
        path2: ad.path2,
        imageUrl: ad.image_url,
        videoId: ad.video_id,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at
      }));
    } catch (error) {
      console.error('Error listing ads:', error);
      throw error;
    }
  }

  async listAdExtensions(adGroupId: string): Promise<AdExtension[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ad_extensions')
        .select('*')
        .eq('ad_group_id', adGroupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(extension => ({
        id: extension.extension_id,
        adGroupId: extension.ad_group_id,
        type: extension.type,
        status: extension.status,
        text: extension.text,
        startDate: extension.start_date,
        endDate: extension.end_date,
        schedules: extension.schedules,
        createdAt: extension.created_at,
        updatedAt: extension.updated_at
      }));
    } catch (error) {
      console.error('Error listing ad extensions:', error);
      throw error;
    }
  }
}

export const adGroupApi = AdGroupApi.getInstance();