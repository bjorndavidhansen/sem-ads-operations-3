import { jStat } from 'jstat';
import natural from 'natural';
import stringSimilarity from 'string-similarity';
import { googleAdsApi } from '../google-ads-api';

interface SearchTermCluster {
  centroid: string;
  terms: string[];
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
  };
  recommendations: {
    type: 'add' | 'exclude' | 'adjust';
    term: string;
    confidence: number;
    reason: string;
  }[];
}

export class SearchTermAnalysis {
  private static instance: SearchTermAnalysis;
  private tokenizer = new natural.WordTokenizer();
  private tfidf = new natural.TfIdf();

  private constructor() {}

  static getInstance(): SearchTermAnalysis {
    if (!SearchTermAnalysis.instance) {
      SearchTermAnalysis.instance = new SearchTermAnalysis();
    }
    return SearchTermAnalysis.instance;
  }

  async analyzeSearchTerms(campaignId: string): Promise<SearchTermCluster[]> {
    // Get search terms and performance data
    const searchTerms = await googleAdsApi.getSearchTerms(campaignId);
    
    // Tokenize and normalize terms
    const processedTerms = searchTerms.map(term => ({
      original: term.text,
      tokens: this.tokenizer.tokenize(term.text.toLowerCase()),
      metrics: term.metrics
    }));

    // Build TF-IDF matrix
    processedTerms.forEach(term => {
      this.tfidf.addDocument(term.tokens.join(' '));
    });

    // Cluster similar terms
    const clusters = this.clusterTerms(processedTerms);

    // Generate recommendations for each cluster
    return clusters.map(cluster => ({
      ...cluster,
      recommendations: this.generateRecommendations(cluster)
    }));
  }

  private clusterTerms(terms: any[]): SearchTermCluster[] {
    // Implement clustering using similarity metrics
    const clusters: SearchTermCluster[] = [];
    const threshold = 0.7;

    terms.forEach(term => {
      let assigned = false;

      // Try to assign to existing cluster
      for (const cluster of clusters) {
        const similarity = stringSimilarity.compareTwoStrings(
          term.original,
          cluster.centroid
        );

        if (similarity >= threshold) {
          cluster.terms.push(term.original);
          this.updateClusterMetrics(cluster, term.metrics);
          assigned = true;
          break;
        }
      }

      // Create new cluster if no match
      if (!assigned) {
        clusters.push({
          centroid: term.original,
          terms: [term.original],
          metrics: { ...term.metrics },
          recommendations: []
        });
      }
    });

    return clusters;
  }

  private updateClusterMetrics(cluster: SearchTermCluster, metrics: any): void {
    cluster.metrics.impressions += metrics.impressions;
    cluster.metrics.clicks += metrics.clicks;
    cluster.metrics.conversions += metrics.conversions;
    cluster.metrics.cost += metrics.cost;
  }

  private generateRecommendations(cluster: SearchTermCluster): any[] {
    const recommendations = [];
    const ctr = cluster.metrics.clicks / cluster.metrics.impressions;
    const convRate = cluster.metrics.conversions / cluster.metrics.clicks;
    const cpa = cluster.metrics.cost / cluster.metrics.conversions;

    // Add high-performing terms as keywords
    if (ctr > 0.1 && convRate > 0.05) {
      recommendations.push({
        type: 'add',
        term: cluster.centroid,
        confidence: 0.8,
        reason: 'High CTR and conversion rate'
      });
    }

    // Exclude poor performing terms
    if (ctr < 0.01 || (cpa > 0 && cpa > 200)) {
      recommendations.push({
        type: 'exclude',
        term: cluster.centroid,
        confidence: 0.7,
        reason: 'Poor performance metrics'
      });
    }

    // Bid adjustments based on performance
    if (convRate > 0.1 && cpa < 100) {
      recommendations.push({
        type: 'adjust',
        term: cluster.centroid,
        confidence: 0.9,
        reason: 'Strong conversion performance'
      });
    }

    return recommendations;
  }
}

export const searchTermAnalysis = SearchTermAnalysis.getInstance();