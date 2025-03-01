-- Create campaign alerts table
CREATE TABLE IF NOT EXISTS campaign_alerts (
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  alert_type text NOT NULL CHECK (alert_type IN ('PERFORMANCE', 'BUDGET', 'CONVERSION')),
  alert_status text NOT NULL CHECK (alert_status IN ('ACTIVE', 'DISMISSED')),
  alert_message text NOT NULL,
  thresholds_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read alerts for their campaigns"
  ON campaign_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = campaign_alerts.campaign_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create alerts for their campaigns"
  ON campaign_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = campaign_alerts.campaign_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alerts for their campaigns"
  ON campaign_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = campaign_alerts.campaign_id
      AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = campaign_alerts.campaign_id
      AND a.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_campaign_alerts_campaign ON campaign_alerts(campaign_id);
CREATE INDEX idx_campaign_alerts_status ON campaign_alerts(alert_status);

-- Create updated_at trigger
CREATE TRIGGER update_campaign_alerts_updated_at
  BEFORE UPDATE ON campaign_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();