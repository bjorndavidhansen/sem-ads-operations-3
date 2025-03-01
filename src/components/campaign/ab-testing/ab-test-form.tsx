import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { abTestApi, type CreateABTestInput, type ABTest } from '../../../lib/ab-test-api';

interface ABTestFormProps {
  test?: ABTest;
  onSubmit: () => void;
  onCancel: () => void;
}

const TEST_TYPES = [
  { value: 'BIDDING_STRATEGY', label: 'Bidding Strategy' },
  { value: 'AD_COPY', label: 'Ad Copy' },
  { value: 'TARGETING', label: 'Targeting' },
  { value: 'BUDGET', label: 'Budget' }
] as const;

export function ABTestForm({ test, onSubmit, onCancel }: ABTestFormProps) {
  const [name, setName] = useState(test?.name || '');
  const [description, setDescription] = useState(test?.description || '');
  const [type, setType] = useState<ABTest['type']>(test?.type || 'BIDDING_STRATEGY');
  const [durationDays, setDurationDays] = useState(test?.durationDays || 30);
  const [confidenceLevel, setConfidenceLevel] = useState(test?.confidenceLevel || 0.95);
  const [variants, setVariants] = useState<CreateABTestInput['variants']>(
    test?.variants.map(v => ({
      name: v.name,
      description: v.description,
      campaignId: v.campaignId,
      isControl: v.isControl,
      configuration: v.configuration
    })) || [
      { name: 'Control', campaignId: '', isControl: true, configuration: {} },
      { name: 'Variant A', campaignId: '', configuration: {} }
    ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (test) {
        await abTestApi.updateTest(test.id, {
          name,
          description,
          durationDays,
          confidenceLevel
        });
      } else {
        await abTestApi.createTest({
          name,
          description,
          type,
          durationDays,
          confidenceLevel,
          variants
        });
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save test');
      console.error('Error saving test:', err);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
        campaignId: '',
        configuration: {}
      }
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updates: Partial<CreateABTestInput['variants'][0]>) => {
    setVariants(variants.map((variant, i) =>
      i === index ? { ...variant, ...updates } : variant
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Test Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {!test && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Test Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ABTest['type'])}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {TEST_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration (Days)
          </label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(parseInt(e.target.value))}
            min="1"
            max="90"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confidence Level
          </label>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>
      </div>

      {!test && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Test Variants</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {variants.map((variant, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, { name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign ID
                  </label>
                  <input
                    type="text"
                    value={variant.campaignId}
                    onChange={(e) => updateVariant(index, { campaignId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Configuration
                </label>
                <textarea
                  value={JSON.stringify(variant.configuration, null, 2)}
                  onChange={(e) => {
                    try {
                      updateVariant(index, {
                        configuration: JSON.parse(e.target.value)
                      });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  className="mt-1 block w-full font-mono rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={variant.isControl}
                    onChange={(e) => updateVariant(index, { isControl: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">Control variant</span>
                </label>

                {variants.length > 2 && !variant.isControl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : (test ? 'Update Test' : 'Create Test')}
        </Button>
      </div>
    </form>
  );
}