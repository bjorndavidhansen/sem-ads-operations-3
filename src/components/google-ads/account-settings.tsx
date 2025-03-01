import { useState } from 'react';
import { AlertCircle, Save, X, RefreshCw, Key, Globe, Shield, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import type { GoogleAdsAccount } from '../../types/google-ads';

interface AccountSettingsProps {
  account: GoogleAdsAccount;
  onClose: () => void;
  onUpdate: () => void;
}

interface AccountSettingsForm {
  accountName: string;
  timezone: string;
  currency: string;
  notificationEmail: string;
  autoTagging: boolean;
  crossAccountConversion: boolean;
  ipAnonymization: boolean;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

export function AccountSettings({ account, onClose, onUpdate }: AccountSettingsProps) {
  const [form, setForm] = useState<AccountSettingsForm>({
    accountName: account.account_name || '',
    timezone: 'America/New_York',
    currency: 'USD',
    notificationEmail: '',
    autoTagging: true,
    crossAccountConversion: false,
    ipAnonymization: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'tracking' | 'privacy' | 'access'>('general');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('google_ads_accounts')
        .update({
          account_name: form.accountName,
          settings_json: {
            timezone: form.timezone,
            currency: form.currency,
            notification_email: form.notificationEmail,
            auto_tagging: form.autoTagging,
            cross_account_conversion: form.crossAccountConversion,
            ip_anonymization: form.ipAnonymization
          }
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account settings');
      console.error('Error updating account settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'tracking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tracking
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'privacy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'access'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Access
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time Zone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={form.notificationEmail}
                    onChange={(e) => setForm({ ...form, notificationEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Auto-tagging</h3>
                    <p className="text-sm text-gray-500">
                      Automatically tag URLs for conversion tracking
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.autoTagging}
                      onChange={(e) => setForm({ ...form, autoTagging: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Cross-account Conversion Tracking</h3>
                    <p className="text-sm text-gray-500">
                      Share conversion data across multiple accounts
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.crossAccountConversion}
                      onChange={(e) => setForm({ ...form, crossAccountConversion: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">IP Anonymization</h3>
                    <p className="text-sm text-gray-500">
                      Anonymize IP addresses for privacy compliance
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.ipAnonymization}
                      onChange={(e) => setForm({ ...form, ipAnonymization: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Privacy Notice</h3>
                      <p className="mt-2 text-sm text-yellow-700">
                        Ensure your account settings comply with applicable privacy laws and regulations,
                        including GDPR and CCPA where applicable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-6">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Access Management</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Manage user access and permissions in your Google Ads account settings.
                      </p>
                      <div className="mt-4">
                        <a
                          href={`https://ads.google.com/aw/settings/account/management?ocid=${account.google_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Manage Access
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setForm({
                accountName: account.account_name || '',
                timezone: 'America/New_York',
                currency: 'USD',
                notificationEmail: '',
                autoTagging: true,
                crossAccountConversion: false,
                ipAnonymization: true
              });
            }}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}