import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number; // in milliseconds
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep: string;
  onStepComplete?: (stepId: string) => void;
  onError?: (stepId: string, error: string) => void;
}

export function ProgressTracker({ steps, currentStep, onStepComplete, onError }: ProgressTrackerProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Calculate overall progress
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const totalSteps = steps.length;
    setProgress((completedSteps / totalSteps) * 100);

    // Calculate estimated time remaining
    const remainingSteps = steps.filter(s => s.status === 'pending' || s.status === 'processing');
    const totalRemainingTime = remainingSteps.reduce((acc, step) => acc + (step.estimatedDuration || 0), 0);
    setTimeRemaining(totalRemainingTime);
  }, [steps]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              Progress
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

      {/* Time remaining */}
      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="text-sm text-gray-500">
          Estimated time remaining: {formatDuration(timeRemaining)}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              step.id === currentStep ? 'bg-blue-50 -mx-4 px-4 py-2 rounded-lg' : ''
            }`}
          >
            <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-700' :
                  step.status === 'processing' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {step.startTime && (
                  <span className="text-xs text-gray-500">
                    {step.endTime ? (
                      `${formatDuration(step.endTime.getTime() - step.startTime.getTime())}`
                    ) : (
                      'In progress...'
                    )}
                  </span>
                )}
              </div>
              {step.error && (
                <p className="mt-1 text-sm text-red-600">
                  {step.error}
                </p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="absolute left-0 ml-2.5 w-0.5 h-full bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}