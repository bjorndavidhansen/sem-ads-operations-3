import { useState, useEffect } from 'react';
import { Search, MapPin, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';

interface Location {
  id: string;
  name: string;
  targetingStatus: 'TARGETING' | 'EXCLUSION';
  bidModifier?: number;
}

interface LocationTargetingProps {
  locations: Location[];
  onChange: (locations: Location[]) => void;
  disabled?: boolean;
}

export function LocationTargeting({ locations, onChange, disabled }: LocationTargetingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual Google Ads API
      const results = [
        { id: '1', name: 'New York, United States' },
        { id: '2', name: 'Los Angeles, United States' },
        { id: '3', name: 'Chicago, United States' },
      ].filter(loc => loc.name.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = (location: { id: string; name: string }, targeting: 'TARGETING' | 'EXCLUSION') => {
    onChange([...locations, { ...location, targetingStatus: targeting }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeLocation = (locationId: string) => {
    onChange(locations.filter(loc => loc.id !== locationId));
  };

  const updateBidModifier = (locationId: string, bidModifier: number) => {
    onChange(
      locations.map(loc =>
        loc.id === locationId ? { ...loc, bidModifier } : loc
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search locations..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={disabled}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
            <ul className="max-h-60 overflow-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate">{result.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addLocation(result, 'TARGETING')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Target
                      </button>
                      <button
                        onClick={() => addLocation(result, 'EXCLUSION')}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Exclude
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {locations.length > 0 ? (
          locations.map((location) => (
            <div
              key={location.id}
              className={`flex items-center justify-between p-3 rounded-md border ${
                location.targetingStatus === 'TARGETING'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{location.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    location.targetingStatus === 'TARGETING'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {location.targetingStatus === 'TARGETING' ? 'Targeting' : 'Excluded'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {location.targetingStatus === 'TARGETING' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Bid adjustment:</label>
                    <input
                      type="number"
                      value={location.bidModifier || 0}
                      onChange={(e) => updateBidModifier(location.id, Number(e.target.value))}
                      min="-90"
                      max="900"
                      step="1"
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      disabled={disabled}
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                )}
                <button
                  onClick={() => removeLocation(location.id)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No locations added. Search and add locations above.
          </div>
        )}
      </div>
    </div>
  );
}