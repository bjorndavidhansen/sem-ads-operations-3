import { supabase } from './supabase';

export interface ReportMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface ReportDimension {
  name: string;
  values: string[];
}

export interface ReportFilter {
  dimension: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | [number, number];
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  dateRange: {
    start: string;
    end: string;
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    recipients: string[];
  };
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportData {
  dimensions: Record<string, string[]>;
  metrics: Record<string, number[]>;
  totals: Record<string, number>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CreateReportInput {
  name: string;
  description?: string;
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  dateRange: {
    start: string;
    end: string;
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    recipients: string[];
  };
}

class ReportApi {
  private static instance: ReportApi;

  private constructor() {}

  static getInstance(): ReportApi {
    if (!ReportApi.instance) {
      ReportApi.instance = new ReportApi();
    }
    return ReportApi.instance;
  }

  async createReport(input: CreateReportInput): Promise<Report> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          metrics: input.metrics,
          dimensions: input.dimensions,
          filters: input.filters,
          date_range: input.dateRange,
          schedule: input.schedule
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.report_id,
        name: data.name,
        description: data.description,
        metrics: data.metrics,
        dimensions: data.dimensions,
        filters: data.filters,
        dateRange: data.date_range,
        schedule: data.schedule,
        lastRun: data.last_run,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async updateReport(id: string, input: Partial<CreateReportInput>): Promise<Report> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.metrics) updates.metrics = input.metrics;
      if (input.dimensions) updates.dimensions = input.dimensions;
      if (input.filters) updates.filters = input.filters;
      if (input.dateRange) updates.date_range = input.dateRange;
      if (input.schedule) updates.schedule = input.schedule;

      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('report_id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.report_id,
        name: data.name,
        description: data.description,
        metrics: data.metrics,
        dimensions: data.dimensions,
        filters: data.filters,
        dateRange: data.date_range,
        schedule: data.schedule,
        lastRun: data.last_run,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('report_id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  async listReports(): Promise<Report[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(report => ({
        id: report.report_id,
        name: report.name,
        description: report.description,
        metrics: report.metrics,
        dimensions: report.dimensions,
        filters: report.filters,
        dateRange: report.date_range,
        schedule: report.schedule,
        lastRun: report.last_run,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }));
    } catch (error) {
      console.error('Error listing reports:', error);
      throw error;
    }
  }

  async runReport(id: string): Promise<ReportData> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Get report configuration
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('report_id', id)
        .single();

      if (reportError) throw reportError;

      // Run report query
      const { data, error } = await supabase.rpc('run_report', {
        report_id: id,
        user_id: user.id
      });

      if (error) throw error;

      // Update last run time
      await supabase
        .from('reports')
        .update({ last_run: new Date().toISOString() })
        .eq('report_id', id);

      return {
        dimensions: data.dimensions,
        metrics: data.metrics,
        totals: data.totals,
        dateRange: report.date_range
      };
    } catch (error) {
      console.error('Error running report:', error);
      throw error;
    }
  }

  async getAvailableMetrics(): Promise<string[]> {
    return [
      'impressions',
      'clicks',
      'cost',
      'conversions',
      'conversion_value',
      'ctr',
      'cpc',
      'conversion_rate',
      'roas',
      'average_position',
      'impression_share',
      'budget_utilization'
    ];
  }

  async getAvailableDimensions(): Promise<string[]> {
    return [
      'campaign',
      'ad_group',
      'ad',
      'keyword',
      'device',
      'network',
      'day_of_week',
      'hour_of_day',
      'location',
      'audience'
    ];
  }
}

export const reportApi = ReportApi.getInstance();