/*
  # Add shared budgets tracking

  1. New Tables
    - `shared_budgets`
      - `id` (uuid, primary key)
      - `name` (text)
      - `amount_micros` (bigint)
      - `customer_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `shared_budgets` table
    - Add policies for authenticated users to:
      - Read shared budgets
      - Create shared budgets
      - Update shared budgets
*/

-- Create shared budgets table
CREATE TABLE IF NOT EXISTS shared_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount_micros bigint NOT NULL,
  customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shared_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read shared budgets"
  ON shared_budgets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create shared budgets"
  ON shared_budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update shared budgets"
  ON shared_budgets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_shared_budgets_customer ON shared_budgets(customer_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_shared_budgets_updated_at
  BEFORE UPDATE ON shared_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();