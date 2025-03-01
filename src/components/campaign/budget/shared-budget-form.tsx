import { useState } from 'react';
import { Button } from '../../ui/button';
import type { SharedBudget } from '../../../lib/shared-budget-api';

interface SharedBudgetFormProps {
  budget?: SharedBudget;
  onSubmit: (name: string, amount: number) => void;
  onCancel: () => void;
}

export function SharedBudgetForm({ budget, onSubmit, onCancel }: SharedBudgetFormProps) {
  const [name, setName] = useState(budget?.name || '');
  const [amount, setAmount] = useState(
    budget ? parseInt(budget.amountMicros) / 1_000_000 : 0
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Budget name is required');
      return;
    }

    if (amount <= 0) {
      setError('Budget amount must be greater than 0');
      return;
    }

    onSubmit(name, amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Budget Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter budget name"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Daily Budget Amount (USD)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => {
              setAmount(Number(e.target.value));
              setError(null);
            }}
            step="0.01"
            min="0"
            className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">
          {budget ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}