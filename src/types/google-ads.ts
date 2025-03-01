export interface GoogleAdsAccount {
  id: string;
  user_id: string;
  google_customer_id: number;
  account_name: string | null;
  is_mcc: boolean;
  parent_account_id: string | null;
  access_level: 'ADMIN' | 'STANDARD' | 'READ_ONLY';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountHierarchyNode extends GoogleAdsAccount {
  children: AccountHierarchyNode[];
}