import { useState } from 'react';
import { Users, Search, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';

interface Audience {
  id: string;
  name: string;
  type: 'IN_MARKET' | 'AFFINITY' | 'CUSTOM' | 'REMARKETING';
  bidModifier?: number;
}

interface AudienceTargetingProps {
  audiences: Audience[];
  onChange: (audiences: Audience[]) => void;
  disabled?: boolean;
}

const AUDIENCE_TYPES = [
  { value: 'IN_MARKET', label: 'In-market' },
  { value: 'AFFINITY', label: 'Affinity' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'REMARKETING', label: 'Remarketing' },
] as const;

export function AudienceTargeting({ audiences, onChange, disabled }: AudienceTargetingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof AUDIENCE_TYPES[number]['value']>('IN_MARKET');

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual Google Ads API
      const results: Audience[] = [
        { id: '1', name: 'Auto Enthusiasts', type: 'AFFINITY' },
        { id: '2', name: 'In-Market for Cars', type: 'IN_MARKET' },
        { id: '3', name: 'Recent Site Visitors', type: 'REMARKETING' },
      ].filter(
        aud =>
          aud.name.toLowerCase().includes(query.toLowerCase()) &&
          aud.type === selectedType
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching audiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAudience = (audience: Audience) => {
    onChange([...audiences, { ...audience, bidModifier: 0 }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAudience = (audienceId: string) => {
    onChange(audiences.filter(aud => aud.id !== audienceId));
  };

  const updateBidModifier = (audienceId: string, bidModifier: number) => {
    onChange(
      audiences.map(aud =>
        aud.id === audienceId ? { ...aud, bidModifier } : aud
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as typeof AUDIENCE_TYPES[number]['value'])}
          className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled}
        >
          {AUDIENCE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder={`Search ${selectedType.toLowerCase()} audiences...`}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={disabled}
          />
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-200">
            {searchResults.map((result) => (
              <li
                key={result.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {result.name}
                  </p>
                  <p className="text-sm text-gray-500">{result.type}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => addAudience(result)}
                  disabled={disabled || audiences.some(a => a.id === result.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {audiences.length > 0 ? (
          audiences.map((audience) => (
            <div
              key={audience.id}
              className="flex items-center justify-between p-4 rounded-md border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {audience.name}
                  </p>
                  <p className="text-xs text-gray-500">{audience.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Bid adjustment:</label>
                  <input
                    type="number"
                    value={audience.bidModifier || 0}
                    onChange={(e) =>
                      updateBidModifier(audience.id, Number(e.target.value))
                    }
                    min="-90"
                    max="900"
                    step="1"
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <button
                  onClick={() => removeAudience(audience.id)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No audiences added. Search and add audiences above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}