import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Power, Tag, Hash } from 'lucide-react';
import { Button } from '../../ui/button';
import { keywordApi, type Keyword } from '../../../lib/keyword-api';
import { KeywordForm } from './keyword-form';
import { NegativeKeywordList } from './negative-keyword-list';

interface KeywordListProps {
  adGroupId: string;
}

export function KeywordList({ adGroupId }: KeywordListProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [showNegatives, setShowNegatives] = useState(false);

  useEffect(() => {
    loadKeywords();
  }, [adGroupId]);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await keywordApi.listKeywords(adGroupId);
      setKeywords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load keywords');
      console.error('Error loading keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeyword = async (input: any) => {
    try {
      setError(null);
      await keywordApi.createKeyword({
        ...input,
        adGroupId
      });
      await loadKeywords();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create keyword');
      console.error('Error creating keyword:', err);
    }
  };

  const handleUpdateKeyword = async (id: string, input: any) => {
    try {
      setError(null);
      await keywordApi.updateKeyword(id, input);
      await loadKeywords();
      setEditingKeyword(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update keyword');
      console.error('Error updating keyword:', err);
    }
  };

  const handleToggleStatus = async (keyword: Keyword) => {
    try {
      setTogglingStatus(keyword.id);
      setError(null);
      await keywordApi.updateKeyword(keyword.id, {
        status: keyword.status === 'ENABLED' ? 'PAUSED' : 'ENABLED'
      });
      await loadKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle keyword status');
      console.error('Error toggling keyword status:', err);
    } finally {
      setTogglingStatus(null);
    }
  };

  const getMatchTypeColor = (matchType: Keyword['matchType']) => {
    switch (matchType) {
      case 'EXACT':
        return 'bg-blue-100 text-blue-800';
      case 'PHRASE':
        return 'bg-green-100 text-green-800';
      case 'BROAD':
        return 'bg-purple-100 text-purple-800';
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
        <h4 className="text-sm font-medium text-gray-900">Keywords</h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNegatives(!showNegatives)}
          >
            {showNegatives ? 'Show Keywords' : 'Show Negatives'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
        </div>
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

      {showNegatives ? (
        <NegativeKeywordList adGroupId={adGroupId} />
      ) : (
        <>
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <KeywordForm
                onSubmit={handleCreateKeyword}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          <div className="space-y-2">
            {keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(keyword)}
                        disabled={togglingStatus === keyword.id}
                        className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          keyword.status === 'ENABLED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <Power className={`h-3 w-3 ${togglingStatus === keyword.id ? 'animate-spin' : ''}`} />
                        {keyword.status}
                      </button>
                      <Hash className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {keyword.text}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(keyword.matchType)}`}>
                        {keyword.matchType}
                      </span>
                      {keyword.labels.length > 0 && (
                        <div className="flex items-center gap-1">
                          {keyword.labels.map((label, index) => (
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
                        onClick={() => setEditingKeyword(keyword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateKeyword(keyword.id, { status: 'REMOVED' })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {keyword.metrics && (
                    <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Clicks:</span>{' '}
                        {keyword.metrics.clicks.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Impressions:</span>{' '}
                        {keyword.metrics.impressions.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span>{' '}
                        ${(keyword.metrics.cost / 1_000_000).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Avg. Position:</span>{' '}
                        {keyword.metrics.averagePosition.toFixed(1)}
                      </div>
                    </div>
                  )}

                  {editingKeyword?.id === keyword.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <KeywordForm
                        keyword={keyword}
                        onSubmit={(input) => handleUpdateKeyword(keyword.id, input)}
                        onCancel={() => setEditingKeyword(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {keywords.length === 0 && !showCreateForm && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Hash className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No keywords added. Click "Add Keyword" to get started.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}