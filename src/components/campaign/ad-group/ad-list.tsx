import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Power, Link, Image, Video, Type } from 'lucide-react';
import { Button } from '../../ui/button';
import { adGroupApi, type Ad } from '../../../lib/ad-group-api';
import { AdForm } from './ad-form';

interface AdListProps {
  adGroupId: string;
}

export function AdList({ adGroupId }: AdListProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadAds();
  }, [adGroupId]);

  const loadAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adGroupApi.listAds(adGroupId);
      setAds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ads');
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (input: any) => {
    try {
      setError(null);
      await adGroupApi.createAd({
        ...input,
        adGroupId
      });
      await loadAds();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad');
      console.error('Error creating ad:', err);
    }
  };

  const handleUpdateAd = async (id: string, input: any) => {
    try {
      setError(null);
      await adGroupApi.updateAd(id, input);
      await loadAds();
      setEditingAd(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad');
      console.error('Error updating ad:', err);
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    try {
      setTogglingStatus(ad.id);
      setError(null);
      await adGroupApi.updateAd(ad.id, {
        status: ad.status === 'ENABLED' ? 'PAUSED' : 'ENABLED'
      });
      await loadAds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle ad status');
      console.error('Error toggling ad status:', err);
    } finally {
      setTogglingStatus(null);
    }
  };

  const getAdTypeIcon = (type: Ad['type']) => {
    switch (type) {
      case 'TEXT':
        return <Type className="h-5 w-5 text-gray-400" />;
      case 'RESPONSIVE_SEARCH':
        return <Type className="h-5 w-5 text-blue-400" />;
      case 'IMAGE':
        return <Image className="h-5 w-5 text-green-400" />;
      case 'VIDEO':
        return <Video className="h-5 w-5 text-purple-400" />;
    }
  };

  const getAdPreview = (ad: Ad) => {
    switch (ad.type) {
      case 'TEXT':
      case 'RESPONSIVE_SEARCH':
        return (
          <div className="space-y-1">
            <div className="text-blue-600 font-medium">
              {ad.headlines?.[0]}
              {ad.path1 && ad.path2 && (
                <span className="text-green-600 ml-2">
                  /{ad.path1}/{ad.path2}
                </span>
              )}
            </div>
            <div className="text-green-600 text-sm">
              {ad.finalUrls[0]}
            </div>
            <div className="text-gray-600 text-sm">
              {ad.descriptions?.[0]}
            </div>
          </div>
        );
      case 'IMAGE':
        return (
          <div className="space-y-2">
            {ad.imageUrl && (
              <img
                src={ad.imageUrl}
                alt="Ad"
                className="h-20 w-auto object-cover rounded"
              />
            )}
            <div className="text-sm text-gray-600">
              {ad.finalUrls[0]}
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium">{ad.headlines?.[0]}</div>
            <div className="text-sm text-gray-600">Video ID: {ad.videoId}</div>
            <div className="text-sm text-gray-600">
              {ad.finalUrls[0]}
            </div>
          </div>
        );
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
        <h4 className="text-sm font-medium text-gray-900">Ads</h4>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
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
          <AdForm
            onSubmit={handleCreateAd}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(ad)}
                    disabled={togglingStatus === ad.id}
                    className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ad.status === 'ENABLED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <Power className={`h-3 w-3 ${togglingStatus === ad.id ? 'animate-spin' : ''}`} />
                    {ad.status}
                  </button>
                  {getAdTypeIcon(ad.type)}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {ad.type.replace(/_/g, ' ')}
                    </span>
                    <Link className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {ad.finalUrls.length} URL{ad.finalUrls.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAd(ad)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUpdateAd(ad.id, { status: 'REMOVED' })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                {getAdPreview(ad)}
              </div>

              {editingAd?.id === ad.id && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <AdForm
                    ad={ad}
                    onSubmit={(input) => handleUpdateAd(ad.id, input)}
                    onCancel={() => setEditingAd(null)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {ads.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Plus className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No ads created. Click "Create Ad" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}