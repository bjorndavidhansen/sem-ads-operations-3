import { useState } from 'react';
import { AlertCircle, Search, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { Button } from '../../ui/button';
import { googleAdsApi } from '../../../lib/google-ads-api';
import type { Campaign } from '../../../lib/google-ads-api';

interface CampaignAnalysis {
  summary: string;
  targeting: {
    keywords: {
      broad: string[];
      phrase: string[];
      exact: string[];
      negative: string[];
    };
    audiences: {
      inMarket: string[];
      affinity: string[];
      custom: string[];
      remarketing: string[];
    };
    locations: {
      included: string[];
      excluded: string[];
    };
    devices: {
      type: string;
      bidAdjustment: number;
    }[];
    schedule: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      bidAdjustment: number;
    }[];
  };
  adGroups: {
    name: string;
    theme: string;
    keywords: number;
    ads: number;
  }[];
  strategy: {
    bidding: string;
    budget: {
      amount: number;
      delivery: string;
    };
    objectives: string[];
    focus: string;
  };
  differences: {
    targeting: string[];
    structure: string[];
    bidding: string[];
    creative: string[];
  };
}

export function CampaignAnalyzer() {
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    campaigns: Record<string, CampaignAnalysis>;
    comparison: string;
  } | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Search campaigns by name
      const response = await googleAdsApi.searchCampaigns(query);
      setSearchResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search campaigns');
      console.error('Error searching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    if (selectedCampaigns.length >= 2) {
      setSelectedCampaigns([selectedCampaigns[1], campaign]);
    } else {
      setSelectedCampaigns([...selectedCampaigns, campaign]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAnalyze = async () => {
    if (selectedCampaigns.length !== 2) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Get detailed campaign data including ad groups, keywords, etc.
      const [campaign1Data, campaign2Data] = await Promise.all([
        googleAdsApi.getCampaignDetails(selectedCampaigns[0].id),
        googleAdsApi.getCampaignDetails(selectedCampaigns[1].id)
      ]);

      // Analyze campaign strategies using LLM
      const analysis = await analyzeCampaigns(campaign1Data, campaign2Data);
      setAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze campaigns');
      console.error('Error analyzing campaigns:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeCampaigns = async (campaign1: any, campaign2: any) => {
    // TODO: Implement LLM analysis
    // This would call your backend API that interfaces with an LLM service
    
    // For now, return mock data
    return {
      campaigns: {
        [campaign1.id]: {
          summary: "E-commerce campaign focused on high-intent keywords with aggressive bidding",
          targeting: {
            keywords: {
              broad: ["buy shoes", "running shoes"],
              phrase: ["nike shoes", "adidas shoes"],
              exact: ["buy nike air max", "buy adidas boost"],
              negative: ["used", "second hand", "repair"]
            },
            audiences: {
              inMarket: ["Footwear", "Athletic Apparel"],
              affinity: ["Sports Enthusiasts", "Fashion & Style"],
              custom: ["Past Purchasers"],
              remarketing: ["Cart Abandoners"]
            },
            locations: {
              included: ["United States", "Canada"],
              excluded: ["Alaska", "Hawaii"]
            },
            devices: [
              { type: "Mobile", bidAdjustment: 20 },
              { type: "Desktop", bidAdjustment: 0 },
              { type: "Tablet", bidAdjustment: -10 }
            ],
            schedule: [
              {
                dayOfWeek: "Monday",
                startTime: "09:00",
                endTime: "21:00",
                bidAdjustment: 0
              }
            ]
          },
          adGroups: [
            {
              name: "Nike Running",
              theme: "Performance Running",
              keywords: 45,
              ads: 3
            }
          ],
          strategy: {
            bidding: "Target ROAS",
            budget: {
              amount: 1000,
              delivery: "Standard"
            },
            objectives: ["Sales", "ROAS"],
            focus: "High-value customers"
          },
          differences: {
            targeting: [],
            structure: [],
            bidding: [],
            creative: []
          }
        },
        [campaign2.id]: {
          // Similar structure for campaign 2
        }
      },
      comparison: "The campaigns show distinct approaches to targeting and bidding..."
    };
  };

  const handleExport = () => {
    if (!analysis) return;

    const data = {
      timestamp: new Date().toISOString(),
      campaigns: selectedCampaigns.map(c => c.name),
      analysis
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Campaign Comparison</h2>
        {analysis && (
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search campaign ${index + 1}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {searchResults.map((campaign) => (
                    <li
                      key={campaign.id}
                      className="relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                      onClick={() => handleSelectCampaign(campaign)}
                    >
                      <div className="flex items-center">
                        <span className="block truncate">{campaign.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCampaigns[index] ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900">
                  {selectedCampaigns[index].name}
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Status: {selectedCampaigns[index].status}</p>
                  <p>Type: {selectedCampaigns[index].advertisingChannelType}</p>
                  <p>Budget: ${parseInt(selectedCampaigns[index].budget.amountMicros) / 1_000_000}/day</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm text-gray-500">
                  Select a campaign to compare
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCampaigns.length === 2 && (
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Compare Campaigns
              </>
            )}
          </Button>
        </div>
      )}

      {analysis && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Analysis Summary</h3>
              <div className="mt-4 prose max-w-none">
                <p>{analysis.comparison}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {selectedCampaigns.map((campaign) => {
              const campaignAnalysis = analysis.campaigns[campaign.id];
              if (!campaignAnalysis) return null;

              return (
                <div key={campaign.id} className="space-y-6">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">{campaignAnalysis.summary}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <h4 className="text-sm font-medium text-gray-900">Targeting Strategy</h4>
                      <div className="mt-4 space-y-4">
                        <div>
                          <h5 className="text-xs font-medium text-gray-500 uppercase">Keywords</h5>
                          <div className="mt-2 space-y-2">
                            {Object.entries(campaignAnalysis.targeting.keywords).map(([type, keywords]) => (
                              <div key={type}>
                                <span className="text-sm font-medium text-gray-700">
                                  {type.charAt(0).toUpperCase() + type.slice(1)}:
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {keywords.join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-xs font-medium text-gray-500 uppercase">Audiences</h5>
                          <div className="mt-2 space-y-2">
                            {Object.entries(campaignAnalysis.targeting.audiences).map(([type, audiences]) => (
                              <div key={type}>
                                <span className="text-sm font-medium text-gray-700">
                                  {type.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {audiences.join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <h4 className="text-sm font-medium text-gray-900">Campaign Strategy</h4>
                      <div className="mt-4 space-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Bidding:</span>
                          <span className="ml-2 text-sm text-gray-500">{campaignAnalysis.strategy.bidding}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Budget:</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ${campaignAnalysis.strategy.budget.amount}/day ({campaignAnalysis.strategy.budget.delivery})
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Objectives:</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {campaignAnalysis.strategy.objectives.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Focus:</span>
                          <span className="ml-2 text-sm text-gray-500">{campaignAnalysis.strategy.focus}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:p-6">
                      <h4 className="text-sm font-medium text-gray-900">Key Differences</h4>
                      <div className="mt-4 space-y-4">
                        {Object.entries(campaignAnalysis.differences).map(([category, differences]) => (
                          <div key={category}>
                            <h5 className="text-xs font-medium text-gray-500 uppercase">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h5>
                            <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                              {differences.map((diff, index) => (
                                <li key={index}>{diff}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}