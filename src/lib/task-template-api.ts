import { supabase } from './supabase';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: 'COPY_CAMPAIGN' | 'CONVERT_MATCH_TYPES' | 'CREATE_BSP';
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskTemplateInput {
  name: string;
  description: string;
  type: TaskTemplate['type'];
  configuration: Record<string, any>;
}

class TaskTemplateApi {
  private static instance: TaskTemplateApi;

  private constructor() {}

  static getInstance(): TaskTemplateApi {
    if (!TaskTemplateApi.instance) {
      TaskTemplateApi.instance = new TaskTemplateApi();
    }
    return TaskTemplateApi.instance;
  }

  async createTemplate(input: CreateTaskTemplateInput): Promise<TaskTemplate> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          task_type: input.type,
          configuration_json: input.configuration
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.template_id,
        name: data.name,
        description: data.description,
        type: data.task_type,
        configuration: data.configuration_json,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating task template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, input: Partial<CreateTaskTemplateInput>): Promise<TaskTemplate> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description) updates.description = input.description;
      if (input.type) updates.task_type = input.type;
      if (input.configuration) updates.configuration_json = input.configuration;

      const { data, error } = await supabase
        .from('task_templates')
        .update(updates)
        .eq('template_id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.template_id,
        name: data.name,
        description: data.description,
        type: data.task_type,
        configuration: data.configuration_json,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating task template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('template_id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task template:', error);
      throw error;
    }
  }

  async listTemplates(): Promise<TaskTemplate[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      return data.map(template => ({
        id: template.template_id,
        name: template.name,
        description: template.description,
        type: template.task_type,
        configuration: template.configuration_json,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }));
    } catch (error) {
      console.error('Error listing task templates:', error);
      throw error;
    }
  }
}

export const taskTemplateApi = TaskTemplateApi.getInstance();