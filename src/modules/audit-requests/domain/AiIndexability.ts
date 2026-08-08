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

export type AiBotAccessState = 'allowed' | 'disallowed' | 'unknown';

export interface AiBotsAccess {
  readonly gptBot: AiBotAccessState;
  readonly chatGptUser: AiBotAccessState;
  readonly perplexityBot: AiBotAccessState;
  readonly claudeBot: AiBotAccessState;
  readonly googleExtended: AiBotAccessState;
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
