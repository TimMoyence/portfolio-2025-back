/**
 * Analyse du fichier llms.txt d'un site selon la spec https://llmstxt.org.
 * Restitue la présence du fichier, sa taille, ses sections, la conformité et les
 * éventuels problèmes de structure détectés.
 */
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

/**
 * État d'accès des bots IA pour le domaine audité, déduit de robots.txt,
 * des meta robots et des en-têtes X-Robots-Tag.
 */
export interface AiBotsAccess {
  readonly gptBot: 'allowed' | 'disallowed' | 'unknown';
  readonly chatGptUser: 'allowed' | 'disallowed' | 'unknown';
  readonly perplexityBot: 'allowed' | 'disallowed' | 'unknown';
  readonly claudeBot: 'allowed' | 'disallowed' | 'unknown';
  readonly googleExtended: 'allowed' | 'disallowed' | 'unknown';
  readonly xRobotsNoAi: boolean;
  readonly xRobotsNoImageAi: boolean;
}

/**
 * Score de citabilité d'une page par un moteur IA, basé sur la présence
 * de faits, de sources, de dates, d'auteur et la densité du contenu.
 */
export interface CitationWorthinessScore {
  readonly score: number;
  readonly hasFacts: boolean;
  readonly hasSources: boolean;
  readonly hasDates: boolean;
  readonly hasAuthor: boolean;
  readonly contentDensity: 'low' | 'medium' | 'high';
}

import type { StructuredDataQualityResult } from './StructuredDataQuality';

/**
 * Agrégat des signaux d'indexabilité IA collectés pour un audit.
 * Regroupe llms.txt, l'accès des bots IA, la citabilité du contenu
 * et la qualité des données structurées JSON-LD.
 *
 * Au niveau URL, `llmsTxt` est toujours `null` (le fichier est au
 * niveau site). Le champ est peuplé au niveau pipeline/agrégat.
 */
export interface AiIndexabilitySignals {
  readonly llmsTxt: LlmsTxtAnalysis | null;
  readonly aiBotsAccess: AiBotsAccess;
  readonly citationWorthiness: CitationWorthinessScore;
  readonly structuredDataQuality: StructuredDataQualityResult;
}
