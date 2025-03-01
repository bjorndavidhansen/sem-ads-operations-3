import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import type { CreateSharedBudgetInput, SharedBudget, UpdateSharedBudgetInput } from '../../lib/google-ads-api';

interface SharedBudgetFormProps {
  onSubmit: (data: CreateSharedBudgetInput | UpdateSharedBudgetInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  budget?: SharedBudget;
  selectedCampaignIds?: string[];
}

export function SharedBudgetForm({ onSubmit, onCancel, isLoading, budget, selectedCampaignIds }: SharedBudgetFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateSharedBudgetInput>({
    defaultValues: budget ? {
      name: budget.name,
      amount: parseInt(budget.amountMicros) / 1_000_000,
    } : {
      name: '',
      amount: 0,
      campaignIds: selectedCampaignIds,
    }
  });

  const handleFormSubmit = async (data: CreateSharedBudgetInput | UpdateSharedBudgetInput) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {budget ? 'Edit Shared Budget' : 'Create Shared Budget'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Budget Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Budget name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
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
              step="0.01"
              min="0"
              {...register('amount', {
                required: 'Budget amount is required',
                min: { value: 0.01, message: 'Budget must be greater than $0' }
              })}
              className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {selectedCampaignIds && selectedCampaignIds.length > 0 && (
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              This budget will be shared among {selectedCampaignIds.length} selected campaign{selectedCampaignIds.length === 1 ? '' : 's'}.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (budget ? 'Saving...' : 'Creating...') : (budget ? 'Save Changes' : 'Create Shared Budget')}
        </Button>
      </div>
    </form>
  );
}