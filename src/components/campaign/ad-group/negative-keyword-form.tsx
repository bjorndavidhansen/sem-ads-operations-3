import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import type { NegativeKeyword } from '../../../lib/keyword-api';

interface NegativeKeywordFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MATCH_TYPES = [
  { value: 'EXACT', label: 'Exact Match' },
  { value: 'PHRASE', label: 'Phrase Match' },
  { value: 'BROAD', label: 'Broad Match' }
] as const;

export function NegativeKeywordForm({ onSubmit, onCancel }: NegativeKeywordFormProps) {
  const [text, setText] = useState('');
  const [matchType, setMatchType] = useState<NegativeKeyword['matchType']>('BROAD');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!text.trim()) {
        throw new Error('Keyword text is required');
      }

      const data = {
        text: text.trim(),
        matchType
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save negative keyword');
      console.error('Error saving negative keyword:', err);
    } finally {
      setLoading(false);
    }
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
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">
          Negative Keyword Text
        </label>
        <input
          type="text"
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="matchType" className="block text-sm font-medium text-gray-700">
          Match Type
        </label>
        <select
          id="matchType"
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as NegativeKeyword['matchType'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {MATCH_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
          {loading ? 'Adding...' : 'Add Negative Keyword'}
        </Button>
      </div>
    </form>
  );
}