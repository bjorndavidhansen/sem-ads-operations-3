import { jStat } from 'jstat';
import regression from 'regression';
import { googleAdsApi } from '../google-ads-api';
import { budgetApi } from '../budget-api';

interface BudgetRecommendation {
  campaignId: string;
  currentBudget: number;
  recommendedBudget: number;
  potentialImpressions: number;
  potentialClicks: number;
  potentialConversions: number;
  confidence: number;
  reason: string;
}

export class BudgetOptimization {
  private static instance: BudgetOptimization;

  private constructor() {}

  static getInstance(): BudgetOptimization {
    if (!BudgetOptimization.instance) {
      BudgetOptimization.instance = new BudgetOptimization();
    }
    return BudgetOptimization.instance;
  }

  async optimizeBudgets(campaignIds: string[]): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    for (const campaignId of campaignIds) {
      // Get historical performance data
      const historicalData = await budgetApi.getForecast(campaignId);
      
      // Calculate optimal budget based on performance
      const recommendation = await this.calculateOptimalBudget(
        campaignId,
        historicalData
      );

      recommendations.push(recommendation);
    }

    return this.prioritizeRecommendations(recommendations);
  }

  private async calculateOptimalBudget(
    campaignId: string,
    historicalData: any
  ): Promise<BudgetRecommendation> {
    const campaign = await googleAdsApi.getCampaignDetails(campaignId);
    const currentBudget = parseInt(campaign.budget.amountMicros) / 1_000_000;

    // Prepare data for regression analysis
    const spendData = historicalData.map((day: any) => [
      day.spend,
      day.conversions
    ]);

    // Perform regression analysis
    const result = regression.polynomial(spendData, { order: 2 });
    
    // Find optimal point using derivative
    const coefficients = result.equation;
    const optimalSpend = -coefficients[1] / (2 * coefficients[2]);

    // Calculate potential metrics
    const potentialConversions = result.predict(optimalSpend)[1];
    const conversionRate = campaign.metrics?.conversionRate || 0.02;
    const ctr = campaign.metrics?.ctr || 0.02;

    const potentialClicks = potentialConversions / conversionRate;
    const potentialImpressions = potentialClicks / ctr;

    // Calculate confidence based on R-squared and data points
    const confidence = Math.min(
      result.r2 * (historicalData.length / 30),
      0.95
    );

    return {
      campaignId,
      currentBudget,
      recommendedBudget: optimalSpend,
      potentialImpressions,
      potentialClicks,
      potentialConversions,
      confidence,
      reason: this.generateReason(currentBudget, optimalSpend, confidence)
    };
  }

  private generateReason(
    currentBudget: number,
    recommendedBudget: number,
    confidence: number
  ): string {
    const change = ((recommendedBudget - currentBudget) / currentBudget) * 100;
    const direction = change > 0 ? 'increase' : 'decrease';
    const magnitude = Math.abs(change).toFixed(1);

    return `Recommend ${direction} of ${magnitude}% based on historical performance analysis (${(
      confidence * 100
    ).toFixed(1)}% confidence)`;
  }

  private prioritizeRecommendations(
    recommendations: BudgetRecommendation[]
  ): BudgetRecommendation[] {
    return recommendations.sort((a, b) => {
      // Prioritize high confidence recommendations
      if (Math.abs(a.confidence - b.confidence) > 0.1) {
        return b.confidence - a.confidence;
      }

      // Then by relative impact
      const aImpact =
        Math.abs(a.recommendedBudget - a.currentBudget) / a.currentBudget;
      const bImpact =
        Math.abs(b.recommendedBudget - b.currentBudget) / b.currentBudget;
      return bImpact - aImpact;
    });
  }
}

export const budgetOptimization = BudgetOptimization.getInstance();