import { Injectable } from '@nestjs/common';
import type { StructuredDataQualityResult } from '../../domain/StructuredDataQuality';

const GOOGLE_RICH_RESULTS_TYPES: ReadonlySet<string> = new Set([
  'Article',
  'NewsArticle',
  'BlogPosting',
  'Product',
  'Recipe',
  'FAQPage',
  'HowTo',
  'Event',
  'LocalBusiness',
  'BreadcrumbList',
]);

const AI_FRIENDLY_TYPES: ReadonlySet<string> = new Set([
  'FAQPage',
  'HowTo',
  'Article',
  'NewsArticle',
  'BlogPosting',
  'Course',
]);

const REQUIRED_FIELDS: Record<string, ReadonlyArray<string>> = {
  Article: ['headline', 'author', 'datePublished'],
  NewsArticle: ['headline', 'author', 'datePublished'],
  BlogPosting: ['headline', 'author', 'datePublished'],
  Product: ['name', 'offers'],
  Recipe: ['name', 'recipeIngredient', 'recipeInstructions'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  Event: ['name', 'startDate', 'location'],
  LocalBusiness: ['name', 'address'],
  BreadcrumbList: ['itemListElement'],
  Course: ['name', 'description', 'provider'],
};

const STRUCTURED_DATA_PRESENCE_SCORE = 20;

type JsonLdBlock = Record<string, unknown>;

@Injectable()
export class StructuredDataQualityService {
  analyze(blocks: ReadonlyArray<unknown>): StructuredDataQualityResult {
    const validBlocks = blocks.filter(
      (b): b is JsonLdBlock => typeof b === 'object' && b !== null,
    );

    if (validBlocks.length === 0) {
      return {
        score: 0,
        total: 0,
        types: [],
        googleRichResultsEligible: false,
        aiFriendly: false,
        invalidBlocks: [],
      };
    }

    const types: string[] = [];
    const invalidBlocks: Array<{
      type: string;
      missingFields: string[];
    }> = [];
    let googleRichResultsEligible = false;
    let aiFriendly = false;

    for (const block of validBlocks) {
      const blockTypes = this.extractTypes(block);
      for (const t of blockTypes) {
        types.push(t);
        if (GOOGLE_RICH_RESULTS_TYPES.has(t)) {
          googleRichResultsEligible = true;
        }
        if (AI_FRIENDLY_TYPES.has(t)) {
          aiFriendly = true;
        }
      }

      const primary = blockTypes.find((t) => REQUIRED_FIELDS[t]);
      if (primary) {
        const missing = REQUIRED_FIELDS[primary].filter(
          (field) => !this.hasValue(block[field]),
        );
        if (missing.length > 0) {
          invalidBlocks.push({ type: primary, missingFields: missing });
        }
      }
    }

    const score = this.computeScore({
      total: validBlocks.length,
      googleRichResultsEligible,
      aiFriendly,
      invalidCount: invalidBlocks.length,
    });

    return {
      score,
      total: validBlocks.length,
      types,
      googleRichResultsEligible,
      aiFriendly,
      invalidBlocks,
    };
  }

  private extractTypes(block: JsonLdBlock): string[] {
    const raw = block['@type'];
    if (typeof raw === 'string') return [raw];
    if (Array.isArray(raw)) {
      return raw.filter((t): t is string => typeof t === 'string');
    }
    return [];
  }

  private hasValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  private computeScore(params: {
    total: number;
    googleRichResultsEligible: boolean;
    aiFriendly: boolean;
    invalidCount: number;
  }): number {
    let score = STRUCTURED_DATA_PRESENCE_SCORE;
    if (params.googleRichResultsEligible) score += 40;
    if (params.aiFriendly) score += 25;
    if (params.total >= 2) score += 10;
    if (params.total >= 3) score += 5;
    score -= params.invalidCount * 15;
    return Math.max(0, Math.min(100, score));
  }
}
