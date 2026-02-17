import { Injectable } from '@nestjs/common';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
import { UrlIndexabilityResult } from './url-indexability.service';

export interface AuditScoreResult {
  pillarScores: Record<string, number>;
  quickWins: string[];
  keyChecks: Record<string, unknown>;
}

@Injectable()
export class ScoringService {
  compute(
    homepage: HomepageAuditSnapshot,
    sitemapUrls: string[],
    sampledUrls: UrlIndexabilityResult[],
  ): AuditScoreResult {
    const quickWins: string[] = [];

    let seo = 100;
    if (!homepage.title) {
      seo -= 18;
      quickWins.push(
        'Ajouter une balise <title> pertinente sur la page d’accueil.',
      );
    }
    if (!homepage.metaDescription) {
      seo -= 15;
      quickWins.push(
        'Ajouter une meta description claire sur la page d’accueil.',
      );
    }
    if (homepage.h1Count !== 1) {
      seo -= 10;
      quickWins.push(
        'Conserver un seul H1 principal pour renforcer la clarté SEO.',
      );
    }
    if (homepage.canonicalUrls.length === 0) {
      seo -= 10;
      quickWins.push(
        'Définir une URL canonique pour limiter le contenu dupliqué.',
      );
    }

    let performance = 100;
    if (homepage.ttfbMs > 800) {
      performance -= 18;
      quickWins.push(
        'Réduire le TTFB (cache serveur/CDN, optimisation backend).',
      );
    }
    if (homepage.totalResponseMs > 2000) {
      performance -= 12;
      quickWins.push(
        'Améliorer le temps total de réponse des pages critiques.',
      );
    }
    if ((homepage.contentLength ?? 0) > 500_000) {
      performance -= 10;
      quickWins.push(
        'Alléger la page (images, scripts, CSS) pour accélérer le chargement.',
      );
    }

    let technical = 100;
    if (!homepage.https) {
      technical -= 25;
      quickWins.push('Forcer HTTPS sur l’ensemble du site.');
    }
    if (homepage.statusCode >= 400) {
      technical -= 30;
      quickWins.push(
        'Corriger la disponibilité de la page d’accueil (code HTTP valide).',
      );
    }
    if (sitemapUrls.length === 0) {
      technical -= 15;
      quickWins.push('Ajouter un sitemap.xml et le déclarer dans robots.txt.');
    }

    const indexabilityErrors = sampledUrls.filter(
      (entry) => !entry.indexable || (entry.statusCode ?? 500) >= 400,
    ).length;
    if (sampledUrls.length > 0 && indexabilityErrors > 0) {
      technical -= Math.min(
        25,
        Math.round((indexabilityErrors / sampledUrls.length) * 40),
      );
      quickWins.push(
        'Corriger les URLs non indexables (noindex involontaire, erreurs HTTP, canonicals manquants).',
      );
    }

    let trust = 100;
    if (!homepage.hasStructuredData) {
      trust -= 12;
      quickWins.push(
        'Ajouter des données structurées (Organization, LocalBusiness, FAQ...) pour renforcer la confiance.',
      );
    }
    if (homepage.openGraphTags.length === 0) {
      trust -= 8;
      quickWins.push(
        'Configurer les balises OpenGraph pour mieux contrôler le partage social.',
      );
    }

    let conversion = 100;
    if (!homepage.hasForms) {
      conversion -= 20;
      quickWins.push(
        'Ajouter un formulaire de contact visible sur les pages stratégiques.',
      );
    }
    if (!homepage.hasCookieBanner) {
      conversion -= 5;
      quickWins.push(
        'Ajouter un bandeau cookies conforme pour renforcer la crédibilité.',
      );
    }

    const pillarScores = {
      seo: this.clamp(seo),
      performance: this.clamp(performance),
      technical: this.clamp(technical),
      trust: this.clamp(trust),
      conversion: this.clamp(conversion),
    };

    return {
      pillarScores,
      quickWins: Array.from(new Set(quickWins)).slice(0, 8),
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
          indexabilityIssues: indexabilityErrors,
        },
      },
    };
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
