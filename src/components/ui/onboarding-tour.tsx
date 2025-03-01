import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ steps, onComplete, isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target);
      setTargetElement(element);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isOpen, steps]);

  if (!isOpen || !targetElement) return null;

  const step = steps[currentStep];
  const rect = targetElement.getBoundingClientRect();

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const getPopoverPosition = () => {
    const spacing = 12;
    switch (step.placement) {
      case 'top':
        return {
          top: rect.top - spacing,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: rect.bottom + spacing,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - spacing,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + spacing,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: rect.bottom + spacing,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        };
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl p-4 max-w-sm"
        style={getPopoverPosition()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
          <div className="mt-2 text-sm text-gray-500">{step.content}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: steps.length }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}