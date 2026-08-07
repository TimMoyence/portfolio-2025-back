export interface LlmsTxtAnalysis {
  readonly present: boolean;
  readonly url: string;
  readonly sizeBytes: number;
  readonly sections: ReadonlyArray<{
    readonly title: string;
    readonly links: number;
  }>;
  readonly hasFullVariant: boolean;
  readonly complianceScore: number;
  readonly issues: ReadonlyArray<string>;
}

export interface AiBotsAccess {
  readonly gptBot: 'allowed' | 'disallowed' | 'unknown';
  readonly chatGptUser: 'allowed' | 'disallowed' | 'unknown';
  readonly perplexityBot: 'allowed' | 'disallowed' | 'unknown';
  readonly claudeBot: 'allowed' | 'disallowed' | 'unknown';
  readonly googleExtended: 'allowed' | 'disallowed' | 'unknown';
  readonly xRobotsNoAi: boolean;
  readonly xRobotsNoImageAi: boolean;
}

export interface CitationWorthinessScore {
  readonly score: number;
  readonly hasFacts: boolean;
  readonly hasSources: boolean;
  readonly hasDates: boolean;
  readonly hasAuthor: boolean;
  readonly contentDensity: 'low' | 'medium' | 'high';
}

import type { StructuredDataQualityResult } from './StructuredDataQuality';

export interface AiIndexabilitySignals {
  readonly llmsTxt: LlmsTxtAnalysis | null;
  readonly aiBotsAccess: AiBotsAccess;
  readonly citationWorthiness: CitationWorthinessScore;
  readonly structuredDataQuality: StructuredDataQualityResult;
}
