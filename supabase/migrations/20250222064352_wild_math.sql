/*
  # Add Campaign Management and Automation Tables

  1. New Tables
    - `campaigns`: Stores metadata about Google Ads campaigns
    - `bidding_strategy_portfolios`: Stores bidding strategy portfolios
    - `automation_tasks`: Tracks execution of automation tasks
    - `campaign_modifications`: Records campaign modifications
    - `match_type_conversions`: Tracks match type conversion details
    - `naming_conventions`: Stores naming convention templates

  2. Changes
    - Added foreign key relationships between tables
    - Added indexes for performance optimization
    - Added RLS policies for security

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_ads_account_id uuid NOT NULL REFERENCES google_ads_accounts(id),
  google_campaign_id bigint NOT NULL,
  campaign_name text NOT NULL,
  campaign_status text CHECK (campaign_status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(google_ads_account_id, google_campaign_id)
);

-- Create bidding_strategy_portfolios table
CREATE TABLE IF NOT EXISTS bidding_strategy_portfolios (
  bidding_strategy_portfolio_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_ads_account_id uuid NOT NULL REFERENCES google_ads_accounts(id),
  google_bsp_id bigint,
  bsp_name text NOT NULL,
  bsp_type text NOT NULL CHECK (bsp_type IN ('TARGET_CPA', 'TARGET_ROAS', 'MAXIMIZE_CONVERSIONS', 'MAXIMIZE_CONVERSION_VALUE', 'MANUAL_CPC')),
  bsp_configuration_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(google_ads_account_id, google_bsp_id)
);

-- Create automation_tasks table
CREATE TABLE IF NOT EXISTS automation_tasks (
  automation_task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  task_type text NOT NULL CHECK (task_type IN ('COPY_CAMPAIGN', 'CONVERT_MATCH_TYPES', 'CREATE_BSP')),
  task_status text NOT NULL CHECK (task_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  request_payload_json jsonb,
  result_payload_json jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_modifications table
CREATE TABLE IF NOT EXISTS campaign_modifications (
  campaign_modification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_task_id uuid NOT NULL REFERENCES automation_tasks(automation_task_id),
  original_campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  new_campaign_id uuid REFERENCES campaigns(campaign_id),
  modification_type text NOT NULL CHECK (modification_type IN ('COPY', 'MATCH_TYPE_CONVERSION', 'NAMING_CONVENTION')),
  modification_details_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create match_type_conversions table
CREATE TABLE IF NOT EXISTS match_type_conversions (
  match_type_conversion_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_modification_id uuid NOT NULL REFERENCES campaign_modifications(campaign_modification_id),
  keyword_google_id bigint NOT NULL,
  original_match_type text NOT NULL CHECK (original_match_type IN ('EXACT', 'PHRASE', 'BROAD')),
  new_match_type text NOT NULL CHECK (new_match_type IN ('EXACT', 'PHRASE', 'BROAD')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create naming_conventions table
CREATE TABLE IF NOT EXISTS naming_conventions (
  naming_convention_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  convention_name text NOT NULL,
  template_string text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bidding_strategy_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_type_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_conventions ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Users can read campaigns they have access to"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts
      WHERE id = campaigns.google_ads_account_id
      AND user_id = auth.uid()
    )
  );

-- Create policies for bidding_strategy_portfolios
CREATE POLICY "Users can read BSPs they have access to"
  ON bidding_strategy_portfolios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts
      WHERE id = bidding_strategy_portfolios.google_ads_account_id
      AND user_id = auth.uid()
    )
  );

-- Create policies for automation_tasks
CREATE POLICY "Users can read their own automation tasks"
  ON automation_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create automation tasks"
  ON automation_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for campaign_modifications
CREATE POLICY "Users can read campaign modifications they have access to"
  ON campaign_modifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automation_tasks
      WHERE automation_task_id = campaign_modifications.automation_task_id
      AND user_id = auth.uid()
    )
  );

-- Create policies for match_type_conversions
CREATE POLICY "Users can read match type conversions they have access to"
  ON match_type_conversions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaign_modifications cm
      JOIN automation_tasks at ON at.automation_task_id = cm.automation_task_id
      WHERE cm.campaign_modification_id = match_type_conversions.campaign_modification_id
      AND at.user_id = auth.uid()
    )
  );

-- Create policies for naming_conventions
CREATE POLICY "Users can read their own naming conventions"
  ON naming_conventions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create naming conventions"
  ON naming_conventions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own naming conventions"
  ON naming_conventions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_campaigns_google_ads_account ON campaigns(google_ads_account_id);
CREATE INDEX idx_bsp_google_ads_account ON bidding_strategy_portfolios(google_ads_account_id);
CREATE INDEX idx_automation_tasks_user ON automation_tasks(user_id, task_type, task_status);
CREATE INDEX idx_campaign_modifications_task ON campaign_modifications(automation_task_id);
CREATE INDEX idx_match_type_conversions_mod ON match_type_conversions(campaign_modification_id);
CREATE INDEX idx_naming_conventions_user ON naming_conventions(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bsp_updated_at
  BEFORE UPDATE ON bidding_strategy_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_tasks_updated_at
  BEFORE UPDATE ON automation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_modifications_updated_at
  BEFORE UPDATE ON campaign_modifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_type_conversions_updated_at
  BEFORE UPDATE ON match_type_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_naming_conventions_updated_at
  BEFORE UPDATE ON naming_conventions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();