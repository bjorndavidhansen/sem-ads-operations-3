import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Power, Link2, Phone, Tag, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import { adGroupApi, type AdExtension } from '../../../lib/ad-group-api';
import { AdExtensionForm } from './ad-extension-form';

interface AdExtensionListProps {
  adGroupId: string;
}

export function AdExtensionList({ adGroupId }: AdExtensionListProps) {
  const [extensions, setExtensions] = useState<AdExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExtension, setEditingExtension] = useState<AdExtension | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadExtensions();
  }, [adGroupId]);

  const loadExtensions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adGroupApi.listAdExtensions(adGroupId);
      setExtensions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extensions');
      console.error('Error loading extensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExtension = async (input: any) => {
    try {
      setError(null);
      await adGroupApi.createAdExtension({
        ...input,
        adGroupId
      });
      await loadExtensions();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create extension');
      console.error('Error creating extension:', err);
    }
  };

  const handleUpdateExtension = async (id: string, input: any) => {
    try {
      setError(null);
      await adGroupApi.updateAdExtension(id, input);
      await loadExtensions();
      setEditingExtension(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update extension');
      console.error('Error updating extension:', err);
    }
  };

  const handleToggleStatus = async (extension: AdExtension) => {
    try {
      setTogglingStatus(extension.id);
      setError(null);
      await adGroupApi.updateAdExtension(extension.id, {
        status: extension.status === 'ENABLED' ? 'PAUSED' : 'ENABLED'
      });
      await loadExtensions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle extension status');
      console.error('Error toggling extension status:', err);
    } finally {
      setTogglingStatus(null);
    }
  };

  const getExtensionIcon = (type: AdExtension['type']) => {
    switch (type) {
      case 'SITELINK':
        return <Link2 className="h-5 w-5 text-blue-400" />;
      case 'CALLOUT':
        return <Tag className="h-5 w-5 text-green-400" />;
      case 'STRUCTURED_SNIPPET':
        return <Tag className="h-5 w-5 text-purple-400" />;
      case 'CALL':
        return <Phone className="h-5 w-5 text-yellow-400" />;
      case 'PRICE':
        return <Tag className="h-5 w-5 text-red-400" />;
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
        <h4 className="text-sm font-medium text-gray-900">Ad Extensions</h4>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Extension
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <AdExtensionForm
            onSubmit={handleCreateExtension}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {extensions.map((extension) => (
          <div
            key={extension.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(extension)}
                    disabled={togglingStatus === extension.id}
                    className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      extension.status === 'ENABLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <Power className={`h-3 w-3 ${togglingStatus === extension.id ? 'animate-spin' : ''}`} />
                    {extension.status}
                  </button>
                  {getExtensionIcon(extension.type)}
                  <span className="text-sm font-medium text-gray-900">
                    {extension.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingExtension(extension)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateExtension(extension.id, { status: 'REMOVED' })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-900">{extension.text}</p>
                {extension.schedules && extension.schedules.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {extension.schedules.length} schedule{extension.schedules.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {editingExtension?.id === extension.id && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <AdExtensionForm
                    extension={extension}
                    onSubmit={(input) => handleUpdateExtension(extension.id, input)}
                    onCancel={() => setEditingExtension(null)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {extensions.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Tag className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No extensions added. Click "Add Extension" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}