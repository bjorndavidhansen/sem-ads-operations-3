import { useState } from 'react';
import { AlertCircle, Plus, X, Upload, Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkKeywordsProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface KeywordOperation {
  type: 'ADD' | 'REMOVE' | 'UPDATE';
  text: string;
  matchType?: 'EXACT' | 'PHRASE' | 'BROAD';
  bid?: number;
  isNegative?: boolean;
}

export function BulkKeywords({ campaigns, onUpdate, onClose }: BulkKeywordsProps) {
  const [operations, setOperations] = useState<KeywordOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');

  const handleAddOperation = () => {
    setOperations([
      ...operations,
      { type: 'ADD', text: '', matchType: 'BROAD' }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<KeywordOperation>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, ...updates } : op
    ));
  };

  const handleImportText = () => {
    try {
      const lines = textInput.split('\n').map(line => line.trim()).filter(Boolean);
      const newOperations: KeywordOperation[] = [];
      
      let currentOperation: Partial<KeywordOperation> = {};
      
      lines.forEach(line => {
        if (line.startsWith('Type:')) {
          if (Object.keys(currentOperation).length > 0) {
            newOperations.push(currentOperation as KeywordOperation);
          }
          currentOperation = {
            type: 'ADD',
            matchType: 'BROAD',
            text: ''
          };
        } else if (line.startsWith('Keyword:')) {
          currentOperation.text = line.substring(8).trim();
        } else if (line.startsWith('Match Type:')) {
          currentOperation.matchType = line.substring(11).trim() as KeywordOperation['matchType'];
        } else if (line.startsWith('Bid:')) {
          currentOperation.bid = parseFloat(line.substring(4).trim());
        } else if (line.startsWith('Negative:')) {
          currentOperation.isNegative = line.substring(9).trim().toLowerCase() === 'true';
        }
      });

      if (Object.keys(currentOperation).length > 0) {
        newOperations.push(currentOperation as KeywordOperation);
      }

      setOperations([...operations, ...newOperations]);
      setTextInput('');
    } catch (err) {
      setError('Failed to parse input text');
      console.error('Error parsing input text:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') return;

        setTextInput(content);
        handleImportText();
      } catch (err) {
        setError('Failed to parse file');
        console.error('Error parsing file:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleExportTemplate = () => {
    const template = `Type: ADD
Keyword: your keyword here
Match Type: BROAD
Bid: 1.50
Negative: false`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await Promise.all(
        campaigns.map(async (campaign) => {
          const adGroups = await googleAdsApi.listAdGroups(campaign.id);

          await Promise.all(
            operations.map(async (operation) => {
              switch (operation.type) {
                case 'ADD':
                  if (operation.isNegative) {
                    await Promise.all(
                      adGroups.map(adGroup =>
                        googleAdsApi.createNegativeKeyword({
                          adGroupId: adGroup.id,
                          text: operation.text,
                          matchType: operation.matchType!
                        })
                      )
                    );
                  } else {
                    await Promise.all(
                      adGroups.map(adGroup =>
                        googleAdsApi.createKeyword({
                          adGroupId: adGroup.id,
                          text: operation.text,
                          matchType: operation.matchType!,
                          cpcBidMicros: operation.bid
                            ? (operation.bid * 1_000_000).toString()
                            : undefined
                        })
                      )
                    );
                  }
                  break;

                case 'REMOVE':
                  await Promise.all(
                    adGroups.map(async (adGroup) => {
                      const keywords = await googleAdsApi.listKeywords(adGroup.id);
                      const matchingKeywords = keywords.filter(k =>
                        k.text === operation.text &&
                        (!operation.matchType || k.matchType === operation.matchType)
                      );

                      await Promise.all(
                        matchingKeywords.map(keyword =>
                          googleAdsApi.updateKeyword(keyword.id, { status: 'REMOVED' })
                        )
                      );
                    })
                  );
                  break;

                case 'UPDATE':
                  await Promise.all(
                    adGroups.map(async (adGroup) => {
                      const keywords = await googleAdsApi.listKeywords(adGroup.id);
                      const matchingKeywords = keywords.filter(k =>
                        k.text === operation.text &&
                        (!operation.matchType || k.matchType === operation.matchType)
                      );

                      await Promise.all(
                        matchingKeywords.map(keyword =>
                          googleAdsApi.updateKeyword(keyword.id, {
                            cpcBidMicros: operation.bid
                              ? (operation.bid * 1_000_000).toString()
                              : undefined
                          })
                        )
                      );
                    })
                  );
                  break;
              }
            })
          );
        })
      );

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update keywords');
      console.error('Error updating keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddOperation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportMode(importMode === 'text' ? 'file' : 'text')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import from {importMode === 'text' ? 'File' : 'Text'}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportTemplate}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {importMode === 'text' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Import Keywords (one per line)
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter keywords..."
          />
          <div className="mt-2">
            <Button
              type="button"
              onClick={handleImportText}
              disabled={!textInput.trim()}
            >
              Import Keywords
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Import from CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportFile}
            className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          />
        </div>
      )}

      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Operation
                </label>
                <select
                  value={operation.type}
                  onChange={(e) => handleUpdateOperation(index, {
                    type: e.target.value as KeywordOperation['type']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ADD">Add</option>
                  <option value="REMOVE">Remove</option>
                  <option value="UPDATE">Update</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Keyword
                </label>
                <input
                  type="text"
                  value={operation.text}
                  onChange={(e) => handleUpdateOperation(index, { text: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Match Type
                </label>
                <select
                  value={operation.matchType}
                  onChange={(e) => handleUpdateOperation(index, {
                    matchType: e.target.value as KeywordOperation['matchType']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="BROAD">Broad</option>
                  <option value="PHRASE">Phrase</option>
                  <option value="EXACT">Exact</option>
                </select>
              </div>

              {operation.type !== 'REMOVE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max CPC Bid
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={operation.bid || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        bid: parseFloat(e.target.value)
                      })}
                      step="0.01"
                      min="0"
                      className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              {operation.type === 'ADD' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={operation.isNegative}
                    onChange={(e) => handleUpdateOperation(index, {
                      isNegative: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">Negative</span>
                </label>
              )}
              <button
                type="button"
                onClick={() => handleRemoveOperation(index)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || operations.length === 0}
        >
          {loading ? 'Updating...' : 'Update Keywords'}
        </Button>
      </div>
    </form>
  );
}