import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';
import type { Keyword } from '../../../lib/keyword-api';

interface KeywordFormProps {
  keyword?: Keyword;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const MATCH_TYPES = [
  { value: 'EXACT', label: 'Exact Match' },
  { value: 'PHRASE', label: 'Phrase Match' },
  { value: 'BROAD', label: 'Broad Match' }
] as const;

export function KeywordForm({ keyword, onSubmit, onCancel }: KeywordFormProps) {
  const [text, setText] = useState(keyword?.text || '');
  const [matchType, setMatchType] = useState<Keyword['matchType']>(keyword?.matchType || 'BROAD');
  const [cpcBid, setCpcBid] = useState(keyword?.cpcBidMicros ? 
    (parseInt(keyword.cpcBidMicros) / 1_000_000).toString() : '');
  const [labels, setLabels] = useState<string[]>(keyword?.labels || []);
  const [newLabel, setNewLabel] = useState('');
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
        matchType,
        cpcBidMicros: cpcBid ? (parseFloat(cpcBid) * 1_000_000).toString() : undefined,
        labels
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save keyword');
      console.error('Error saving keyword:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLabel = () => {
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
    }
    setNewLabel('');
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
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
          Keyword Text
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
          onChange={(e) => setMatchType(e.target.value as Keyword['matchType'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {MATCH_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cpcBid" className="block text-sm font-medium text-gray-700">
          Max CPC Bid (USD)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="cpcBid"
            value={cpcBid}
            onChange={(e) => setCpcBid(e.target.value)}
            step="0.01"
            min="0"
            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Labels
        </label>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter label"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addLabel}
              disabled={!newLabel.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
          {loading ? 'Saving...' : (keyword ? 'Update Keyword' : 'Add Keyword')}
        </Button>
      </div>
    </form>
  );
}