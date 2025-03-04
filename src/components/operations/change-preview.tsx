import React, { useState } from 'react';
import { ChangePreviewItem, ValidationSummary, ValidationSeverity } from '../../types/validation';

interface ChangePreviewProps {
  items: ChangePreviewItem[];
  summary: ValidationSummary;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ChangePreview: React.FC<ChangePreviewProps> = ({
  items,
  summary,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  const [filter, setFilter] = useState<string>('all');
  
  // Check if there are any errors that would block execution
  const hasBlockingErrors = summary.validationResults.errors.length > 0;
  
  const getFilteredItems = () => {
    if (filter === 'all') return items;
    return items.filter(item => item.entityType === filter);
  };
  
  const getSeverityClass = (severity: ValidationSeverity) => {
    switch (severity) {
      case ValidationSeverity.ERROR:
        return 'text-red-600';
      case ValidationSeverity.WARNING:
        return 'text-amber-500';
      case ValidationSeverity.INFO:
        return 'text-blue-500';
      default:
        return 'text-gray-700';
    }
  };
  
  const renderTabContent = () => {
    if (activeTab === 'summary') {
      return (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Change Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{summary.entityBreakdown.campaigns}</div>
                <div className="text-sm text-gray-500">Campaigns</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{summary.entityBreakdown.adGroups}</div>
                <div className="text-sm text-gray-500">Ad Groups</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{summary.entityBreakdown.keywords}</div>
                <div className="text-sm text-gray-500">Keywords</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{summary.entityBreakdown.negativeKeywords}</div>
                <div className="text-sm text-gray-500">Negative Keywords</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Validation Results</h3>
            {summary.validationResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="text-red-600 font-medium mb-2">Errors ({summary.validationResults.errors.length})</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.validationResults.errors.map((error, index) => (
                    <li key={index} className="text-red-600">
                      {error.message}
                      {error.suggestion && (
                        <span className="text-gray-600 ml-2">- {error.suggestion}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.validationResults.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-amber-500 font-medium mb-2">Warnings ({summary.validationResults.warnings.length})</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.validationResults.warnings.map((warning, index) => (
                    <li key={index} className="text-amber-500">
                      {warning.message}
                      {warning.suggestion && (
                        <span className="text-gray-600 ml-2">- {warning.suggestion}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.validationResults.info.length > 0 && (
              <div>
                <h4 className="text-blue-500 font-medium mb-2">Information ({summary.validationResults.info.length})</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.validationResults.info.map((info, index) => (
                    <li key={index} className="text-blue-500">
                      {info.message}
                      {info.suggestion && (
                        <span className="text-gray-600 ml-2">- {info.suggestion}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.validationResults.errors.length === 0 && 
             summary.validationResults.warnings.length === 0 && 
             summary.validationResults.info.length === 0 && (
              <p className="text-green-600">No validation issues found.</p>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Impact Assessment</h3>
            <div className="space-y-4">
              {items.filter(item => item.impacts && item.impacts.length > 0).map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-medium">{item.name}</h4>
                  <ul className="mt-2 space-y-2">
                    {item.impacts?.map((impact, impactIndex) => (
                      <li key={impactIndex} className={getSeverityClass(impact.severity)}>
                        {impact.description}
                        {impact.metrics && impact.metrics.length > 0 && (
                          <div className="flex mt-1 space-x-4">
                            {impact.metrics.map((metric, metricIndex) => (
                              <div key={metricIndex} className="flex items-center">
                                <span className="font-medium">{metric.name}:</span>
                                <span className="ml-1">
                                  {metric.value}
                                  {metric.unit && ` ${metric.unit}`}
                                </span>
                                {metric.trend && (
                                  <span className="ml-1">
                                    {metric.trend === 'up' && '↑'}
                                    {metric.trend === 'down' && '↓'}
                                    {metric.trend === 'neutral' && '→'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {items.filter(item => item.impacts && item.impacts.length > 0).length === 0 && (
                <p className="text-gray-500">No impact data available.</p>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                Filter by entity type
              </label>
              <select
                id="filter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Entities</option>
                <option value="campaign">Campaigns</option>
                <option value="adGroup">Ad Groups</option>
                <option value="keyword">Keywords</option>
                <option value="negativeKeyword">Negative Keywords</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {getFilteredItems().length} of {items.length} changes
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredItems().map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.entityType === 'campaign' && 'Campaign'}
                      {item.entityType === 'adGroup' && 'Ad Group'}
                      {item.entityType === 'keyword' && 'Keyword'}
                      {item.entityType === 'negativeKeyword' && 'Negative Keyword'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.before ? (
                        <div>
                          {item.entityType === 'campaign' && (
                            <>
                              <div>Name: {item.before.name}</div>
                              <div>Status: {item.before.status}</div>
                              {item.before.budget && (
                                <div>Budget: {item.before.budget.amount} {item.before.budget.currency}</div>
                              )}
                            </>
                          )}
                          {item.entityType === 'adGroup' && (
                            <>
                              <div>Name: {item.before.name}</div>
                              <div>Status: {item.before.status}</div>
                            </>
                          )}
                          {(item.entityType === 'keyword' || item.entityType === 'negativeKeyword') && (
                            <>
                              <div>Text: {item.before.text}</div>
                              <div>Match Type: {item.before.matchType}</div>
                              {item.before.negative !== undefined && (
                                <div>Negative: {item.before.negative ? 'Yes' : 'No'}</div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A (New Entity)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.after && (
                        <div>
                          {item.entityType === 'campaign' && (
                            <>
                              <div>Name: {item.after.name}</div>
                              <div>Status: {item.after.status}</div>
                              {item.after.budget && (
                                <div>Budget: {item.after.budget.amount} {item.after.budget.currency}</div>
                              )}
                            </>
                          )}
                          {item.entityType === 'adGroup' && (
                            <>
                              <div>Name: {item.after.name}</div>
                              <div>Status: {item.after.status}</div>
                            </>
                          )}
                          {(item.entityType === 'keyword' || item.entityType === 'negativeKeyword') && (
                            <>
                              <div>Text: {item.after.text}</div>
                              <div>Match Type: {item.after.matchType}</div>
                              {item.after.negative !== undefined && (
                                <div>Negative: {item.after.negative ? 'Yes' : 'No'}</div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.validationResults && item.validationResults.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {item.validationResults.map((result, resultIndex) => (
                            <li key={resultIndex} className={getSeverityClass(result.severity)}>
                              {result.message}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Change Preview</h2>
        <div className="text-sm text-gray-500">
          Generated on {summary.timestamp.toLocaleString()}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'summary' | 'details')}
          >
            <option value="summary">Summary</option>
            <option value="details">Details</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`${
                  activeTab === 'summary'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Detailed Changes
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {renderTabContent()}
      
      <div className="mt-8 flex justify-end space-x-4">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            hasBlockingErrors
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
          onClick={onConfirm}
          disabled={hasBlockingErrors || loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Confirm Changes'
          )}
        </button>
      </div>
    </div>
  );
};
