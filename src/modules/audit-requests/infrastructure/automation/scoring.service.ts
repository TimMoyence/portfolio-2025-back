import { Injectable } from '@nestjs/common';
import type {
  AiBotsAccess,
  LlmsTxtAnalysis,
} from '../../domain/AiIndexability';
import type { StructuredDataQualityResult } from '../../domain/StructuredDataQuality';
import { AuditLocale } from '../../domain/audit-locale.util';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
import { UrlIndexabilityResult } from './url-indexability.service';

export type PillarKey =
  | 'seo'
  | 'performance'
  | 'technical'
  | 'trust'
  | 'conversion'
  | 'aiVisibility'
  | 'citationWorthiness';

type PillarScores = Record<PillarKey, number>;

export const PILLAR_KEYS: readonly PillarKey[] = [
  'seo',
  'performance',
  'technical',
  'trust',
  'conversion',
  'aiVisibility',
  'citationWorthiness',
] as const;

export type ActionablePillarKey = Exclude<
  PillarKey,
  'aiVisibility' | 'citationWorthiness'
>;

export const ACTIONABLE_PILLARS: readonly ActionablePillarKey[] = [
  'seo',
  'performance',
  'technical',
  'trust',
  'conversion',
] as const;

export interface AiVisibilityInput {
  llmsTxt: LlmsTxtAnalysis | null;
  aiBotsAccess: ReadonlyArray<AiBotsAccess>;
  structuredDataQuality: ReadonlyArray<StructuredDataQualityResult>;
}

export interface ScoringSiteSignals {
  llmsTxt?: LlmsTxtAnalysis | null;
}

export interface AuditScoreResult {
  pillarScores: PillarScores;
  quickWins: string[];
  keyChecks: Record<string, unknown>;
}

interface SampledCoverage {
  missingTitle: number;
  missingMeta: number;
  badH1: number;
  canonicalIssues: number;
  missingLang: number;
  indexabilityErrors: number;
}

interface ScoringCopy {
  quickWins: Record<string, string>;
}

@Injectable()
export class ScoringService {
  compute(
    homepage: HomepageAuditSnapshot,
    sitemapUrls: string[],
    sampledUrls: UrlIndexabilityResult[],
    locale: AuditLocale = 'fr',
    siteSignals: ScoringSiteSignals = {},
  ): AuditScoreResult {
    const t = this.copy(locale);
    const quickWins: string[] = [];

    const coverage = this.computeSampledCoverage(sampledUrls);
    const sampledCount = sampledUrls.length;

    const seo = this.scoreSeo(homepage, sampledCount, coverage, t, quickWins);
    const performance = this.scorePerformance(homepage, t, quickWins);
    const technical = this.scoreTechnical(
      homepage,
      sitemapUrls,
      sampledCount,
      coverage,
      t,
      quickWins,
    );
    const trust = this.scoreTrust(homepage, t, quickWins);
    const conversion = this.scoreConversion(homepage, t, quickWins);

    const aiBotsAccess = sampledUrls
      .map((entry) => entry.aiSignals?.aiBotsAccess)
      .filter((signal): signal is AiBotsAccess => Boolean(signal));
    const structuredDataQuality = sampledUrls
      .map((entry) => entry.aiSignals?.structuredDataQuality)
      .filter((signal): signal is StructuredDataQualityResult =>
        Boolean(signal),
      );
    const citationScores = sampledUrls
      .map((entry) => entry.aiSignals?.citationWorthiness?.score)
      .filter((score): score is number => typeof score === 'number');

    const aiVisibility = this.scoreAiVisibility({
      llmsTxt: siteSignals.llmsTxt ?? null,
      aiBotsAccess,
      structuredDataQuality,
    });
    const citationWorthiness = this.scoreCitationWorthiness(citationScores);

    const pillarScores: PillarScores = {
      seo: this.clamp(seo),
      performance: this.clamp(performance),
      technical: this.clamp(technical),
      trust: this.clamp(trust),
      conversion: this.clamp(conversion),
      aiVisibility,
      citationWorthiness,
    };

    return {
      pillarScores,
      quickWins: Array.from(new Set(quickWins)).slice(0, 10),
      keyChecks: {
        accessibility: {
          statusCode: homepage.statusCode,
          https: homepage.https,
          redirectCount: homepage.redirectChain.length,
          finalUrl: homepage.finalUrl,
        },
        seo: {
          title: Boolean(homepage.title),
          metaDescription: Boolean(homepage.metaDescription),
          canonicalCount: homepage.canonicalUrls.length,
          h1Count: homepage.h1Count,
          lang: homepage.htmlLang,
          sampledUrls: sampledUrls.length,
          sampledCoverage: {
            missingTitle: coverage.missingTitle,
            missingMetaDescription: coverage.missingMeta,
            badH1Count: coverage.badH1,
            canonicalIssues: coverage.canonicalIssues,
            missingLang: coverage.missingLang,
          },
        },
        technology: {
          cmsHints: homepage.detectedCmsHints,
          analytics: homepage.hasAnalytics,
          tagManager: homepage.hasTagManager,
          pixel: homepage.hasPixel,
          cookieBanner: homepage.hasCookieBanner,
          forms: homepage.hasForms,
          structuredData: homepage.hasStructuredData,
        },
        performance: {
          ttfbMs: homepage.ttfbMs,
          totalResponseMs: homepage.totalResponseMs,
          contentLength: homepage.contentLength,
          cwv: {
            lcp: 'pending',
            cls: 'pending',
            inp: 'pending',
          },
        },
        sitemap: {
          sitemapCount: sitemapUrls.length,
          sampledUrlCount: sampledUrls.length,
          indexabilityIssues: coverage.indexabilityErrors,
        },
      },
    };
  }

  scoreAiVisibility(input: AiVisibilityInput): number {
    let score = 20;
    if (input.llmsTxt?.present) {
      score += 20;
      score += Math.min(15, input.llmsTxt.complianceScore * 0.15);
    }

    if (input.aiBotsAccess.length > 0) {
      const friendly = input.aiBotsAccess.filter(
        (bots) =>
          bots.gptBot !== 'disallowed' && bots.googleExtended !== 'disallowed',
      ).length;
      score += (friendly / input.aiBotsAccess.length) * 25;
    }

    if (input.structuredDataQuality.length > 0) {
      const aiFriendly = input.structuredDataQuality.filter(
        (sd) => sd.aiFriendly,
      ).length;
      score += (aiFriendly / input.structuredDataQuality.length) * 20;
    }

    return this.clamp(score);
  }

  scoreCitationWorthiness(perPageScores: ReadonlyArray<number>): number {
    if (perPageScores.length === 0) return 0;
    const sum = perPageScores.reduce((acc, value) => acc + value, 0);
    return this.clamp(sum / perPageScores.length);
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private computeSampledCoverage(
    sampledUrls: UrlIndexabilityResult[],
  ): SampledCoverage {
    return {
      missingTitle: sampledUrls.filter((entry) => !(entry.title ?? '').trim())
        .length,
      missingMeta: sampledUrls.filter(
        (entry) => !(entry.metaDescription ?? '').trim(),
      ).length,
      badH1: sampledUrls.filter((entry) => (entry.h1Count ?? 1) !== 1).length,
      canonicalIssues: sampledUrls.filter(
        (entry) => !entry.canonical || (entry.canonicalCount ?? 0) !== 1,
      ).length,
      missingLang: sampledUrls.filter((entry) => !entry.htmlLang).length,
      indexabilityErrors: sampledUrls.filter(
        (entry) => !entry.indexable || (entry.statusCode ?? 500) >= 400,
      ).length,
    };
  }

  private scoreSeo(
    homepage: HomepageAuditSnapshot,
    sampledCount: number,
    coverage: SampledCoverage,
    t: ScoringCopy,
    quickWins: string[],
  ): number {
    let seo = 100;
    if (!homepage.title) {
      seo -= 18;
      quickWins.push(t.quickWins.homeTitle);
    }
    if (!homepage.metaDescription) {
      seo -= 15;
      quickWins.push(t.quickWins.homeMeta);
    }
    if (homepage.h1Count !== 1) {
      seo -= 10;
      quickWins.push(t.quickWins.homeH1);
    }
    if (homepage.canonicalUrls.length === 0) {
      seo -= 10;
      quickWins.push(t.quickWins.homeCanonical);
    }

    const coveragePenalties: ReadonlyArray<{
      count: number;
      weight: number;
      cap: number;
      quickWin: string;
    }> = [
      {
        count: coverage.missingTitle,
        weight: 20,
        cap: 15,
        quickWin: t.quickWins.sampleTitleCoverage,
      },
      {
        count: coverage.missingMeta,
        weight: 18,
        cap: 14,
        quickWin: t.quickWins.sampleMetaCoverage,
      },
      {
        count: coverage.badH1,
        weight: 12,
        cap: 10,
        quickWin: t.quickWins.sampleH1Structure,
      },
      {
        count: coverage.canonicalIssues,
        weight: 12,
        cap: 10,
        quickWin: t.quickWins.sampleCanonicalConsistency,
      },
      {
        count: coverage.missingLang,
        weight: 10,
        cap: 8,
        quickWin: t.quickWins.sampleLangCoverage,
      },
    ];

    for (const penalty of coveragePenalties) {
      if (sampledCount === 0 || penalty.count === 0) continue;
      seo -= Math.min(
        penalty.cap,
        Math.round((penalty.count / sampledCount) * penalty.weight),
      );
      quickWins.push(penalty.quickWin);
    }

    return seo;
  }

  private scorePerformance(
    homepage: HomepageAuditSnapshot,
    t: ScoringCopy,
    quickWins: string[],
  ): number {
    let performance = 100;
    if (homepage.ttfbMs > 800) {
      performance -= 18;
      quickWins.push(t.quickWins.ttfb);
    }
    if (homepage.totalResponseMs > 2000) {
      performance -= 12;
      quickWins.push(t.quickWins.totalResponse);
    }
    if ((homepage.contentLength ?? 0) > 500_000) {
      performance -= 10;
      quickWins.push(t.quickWins.pageWeight);
    }
    return performance;
  }

  private scoreTechnical(
    homepage: HomepageAuditSnapshot,
    sitemapUrls: string[],
    sampledCount: number,
    coverage: SampledCoverage,
    t: ScoringCopy,
    quickWins: string[],
  ): number {
    let technical = 100;
    if (!homepage.https) {
      technical -= 25;
      quickWins.push(t.quickWins.https);
    }
    if (homepage.statusCode >= 400) {
      technical -= 30;
      quickWins.push(t.quickWins.homeStatus);
    }
    if (sitemapUrls.length === 0) {
      technical -= 15;
      quickWins.push(t.quickWins.sitemap);
    }
    if (sampledCount > 0 && coverage.indexabilityErrors > 0) {
      technical -= Math.min(
        25,
        Math.round((coverage.indexabilityErrors / sampledCount) * 40),
      );
      quickWins.push(t.quickWins.indexability);
    }
    return technical;
  }

  private scoreTrust(
    homepage: HomepageAuditSnapshot,
    t: ScoringCopy,
    quickWins: string[],
  ): number {
    let trust = 100;
    if (!homepage.hasStructuredData) {
      trust -= 12;
      quickWins.push(t.quickWins.structuredData);
    }
    if (homepage.openGraphTags.length === 0) {
      trust -= 8;
      quickWins.push(t.quickWins.openGraph);
    }
    return trust;
  }

  private scoreConversion(
    homepage: HomepageAuditSnapshot,
    t: ScoringCopy,
    quickWins: string[],
  ): number {
    let conversion = 100;
    if (!homepage.hasForms) {
      conversion -= 20;
      quickWins.push(t.quickWins.forms);
    }
    if (!homepage.hasCookieBanner) {
      conversion -= 5;
      quickWins.push(t.quickWins.cookies);
    }
    return conversion;
  }

  private copy(locale: AuditLocale): ScoringCopy {
    if (locale === 'en') {
      return {
        quickWins: {
          homeTitle: 'Add a clear, intent-focused <title> on the homepage.',
          homeMeta: 'Add a compelling meta description on the homepage.',
          homeH1: 'Keep exactly one primary H1 to improve SEO clarity.',
          homeCanonical:
            'Set a canonical URL to reduce duplicate-content risk.',
          sampleTitleCoverage:
            'Fix missing page titles across sampled URLs and enforce unique title patterns.',
          sampleMetaCoverage:
            'Improve meta description coverage on sampled URLs with unique copy.',
          sampleH1Structure:
            'Enforce one descriptive H1 per indexed page in templates/components.',
          sampleCanonicalConsistency:
            'Standardize canonical tags (single self-referencing canonical per page).',
          sampleLangCoverage:
            'Ensure each page sets a valid html[lang] for international SEO consistency.',
          ttfb: 'Reduce TTFB (server-side caching, CDN, backend optimization).',
          totalResponse:
            'Lower total response time on critical pages to improve UX and crawl budget.',
          pageWeight:
            'Reduce page weight (images/scripts/CSS) to speed up rendering.',
          https: 'Enforce HTTPS across the entire website.',
          homeStatus:
            'Fix homepage availability and keep HTTP status in the 2xx range.',
          sitemap: 'Publish sitemap.xml and reference it in robots.txt.',
          indexability:
            'Fix non-indexable URLs (unexpected noindex, HTTP errors, missing/invalid canonicals).',
          structuredData:
            'Add structured data (Organization, LocalBusiness, FAQ) to strengthen trust and eligibility.',
          openGraph:
            'Implement OpenGraph tags to control social previews and improve share CTR.',
          forms:
            'Expose a visible contact form on high-intent strategic pages.',
          cookies:
            'Add a compliant cookie consent banner to improve trust signals.',
        },
      };
    }

    return {
      quickWins: {
        homeTitle:
          'Ajouter une balise <title> pertinente sur la page d’accueil.',
        homeMeta: 'Ajouter une meta description claire sur la page d’accueil.',
        homeH1: 'Conserver un seul H1 principal pour renforcer la clarté SEO.',
        homeCanonical:
          'Définir une URL canonique pour limiter le contenu dupliqué.',
        sampleTitleCoverage:
          'Corriger les balises title manquantes sur les URLs analysées et standardiser les modèles de title.',
        sampleMetaCoverage:
          'Améliorer la couverture des meta descriptions sur les URLs analysées avec des contenus uniques.',
        sampleH1Structure:
          'Garantir un H1 descriptif unique par page indexable dans les templates.',
        sampleCanonicalConsistency:
          'Uniformiser les canonicals (une canonical auto-référente unique par page).',
        sampleLangCoverage:
          "Renseigner l'attribut html[lang] sur chaque page pour fiabiliser le ciblage SEO multilingue.",
        ttfb: 'Réduire le TTFB (cache serveur/CDN, optimisation backend).',
        totalResponse:
          'Améliorer le temps total de réponse des pages critiques.',
        pageWeight:
          'Alléger la page (images, scripts, CSS) pour accélérer le chargement.',
        https: 'Forcer HTTPS sur l’ensemble du site.',
        homeStatus:
          'Corriger la disponibilité de la page d’accueil (code HTTP valide).',
        sitemap: 'Ajouter un sitemap.xml et le déclarer dans robots.txt.',
        indexability:
          'Corriger les URLs non indexables (noindex involontaire, erreurs HTTP, canonicals manquants).',
        structuredData:
          'Ajouter des données structurées (Organization, LocalBusiness, FAQ...) pour renforcer la confiance.',
        openGraph:
          'Configurer les balises OpenGraph pour mieux contrôler le partage social.',
        forms:
          'Ajouter un formulaire de contact visible sur les pages stratégiques.',
        cookies:
          'Ajouter un bandeau cookies conforme pour renforcer la crédibilité.',
      },
    };
  }
}
