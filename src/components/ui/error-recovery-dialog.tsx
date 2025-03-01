import { useState } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, X } from 'lucide-react';
import { Button } from './button';
import type { Operation } from '../../lib/operation-manager';

interface ErrorRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: Operation;
  onRetry: () => void;
  onRollback: () => void;
  isLoading?: boolean;
}

export function ErrorRecoveryDialog({
  isOpen,
  onClose,
  operation,
  onRetry,
  onRollback,
  isLoading
}: ErrorRecoveryDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Operation Failed</h3>
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
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-gray-900">
                The operation "{operation.type}" has failed.
              </p>
              
              {operation.error && (
                <button
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide error details' : 'Show error details'}
                </button>
              )}
            </div>
          </div>

          {showDetails && operation.error && (
            <div className="mt-4 bg-red-50 rounded-md p-4">
              <p className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                {operation.error.message}
              </p>
            </div>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900">Operation Details</h4>
            <dl className="mt-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-gray-900">{operation.status}</dd>
                <dt className="text-gray-500">Start Time</dt>
                <dd className="text-gray-900">
                  {operation.startTime?.toLocaleString()}
                </dd>
                <dt className="text-gray-500">End Time</dt>
                <dd className="text-gray-900">
                  {operation.endTime?.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {operation.rollbackSteps.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Rollback Steps</h4>
              <ul className="mt-2 space-y-2">
                {operation.rollbackSteps.map(step => (
                  <li key={step.id} className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status}
                    </span>
                    <span className="ml-2">{step.description}</span>
                    {step.error && (
                      <p className="mt-1 text-xs text-red-600">{step.error.message}</p>
                    )}
                  </li>
                ))}
              </ul>
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
            Close
          </Button>
          <Button
            variant="outline"
            onClick={onRollback}
            disabled={isLoading || operation.status === 'rolled_back'}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback
          </Button>
          <Button
            onClick={onRetry}
            disabled={isLoading}
            loading={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Operation
          </Button>
        </div>
      </div>
    </div>
  );
}