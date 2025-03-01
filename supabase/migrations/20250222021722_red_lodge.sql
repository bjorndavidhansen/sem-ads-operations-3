/*
  # Create Google Ads Accounts Table

  1. New Tables
    - `google_ads_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `google_customer_id` (bigint, unique)
      - `account_name` (text)
      - `oauth_credentials_json` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `google_ads_accounts` table
    - Add policies for authenticated users to:
      - Read their own accounts
      - Insert new accounts
      - Update their own accounts
*/

CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  google_customer_id bigint NOT NULL,
  account_name text,
  oauth_credentials_json jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(google_customer_id)
);

-- Enable RLS
ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own accounts"
  ON google_ads_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON google_ads_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON google_ads_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_user_id ON google_ads_accounts(user_id);