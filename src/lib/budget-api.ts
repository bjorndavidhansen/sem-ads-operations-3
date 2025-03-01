import { supabase } from './supabase';

export interface BudgetPacing {
  id: string;
  campaignId: string;
  date: string;
  budgetAmount: number;
  actualSpend: number;
  projectedSpend: number;
  utilizationRate: number;
  daysRemaining: number;
  forecastedEndOfMonthSpend: number;
  paceStatus: 'UNDER_PACING' | 'ON_TRACK' | 'OVER_PACING';
}

export interface BudgetForecast {
  date: string;
  projectedSpend: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

class BudgetApi {
  private static instance: BudgetApi;

  private constructor() {}

  static getInstance(): BudgetApi {
    if (!BudgetApi.instance) {
      BudgetApi.instance = new BudgetApi();
    }
    return BudgetApi.instance;
  }

  async getBudgetPacing(campaignId: string): Promise<BudgetPacing> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('budget_pacing')
        .select(`
          *,
          campaign:campaigns (*)
        `)
        .eq('campaign_id', campaignId)
        .single();

      if (error) throw error;

      return {
        id: data.pacing_id,
        campaignId: data.campaign_id,
        date: data.date,
        budgetAmount: data.budget_amount,
        actualSpend: data.actual_spend,
        projectedSpend: data.projected_spend,
        utilizationRate: data.utilization_rate,
        daysRemaining: data.days_remaining,
        forecastedEndOfMonthSpend: data.forecasted_end_of_month_spend,
        paceStatus: data.pace_status
      };
    } catch (error) {
      console.error('Error getting budget pacing:', error);
      throw error;
    }
  }

  async getForecast(campaignId: string, days: number = 30): Promise<BudgetForecast[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('budget_forecasts')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: true })
        .limit(days);

      if (error) throw error;

      return data.map(forecast => ({
        date: forecast.date,
        projectedSpend: forecast.projected_spend,
        lowerBound: forecast.lower_bound,
        upperBound: forecast.upper_bound,
        confidence: forecast.confidence
      }));
    } catch (error) {
      console.error('Error getting budget forecast:', error);
      throw error;
    }
  }
}

export const budgetApi = BudgetApi.getInstance();