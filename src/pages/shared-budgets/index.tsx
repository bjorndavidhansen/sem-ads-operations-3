import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SharedBudgetList } from '../../components/campaign/budget/shared-budget-list';

export function SharedBudgetsPage() {
  const { accountId } = useParams<{ accountId: string }>();

  if (!accountId) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No account selected</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SharedBudgetList accountId={accountId} />
      </div>
    </div>
  );
}