import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface BudgetEditorProps {
  initialBudget: number;
  onSave: (newBudget: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BudgetEditor({ initialBudget, onSave, onCancel, isLoading }: BudgetEditorProps) {
  const [budget, setBudget] = useState(initialBudget.toString());
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBudget = parseFloat(budget);
    if (isNaN(newBudget) || newBudget <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    onSave(newBudget);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <input
          type="number"
          value={budget}
          onChange={(e) => {
            setBudget(e.target.value);
            setError(null);
          }}
          step="0.01"
          min="0"
          disabled={isLoading}
          className={`pl-5 block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            error ? 'border-red-300' : ''
          }`}
        />
        {error && (
          <div className="absolute left-0 top-full mt-1 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={isLoading}
          className={`p-1 rounded-md text-white ${
            isLoading
              ? 'bg-gray-400'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="p-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}