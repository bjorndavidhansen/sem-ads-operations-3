import { useState, useRef, useEffect } from 'react';
import { Search, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { intentParser } from '../../lib/intent-parser';

interface IntentInputProps {
  onSubmit: (intent: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function IntentInput({ onSubmit, onCancel, isLoading }: IntentInputProps) {
  const [input, setInput] = useState('');
  const [parsedIntent, setParsedIntent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    'Copy campaign "Summer Sale 2024"',
    'Convert all keywords to exact match',
    'Create bidding strategy with target CPA of $50',
    'Create bidding strategy with target ROAS of 400%'
  ];

  useEffect(() => {
    if (input) {
      const result = intentParser.parseIntent(input);
      if (result && result.confidence > 0.7) {
        setParsedIntent(result);
        setError(null);
      } else {
        setParsedIntent(null);
        setError('Could not understand intent. Please try rephrasing or use one of the suggestions.');
      }
    } else {
      setParsedIntent(null);
      setError(null);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedIntent) return;

    onSubmit(parsedIntent);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="intent"
            className="block text-sm font-medium text-gray-700"
          >
            What would you like to do?
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              id="intent"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your intent..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>
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

        {parsedIntent && (
          <div className="rounded-md bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-700">Parsed Intent</h4>
            <div className="mt-2 text-sm text-blue-700">
              <div>Operation: {parsedIntent.operation}</div>
              <div>Parameters: {JSON.stringify(parsedIntent.parameters, null, 2)}</div>
              <div>Confidence: {(parsedIntent.confidence * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!parsedIntent || isLoading}
            loading={isLoading}
          >
            Execute
          </Button>
        </div>
      </form>

      {showSuggestions && (
        <div className="bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Suggestions
            </h4>
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}