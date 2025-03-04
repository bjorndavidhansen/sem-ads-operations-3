import React, { useState, useEffect } from 'react';
import { useOperationTracking, OperationProgress, OperationStatus } from '../../hooks/use-operation-tracking';
import OperationProgressBar from './operation-progress';

interface OperationsDashboardProps {
  className?: string;
  filter?: {
    status?: OperationStatus[];
    type?: string[];
  };
  limit?: number;
  showDetails?: boolean;
  refreshInterval?: number; // in milliseconds
  onCancelOperation?: (operationId: string) => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  className = '',
  filter,
  limit = 10,
  showDetails = false,
  refreshInterval = 5000,
  onCancelOperation,
}) => {
  const { getAllOperations } = useOperationTracking();
  const [operations, setOperations] = useState<OperationProgress[]>([]);
  const [statusFilter, setStatusFilter] = useState<OperationStatus[]>(
    filter?.status || ['in_progress', 'pending']
  );

  // Fetch operations periodically
  useEffect(() => {
    const fetchOperations = () => {
      let allOperations = getAllOperations();
      
      // Apply filters
      if (statusFilter.length > 0) {
        allOperations = allOperations.filter(op => statusFilter.includes(op.status));
      }
      
      if (filter?.type && filter.type.length > 0) {
        allOperations = allOperations.filter(op => filter.type?.includes(op.type));
      }
      
      // Sort: in_progress first, then by start time (newest first)
      allOperations.sort((a, b) => {
        // First sort by status (in_progress first)
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
        
        // Then sort by start time (newest first)
        return b.startTime.getTime() - a.startTime.getTime();
      });
      
      // Apply limit
      if (limit > 0) {
        allOperations = allOperations.slice(0, limit);
      }
      
      setOperations(allOperations);
    };
    
    // Initial fetch
    fetchOperations();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchOperations, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [getAllOperations, statusFilter, filter, limit, refreshInterval]);

  const handleCancelOperation = (operationId: string) => {
    if (onCancelOperation) {
      onCancelOperation(operationId);
    }
  };

  const toggleStatusFilter = (status: OperationStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <h2 className="text-lg font-medium mr-4">Operations</h2>
        
        <div className="flex flex-wrap gap-2">
          {(['pending', 'in_progress', 'completed', 'failed', 'cancelled'] as OperationStatus[]).map(status => (
            <button
              key={status}
              onClick={() => toggleStatusFilter(status)}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter.includes(status)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {operations.length === 0 ? (
        <div className="text-gray-500 p-4 text-center border border-gray-200 rounded-lg">
          No operations found matching the selected filters
        </div>
      ) : (
        <div className="space-y-4">
          {operations.map(operation => (
            <OperationProgressBar
              key={operation.operationId}
              operationId={operation.operationId}
              showDetails={showDetails}
              onCancel={() => handleCancelOperation(operation.operationId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OperationsDashboard;
