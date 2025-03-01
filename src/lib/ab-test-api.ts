import { supabase } from './supabase';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'BIDDING_STRATEGY' | 'AD_COPY' | 'TARGETING' | 'BUDGET';
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  startDate?: string;
  endDate?: string;
  durationDays: number;
  confidenceLevel: number;
  winningVariantId?: string;
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    revenue?: number;
  };
  variants: ABTestVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ABTestVariant {
  id: string;
  testId: string;
  campaignId: string;
  name: string;
  description: string;
  isControl: boolean;
  configuration: Record<string, any>;
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    revenue?: number;
    ctr?: number;
    cpc?: number;
    conversionRate?: number;
    roas?: number;
  };
}

export interface CreateABTestInput {
  name: string;
  description?: string;
  type: ABTest['type'];
  durationDays: number;
  confidenceLevel?: number;
  variants: {
    name: string;
    description?: string;
    campaignId: string;
    isControl?: boolean;
    configuration: Record<string, any>;
  }[];
}

export interface UpdateABTestInput {
  name?: string;
  description?: string;
  status?: ABTest['status'];
  durationDays?: number;
  confidenceLevel?: number;
  winningVariantId?: string;
}

class ABTestApi {
  private static instance: ABTestApi;

  private constructor() {}

  static getInstance(): ABTestApi {
    if (!ABTestApi.instance) {
      ABTestApi.instance = new ABTestApi();
    }
    return ABTestApi.instance;
  }

  async createTest(input: CreateABTestInput): Promise<ABTest> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create test
      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          test_type: input.type,
          status: 'DRAFT',
          duration_days: input.durationDays,
          confidence_level: input.confidenceLevel || 0.95
        })
        .select()
        .single();

      if (testError) throw testError;

      // Create variants
      const variants = await Promise.all(
        input.variants.map(variant =>
          supabase
            .from('ab_test_variants')
            .insert({
              test_id: test.test_id,
              campaign_id: variant.campaignId,
              name: variant.name,
              description: variant.description,
              is_control: variant.isControl || false,
              configuration_json: variant.configuration
            })
            .select()
            .single()
        )
      );

      if (variants.some(v => v.error)) {
        throw new Error('Failed to create test variants');
      }

      return {
        id: test.test_id,
        name: test.name,
        description: test.description,
        type: test.test_type,
        status: test.status,
        startDate: test.start_date,
        endDate: test.end_date,
        durationDays: test.duration_days,
        confidenceLevel: test.confidence_level,
        winningVariantId: test.winning_variant_id,
        metrics: test.metrics_json,
        variants: variants.map(v => v.data).map(variant => ({
          id: variant.variant_id,
          testId: variant.test_id,
          campaignId: variant.campaign_id,
          name: variant.name,
          description: variant.description,
          isControl: variant.is_control,
          configuration: variant.configuration_json,
          metrics: variant.metrics_json
        })),
        createdAt: test.created_at,
        updatedAt: test.updated_at
      };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async updateTest(id: string, input: UpdateABTestInput): Promise<ABTest> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status) updates.status = input.status;
      if (input.durationDays) updates.duration_days = input.durationDays;
      if (input.confidenceLevel) updates.confidence_level = input.confidenceLevel;
      if (input.winningVariantId) updates.winning_variant_id = input.winningVariantId;

      const { data: test, error: testError } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('test_id', id)
        .select(`
          *,
          variants:ab_test_variants (*)
        `)
        .single();

      if (testError) throw testError;

      return {
        id: test.test_id,
        name: test.name,
        description: test.description,
        type: test.test_type,
        status: test.status,
        startDate: test.start_date,
        endDate: test.end_date,
        durationDays: test.duration_days,
        confidenceLevel: test.confidence_level,
        winningVariantId: test.winning_variant_id,
        metrics: test.metrics_json,
        variants: test.variants.map((variant: any) => ({
          id: variant.variant_id,
          testId: variant.test_id,
          campaignId: variant.campaign_id,
          name: variant.name,
          description: variant.description,
          isControl: variant.is_control,
          configuration: variant.configuration_json,
          metrics: variant.metrics_json
        })),
        createdAt: test.created_at,
        updatedAt: test.updated_at
      };
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw error;
    }
  }

  async startTest(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'RUNNING',
          start_date: new Date().toISOString()
        })
        .eq('test_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  async pauseTest(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'PAUSED'
        })
        .eq('test_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error pausing A/B test:', error);
      throw error;
    }
  }

  async completeTest(id: string, winningVariantId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'COMPLETED',
          end_date: new Date().toISOString(),
          winning_variant_id: winningVariantId
        })
        .eq('test_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing A/B test:', error);
      throw error;
    }
  }

  async listTests(): Promise<ABTest[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ab_tests')
        .select(`
          *,
          variants:ab_test_variants (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(test => ({
        id: test.test_id,
        name: test.name,
        description: test.description,
        type: test.test_type,
        status: test.status,
        startDate: test.start_date,
        endDate: test.end_date,
        durationDays: test.duration_days,
        confidenceLevel: test.confidence_level,
        winningVariantId: test.winning_variant_id,
        metrics: test.metrics_json,
        variants: test.variants.map((variant: any) => ({
          id: variant.variant_id,
          testId: variant.test_id,
          campaignId: variant.campaign_id,
          name: variant.name,
          description: variant.description,
          isControl: variant.is_control,
          configuration: variant.configuration_json,
          metrics: variant.metrics_json
        })),
        createdAt: test.created_at,
        updatedAt: test.updated_at
      }));
    } catch (error) {
      console.error('Error listing A/B tests:', error);
      throw error;
    }
  }

  async getTestDetails(id: string): Promise<ABTest> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('ab_tests')
        .select(`
          *,
          variants:ab_test_variants (*)
        `)
        .eq('test_id', id)
        .single();

      if (error) throw error;

      return {
        id: data.test_id,
        name: data.name,
        description: data.description,
        type: data.test_type,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        durationDays: data.duration_days,
        confidenceLevel: data.confidence_level,
        winningVariantId: data.winning_variant_id,
        metrics: data.metrics_json,
        variants: data.variants.map((variant: any) => ({
          id: variant.variant_id,
          testId: variant.test_id,
          campaignId: variant.campaign_id,
          name: variant.name,
          description: variant.description,
          isControl: variant.is_control,
          configuration: variant.configuration_json,
          metrics: variant.metrics_json
        })),
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error getting A/B test details:', error);
      throw error;
    }
  }
}

export const abTestApi = ABTestApi.getInstance();