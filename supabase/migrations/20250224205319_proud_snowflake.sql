/*
  # Add Ad Groups and Ads Tables

  1. New Tables
    - ad_groups: Stores ad group information
    - ads: Stores ad creative information
    - ad_extensions: Stores ad extension data
    - keywords: Stores keyword targeting data
    - negative_keywords: Stores negative keyword data

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Relationships
    - Ad groups belong to campaigns
    - Ads belong to ad groups
    - Keywords and extensions belong to ad groups
*/

-- Create ad_groups table
CREATE TABLE IF NOT EXISTS ad_groups (
  ad_group_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(campaign_id),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  type text NOT NULL CHECK (type IN ('SEARCH', 'DISPLAY', 'VIDEO')),
  cpc_bid_micros bigint,
  labels text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  ad_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id uuid NOT NULL REFERENCES ad_groups(ad_group_id),
  type text NOT NULL CHECK (type IN ('TEXT', 'RESPONSIVE_SEARCH', 'IMAGE', 'VIDEO')),
  status text NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  final_urls text[] NOT NULL,
  headlines text[],
  descriptions text[],
  path1 text,
  path2 text,
  image_url text,
  video_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_extensions table
CREATE TABLE IF NOT EXISTS ad_extensions (
  extension_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id uuid NOT NULL REFERENCES ad_groups(ad_group_id),
  type text NOT NULL CHECK (type IN ('SITELINK', 'CALLOUT', 'STRUCTURED_SNIPPET', 'CALL', 'PRICE')),
  status text NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  text text NOT NULL,
  start_date date,
  end_date date,
  schedules jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  keyword_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id uuid NOT NULL REFERENCES ad_groups(ad_group_id),
  text text NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('EXACT', 'PHRASE', 'BROAD')),
  status text NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED')),
  cpc_bid_micros bigint,
  labels text[] DEFAULT '{}',
  metrics_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create negative_keywords table
CREATE TABLE IF NOT EXISTS negative_keywords (
  negative_keyword_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id uuid NOT NULL REFERENCES ad_groups(ad_group_id),
  text text NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('EXACT', 'PHRASE', 'BROAD')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE negative_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access ad groups through campaigns"
  ON ad_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE c.campaign_id = ad_groups.campaign_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access ads through ad groups"
  ON ads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_groups ag
      JOIN campaigns c ON c.campaign_id = ag.campaign_id
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE ag.ad_group_id = ads.ad_group_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access extensions through ad groups"
  ON ad_extensions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_groups ag
      JOIN campaigns c ON c.campaign_id = ag.campaign_id
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE ag.ad_group_id = ad_extensions.ad_group_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access keywords through ad groups"
  ON keywords
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_groups ag
      JOIN campaigns c ON c.campaign_id = ag.campaign_id
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE ag.ad_group_id = keywords.ad_group_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access negative keywords through ad groups"
  ON negative_keywords
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_groups ag
      JOIN campaigns c ON c.campaign_id = ag.campaign_id
      JOIN google_ads_accounts a ON a.id = c.google_ads_account_id
      WHERE ag.ad_group_id = negative_keywords.ad_group_id
      AND a.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_ad_groups_campaign ON ad_groups(campaign_id);
CREATE INDEX idx_ads_ad_group ON ads(ad_group_id);
CREATE INDEX idx_ad_extensions_ad_group ON ad_extensions(ad_group_id);
CREATE INDEX idx_keywords_ad_group ON keywords(ad_group_id);
CREATE INDEX idx_negative_keywords_ad_group ON negative_keywords(ad_group_id);

-- Create updated_at triggers
CREATE TRIGGER update_ad_groups_updated_at
  BEFORE UPDATE ON ad_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_extensions_updated_at
  BEFORE UPDATE ON ad_extensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negative_keywords_updated_at
  BEFORE UPDATE ON negative_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();