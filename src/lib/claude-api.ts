import { Claude } from '@anthropic-ai/sdk';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  throw new Error('Claude API key not found');
}

const claude = new Claude({
  apiKey: CLAUDE_API_KEY
});

interface CampaignData {
  name: string;
  type: string;
  status: string;
  budget: {
    amount: number;
    isShared: boolean;
  };
  targeting: {
    keywords: {
      text: string;
      matchType: string;
      isNegative: boolean;
    }[];
    audiences: {
      type: string;
      name: string;
    }[];
    locations: {
      name: string;
      isExcluded: boolean;
    }[];
  };
  adGroups: {
    name: string;
    ads: {
      type: string;
      headlines: string[];
      descriptions: string[];
    }[];
  }[];
  metrics?: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  };
}

interface CampaignAnalysis {
  summary: string;
  strategy: {
    targeting: string;
    bidding: string;
    messaging: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  differences?: {
    targeting: string[];
    structure: string[];
    bidding: string[];
    creative: string[];
  };
}

export async function analyzeCampaign(campaign: CampaignData): Promise<CampaignAnalysis> {
  const prompt = `
    Analyze this Google Ads campaign and provide insights:

    Campaign: ${JSON.stringify(campaign, null, 2)}

    Please provide:
    1. A concise summary of the campaign strategy
    2. Analysis of targeting approach
    3. Analysis of bidding strategy
    4. Analysis of ad messaging and creative
    5. Key strengths
    6. Areas for improvement
    7. Specific recommendations

    Format the response as JSON matching this type:
    {
      summary: string;
      strategy: {
        targeting: string;
        bidding: string;
        messaging: string;
      };
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    }
  `;

  const response = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return JSON.parse(response.content[0].text);
}

export async function compareCampaigns(campaign1: CampaignData, campaign2: CampaignData): Promise<{
  analysis1: CampaignAnalysis;
  analysis2: CampaignAnalysis;
  comparison: string;
}> {
  const [analysis1, analysis2] = await Promise.all([
    analyzeCampaign(campaign1),
    analyzeCampaign(campaign2)
  ]);

  const comparisonPrompt = `
    Compare these two Google Ads campaigns:

    Campaign 1: ${JSON.stringify(campaign1, null, 2)}
    Campaign 2: ${JSON.stringify(campaign2, null, 2)}

    Analysis 1: ${JSON.stringify(analysis1, null, 2)}
    Analysis 2: ${JSON.stringify(analysis2, null, 2)}

    Please provide:
    1. A detailed comparison of their strategies
    2. Key differences in targeting, structure, bidding, and creative
    3. Relative strengths and weaknesses
    4. Which approach might be more effective and why
    5. Recommendations for improving both campaigns

    Focus on actionable insights that could help optimize both campaigns.
  `;

  const response = await claude.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: comparisonPrompt
      }
    ]
  });

  // Add comparison insights to the analysis objects
  analysis1.differences = {
    targeting: [],
    structure: [],
    bidding: [],
    creative: []
  };

  analysis2.differences = {
    targeting: [],
    structure: [],
    bidding: [],
    creative: []
  };

  return {
    analysis1,
    analysis2,
    comparison: response.content[0].text
  };
}