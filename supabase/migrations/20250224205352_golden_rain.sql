/*
  # Add Account Statistics Table

  1. New Tables
    - account_stats: Stores account-level performance metrics
    - account_daily_stats: Stores daily performance metrics
    - account_audit_log: Stores account activity history

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Relationships
    - Stats belong to Google Ads accounts
    - Audit logs belong to accounts and users
*/

-- Create account_stats table
CREATE TABLE IF NOT EXISTS account_stats (
  stat_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES google_ads_accounts(id),
  campaign_count integer DEFAULT 0,
  ad_group_count integer DEFAULT 0,
  keyword_count integer DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  cost bigint DEFAULT 0,
  conversions integer DEFAULT 0,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

-- Create account_daily_stats table
CREATE TABLE IF NOT EXISTS account_daily_stats (
  daily_stat_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES google_ads_accounts(id),
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  cost bigint DEFAULT 0,
  conversions integer DEFAULT 0,
  average_position numeric(4,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, date)
);

-- Create account_audit_log table
CREATE TABLE IF NOT EXISTS account_audit_log (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES google_ads_accounts(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE account_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access stats for their accounts"
  ON account_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts
      WHERE id = account_stats.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access daily stats for their accounts"
  ON account_daily_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts
      WHERE id = account_daily_stats.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access audit logs for their accounts"
  ON account_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts
      WHERE id = account_audit_log.account_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_account_stats_account ON account_stats(account_id);
CREATE INDEX idx_account_daily_stats_account ON account_daily_stats(account_id);
CREATE INDEX idx_account_daily_stats_date ON account_daily_stats(date);
CREATE INDEX idx_account_audit_log_account ON account_audit_log(account_id);
CREATE INDEX idx_account_audit_log_user ON account_audit_log(user_id);
CREATE INDEX idx_account_audit_log_action ON account_audit_log(action);
CREATE INDEX idx_account_audit_log_created ON account_audit_log(created_at);

-- Create updated_at triggers
CREATE TRIGGER update_account_stats_updated_at
  BEFORE UPDATE ON account_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_daily_stats_updated_at
  BEFORE UPDATE ON account_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();