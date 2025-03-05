import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface SimpleProgressTrackerProps {
  progress: number;
  status: string;
}

export function ProgressTracker({ progress, status }: SimpleProgressTrackerProps) {
  return (
    <div className="space-y-4">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {status}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        {progress < 100 ? (
          <Clock className="h-5 w-5 text-blue-500 animate-spin mr-2" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        )}
        <span className="text-sm text-gray-600">
          {progress < 100 ? status : 'Operation complete'}
        </span>
      </div>
    </div>
  );
}