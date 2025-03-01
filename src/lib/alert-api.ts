import { supabase } from './supabase';

export interface AlertThreshold {
  metric: 'CPC' | 'CTR' | 'CONVERSION_RATE' | 'COST' | 'BUDGET_UTILIZATION';
  condition: 'ABOVE' | 'BELOW';
  value: number;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface CampaignAlert {
  id: string;
  campaignId: string;
  type: 'PERFORMANCE' | 'BUDGET' | 'CONVERSION';
  status: 'ACTIVE' | 'DISMISSED';
  message: string;
  thresholds: AlertThreshold[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  campaignId: string;
  type: CampaignAlert['type'];
  thresholds: AlertThreshold[];
}

class AlertApi {
  private static instance: AlertApi;

  private constructor() {}

  static getInstance(): AlertApi {
    if (!AlertApi.instance) {
      AlertApi.instance = new AlertApi();
    }
    return AlertApi.instance;
  }

  async createAlert(input: CreateAlertInput): Promise<CampaignAlert> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('campaign_alerts')
        .insert({
          campaign_id: input.campaignId,
          alert_type: input.type,
          alert_status: 'ACTIVE',
          thresholds_json: input.thresholds
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.alert_id,
        campaignId: data.campaign_id,
        type: data.alert_type,
        status: data.alert_status,
        message: data.alert_message,
        thresholds: data.thresholds_json,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async dismissAlert(alertId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('campaign_alerts')
        .update({ alert_status: 'DISMISSED' })
        .eq('alert_id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  }

  async listAlerts(campaignId?: string): Promise<CampaignAlert[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('campaign_alerts')
        .select(`
          *,
          campaign:campaigns (*)
        `)
        .eq('alert_status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(alert => ({
        id: alert.alert_id,
        campaignId: alert.campaign_id,
        type: alert.alert_type,
        status: alert.alert_status,
        message: alert.alert_message,
        thresholds: alert.thresholds_json,
        createdAt: alert.created_at,
        updatedAt: alert.updated_at
      }));
    } catch (error) {
      console.error('Error listing alerts:', error);
      throw error;
    }
  }
}

export const alertApi = AlertApi.getInstance();