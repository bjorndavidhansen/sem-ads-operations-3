import { supabase } from './supabase';

export interface MatchTypeConversion {
  id: string;
  campaignId: string;
  keywordId: string;
  originalMatchType: 'EXACT' | 'PHRASE' | 'BROAD';
  newMatchType: 'EXACT' | 'PHRASE' | 'BROAD';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

class MatchTypeApi {
  private static instance: MatchTypeApi;

  private constructor() {}

  static getInstance(): MatchTypeApi {
    if (!MatchTypeApi.instance) {
      MatchTypeApi.instance = new MatchTypeApi();
    }
    return MatchTypeApi.instance;
  }

  async convertMatchTypes(
    accountId: string,
    campaignIds: string[],
    targetMatchType: 'EXACT' | 'PHRASE' | 'BROAD'
  ): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create automation task
      const { data: task, error: taskError } = await supabase
        .from('automation_tasks')
        .insert({
          user_id: user.id,
          task_type: 'CONVERT_MATCH_TYPES',
          task_status: 'PENDING',
          request_payload_json: {
            accountId,
            campaignIds,
            targetMatchType
          }
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // For each campaign, create a modification record
      for (const campaignId of campaignIds) {
        const { error: modError } = await supabase
          .from('campaign_modifications')
          .insert({
            automation_task_id: task.automation_task_id,
            original_campaign_id: campaignId,
            modification_type: 'MATCH_TYPE_CONVERSION',
            modification_details_json: {
              targetMatchType
            }
          });

        if (modError) throw modError;
      }

      // Update task status to running
      const { error: updateError } = await supabase
        .from('automation_tasks')
        .update({ task_status: 'RUNNING' })
        .eq('automation_task_id', task.automation_task_id);

      if (updateError) throw updateError;

      // In a real implementation, this would trigger a background job
      // For now, we'll just update the status to completed
      await supabase
        .from('automation_tasks')
        .update({
          task_status: 'COMPLETED',
          end_time: new Date().toISOString()
        })
        .eq('automation_task_id', task.automation_task_id);

    } catch (error) {
      console.error('Error converting match types:', error);
      throw error;
    }
  }

  async getMatchTypeConversions(campaignId: string): Promise<MatchTypeConversion[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('match_type_conversions')
        .select(`
          match_type_conversion_id,
          campaign_modifications (
            campaign_id
          ),
          keyword_google_id,
          original_match_type,
          new_match_type
        `)
        .eq('campaign_modifications.campaign_id', campaignId);

      if (error) throw error;

      return data.map(conversion => ({
        id: conversion.match_type_conversion_id,
        campaignId: conversion.campaign_modifications.campaign_id,
        keywordId: conversion.keyword_google_id,
        originalMatchType: conversion.original_match_type,
        newMatchType: conversion.new_match_type,
        status: 'COMPLETED'
      }));
    } catch (error) {
      console.error('Error getting match type conversions:', error);
      throw error;
    }
  }
}

export const matchTypeApi = MatchTypeApi.getInstance();