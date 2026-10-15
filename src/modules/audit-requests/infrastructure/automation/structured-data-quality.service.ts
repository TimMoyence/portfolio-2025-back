import { Injectable } from '@nestjs/common';
import { estObjet } from '../../../../common/domain/est-objet';
import { scoreSur100 } from '../../domain/score-sur-100';
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

const REQUIRED_FIELDS: ReadonlyMap<string, ReadonlyArray<string>> = new Map([
  ['Article', ['headline', 'author', 'datePublished']],
  ['NewsArticle', ['headline', 'author', 'datePublished']],
  ['BlogPosting', ['headline', 'author', 'datePublished']],
  ['Product', ['name', 'offers']],
  ['Recipe', ['name', 'recipeIngredient', 'recipeInstructions']],
  ['FAQPage', ['mainEntity']],
  ['HowTo', ['name', 'step']],
  ['Event', ['name', 'startDate', 'location']],
  ['LocalBusiness', ['name', 'address']],
  ['BreadcrumbList', ['itemListElement']],
  ['Course', ['name', 'description', 'provider']],
]);

const STRUCTURED_DATA_PRESENCE_SCORE = 20;

type JsonLdBlock = Readonly<Record<string, unknown>>;

const CLES_D_UN_SIMPLE_CONTENEUR: ReadonlySet<string> = new Set([
  '@context',
  '@id',
  '@graph',
]);

const noeudsDuBloc = (bloc: unknown): unknown[] => {
  if (!estObjet(bloc) || !Object.hasOwn(bloc, '@graph')) {
    return [bloc];
  }
  const graphe: unknown = bloc['@graph'];
  const noeuds = Array.isArray(graphe) ? Array.from<unknown>(graphe) : [graphe];
  const estAussiUnNoeud = Object.keys(bloc).some(
    (cle) => !CLES_D_UN_SIMPLE_CONTENEUR.has(cle),
  );
  return estAussiUnNoeud ? [bloc, ...noeuds] : noeuds;
};

@Injectable()
export class StructuredDataQualityService {
  analyze(
    blocks: ReadonlyArray<unknown>,
    illisibles = 0,
  ): StructuredDataQualityResult {
    const noeuds = blocks.flatMap(noeudsDuBloc);
    const validBlocks = noeuds.filter(estObjet);
    const malformedBlocks = illisibles + noeuds.length - validBlocks.length;

    if (validBlocks.length === 0) {
      return {
        score: 0,
        total: 0,
        types: [],
        googleRichResultsEligible: false,
        aiFriendly: false,
        invalidBlocks: [],
        malformedBlocks,
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

      const invalide = this.blocInvalide(block, blockTypes);
      if (invalide) invalidBlocks.push(invalide);
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
      malformedBlocks,
    };
  }

  private blocInvalide(
    block: JsonLdBlock,
    blockTypes: ReadonlyArray<string>,
  ): { type: string; missingFields: string[] } | null {
    for (const type of blockTypes) {
      const requis = REQUIRED_FIELDS.get(type);
      if (!requis) continue;
      const missingFields = requis.filter(
        (field) => !this.hasValue(block[field]),
      );
      return missingFields.length > 0 ? { type, missingFields } : null;
    }
    return null;
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
    return scoreSur100(score);
  }
}
