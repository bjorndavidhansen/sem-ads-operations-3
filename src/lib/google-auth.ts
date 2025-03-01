import { supabase } from './supabase';

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export async function handleGoogleAuth(response: GoogleAuthResponse) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Store the tokens in Supabase
    const { error: updateError } = await supabase
      .from('google_ads_accounts')
      .upsert({
        user_id: user.id,
        refresh_token: response.refresh_token,
        oauth_credentials_json: response,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling Google auth:', error);
    return { success: false, error };
  }
}