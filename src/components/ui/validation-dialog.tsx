import { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from './button';

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: {
    type: 'info' | 'warning' | 'error';
    message: string;
  }[];
  impact?: {
    description: string;
    metrics?: {
      label: string;
      value: string;
      change: number;
    }[];
  };
}

interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  validation: ValidationResult;
  isLoading?: boolean;
}

export function ValidationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  validation,
  isLoading
}: ValidationDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="flex items-start">
            {validation.valid ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            )}
            <div className="ml-3">
              <p className="text-sm text-gray-900">{validation.message}</p>
              
              {validation.details && validation.details.length > 0 && (
                <button
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              )}
            </div>
          </div>

          {showDetails && validation.details && (
            <div className="mt-4 space-y-3">
              {validation.details.map((detail, index) => (
                <div
                  key={index}
                  className={`rounded-md p-3 ${
                    detail.type === 'error' ? 'bg-red-50 text-red-700' :
                    detail.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-blue-50 text-blue-700'
                  }`}
                >
                  {detail.message}
                </div>
              ))}
            </div>
          )}

          {validation.impact && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Impact Analysis</h4>
              <p className="mt-1 text-sm text-gray-500">
                {validation.impact.description}
              </p>
              {validation.impact.metrics && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {validation.impact.metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">{metric.label}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {metric.value}
                        </span>
                        <span className={`text-xs font-medium ${
                          metric.change > 0 ? 'text-green-600' :
                          metric.change < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!validation.valid || isLoading}
            loading={isLoading}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}