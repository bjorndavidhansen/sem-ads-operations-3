import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Power, Tag } from 'lucide-react';
import { Button } from '../../ui/button';
import { adGroupApi, type AdGroup } from '../../../lib/ad-group-api';
import { AdGroupForm } from './ad-group-form';
import { AdList } from './ad-list';
import { AdExtensionList } from './ad-extension-list';

interface AdGroupListProps {
  campaignId: string;
}

export function AdGroupList({ campaignId }: AdGroupListProps) {
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdGroup, setEditingAdGroup] = useState<AdGroup | null>(null);
  const [expandedAdGroup, setExpandedAdGroup] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadAdGroups();
  }, [campaignId]);

  const loadAdGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adGroupApi.listAdGroups(campaignId);
      setAdGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ad groups');
      console.error('Error loading ad groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdGroup = async (input: any) => {
    try {
      setError(null);
      await adGroupApi.createAdGroup({
        ...input,
        campaignId
      });
      await loadAdGroups();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad group');
      console.error('Error creating ad group:', err);
    }
  };

  const handleUpdateAdGroup = async (id: string, input: any) => {
    try {
      setError(null);
      await adGroupApi.updateAdGroup(id, input);
      await loadAdGroups();
      setEditingAdGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad group');
      console.error('Error updating ad group:', err);
    }
  };

  const handleToggleStatus = async (adGroup: AdGroup) => {
    try {
      setTogglingStatus(adGroup.id);
      setError(null);
      await adGroupApi.updateAdGroup(adGroup.id, {
        status: adGroup.status === 'ENABLED' ? 'PAUSED' : 'ENABLED'
      });
      await loadAdGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle ad group status');
      console.error('Error toggling ad group status:', err);
    } finally {
      setTogglingStatus(null);
    }
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
        <h3 className="text-lg font-medium text-gray-900">Ad Groups</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ad Group
        </Button>
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

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <AdGroupForm
            onSubmit={handleCreateAdGroup}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {adGroups.map((adGroup) => (
          <div
            key={adGroup.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(adGroup)}
                    disabled={togglingStatus === adGroup.id}
                    className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      adGroup.status === 'ENABLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <Power className={`h-3 w-3 ${togglingStatus === adGroup.id ? 'animate-spin' : ''}`} />
                    {adGroup.status}
                  </button>
                  <h4 className="text-sm font-medium text-gray-900">{adGroup.name}</h4>
                  {adGroup.labels.length > 0 && (
                    <div className="flex items-center gap-1">
                      {adGroup.labels.map((label, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAdGroup(adGroup)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExpandedAdGroup(
                      expandedAdGroup === adGroup.id ? null : adGroup.id
                    )}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedAdGroup === adGroup.id ? (
                      <Trash2 className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {editingAdGroup?.id === adGroup.id && (
                <div className="mt-4">
                  <AdGroupForm
                    adGroup={adGroup}
                    onSubmit={(input) => handleUpdateAdGroup(adGroup.id, input)}
                    onCancel={() => setEditingAdGroup(null)}
                  />
                </div>
              )}
            </div>

            {expandedAdGroup === adGroup.id && (
              <div className="border-t border-gray-200">
                <div className="p-4">
                  <AdList adGroupId={adGroup.id} />
                </div>
                <div className="border-t border-gray-200 p-4">
                  <AdExtensionList adGroupId={adGroup.id} />
                </div>
              </div>
            )}
          </div>
        ))}

        {adGroups.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Plus className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No ad groups created. Click "Create Ad Group" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}