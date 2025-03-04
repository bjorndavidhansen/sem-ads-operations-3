import React from 'react';
import { useOperationTracking, OperationProgress } from '../../hooks/use-operation-tracking';
import { cn } from '../../lib/utils';
import { Progress } from './progress';
import { AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react';

interface OperationProgressBarProps {
  operationId: string;
  showDetails?: boolean;
  className?: string;
}

export function OperationProgressBar({
  operationId,
  showDetails = false,
  className
}: OperationProgressBarProps) {
  const { operation } = useOperationTracking(operationId);

  if (!operation) {
    return null;
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <OperationStatusIcon operation={operation} />
          <span className="font-medium">
            {getOperationTitle(operation)}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {operation.progress}%
        </span>
      </div>
      
      <Progress value={operation.progress} className="h-2" />
      
      {showDetails && (
        <div className="mt-2 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <div>Started: {formatDate(operation.startTime)}</div>
            {operation.endTime && (
              <div>Ended: {formatDate(operation.endTime)}</div>
            )}
            <div>Status: {formatStatus(operation.status)}</div>
            {operation.error && (
              <div className="col-span-2 text-destructive">
                Error: {operation.error.message}
              </div>
            )}
          </div>
          
          {operation.logs.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recent Activity</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {operation.logs.slice(-5).reverse().map((log, index) => (
                  <li key={index} className={cn(
                    "py-1 px-2 rounded text-xs",
                    log.level === 'error' && "bg-destructive/10 text-destructive",
                    log.level === 'warning' && "bg-warning/10 text-warning",
                    log.level === 'info' && "bg-muted"
                  )}>
                    <span className="text-muted-foreground mr-2">
                      {formatTime(log.timestamp)}
                    </span>
                    {log.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OperationStatusIcon({ operation }: { operation: OperationProgress }) {
  switch (operation.status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function getOperationTitle(operation: OperationProgress): string {
  switch (operation.type) {
    case 'campaign_clone':
      return 'Campaign Clone Operation';
    case 'match_type_conversion':
      return 'Match Type Conversion';
    case 'bulk_operation':
      return 'Bulk Operation';
    default:
      return 'Operation';
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString() + ' ' + formatTime(date);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Component for showing a list of active operations
export function ActiveOperations() {
  const { getAllOperations } = useOperationTracking();
  const operations = getAllOperations().filter(op => 
    op.status === 'pending' || op.status === 'in_progress'
  );
  
  if (operations.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-lg p-4 space-y-4">
      <h3 className="font-semibold">Active Operations ({operations.length})</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {operations.map(op => (
          <OperationProgressBar 
            key={op.operationId} 
            operationId={op.operationId}
            showDetails
          />
        ))}
      </div>
    </div>
  );
}
