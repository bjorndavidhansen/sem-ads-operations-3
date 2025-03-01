import { useState, useEffect } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { googleAdsApi, type SharedBudget } from '../../lib/google-ads-api';
import { supabase } from '../../lib/supabase';

interface SharedBudgetSelectorProps {
  onSelect: (budgetId: string | null) => void;
  onCreateNew: () => void;
  selectedBudgetId?: string;
  disabled?: boolean;
}

export function SharedBudgetSelector({ onSelect, onCreateNew, selectedBudgetId, disabled }: SharedBudgetSelectorProps) {
  const [budgets, setBudgets] = useState<SharedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedBudgets() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: account } = await supabase
          .from('google_ads_accounts')
          .select('google_customer_id')
          .eq('user_id', user.id)
          .single();

        if (!account) throw new Error('No Google Ads account found');

        const response = await googleAdsApi.listSharedBudgets(account.google_customer_id);
        setBudgets(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shared budgets');
        console.error('Error fetching shared budgets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedBudgets();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading shared budgets...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Shared Budgets</h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCreateNew}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          disabled={disabled}
          className={`w-full text-left px-4 py-2 rounded-md border ${
            !selectedBudgetId
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          Individual budget (not shared)
        </button>

        {budgets.map((budget) => (
          <button
            key={budget.id}
            type="button"
            onClick={() => onSelect(budget.id)}
            disabled={disabled}
            className={`w-full text-left px-4 py-2 rounded-md border ${
              selectedBudgetId === budget.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{budget.name}</span>
              <span className="flex items-center text-sm text-gray-500">
                <DollarSign className="h-4 w-4 mr-1" />
                {(parseInt(budget.amountMicros) / 1_000_000).toFixed(2)}
              </span>
            </div>
            {budget.campaigns.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Used by {budget.campaigns.length} campaign{budget.campaigns.length === 1 ? '' : 's'}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}