import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Copy, Filter, Download, Play, Pause, 
  ChevronDown, ChevronRight, DollarSign, BarChart2, Settings,
  AlertCircle, Calendar, Tag, Users, Target, Layers
} from 'lucide-react';
import { Button } from '../ui/button';
import { CampaignForm } from './campaign-form';
import { CampaignMetrics } from './campaign-metrics';
import { BudgetEditor } from './budget-editor';
import { SharedBudgetSelector } from './shared-budget-selector';
import { AdGroupList } from './ad-group/ad-group-list';
import { BulkOperations } from './bulk/bulk-operations';
import { googleAdsApi } from '../../lib/google-ads-api';
import { supabase } from '../../lib/supabase';
import type { Campaign } from '../../lib/google-ads-api';

interface CampaignManagerProps {
  accountId: string;
}

interface CampaignFilters {
  status: ('ENABLED' | 'PAUSED' | 'REMOVED')[];
  type: string[];
  labels: string[];
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'between';
    value: number | [number, number];
  }[];
}

export function CampaignManager({ accountId }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({
    status: [],
    type: [],
    labels: [],
    dateRange: {
      start: '',
      end: ''
    },
    metrics: []
  });
  const [view, setView] = useState<'list' | 'grid' | 'table'>('list');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, [accountId]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await googleAdsApi.listCampaigns(accountId);
      setCampaigns(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCampaigns.size === 0) return;

    try {
      setError(null);

      switch (bulkAction) {
        case 'enable':
          await Promise.all(
            Array.from(selectedCampaigns).map(id =>
              googleAdsApi.updateCampaign(accountId, id, { status: 'ENABLED' })
            )
          );
          break;

        case 'pause':
          await Promise.all(
            Array.from(selectedCampaigns).map(id =>
              googleAdsApi.updateCampaign(accountId, id, { status: 'PAUSED' })
            )
          );
          break;

        case 'delete':
          if (!window.confirm('Are you sure you want to delete the selected campaigns? This action cannot be undone.')) {
            return;
          }
          await googleAdsApi.deleteCampaigns(accountId, Array.from(selectedCampaigns));
          break;

        case 'copy':
          await googleAdsApi.copyCampaigns(accountId, Array.from(selectedCampaigns));
          break;
      }

      await loadCampaigns();
      setSelectedCampaigns(new Set());
      setBulkAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
      console.error('Error performing bulk action:', err);
    }
  };

  const toggleCampaign = (id: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCampaigns(newSelected);
  };

  const toggleExpandCampaign = (id: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCampaigns(newExpanded);
  };

  const formatMetric = (value: number, type: string) => {
    if (type.includes('cost') || type.includes('value')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    }
    if (type.includes('rate') || type.includes('percentage')) {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">Campaigns</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('list')}
              className={view === 'list' ? 'bg-blue-50' : ''}
            >
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('grid')}
              className={view === 'grid' ? 'bg-blue-50' : ''}
            >
              Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('table')}
              className={view === 'table' ? 'bg-blue-50' : ''}
            >
              Table
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCampaigns.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setBulkAction('bulk')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Bulk Operations
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

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

      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-2 space-y-2">
                {['ENABLED', 'PAUSED', 'REMOVED'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status as any)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status as any]
                          : filters.status.filter(s => s !== status);
                        setFilters({ ...filters, status: newStatus });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="mt-2 space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Labels</label>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Filter by labels..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  onChange={(e) => setFilters({
                    ...filters,
                    labels: e.target.value ? e.target.value.split(',').map(l => l.trim()) : []
                  })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Metrics</label>
              <div className="mt-2 space-y-2">
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      setFilters({
                        ...filters,
                        metrics: [
                          ...filters.metrics,
                          { field: e.target.value, operator: 'gt', value: 0 }
                        ]
                      });
                    }
                  }}
                >
                  <option value="">Add metric filter...</option>
                  <option value="impressions">Impressions</option>
                  <option value="clicks">Clicks</option>
                  <option value="cost">Cost</option>
                  <option value="conversions">Conversions</option>
                  <option value="ctr">CTR</option>
                  <option value="cpa">CPA</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {campaigns.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.has(campaign.id)}
                      onChange={() => toggleCampaign(campaign.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => toggleExpandCampaign(campaign.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedCampaigns.has(campaign.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{campaign.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'ENABLED'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {campaign.status}
                        </span>
                        <span>{campaign.advertisingChannelType}</span>
                        <span>•</span>
                        <span>
                          Budget: ${parseInt(campaign.budget.amountMicros) / 1_000_000}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Handle view reports
                      }}
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCampaign(campaign)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>

                {expandedCampaigns.has(campaign.id) && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Details</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {new Date(campaign.startDate).toLocaleDateString()}
                              {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString()}`}
                            </span>
                          </div>
                          {campaign.targetRoas && (
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                Target ROAS: {campaign.targetRoas.targetRoas}%
                              </span>
                            </div>
                          )}
                          {campaign.targetCpa && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                Target CPA: ${parseInt(campaign.targetCpa.targetCpaMicros) / 1_000_000}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</h4>
                        <div className="mt-2 space-y-2">
                          {campaign.metrics && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Impressions</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {campaign.metrics.impressions.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Clicks</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {campaign.metrics.clicks.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">CTR</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {campaign.metrics.ctr.toFixed(2)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</h4>
                        <div className="mt-2 space-y-2">
                          {campaign.metrics && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Conversions</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {campaign.metrics.conversions.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Conv. Rate</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {campaign.metrics.conversionRate.toFixed(2)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</h4>
                        <div className="mt-2 space-y-2">
                          {campaign.metrics && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Cost</span>
                                <span className="text-sm font-medium text-gray-900">
                                  ${campaign.metrics.cost.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Avg. CPC</span>
                                <span className="text-sm font-medium text-gray-900">
                                  ${campaign.metrics.averageCpc.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {campaign.metrics && (
                      <div className="mt-4">
                        <CampaignMetrics metrics={campaign.metrics} historicalData={campaign.historicalMetrics} />
                      </div>
                    )}

                    <div className="mt-4">
                      <AdGroupList campaignId={campaign.id} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first campaign.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create Campaign</h2>
            </div>
            <div className="p-6">
              <CampaignForm
                accountId={accountId}
                onSubmit={async (data) => {
                  try {
                    await googleAdsApi.createCampaign(accountId, data);
                    await loadCampaigns();
                    setShowCreateForm(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to create campaign');
                    console.error('Error creating campaign:', err);
                  }
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {editingCampaign && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Edit Campaign</h2>
            </div>
            <div className="p-6">
              <CampaignForm
                accountId={accountId}
                campaign={editingCampaign}
                onSubmit={async (data) => {
                  try {
                    await googleAdsApi.updateCampaign(accountId, editingCampaign.id, data);
                    await loadCampaigns();
                    setEditingCampaign(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to update campaign');
                    console.error('Error updating campaign:', err);
                  }
                }}
                onCancel={() => setEditingCampaign(null)}
              />
            </div>
          </div>
        </div>
      )}

      {bulkAction === 'bulk' && selectedCampaigns.size > 0 && (
        <BulkOperations
          selectedCampaigns={campaigns.filter(c => selectedCampaigns.has(c.id))}
          onUpdate={loadCampaigns}
          onClose={() => setBulkAction(null)}
        />
      )}
    </div>
  );
}