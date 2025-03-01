import { jStat } from 'jstat';

interface ParsedIntent {
  operation: string;
  parameters: Record<string, any>;
  confidence: number;
  alternatives?: Array<{
    operation: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
}

interface IntentMatch {
  pattern: RegExp;
  operation: string;
  extractParameters: (matches: RegExpMatchArray) => Record<string, any>;
  confidence: number;
}

class IntentParser {
  private static instance: IntentParser;
  private patterns: IntentMatch[] = [
    {
      pattern: /copy\s+campaign\s+(?:"|'|`)(.+?)(?:"|'|`)/i,
      operation: 'COPY_CAMPAIGN',
      extractParameters: (matches) => ({ name: matches[1] }),
      confidence: 0.9
    },
    {
      pattern: /convert\s+(?:all\s+)?keywords?\s+to\s+(broad|phrase|exact)\s+match/i,
      operation: 'CONVERT_MATCH_TYPES',
      extractParameters: (matches) => ({ targetMatchType: matches[1].toUpperCase() }),
      confidence: 0.85
    },
    {
      pattern: /create\s+(?:a\s+)?bidding\s+strategy\s+(?:with\s+)?target\s+(?:CPA|cost\s+per\s+acquisition)\s+of\s+\$?(\d+(?:\.\d{1,2})?)/i,
      operation: 'CREATE_BSP',
      extractParameters: (matches) => ({
        type: 'TARGET_CPA',
        targetCpa: parseFloat(matches[1])
      }),
      confidence: 0.8
    },
    {
      pattern: /create\s+(?:a\s+)?bidding\s+strategy\s+(?:with\s+)?target\s+ROAS\s+of\s+(\d+(?:\.\d{1,2})?)/i,
      operation: 'CREATE_BSP',
      extractParameters: (matches) => ({
        type: 'TARGET_ROAS',
        targetRoas: parseFloat(matches[1])
      }),
      confidence: 0.8
    }
  ];

  private constructor() {}

  static getInstance(): IntentParser {
    if (!IntentParser.instance) {
      IntentParser.instance = new IntentParser();
    }
    return IntentParser.instance;
  }

  parseIntent(input: string): ParsedIntent | null {
    const matches: Array<{
      pattern: IntentMatch;
      match: RegExpMatchArray;
      confidence: number;
    }> = [];

    // Find all matching patterns
    for (const pattern of this.patterns) {
      const match = input.match(pattern.pattern);
      if (match) {
        matches.push({
          pattern,
          match,
          confidence: this.calculateConfidence(input, pattern, match)
        });
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    const bestMatch = matches[0];
    const result: ParsedIntent = {
      operation: bestMatch.pattern.operation,
      parameters: bestMatch.pattern.extractParameters(bestMatch.match),
      confidence: bestMatch.confidence
    };

    // Add alternatives if there are other matches
    if (matches.length > 1) {
      result.alternatives = matches.slice(1).map(m => ({
        operation: m.pattern.operation,
        parameters: m.pattern.extractParameters(m.match),
        confidence: m.confidence
      }));
    }

    return result;
  }

  private calculateConfidence(
    input: string,
    pattern: IntentMatch,
    match: RegExpMatchArray
  ): number {
    let confidence = pattern.confidence;

    // Adjust confidence based on match quality
    const matchLength = match[0].length;
    const inputLength = input.length;
    const coverage = matchLength / inputLength;
    confidence *= (0.5 + 0.5 * coverage);

    // Adjust for exact matches
    if (match[0].toLowerCase() === input.toLowerCase()) {
      confidence *= 1.2;
    }

    // Cap confidence at 1.0
    return Math.min(confidence, 1.0);
  }

  addPattern(pattern: IntentMatch): void {
    this.patterns.push(pattern);
  }

  getPatterns(): IntentMatch[] {
    return [...this.patterns];
  }
}

export const intentParser = IntentParser.getInstance();