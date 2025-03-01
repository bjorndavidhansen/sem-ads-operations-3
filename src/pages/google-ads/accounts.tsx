import { useState, useEffect } from 'react';
import { Building2, AlertCircle, Trash2, Plus, ChevronDown, ChevronRight, BarChart2, Settings } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../../components/ui/button';
import { handleGoogleAuth } from '../../lib/google-auth';
import { supabase } from '../../lib/supabase';
import { AccountSettings } from '../../components/google-ads/account-settings';
import type { GoogleAdsAccount } from '../../types/google-ads';

interface AccountStats {
  campaigns: number;
  adGroups: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  lastSync: string;
}

export function GoogleAdsAccountsPage() {
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<GoogleAdsAccount | null>(null);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/adwords',
    onSuccess: async (response) => {
      try {
        setError(null);
        await handleGoogleAuth({
          access_token: response.access_token,
          token_type: 'Bearer',
          scope: response.scope,
          expiry_date: Date.now() + (response.expires_in * 1000),
          refresh_token: response.refresh_token || ''
        });
        loadAccounts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect Google Ads account');
        console.error('Error connecting account:', err);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      if (error.error === 'access_denied' && error.details?.includes('verification process')) {
        setError('This application is in testing mode and can only be accessed by approved test users.');
      } else {
        setError('Failed to connect with Google Ads. Please try again.');
      }
    },
    flow: 'auth-code'
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('google_ads_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_mcc', { ascending: false })
        .order('account_name');

      if (error) throw error;

      setAccounts(data);

      // Load stats for each account
      const stats: Record<string, AccountStats> = {};
      for (const account of data) {
        if (account.is_active) {
          const { data: accountData } = await supabase
            .from('account_stats')
            .select('*')
            .eq('account_id', account.id)
            .single();

          if (accountData) {
            stats[account.id] = {
              campaigns: accountData.campaign_count || 0,
              adGroups: accountData.ad_group_count || 0,
              impressions: accountData.impressions || 0,
              clicks: accountData.clicks || 0,
              cost: accountData.cost || 0,
              conversions: accountData.conversions || 0,
              lastSync: accountData.last_sync || new Date().toISOString()
            };
          }
        }
      }
      setAccountStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this account? This action cannot be undone.')) {
      return;
    }

    try {
      setDisconnecting(accountId);
      setError(null);

      const { error } = await supabase
        .from('google_ads_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(accounts.filter(account => account.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
      console.error('Error disconnecting account:', err);
    } finally {
      setDisconnecting(null);
    }
  };

  const toggleAccountExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: num > 999999 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount > 999999 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Google Ads Accounts</h1>
          <Button onClick={() => login()}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Account
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden rounded-md">
          {accounts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <li key={account.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleAccountExpanded(account.id)}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                      >
                        {expandedAccounts.has(account.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      <Building2 className={`h-5 w-5 ${account.is_mcc ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {account.account_name || `Account ${account.google_customer_id}`}
                          {account.is_mcc && <span className="ml-2 text-xs text-gray-500">(MCC)</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          Customer ID: {account.google_customer_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnecting === account.id}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className={`h-4 w-4 ${disconnecting === account.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {expandedAccounts.has(account.id) && accountStats[account.id] && (
                    <div className="mt-4 pl-12">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Overview</h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Campaigns</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(accountStats[account.id].campaigns)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Ad Groups</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(accountStats[account.id].adGroups)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Impressions</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(accountStats[account.id].impressions)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Clicks</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(accountStats[account.id].clicks)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total</span>
                                <span className="text-sm font-medium text-gray-900">{formatNumber(accountStats[account.id].conversions)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Cost</span>
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(accountStats[account.id].cost)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Details</h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Last Sync</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {new Date(accountStats[account.id].lastSync).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Access Level</span>
                                <span className="text-sm font-medium text-gray-900">Admin</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            View Reports
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Account Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts connected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by connecting your Google Ads account.
              </p>
              <div className="mt-6">
                <Button onClick={() => login()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              </div>
            </div>
          )}
        </div>

        {editingAccount && (
          <AccountSettings
            account={editingAccount}
            onClose={() => setEditingAccount(null)}
            onUpdate={loadAccounts}
          />
        )}
      </div>
    </div>
  );
}