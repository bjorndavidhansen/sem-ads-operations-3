import React, { useState } from 'react';
import { useOperationTracking, OperationProgress, OperationLog } from '../../hooks/use-operation-tracking';

interface OperationProgressProps {
  operationId: string;
  showDetails?: boolean;
  onCancel?: () => void;
  className?: string;
}

export const OperationProgressBar: React.FC<OperationProgressProps> = ({
  operationId,
  showDetails = false,
  onCancel,
  className = '',
}) => {
  const { operation } = useOperationTracking(operationId);
  const [expandedLogs, setExpandedLogs] = useState(false);

  if (!operation) {
    return <div className={`text-gray-500 ${className}`}>Operation not found</div>;
  }

  const formatTime = (seconds?: number): string => {
    if (seconds === undefined) return 'Calculating...';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDuration = (start: Date, end?: Date): string => {
    const endTime = end || new Date();
    const durationMs = endTime.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    return formatTime(seconds);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getLogIcon = (level: string): string => {
    switch (level) {
      case 'error':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🔍';
      default:
        return '•';
    }
  };

  const renderLogs = (logs: OperationLog[], limit = 5) => {
    const filteredLogs = expandedLogs 
      ? logs 
      : logs.filter(log => log.level === 'error' || log.level === 'warning').slice(-limit);
    
    if (filteredLogs.length === 0) {
      return <div className="text-gray-500 italic">No logs to display</div>;
    }

    return (
      <div className="mt-2 text-sm">
        {filteredLogs.map((log, index) => (
          <div key={index} className={`mb-1 ${log.level === 'error' ? 'text-red-600' : log.level === 'warning' ? 'text-amber-600' : 'text-gray-700'}`}>
            <span className="mr-1">{getLogIcon(log.level)}</span>
            <span className="text-gray-500 mr-2">{log.timestamp.toLocaleTimeString()}</span>
            {log.message}
            {log.details && (
              <details className="ml-6 mt-1 text-xs">
                <summary className="cursor-pointer">Details</summary>
                <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {logs.length > limit && !expandedLogs && (
          <button 
            onClick={() => setExpandedLogs(true)}
            className="text-blue-600 hover:underline text-xs mt-1"
          >
            Show all logs ({logs.length})
          </button>
        )}
        
        {expandedLogs && (
          <button 
            onClick={() => setExpandedLogs(false)}
            className="text-blue-600 hover:underline text-xs mt-1"
          >
            Show fewer logs
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-medium">{operation.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <p className="text-sm text-gray-500">
            Started {operation.startTime.toLocaleString()}
            {operation.endTime && ` • Completed ${operation.endTime.toLocaleString()}`}
            {!operation.endTime && operation.estimatedTimeRemaining !== undefined && 
              ` • Est. remaining: ${formatTime(operation.estimatedTimeRemaining)}`
            }
            {operation.endTime && ` • Duration: ${formatDuration(operation.startTime, operation.endTime)}`}
          </p>
        </div>
        
        {operation.status === 'in_progress' && onCancel && (
          <button 
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="relative pt-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {operation.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block">
              {Math.round(operation.progress)}%
            </span>
          </div>
        </div>
        
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 mt-1">
          <div 
            style={{ width: `${operation.progress}%` }} 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getStatusColor(operation.status)}`}
          ></div>
        </div>
        
        {operation.totalItems !== undefined && (
          <div className="text-xs text-gray-500 mb-2">
            {operation.processedItems || 0} of {operation.totalItems} items processed
          </div>
        )}
      </div>
      
      {operation.error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <div className="font-medium">Error: {operation.error.message}</div>
          {operation.error.details && (
            <details className="mt-1">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="bg-red-100 p-2 rounded mt-1 overflow-x-auto text-xs">
                {typeof operation.error.details === 'string' 
                  ? operation.error.details 
                  : JSON.stringify(operation.error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
      
      {showDetails && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-1">Operation Logs</h4>
          {renderLogs(operation.logs)}
          
          {operation.metadata && (
            <>
              <h4 className="text-sm font-medium mt-3 mb-1">Operation Details</h4>
              <div className="bg-gray-50 p-2 rounded text-xs">
                <pre className="overflow-x-auto">
                  {JSON.stringify(operation.metadata, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationProgressBar;
