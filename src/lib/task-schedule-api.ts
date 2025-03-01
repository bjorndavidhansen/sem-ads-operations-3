import { supabase } from './supabase';
import { TaskTemplate } from './task-template-api';

export interface TaskSchedule {
  id: string;
  name: string;
  description: string;
  template: TaskTemplate;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskScheduleInput {
  name: string;
  description?: string;
  templateId: string;
  cronExpression: string;
  timezone?: string;
  configuration?: Record<string, any>;
}

export interface UpdateTaskScheduleInput {
  name?: string;
  description?: string;
  cronExpression?: string;
  timezone?: string;
  isActive?: boolean;
  configuration?: Record<string, any>;
}

class TaskScheduleApi {
  private static instance: TaskScheduleApi;

  private constructor() {}

  static getInstance(): TaskScheduleApi {
    if (!TaskScheduleApi.instance) {
      TaskScheduleApi.instance = new TaskScheduleApi();
    }
    return TaskScheduleApi.instance;
  }

  async createSchedule(input: CreateTaskScheduleInput): Promise<TaskSchedule> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('task_schedules')
        .insert({
          user_id: user.id,
          template_id: input.templateId,
          name: input.name,
          description: input.description,
          cron_expression: input.cronExpression,
          timezone: input.timezone || 'UTC',
          configuration_json: input.configuration || {}
        })
        .select(`
          *,
          template:task_templates (*)
        `)
        .single();

      if (error) throw error;

      return this.mapScheduleData(data);
    } catch (error) {
      console.error('Error creating task schedule:', error);
      throw error;
    }
  }

  async updateSchedule(id: string, input: UpdateTaskScheduleInput): Promise<TaskSchedule> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.cronExpression) updates.cron_expression = input.cronExpression;
      if (input.timezone) updates.timezone = input.timezone;
      if (input.isActive !== undefined) updates.is_active = input.isActive;
      if (input.configuration) updates.configuration_json = input.configuration;

      const { data, error } = await supabase
        .from('task_schedules')
        .update(updates)
        .eq('schedule_id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          template:task_templates (*)
        `)
        .single();

      if (error) throw error;

      return this.mapScheduleData(data);
    } catch (error) {
      console.error('Error updating task schedule:', error);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('task_schedules')
        .delete()
        .eq('schedule_id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task schedule:', error);
      throw error;
    }
  }

  async listSchedules(): Promise<TaskSchedule[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('task_schedules')
        .select(`
          *,
          template:task_templates (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.mapScheduleData);
    } catch (error) {
      console.error('Error listing task schedules:', error);
      throw error;
    }
  }

  private mapScheduleData(data: any): TaskSchedule {
    return {
      id: data.schedule_id,
      name: data.name,
      description: data.description,
      template: {
        id: data.template.template_id,
        name: data.template.name,
        description: data.template.description,
        type: data.template.task_type,
        configuration: data.template.configuration_json,
        createdAt: data.template.created_at,
        updatedAt: data.template.updated_at
      },
      cronExpression: data.cron_expression,
      timezone: data.timezone,
      isActive: data.is_active,
      lastRun: data.last_run,
      nextRun: data.next_run,
      configuration: data.configuration_json,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const taskScheduleApi = TaskScheduleApi.getInstance();