/*
  # Add A/B testing tables

  1. New Tables
    - `ab_tests`
      - Test configuration and status tracking
      - Stores test parameters, duration, and results
    - `ab_test_variants`
      - Individual test variants
      - Links to campaigns and tracks performance metrics
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Indexes
    - Optimize queries for test and variant lookups
*/

-- Create ab_tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  test_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  test_type text NOT NULL CHECK (test_type IN ('BIDDING_STRATEGY', 'AD_COPY', 'TARGETING', 'BUDGET')),
  status text NOT NULL CHECK (status IN ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED')),
  start_date timestamptz,
  end_date timestamptz,
  duration_days integer,
  confidence_level numeric CHECK (confidence_level >= 0 AND confidence_level <= 1),
  winning_variant_id uuid,
  metrics_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ab_test_variants table
CREATE TABLE IF NOT EXISTS ab_test_variants (
  variant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(test_id),
  campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  name text NOT NULL,
  description text,
  is_control boolean NOT NULL DEFAULT false,
  configuration_json jsonb NOT NULL DEFAULT '{}',
  metrics_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for ab_tests
CREATE POLICY "Users can read their own tests"
  ON ab_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tests"
  ON ab_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tests"
  ON ab_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for ab_test_variants
CREATE POLICY "Users can read variants for their tests"
  ON ab_test_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE test_id = ab_test_variants.test_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create variants for their tests"
  ON ab_test_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE test_id = ab_test_variants.test_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants for their tests"
  ON ab_test_variants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE test_id = ab_test_variants.test_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE test_id = ab_test_variants.test_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_ab_tests_user ON ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_test_variants_test ON ab_test_variants(test_id);
CREATE INDEX idx_ab_test_variants_campaign ON ab_test_variants(campaign_id);

-- Create updated_at triggers
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_variants_updated_at
  BEFORE UPDATE ON ab_test_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();