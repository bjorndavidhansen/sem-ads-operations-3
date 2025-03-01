import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Hash } from 'lucide-react';
import { Button } from '../../ui/button';
import { keywordApi, type NegativeKeyword } from '../../../lib/keyword-api';
import { NegativeKeywordForm } from './negative-keyword-form';

interface NegativeKeywordListProps {
  adGroupId: string;
}

export function NegativeKeywordList({ adGroupId }: NegativeKeywordListProps) {
  const [keywords, setKeywords] = useState<NegativeKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadKeywords();
  }, [adGroupId]);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await keywordApi.listNegativeKeywords(adGroupId);
      setKeywords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load negative keywords');
      console.error('Error loading negative keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeyword = async (input: any) => {
    try {
      setError(null);
      await keywordApi.createNegativeKeyword({
        ...input,
        adGroupId
      });
      await loadKeywords();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create negative keyword');
      console.error('Error creating negative keyword:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      setError(null);
      await keywordApi.deleteNegativeKeyword(id);
      await loadKeywords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete negative keyword');
      console.error('Error deleting negative keyword:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getMatchTypeColor = (matchType: NegativeKeyword['matchType']) => {
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
          <NegativeKeywordForm
            onSubmit={handleCreateKeyword}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Negative
        </Button>
      </div>

      <div className="space-y-2">
        {keywords.map((keyword) => (
          <div
            key={keyword.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-red-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {keyword.text}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(keyword.matchType)}`}>
                    {keyword.matchType}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(keyword.id)}
                  disabled={deleting === keyword.id}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}