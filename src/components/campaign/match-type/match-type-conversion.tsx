import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '../../ui/button';

export type KeywordMatchType = 'EXACT' | 'PHRASE' | 'BROAD';

interface MatchTypeConversionProps {
  onConvert: (targetMatchType: KeywordMatchType) => void;
  disabled?: boolean;
}

export function MatchTypeConversion({ onConvert, disabled }: MatchTypeConversionProps) {
  const [targetMatchType, setTargetMatchType] = useState<KeywordMatchType>('EXACT');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Match Type Conversion</h3>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Match Type
            </label>
            <select
              value={targetMatchType}
              onChange={(e) => setTargetMatchType(e.target.value as KeywordMatchType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={disabled}
            >
              <option value="EXACT">Exact Match</option>
              <option value="PHRASE">Phrase Match</option>
              <option value="BROAD">Broad Match</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {targetMatchType === 'EXACT' && (
                'Convert all keywords to exact match for precise targeting.'
              )}
              {targetMatchType === 'PHRASE' && (
                'Convert all keywords to phrase match for flexible word order matching.'
              )}
              {targetMatchType === 'BROAD' && (
                'Convert all keywords to broad match for maximum reach.'
              )}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => onConvert(targetMatchType)}
              disabled={disabled}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Convert Match Types
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}