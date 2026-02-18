import { Injectable } from '@nestjs/common';
import { AuditLocale } from '../../domain/audit-locale.util';
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
    locale: AuditLocale = 'fr',
  ): AuditScoreResult {
    const t = this.copy(locale);
    const quickWins: string[] = [];

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

    const sampledMissingTitle = sampledUrls.filter(
      (entry) => !(entry.title ?? '').trim(),
    ).length;
    if (sampledUrls.length > 0 && sampledMissingTitle > 0) {
      seo -= Math.min(
        15,
        Math.round((sampledMissingTitle / sampledUrls.length) * 20),
      );
      quickWins.push(t.quickWins.sampleTitleCoverage);
    }

    const sampledMissingMeta = sampledUrls.filter(
      (entry) => !(entry.metaDescription ?? '').trim(),
    ).length;
    if (sampledUrls.length > 0 && sampledMissingMeta > 0) {
      seo -= Math.min(
        14,
        Math.round((sampledMissingMeta / sampledUrls.length) * 18),
      );
      quickWins.push(t.quickWins.sampleMetaCoverage);
    }

    const sampledBadH1 = sampledUrls.filter(
      (entry) => (entry.h1Count ?? 1) !== 1,
    ).length;
    if (sampledUrls.length > 0 && sampledBadH1 > 0) {
      seo -= Math.min(10, Math.round((sampledBadH1 / sampledUrls.length) * 12));
      quickWins.push(t.quickWins.sampleH1Structure);
    }

    const sampledCanonicalIssues = sampledUrls.filter(
      (entry) => !entry.canonical || (entry.canonicalCount ?? 0) !== 1,
    ).length;
    if (sampledUrls.length > 0 && sampledCanonicalIssues > 0) {
      seo -= Math.min(
        10,
        Math.round((sampledCanonicalIssues / sampledUrls.length) * 12),
      );
      quickWins.push(t.quickWins.sampleCanonicalConsistency);
    }

    const sampledMissingLang = sampledUrls.filter(
      (entry) => !entry.htmlLang,
    ).length;
    if (sampledUrls.length > 0 && sampledMissingLang > 0) {
      seo -= Math.min(
        8,
        Math.round((sampledMissingLang / sampledUrls.length) * 10),
      );
      quickWins.push(t.quickWins.sampleLangCoverage);
    }

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

    const indexabilityErrors = sampledUrls.filter(
      (entry) => !entry.indexable || (entry.statusCode ?? 500) >= 400,
    ).length;
    if (sampledUrls.length > 0 && indexabilityErrors > 0) {
      technical -= Math.min(
        25,
        Math.round((indexabilityErrors / sampledUrls.length) * 40),
      );
      quickWins.push(t.quickWins.indexability);
    }

    let trust = 100;
    if (!homepage.hasStructuredData) {
      trust -= 12;
      quickWins.push(t.quickWins.structuredData);
    }
    if (homepage.openGraphTags.length === 0) {
      trust -= 8;
      quickWins.push(t.quickWins.openGraph);
    }

    let conversion = 100;
    if (!homepage.hasForms) {
      conversion -= 20;
      quickWins.push(t.quickWins.forms);
    }
    if (!homepage.hasCookieBanner) {
      conversion -= 5;
      quickWins.push(t.quickWins.cookies);
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
            missingTitle: sampledMissingTitle,
            missingMetaDescription: sampledMissingMeta,
            badH1Count: sampledBadH1,
            canonicalIssues: sampledCanonicalIssues,
            missingLang: sampledMissingLang,
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
          indexabilityIssues: indexabilityErrors,
        },
      },
    };
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private copy(locale: AuditLocale): {
    quickWins: Record<string, string>;
  } {
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
