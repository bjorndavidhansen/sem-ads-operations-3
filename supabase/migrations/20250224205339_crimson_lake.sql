/*
  # Add Reports and Analytics Tables

  1. New Tables
    - reports: Stores report configurations
    - report_schedules: Stores report scheduling information
    - report_executions: Stores report execution history
    - report_metrics: Stores metric definitions
    - report_dimensions: Stores dimension definitions

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Relationships
    - Reports belong to users
    - Schedules belong to reports
    - Executions belong to reports
*/

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  metrics text[] NOT NULL,
  dimensions text[] NOT NULL,
  filters jsonb,
  date_range jsonb NOT NULL,
  schedule jsonb,
  last_run timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_executions table
CREATE TABLE IF NOT EXISTS report_executions (
  execution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(report_id),
  status text NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  result_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_metrics table
CREATE TABLE IF NOT EXISTS report_metrics (
  metric_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('INTEGER', 'FLOAT', 'PERCENTAGE', 'CURRENCY')),
  formula text,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Create report_dimensions table
CREATE TABLE IF NOT EXISTS report_dimensions (
  dimension_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  data_type text NOT NULL CHECK (data_type IN ('STRING', 'DATE', 'TIMESTAMP', 'BOOLEAN')),
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_dimensions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access executions of their reports"
  ON report_executions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE report_id = report_executions.report_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read metrics"
  ON report_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read dimensions"
  ON report_dimensions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_report_executions_report ON report_executions(report_id);
CREATE INDEX idx_report_executions_status ON report_executions(status);
CREATE INDEX idx_report_metrics_name ON report_metrics(name);
CREATE INDEX idx_report_dimensions_name ON report_dimensions(name);

-- Create updated_at triggers
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_executions_updated_at
  BEFORE UPDATE ON report_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_metrics_updated_at
  BEFORE UPDATE ON report_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_dimensions_updated_at
  BEFORE UPDATE ON report_dimensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();