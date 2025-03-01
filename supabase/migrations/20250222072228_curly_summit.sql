-- Create budget pacing table
CREATE TABLE IF NOT EXISTS budget_pacing (
  pacing_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  date date NOT NULL,
  budget_amount numeric NOT NULL,
  actual_spend numeric NOT NULL,
  projected_spend numeric NOT NULL,
  utilization_rate numeric NOT NULL,
  days_remaining integer NOT NULL,
  forecasted_end_of_month_spend numeric NOT NULL,
  pace_status text NOT NULL CHECK (pace_status IN ('UNDER_PACING', 'ON_TRACK', 'OVER_PACING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget forecasts table
CREATE TABLE IF NOT EXISTS budget_forecasts (
  forecast_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  date date NOT NULL,
  projected_spend numeric NOT NULL,
  lower_bound numeric NOT NULL,
  upper_bound numeric NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_pacing ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_pacing
CREATE POLICY "Users can read budget pacing for their campaigns"
  ON budget_pacing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = budget_pacing.campaign_id
      AND a.user_id = auth.uid()
    )
  );

-- Create policies for budget_forecasts
CREATE POLICY "Users can read budget forecasts for their campaigns"
  ON budget_forecasts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = budget_forecasts.campaign_id
      AND a.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_budget_pacing_campaign ON budget_pacing(campaign_id);
CREATE INDEX idx_budget_pacing_date ON budget_pacing(date);
CREATE INDEX idx_budget_forecasts_campaign ON budget_forecasts(campaign_id);
CREATE INDEX idx_budget_forecasts_date ON budget_forecasts(date);

-- Create updated_at triggers
CREATE TRIGGER update_budget_pacing_updated_at
  BEFORE UPDATE ON budget_pacing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_forecasts_updated_at
  BEFORE UPDATE ON budget_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();