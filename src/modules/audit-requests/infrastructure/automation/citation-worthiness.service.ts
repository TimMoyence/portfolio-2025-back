import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import type { CitationWorthinessScore } from '../../domain/AiIndexability';

const TRUSTED_DOMAINS: ReadonlyArray<string> = [
  'nature.com',
  'science.org',
  'reuters.com',
  'apnews.com',
  'bbc.co.uk',
  'bbc.com',
  'nytimes.com',
  'lemonde.fr',
  'lesechos.fr',
  'insee.fr',
  'who.int',
  'europa.eu',
  'wikipedia.org',
  'arxiv.org',
  'nih.gov',
  'gov.uk',
  'gouv.fr',
];

const FACT_PATTERN = /\d+%|\d{2,}/;

/**
 * Service d'évaluation de la "citabilité" d'une page par un moteur IA.
 *
 * Analyse le HTML via Cheerio pour détecter les signaux qui rendent un
 * contenu attractif à la citation : présence d'un auteur, d'une date
 * structurée (`<time datetime>`), de sources externes vers des domaines
 * d'autorité, de chiffres factuels et une densité de contenu suffisante.
 *
 * Le score est borné entre 0 et 100.
 */
@Injectable()
export class CitationWorthinessService {
  /**
   * Analyse un document HTML et retourne un score de citabilité ainsi que
   * les signaux détectés. L'URL de la page est utilisée pour distinguer
   * les liens internes (domaine identique) des liens sortants.
   */
  analyze(html: string, pageUrl: string): CitationWorthinessScore {
    const $ = load(html);

    const hasAuthor = this.detectAuthor($);
    const hasDates = $('time[datetime]').length > 0;
    const pageHost = this.safeHost(pageUrl);
    const hasSources = this.detectSources($, pageHost);
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const hasFacts = FACT_PATTERN.test(bodyText);
    const wordCount = bodyText.length === 0 ? 0 : bodyText.split(' ').length;
    const contentDensity = this.densityBucket(wordCount);
    const hasStructuredHeadings = $('h1').length > 0 && $('h2').length > 0;

    let score = 10;
    if (hasAuthor) score += 15;
    if (hasDates) score += 15;
    if (hasSources) score += 20;
    if (hasFacts) score += 15;
    if (contentDensity === 'high') score += 15;
    if (hasStructuredHeadings) score += 10;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      hasFacts,
      hasSources,
      hasDates,
      hasAuthor,
      contentDensity,
    };
  }

  private detectAuthor($: ReturnType<typeof load>): boolean {
    if ($('meta[name="author"]').attr('content')) return true;
    if ($('[rel="author"]').length > 0) return true;
    if ($('[itemprop="author"]').length > 0) return true;
    return false;
  }

  private detectSources(
    $: ReturnType<typeof load>,
    pageHost: string | null,
  ): boolean {
    let found = false;
    $('a[href]').each((_, el) => {
      if (found) return;
      const href = $(el).attr('href');
      if (!href) return;
      try {
        const parsed = new URL(href);
        if (pageHost && parsed.host === pageHost) return;
        const host = parsed.host.toLowerCase();
        if (TRUSTED_DOMAINS.some((domain) => host.endsWith(domain))) {
          found = true;
        }
      } catch {
        // URL invalide : on ignore
      }
    });
    return found;
  }

  private safeHost(url: string): string | null {
    try {
      return new URL(url).host;
    } catch {
      return null;
    }
  }

  private densityBucket(wordCount: number): 'low' | 'medium' | 'high' {
    if (wordCount < 200) return 'low';
    if (wordCount <= 400) return 'medium';
    return 'high';
  }
}
