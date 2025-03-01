import { useState } from 'react';
import { AlertTriangle, Plus, X, Link } from 'lucide-react';
import { Button } from '../../ui/button';
import type { Ad } from '../../../lib/ad-group-api';

interface AdFormProps {
  ad?: Ad;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const AD_TYPES = [
  { value: 'TEXT', label: 'Text Ad' },
  { value: 'RESPONSIVE_SEARCH', label: 'Responsive Search Ad' },
  { value: 'IMAGE', label: 'Image Ad' },
  { value: 'VIDEO', label: 'Video Ad' }
] as const;

export function AdForm({ ad, onSubmit, onCancel }: AdFormProps) {
  const [type, setType] = useState<Ad['type']>(ad?.type || 'TEXT');
  const [headlines, setHeadlines] = useState<string[]>(ad?.headlines || ['']);
  const [descriptions, setDescriptions] = useState<string[]>(ad?.descriptions || ['']);
  const [finalUrls, setFinalUrls] = useState<string[]>(ad?.finalUrls || ['']);
  const [path1, setPath1] = useState(ad?.path1 || '');
  const [path2, setPath2] = useState(ad?.path2 || '');
  const [imageUrl, setImageUrl] = useState(ad?.imageUrl || '');
  const [videoId, setVideoId] = useState(ad?.videoId || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate required fields based on ad type
      if (type === 'TEXT' || type === 'RESPONSIVE_SEARCH') {
        if (!headlines.some(h => h.trim())) {
          throw new Error('At least one headline is required');
        }
        if (!descriptions.some(d => d.trim())) {
          throw new Error('At least one description is required');
        }
      }

      if (type === 'IMAGE' && !imageUrl) {
        throw new Error('Image URL is required');
      }

      if (type === 'VIDEO' && !videoId) {
        throw new Error('Video ID is required');
      }

      if (!finalUrls.some(url => url.trim())) {
        throw new Error('At least one final URL is required');
      }

      const data = {
        type,
        headlines: headlines.filter(h => h.trim()),
        descriptions: descriptions.filter(d => d.trim()),
        finalUrls: finalUrls.filter(url => url.trim()),
        path1: path1.trim() || undefined,
        path2: path2.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        videoId: videoId.trim() || undefined
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ad');
      console.error('Error saving ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const addHeadline = () => {
    setHeadlines([...headlines, '']);
  };

  const removeHeadline = (index: number) => {
    setHeadlines(headlines.filter((_, i) => i !== index));
  };

  const updateHeadline = (index: number, value: string) => {
    setHeadlines(headlines.map((h, i) => i === index ? value : h));
  };

  const addDescription = () => {
    setDescriptions([...descriptions, '']);
  };

  const removeDescription = (index: number) => {
    setDescriptions(descriptions.filter((_, i) => i !== index));
  };

  const updateDescription = (index: number, value: string) => {
    setDescriptions(descriptions.map((d, i) => i === index ? value : d));
  };

  const addFinalUrl = () => {
    setFinalUrls([...finalUrls, '']);
  };

  const removeFinalUrl = (index: number) => {
    setFinalUrls(finalUrls.filter((_, i) => i !== index));
  };

  const updateFinalUrl = (index: number, value: string) => {
    setFinalUrls(finalUrls.map((url, i) => i === index ? value : url));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Ad Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Ad['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={!!ad} // Can't change type after creation
        >
          {AD_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {(type === 'TEXT' || type === 'RESPONSIVE_SEARCH') && (
        <>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Headlines
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeadline}
                disabled={headlines.length >= (type === 'RESPONSIVE_SEARCH' ? 15 : 1)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Headline
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {headlines.map((headline, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => updateHeadline(index, e.target.value)}
                    maxLength={30}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Headline ${index + 1}`}
                  />
                  {(type === 'RESPONSIVE_SEARCH' || index > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeHeadline(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Descriptions
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDescription}
                disabled={descriptions.length >= (type === 'RESPONSIVE_SEARCH' ? 4 : 1)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Description
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {descriptions.map((description, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    maxLength={90}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Description ${index + 1}`}
                  />
                  {(type === 'RESPONSIVE_SEARCH' || index > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeDescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Path 1 (Optional)
              </label>
              <input
                type="text"
                value={path1}
                onChange={(e) => setPath1(e.target.value)}
                maxLength={15}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., products"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Path 2 (Optional)
              </label>
              <input
                type="text"
                value={path2}
                onChange={(e) => setPath2(e.target.value)}
                maxLength={15}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., shoes"
              />
            </div>
          </div>
        </>
      )}

      {type === 'IMAGE' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="https://example.com/image.jpg"
          />
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Ad preview"
                className="h-40 w-auto object-contain rounded"
                onError={() => setError('Invalid image URL')}
              />
            </div>
          )}
        </div>
      )}

      {type === 'VIDEO' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Video ID
            </label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter YouTube video ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Headline
            </label>
            <input
              type="text"
              value={headlines[0] || ''}
              onChange={(e) => setHeadlines([e.target.value])}
              maxLength={30}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Video headline"
            />
          </div>
        </>
      )}

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Final URLs
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFinalUrl}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {finalUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateFinalUrl(index, e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeFinalUrl(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : (ad ? 'Update Ad' : 'Create Ad')}
        </Button>
      </div>
    </form>
  );
}