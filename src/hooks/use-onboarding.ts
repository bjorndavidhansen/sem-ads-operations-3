import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  lastSeenAt: string | null;
}

export function useOnboarding(tourId: string) {
  const [state, setState] = useState<OnboardingState>({
    completed: false,
    currentStep: 0,
    lastSeenAt: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnboardingState();
  }, [tourId]);

  const loadOnboardingState = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .eq('tour_id', tourId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setState({
          completed: data.completed,
          currentStep: data.current_step,
          lastSeenAt: data.last_seen_at
        });
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOnboardingState = async (updates: Partial<OnboardingState>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          tour_id: tourId,
          completed: updates.completed ?? state.completed,
          current_step: updates.currentStep ?? state.currentStep,
          last_seen_at: new Date().toISOString()
        });

      if (error) throw error;

      setState(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating onboarding state:', error);
    }
  };

  return {
    state,
    loading,
    updateOnboardingState
  };
}