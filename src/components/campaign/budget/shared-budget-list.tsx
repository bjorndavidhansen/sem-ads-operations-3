import { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Pencil, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { sharedBudgetApi, type SharedBudget } from '../../../lib/shared-budget-api';
import { SharedBudgetForm } from './shared-budget-form';

interface SharedBudgetListProps {
  accountId: string;
  onSelect?: (budgetId: string) => void;
  selectedBudgetId?: string;
}

export function SharedBudgetList({ accountId, onSelect, selectedBudgetId }: SharedBudgetListProps) {
  const [budgets, setBudgets] = useState<SharedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<SharedBudget | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadBudgets();
  }, [accountId]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sharedBudgetApi.listSharedBudgets(accountId);
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared budgets');
      console.error('Error loading shared budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name: string, amount: number) => {
    try {
      setError(null);
      const newBudget = await sharedBudgetApi.createSharedBudget({
        name,
        amount,
        customerAccountId: accountId
      });
      setBudgets([...budgets, newBudget]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shared budget');
      console.error('Error creating shared budget:', err);
    }
  };

  const handleUpdate = async (id: string, name: string, amount: number) => {
    try {
      setError(null);
      const updatedBudget = await sharedBudgetApi.updateSharedBudget(id, {
        name,
        amount
      });
      setBudgets(budgets.map(budget => 
        budget.id === id ? updatedBudget : budget
      ));
      setEditingBudget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shared budget');
      console.error('Error updating shared budget:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shared budget? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await sharedBudgetApi.deleteSharedBudget(id);
      setBudgets(budgets.filter(budget => budget.id !== id));
      if (selectedBudgetId === id && onSelect) {
        onSelect('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shared budget');
      console.error('Error deleting shared budget:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Shared Budgets</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <SharedBudgetForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="space-y-2">
        {budgets.map((budget) => (
          <div
            key={budget.id}
            className={`p-4 rounded-lg border ${
              selectedBudgetId === budget.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {editingBudget?.id === budget.id ? (
              <SharedBudgetForm
                budget={budget}
                onSubmit={(name, amount) => handleUpdate(budget.id, name, amount)}
                onCancel={() => setEditingBudget(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{budget.name}</h4>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {(parseInt(budget.amountMicros) / 1_000_000).toFixed(2)}
                    {budget.campaigns.length > 0 && (
                      <span className="ml-2">
                        • {budget.campaigns.length} campaign{budget.campaigns.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onSelect && (
                    <Button
                      variant={selectedBudgetId === budget.id ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onSelect(budget.id)}
                    >
                      {selectedBudgetId === budget.id ? 'Selected' : 'Select'}
                    </Button>
                  )}
                  <button
                    onClick={() => setEditingBudget(budget)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    disabled={deleting === budget.id}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className={`h-4 w-4 ${deleting === budget.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {budgets.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DollarSign className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No shared budgets created. Click "Create Budget" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}