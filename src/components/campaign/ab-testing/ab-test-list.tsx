import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Power, Play, Pause, Check, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { ABTestForm } from './ab-test-form';
import { ABTestMetrics } from './ab-test-metrics';
import { abTestApi, type ABTest } from '../../../lib/ab-test-api';

export function ABTestList() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abTestApi.listTests();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
      console.error('Error loading tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (id: string) => {
    try {
      setUpdatingStatus(id);
      setError(null);
      await abTestApi.startTest(id);
      await loadTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
      console.error('Error starting test:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePauseTest = async (id: string) => {
    try {
      setUpdatingStatus(id);
      setError(null);
      await abTestApi.pauseTest(id);
      await loadTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause test');
      console.error('Error pausing test:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCompleteTest = async (test: ABTest) => {
    if (!test.variants.length) return;

    // Find the best performing variant
    const bestVariant = test.variants.reduce((best, current) => {
      const bestMetrics = best.metrics;
      const currentMetrics = current.metrics;

      // Compare based on test type
      switch (test.type) {
        case 'BIDDING_STRATEGY':
          return (currentMetrics.roas || 0) > (bestMetrics.roas || 0) ? current : best;
        case 'AD_COPY':
          return (currentMetrics.ctr || 0) > (bestMetrics.ctr || 0) ? current : best;
        case 'TARGETING':
          return (currentMetrics.conversionRate || 0) > (bestMetrics.conversionRate || 0) ? current : best;
        case 'BUDGET':
          return (currentMetrics.roas || 0) > (bestMetrics.roas || 0) ? current : best;
        default:
          return best;
      }
    }, test.variants[0]);

    try {
      setUpdatingStatus(test.id);
      setError(null);
      await abTestApi.completeTest(test.id, bestVariant.id);
      await loadTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete test');
      console.error('Error completing test:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (status: ABTest['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
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
        <h2 className="text-lg font-medium text-gray-900">A/B Tests</h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm || editingTest ? (
        <div className="bg-white rounded-lg shadow p-6">
          <ABTestForm
            test={editingTest || undefined}
            onSubmit={() => {
              setShowCreateForm(false);
              setEditingTest(null);
              loadTests();
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingTest(null);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                      className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(test.status)}`}
                    >
                      <Power className={`h-3 w-3 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                      {test.status}
                    </button>
                    <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                    <span className="text-sm text-gray-500">
                      {test.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        disabled={updatingStatus === test.id}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Play className={`h-4 w-4 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    {test.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={() => handlePauseTest(test.id)}
                          disabled={updatingStatus === test.id}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Pause className={`h-4 w-4 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleCompleteTest(test)}
                          disabled={updatingStatus === test.id}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Check className={`h-4 w-4 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                        </button>
                      </>
                    )}
                    {test.status === 'PAUSED' && (
                      <>
                        <button
                          onClick={() => handleStartTest(test.id)}
                          disabled={updatingStatus === test.id}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Play className={`h-4 w-4 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleCompleteTest(test)}
                          disabled={updatingStatus === test.id}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Check className={`h-4 w-4 ${updatingStatus === test.id ? 'animate-spin' : ''}`} />
                        </button>
                      </>
                    )}
                    {test.status === 'DRAFT' && (
                      <button
                        onClick={() => setEditingTest(test)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    Duration: {test.durationDays} days
                    {test.startDate && (
                      <div className="text-xs text-gray-400">
                        Started: {new Date(test.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div>
                    {test.variants.length} variants
                    {test.winningVariantId && (
                      <div className="text-xs text-green-600">
                        Winner: {test.variants.find(v => v.id === test.winningVariantId)?.name}
                      </div>
                    )}
                  </div>
                  {test.description && (
                    <div className="col-span-3 text-xs">{test.description}</div>
                  )}
                </div>

                {expandedTest === test.id && test.variants.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <ABTestMetrics test={test} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {tests.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Plus className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No tests created. Click "Create Test" to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}