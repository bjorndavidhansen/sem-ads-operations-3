import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { GoogleAdsAccount, AccountHierarchyNode } from '../../types/google-ads';

interface AccountSelectorProps {
  onSelect: (account: GoogleAdsAccount) => void;
  selectedAccountId?: string;
}

export function AccountSelector({ onSelect, selectedAccountId }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<AccountHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('google_ads_accounts')
          .select('*')
          .order('is_mcc', { ascending: false })
          .order('account_name');

        if (error) throw error;

        // Build account hierarchy
        const accountMap = new Map<string, AccountHierarchyNode>();
        const rootAccounts: AccountHierarchyNode[] = [];

        // First pass: Create all nodes
        data.forEach((account: GoogleAdsAccount) => {
          accountMap.set(account.id, { ...account, children: [] });
        });

        // Second pass: Build hierarchy
        data.forEach((account: GoogleAdsAccount) => {
          const node = accountMap.get(account.id)!;
          if (account.parent_account_id) {
            const parent = accountMap.get(account.parent_account_id);
            if (parent) {
              parent.children.push(node);
            }
          } else {
            rootAccounts.push(node);
          }
        });

        setAccounts(rootAccounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, []);

  function AccountNode({ node, depth = 0 }: { node: AccountHierarchyNode; depth?: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === selectedAccountId;

    return (
      <div>
        <button
          onClick={() => {
            if (hasChildren) {
              setExpanded(!expanded);
            }
            onSelect(node);
          }}
          className={`w-full text-left px-2 py-1.5 hover:bg-gray-100 flex items-center gap-2 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <span className="w-4" />
          )}
          <Building2 className={`h-4 w-4 ${node.is_mcc ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className="text-sm">
            {node.account_name || `Account ${node.google_customer_id}`}
            {node.is_mcc && <span className="ml-1 text-xs text-gray-500">(MCC)</span>}
          </span>
        </button>
        {expanded && hasChildren && (
          <div>
            {node.children.map((child) => (
              <AccountNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading accounts...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (accounts.length === 0) {
    return <div className="text-sm text-gray-500">No accounts found</div>;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      {accounts.map((account) => (
        <AccountNode key={account.id} node={account} />
      ))}
    </div>
  );
}