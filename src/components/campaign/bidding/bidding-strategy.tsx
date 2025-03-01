import { useState, useEffect } from 'react';
import { DollarSign, Target, TrendingUp, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { biddingStrategyApi, type BiddingStrategy as BiddingStrategyType } from '../../../lib/bidding-strategy-api';

interface BiddingStrategyProps {
  accountId: string;
  onSelect?: (strategyId: string | null) => void;
  selectedStrategyId?: string;
  disabled?: boolean;
}

const STRATEGY_TYPES = [
  {
    value: 'TARGET_CPA',
    label: 'Target CPA',
    description: 'Automatically set bids to get as many conversions as possible at your target cost per acquisition',
    Icon: Target,
    conservative: { label: 'Conservative CPA', multiplier: 1.2 }
  },
  {
    value: 'TARGET_ROAS',
    label: 'Target ROAS',
    description: 'Automatically optimize bids to achieve your target return on ad spend',
    Icon: TrendingUp,
    conservative: { label: 'Conservative ROAS', multiplier: 0.8 }
  },
  {
    value: 'MAXIMIZE_CONVERSIONS',
    label: 'Maximize Conversions',
    description: 'Automatically set bids to help get the most conversions within your budget',
    Icon: Target
  },
  {
    value: 'MAXIMIZE_CONVERSION_VALUE',
    label: 'Maximize Conversion Value',
    description: 'Automatically set bids to help get the most conversion value within your budget',
    Icon: DollarSign
  },
  {
    value: 'MANUAL_CPC',
    label: 'Manual CPC',
    description: 'Set your own maximum cost-per-click bids',
    Icon: DollarSign
  }
] as const;

export function BiddingStrategy({
  accountId,
  onSelect,
  selectedStrategyId,
  disabled
}: BiddingStrategyProps) {
  const [strategies, setStrategies] = useState<BiddingStrategyType[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, [accountId]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await biddingStrategyApi.listBiddingStrategies(accountId);
      setStrategies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bidding strategies');
      console.error('Error loading bidding strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = async (strategy: Omit<BiddingStrategyType, 'id' | 'campaigns'>) => {
    try {
      setError(null);
      const newStrategy = await biddingStrategyApi.createBiddingStrategy(accountId, strategy);
      setStrategies([...strategies, newStrategy]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bidding strategy');
      console.error('Error creating bidding strategy:', err);
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      setError(null);
      await biddingStrategyApi.deleteBiddingStrategy(id);
      setStrategies(strategies.filter(s => s.id !== id));
      if (selectedStrategyId === id && onSelect) {
        onSelect(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bidding strategy');
      console.error('Error deleting bidding strategy:', err);
    }
  };

  const handleUpdateStrategy = async (id: string, updates: Partial<BiddingStrategyType>) => {
    try {
      setError(null);
      const updatedStrategy = await biddingStrategyApi.updateBiddingStrategy(id, updates);
      setStrategies(
        strategies.map(strategy =>
          strategy.id === id ? updatedStrategy : strategy
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bidding strategy');
      console.error('Error updating bidding strategy:', err);
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
        <h3 className="text-lg font-medium text-gray-900">Bidding Strategies</h3>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Strategy
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
        <CreateStrategyForm
          onSubmit={handleCreateStrategy}
          onCancel={() => setShowCreateForm(false)}
          disabled={disabled}
        />
      )}

      <div className="space-y-4">
        {strategies.map(strategy => {
          const strategyType = STRATEGY_TYPES.find(t => t.value === strategy.type);
          const Icon = strategyType?.Icon;

          return (
            <div
              key={strategy.id}
              className={`p-4 rounded-lg border ${
                selectedStrategyId === strategy.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5 text-gray-400" />}
                    <h4 className="text-sm font-medium text-gray-900">
                      {strategy.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({strategyType?.label})
                    </span>
                  </div>

                  {(strategy.type === 'TARGET_CPA' || strategy.type === 'TARGET_ROAS') && (
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">
                          Target {strategy.type === 'TARGET_CPA' ? 'CPA' : 'ROAS'}:
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          {strategy.type === 'TARGET_CPA' && (
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                          )}
                          <input
                            type="number"
                            value={strategy.type === 'TARGET_CPA' ? strategy.targetCpa : strategy.targetRoas}
                            onChange={(e) => handleUpdateStrategy(strategy.id, {
                              [strategy.type === 'TARGET_CPA' ? 'targetCpa' : 'targetRoas']: Number(e.target.value)
                            })}
                            step={strategy.type === 'TARGET_CPA' ? '0.01' : '0.1'}
                            min={strategy.type === 'TARGET_CPA' ? '0.01' : '0.1'}
                            className={`block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                              strategy.type === 'TARGET_CPA' ? 'pl-6' : ''
                            }`}
                            disabled={disabled}
                          />
                          {strategy.type === 'TARGET_ROAS' && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {strategyType?.conservative && (
                        <button
                          onClick={() => {
                            const conservativeMultiplier = strategyType.conservative?.multiplier;
                            
                            if (strategy.type === 'TARGET_CPA' && strategy.targetCpa && conservativeMultiplier) {
                              handleUpdateStrategy(strategy.id, {
                                targetCpa: strategy.targetCpa * conservativeMultiplier
                              });
                            } else if (strategy.type === 'TARGET_ROAS' && strategy.targetRoas && conservativeMultiplier) {
                              handleUpdateStrategy(strategy.id, {
                                targetRoas: strategy.targetRoas * conservativeMultiplier
                              });
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                          disabled={disabled}
                        >
                          Apply Conservative
                        </button>
                      )}
                    </div>
                  )}

                  {strategy.campaigns.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Used by {strategy.campaigns.length} campaign{strategy.campaigns.length === 1 ? '' : 's'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onSelect && (
                    <Button
                      size="sm"
                      variant={selectedStrategyId === strategy.id ? 'primary' : 'outline'}
                      onClick={() => onSelect(selectedStrategyId === strategy.id ? null : strategy.id)}
                      disabled={disabled}
                    >
                      {selectedStrategyId === strategy.id ? 'Selected' : 'Select'}
                    </Button>
                  )}
                  <button
                    onClick={() => handleDeleteStrategy(strategy.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {strategies.length === 0 && !showCreateForm && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DollarSign className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No bidding strategies created. Click "Create Strategy" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateStrategyForm({
  onSubmit,
  onCancel,
  disabled
}: {
  onSubmit: (strategy: Omit<BiddingStrategyType, 'id' | 'campaigns'>) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<BiddingStrategyType['type']>('TARGET_CPA');
  const [targetCpa, setTargetCpa] = useState<number>(10);
  const [targetRoas, setTargetRoas] = useState<number>(200);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      ...(type === 'TARGET_CPA' ? { targetCpa } : {}),
      ...(type === 'TARGET_ROAS' ? { targetRoas } : {})
    });
  };

  const selectedType = STRATEGY_TYPES.find(t => t.value === type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Strategy Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter strategy name"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Strategy Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BiddingStrategyType['type'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={disabled}
        >
          {STRATEGY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {selectedType && (
          <p className="mt-1 text-sm text-gray-500">{selectedType.description}</p>
        )}
      </div>

      {type === 'TARGET_CPA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target CPA
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={targetCpa}
              onChange={(e) => setTargetCpa(Number(e.target.value))}
              min="0.01"
              step="0.01"
              className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {type === 'TARGET_ROAS' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target ROAS
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              value={targetRoas}
              onChange={(e) => setTargetRoas(Number(e.target.value))}
              min="0.1"
              step="0.1"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              disabled={disabled}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={disabled}
        >
          Create Strategy
        </Button>
      </div>
    </form>
  );
}