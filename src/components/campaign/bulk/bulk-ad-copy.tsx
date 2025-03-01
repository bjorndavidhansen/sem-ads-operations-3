import { useState } from 'react';
import { AlertCircle, Plus, X, FileText, Upload, Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface BulkAdCopyProps {
  campaigns: Campaign[];
  onUpdate: () => void;
  onClose: () => void;
}

interface AdCopyOperation {
  type: 'ADD' | 'UPDATE' | 'REMOVE';
  adType: 'TEXT' | 'RESPONSIVE_SEARCH';
  headlines: string[];
  descriptions: string[];
  finalUrl?: string;
  path1?: string;
  path2?: string;
}

export function BulkAdCopy({ campaigns, onUpdate, onClose }: BulkAdCopyProps) {
  const [operations, setOperations] = useState<AdCopyOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');

  const handleAddOperation = () => {
    setOperations([
      ...operations,
      {
        type: 'ADD',
        adType: 'RESPONSIVE_SEARCH',
        headlines: [''],
        descriptions: ['']
      }
    ]);
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleUpdateOperation = (index: number, updates: Partial<AdCopyOperation>) => {
    setOperations(operations.map((op, i) =>
      i === index ? { ...op, ...updates } : op
    ));
  };

  const handleAddHeadline = (index: number) => {
    const operation = operations[index];
    if (operation.headlines.length >= 15) return;

    handleUpdateOperation(index, {
      headlines: [...operation.headlines, '']
    });
  };

  const handleRemoveHeadline = (opIndex: number, headlineIndex: number) => {
    const operation = operations[opIndex];
    handleUpdateOperation(opIndex, {
      headlines: operation.headlines.filter((_, i) => i !== headlineIndex)
    });
  };

  const handleUpdateHeadline = (opIndex: number, headlineIndex: number, value: string) => {
    const operation = operations[opIndex];
    handleUpdateOperation(opIndex, {
      headlines: operation.headlines.map((h, i) =>
        i === headlineIndex ? value : h
      )
    });
  };

  const handleAddDescription = (index: number) => {
    const operation = operations[index];
    if (operation.descriptions.length >= 4) return;

    handleUpdateOperation(index, {
      descriptions: [...operation.descriptions, '']
    });
  };

  const handleRemoveDescription = (opIndex: number, descIndex: number) => {
    const operation = operations[opIndex];
    handleUpdateOperation(opIndex, {
      descriptions: operation.descriptions.filter((_, i) => i !== descIndex)
    });
  };

  const handleUpdateDescription = (opIndex: number, descIndex: number, value: string) => {
    const operation = operations[opIndex];
    handleUpdateOperation(opIndex, {
      descriptions: operation.descriptions.map((d, i) =>
        i === descIndex ? value : d
      )
    });
  };

  const handleImportText = () => {
    try {
      const lines = textInput.split('\n').map(line => line.trim()).filter(Boolean);
      const newOperations: AdCopyOperation[] = [];
      
      let currentOperation: Partial<AdCopyOperation> = {};
      
      lines.forEach(line => {
        if (line.startsWith('Type:')) {
          if (Object.keys(currentOperation).length > 0) {
            newOperations.push(currentOperation as AdCopyOperation);
          }
          currentOperation = {
            type: 'ADD',
            adType: line.includes('Responsive') ? 'RESPONSIVE_SEARCH' : 'TEXT',
            headlines: [],
            descriptions: []
          };
        } else if (line.startsWith('Headline:')) {
          currentOperation.headlines = [...(currentOperation.headlines || []), line.substring(9).trim()];
        } else if (line.startsWith('Description:')) {
          currentOperation.descriptions = [...(currentOperation.descriptions || []), line.substring(12).trim()];
        } else if (line.startsWith('URL:')) {
          currentOperation.finalUrl = line.substring(4).trim();
        } else if (line.startsWith('Path1:')) {
          currentOperation.path1 = line.substring(6).trim();
        } else if (line.startsWith('Path2:')) {
          currentOperation.path2 = line.substring(6).trim();
        }
      });

      if (Object.keys(currentOperation).length > 0) {
        newOperations.push(currentOperation as AdCopyOperation);
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
    const template = `Type: Responsive Search Ad
Headline: Your headline here
Headline: Another headline
Description: Your description here
Description: Another description
URL: https://example.com
Path1: path
Path2: subpath`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ad-copy-template.txt';
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
                  await Promise.all(
                    adGroups.map(adGroup =>
                      googleAdsApi.createAd({
                        adGroupId: adGroup.id,
                        type: operation.adType,
                        headlines: operation.headlines,
                        descriptions: operation.descriptions,
                        finalUrls: operation.finalUrl ? [operation.finalUrl] : [],
                        path1: operation.path1,
                        path2: operation.path2
                      })
                    )
                  );
                  break;

                case 'UPDATE':
                  await Promise.all(
                    adGroups.map(async (adGroup) => {
                      const ads = await googleAdsApi.listAds(adGroup.id);
                      const matchingAds = ads.filter(ad =>
                        ad.type === operation.adType
                      );

                      await Promise.all(
                        matchingAds.map(ad =>
                          googleAdsApi.updateAd(ad.id, {
                            headlines: operation.headlines,
                            descriptions: operation.descriptions,
                            finalUrls: operation.finalUrl ? [operation.finalUrl] : undefined,
                            path1: operation.path1,
                            path2: operation.path2
                          })
                        )
                      );
                    })
                  );
                  break;

                case 'REMOVE':
                  await Promise.all(
                    adGroups.map(async (adGroup) => {
                      const ads = await googleAdsApi.listAds(adGroup.id);
                      const matchingAds = ads.filter(ad =>
                        ad.type === operation.adType
                      );

                      await Promise.all(
                        matchingAds.map(ad =>
                          googleAdsApi.updateAd(ad.id, { status: 'REMOVED' })
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
      setError(err instanceof Error ? err.message : 'Failed to update ads');
      console.error('Error updating ads:', err);
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
            Add Ad
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
            Import Ad Copy (one per line)
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Type: Responsive Search Ad&#10;Headline: Your headline here&#10;Description: Your description here"
          />
          <div className="mt-2">
            <Button
              type="button"
              onClick={handleImportText}
              disabled={!textInput.trim()}
            >
              Import Ad Copy
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Import from Text File
          </label>
          <input
            type="file"
            accept=".txt"
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
          <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select
                  value={operation.type}
                  onChange={(e) => handleUpdateOperation(index, {
                    type: e.target.value as AdCopyOperation['type']
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="ADD">Add</option>
                  <option value="UPDATE">Update</option>
                  <option value="REMOVE">Remove</option>
                </select>

                <select
                  value={operation.adType}
                  onChange={(e) => handleUpdateOperation(index, {
                    adType: e.target.value as AdCopyOperation['adType']
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="TEXT">Text Ad</option>
                  <option value="RESPONSIVE_SEARCH">Responsive Search Ad</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveOperation(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {operation.type !== 'REMOVE' && (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Headlines
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddHeadline(index)}
                        disabled={operation.headlines.length >= 15}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Headline
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {operation.headlines.map((headline, headlineIndex) => (
                        <div key={headlineIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={headline}
                            onChange={(e) => handleUpdateHeadline(index, headlineIndex, e.target.value)}
                            maxLength={30}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder={`Headline ${headlineIndex + 1}`}
                          />
                          {operation.headlines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHeadline(index, headlineIndex)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Descriptions
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddDescription(index)}
                        disabled={operation.descriptions.length >= 4}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Description
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {operation.descriptions.map((description, descIndex) => (
                        <div key={descIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => handleUpdateDescription(index, descIndex, e.target.value)}
                            maxLength={90}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder={`Description ${descIndex + 1}`}
                          />
                          {operation.descriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDescription(index, descIndex)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Final URL
                    </label>
                    <input
                      type="url"
                      value={operation.finalUrl || ''}
                      onChange={(e) => handleUpdateOperation(index, {
                        finalUrl: e.target.value
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Path 1 (Optional)
                      </label>
                      <input
                        type="text"
                        value={operation.path1 || ''}
                        onChange={(e) => handleUpdateOperation(index, {
                          path1: e.target.value
                        })}
                        maxLength={15}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., products"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Path 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={operation.path2 || ''}
                        onChange={(e) => handleUpdateOperation(index, {
                          path2: e.target.value
                        })}
                        maxLength={15}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., shoes"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {operations.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No ad copy operations added. Click "Add Ad" to get started.
            </p>
          </div>
        )}
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
          {loading ? 'Updating...' : 'Update Ads'}
        </Button>
      </div>
    </form>
  );
}