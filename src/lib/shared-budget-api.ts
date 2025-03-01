import { supabase } from './supabase';

export interface SharedBudget {
  id: string;
  name: string;
  amountMicros: string;
  customerAccountId: string;
  campaigns: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSharedBudgetInput {
  name: string;
  amount: number;
  customerAccountId: string;
  campaignIds?: string[];
}

export interface UpdateSharedBudgetInput {
  name?: string;
  amount?: number;
  campaignIds?: string[];
}

class SharedBudgetApi {
  private static instance: SharedBudgetApi;

  private constructor() {}

  static getInstance(): SharedBudgetApi {
    if (!SharedBudgetApi.instance) {
      SharedBudgetApi.instance = new SharedBudgetApi();
    }
    return SharedBudgetApi.instance;
  }

  async createSharedBudget(input: CreateSharedBudgetInput): Promise<SharedBudget> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('shared_budgets')
        .insert({
          name: input.name,
          amount_micros: (input.amount * 1_000_000).toString(),
          customer_id: input.customerAccountId,
          campaign_ids: input.campaignIds || []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        amountMicros: data.amount_micros,
        customerAccountId: data.customer_id,
        campaigns: data.campaign_ids,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating shared budget:', error);
      throw error;
    }
  }

  async updateSharedBudget(id: string, input: UpdateSharedBudgetInput): Promise<SharedBudget> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.amount) updates.amount_micros = (input.amount * 1_000_000).toString();
      if (input.campaignIds) updates.campaign_ids = input.campaignIds;

      const { data, error } = await supabase
        .from('shared_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        amountMicros: data.amount_micros,
        customerAccountId: data.customer_id,
        campaigns: data.campaign_ids,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating shared budget:', error);
      throw error;
    }
  }

  async deleteSharedBudget(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('shared_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting shared budget:', error);
      throw error;
    }
  }

  async listSharedBudgets(customerAccountId: string): Promise<SharedBudget[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('shared_budgets')
        .select('*')
        .eq('customer_id', customerAccountId)
        .order('name');

      if (error) throw error;

      return data.map(budget => ({
        id: budget.id,
        name: budget.name,
        amountMicros: budget.amount_micros,
        customerAccountId: budget.customer_id,
        campaigns: budget.campaign_ids || [],
        createdAt: budget.created_at,
        updatedAt: budget.updated_at
      }));
    } catch (error) {
      console.error('Error listing shared budgets:', error);
      throw error;
    }
  }
}

export const sharedBudgetApi = SharedBudgetApi.getInstance();