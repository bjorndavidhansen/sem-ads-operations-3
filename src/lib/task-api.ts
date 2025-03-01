import { supabase } from './supabase';

export interface AutomationTask {
  id: string;
  type: 'COPY_CAMPAIGN' | 'CONVERT_MATCH_TYPES' | 'CREATE_BSP';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: string;
  endTime?: string;
  requestPayload: any;
  resultPayload?: any;
  errorMessage?: string;
}

class TaskApi {
  private static instance: TaskApi;

  private constructor() {}

  static getInstance(): TaskApi {
    if (!TaskApi.instance) {
      TaskApi.instance = new TaskApi();
    }
    return TaskApi.instance;
  }

  async listTasks(): Promise<AutomationTask[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(task => ({
        id: task.automation_task_id,
        type: task.task_type,
        status: task.task_status,
        startTime: task.start_time,
        endTime: task.end_time,
        requestPayload: task.request_payload_json,
        resultPayload: task.result_payload_json,
        errorMessage: task.error_message
      }));
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  }

  async getTaskDetails(taskId: string): Promise<AutomationTask> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('automation_tasks')
        .select(`
          *,
          campaign_modifications (
            campaign_modification_id,
            original_campaign_id,
            new_campaign_id,
            modification_type,
            modification_details_json,
            match_type_conversions (*)
          )
        `)
        .eq('automation_task_id', taskId)
        .single();

      if (error) throw error;

      return {
        id: data.automation_task_id,
        type: data.task_type,
        status: data.task_status,
        startTime: data.start_time,
        endTime: data.end_time,
        requestPayload: data.request_payload_json,
        resultPayload: data.result_payload_json,
        errorMessage: data.error_message
      };
    } catch (error) {
      console.error('Error getting task details:', error);
      throw error;
    }
  }
}

export const taskApi = TaskApi.getInstance();