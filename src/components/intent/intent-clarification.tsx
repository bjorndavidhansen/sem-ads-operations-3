import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '../ui/button';

interface IntentClarificationProps {
  isOpen: boolean;
  onClose: () => void;
  intent: any;
  alternatives: Array<{
    operation: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
  onConfirm: (selectedIntent: any) => void;
}

export function IntentClarification({
  isOpen,
  onClose,
  intent,
  alternatives,
  onConfirm
}: IntentClarificationProps) {
  const [selectedIntent, setSelectedIntent] = useState(intent);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Confirm Intent</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-gray-900">
                Please confirm your intended action:
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {/* Primary intent */}
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer ${
                selectedIntent === intent
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedIntent(intent)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {intent.operation}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Confidence: {(intent.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                {selectedIntent === intent && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="mt-2">
                <h5 className="text-xs font-medium text-gray-700">Parameters:</h5>
                <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(intent.parameters, null, 2)}
                </pre>
              </div>
            </div>

            {/* Alternative intents */}
            {alternatives.map((alt, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 cursor-pointer ${
                  selectedIntent === alt
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedIntent(alt)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {alt.operation}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Confidence: {(alt.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  {selectedIntent === alt && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="mt-2">
                  <h5 className="text-xs font-medium text-gray-700">Parameters:</h5>
                  <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(alt.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedIntent)}
          >
            Confirm Action
          </Button>
        </div>
      </div>
    </div>
  );
}