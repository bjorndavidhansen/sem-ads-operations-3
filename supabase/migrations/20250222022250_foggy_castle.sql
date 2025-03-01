/*
  # Add MCC Support to Google Ads Accounts

  1. Changes to google_ads_accounts
    - Add `is_mcc` column to identify manager accounts
    - Add `parent_account_id` for hierarchy tracking
    - Add `refresh_token` column for OAuth credentials
    - Add `access_level` column for permission tracking

  2. Security
    - Update RLS policies to handle account hierarchy
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own accounts" ON google_ads_accounts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new columns to google_ads_accounts
ALTER TABLE google_ads_accounts 
ADD COLUMN IF NOT EXISTS is_mcc boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_account_id uuid REFERENCES google_ads_accounts(id),
ADD COLUMN IF NOT EXISTS refresh_token text,
ADD COLUMN IF NOT EXISTS access_level text CHECK (access_level IN ('ADMIN', 'STANDARD', 'READ_ONLY'));

-- Create index for parent_account lookups
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_parent ON google_ads_accounts(parent_account_id);

-- Create a function to get all child accounts
CREATE OR REPLACE FUNCTION get_child_accounts(account_id uuid)
RETURNS TABLE (id uuid) AS $$
WITH RECURSIVE account_tree AS (
  -- Base case: direct children
  SELECT a.id
  FROM google_ads_accounts a
  WHERE a.parent_account_id = account_id
  
  UNION ALL
  
  -- Recursive case: children of children
  SELECT a.id
  FROM google_ads_accounts a
  INNER JOIN account_tree t ON a.parent_account_id = t.id
)
SELECT * FROM account_tree;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create new policy for account hierarchy
DO $$ 
BEGIN
  CREATE POLICY "Users can read own and child accounts"
    ON google_ads_accounts
    FOR SELECT
    TO authenticated
    USING (
      auth.uid() = user_id OR
      id IN (
        SELECT a.id 
        FROM google_ads_accounts a
        WHERE a.user_id = auth.uid() AND 
              a.is_mcc = true AND
              id IN (SELECT get_child_accounts(a.id))
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;