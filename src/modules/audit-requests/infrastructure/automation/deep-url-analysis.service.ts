import { Injectable } from '@nestjs/common';
import { UrlIndexabilityResult } from './url-indexability.service';

export type FindingSeverity = 'high' | 'medium' | 'low';
export type FindingImpact = 'traffic' | 'indexation' | 'conversion';

export interface DeepUrlFinding {
  code: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence: number;
  impact: FindingImpact;
  affectedUrls: string[];
  recommendation: string;
}

export interface DeepUrlAnalysisResult {
  findings: DeepUrlFinding[];
  metrics: Record<string, unknown>;
}

@Injectable()
export class DeepUrlAnalysisService {
  analyze(urls: UrlIndexabilityResult[]): DeepUrlAnalysisResult {
    if (!urls.length) {
      return {
        findings: [],
        metrics: {
          analyzedUrls: 0,
          duplicateTitles: 0,
          duplicateMetaDescriptions: 0,
          missingTitle: 0,
          missingMetaDescription: 0,
          badH1Count: 0,
          missingLang: 0,
          canonicalIssues: 0,
          noindexConflicts: 0,
        },
      };
    }

    const findings: DeepUrlFinding[] = [];
    const titleMap = new Map<string, string[]>();
    const metaMap = new Map<string, string[]>();

    let missingTitle = 0;
    let missingMeta = 0;
    let badTitleLength = 0;
    let badMetaLength = 0;
    let badH1Count = 0;
    let missingLang = 0;
    let canonicalIssues = 0;
    let noindexConflicts = 0;
    const errorUrls: string[] = [];
    const slowUrls: string[] = [];
    const canonicalIssueUrls: string[] = [];
    const noindexUrls: string[] = [];

    for (const entry of urls) {
      const pageUrl = entry.url;
      const title = (entry.title ?? '').trim();
      const meta = (entry.metaDescription ?? '').trim();

      if (!title) {
        missingTitle += 1;
      } else {
        titleMap.set(title, [...(titleMap.get(title) ?? []), pageUrl]);
        if (title.length < 20 || title.length > 65) {
          badTitleLength += 1;
        }
      }

      if (!meta) {
        missingMeta += 1;
      } else {
        metaMap.set(meta, [...(metaMap.get(meta) ?? []), pageUrl]);
        if (meta.length < 80 || meta.length > 170) {
          badMetaLength += 1;
        }
      }

      if ((entry.h1Count ?? 1) !== 1) {
        badH1Count += 1;
      }

      if (!entry.htmlLang) {
        missingLang += 1;
      }

      if (!entry.canonical || (entry.canonicalCount ?? 0) !== 1) {
        canonicalIssues += 1;
        canonicalIssueUrls.push(pageUrl);
      }

      if (!entry.indexable && (entry.statusCode ?? 500) < 400) {
        noindexConflicts += 1;
        noindexUrls.push(pageUrl);
      }

      if ((entry.statusCode ?? 500) >= 400 || entry.error) {
        errorUrls.push(pageUrl);
      }

      if ((entry.responseTimeMs ?? 0) > 2200) {
        slowUrls.push(pageUrl);
      }
    }

    const duplicateTitles = this.duplicates(titleMap);
    const duplicateMetas = this.duplicates(metaMap);

    this.pushIfNeeded(
      findings,
      missingTitle > 0,
      'missing_title',
      'Balises title manquantes',
      `${missingTitle} URL(s) sans balise title.`,
      this.severityFromRatio(missingTitle, urls.length),
      0.92,
      'traffic',
      urls.filter((entry) => !entry.title).map((entry) => entry.url),
      'Ajouter un title unique et orienté intention de recherche sur chaque page.',
    );

    this.pushIfNeeded(
      findings,
      missingMeta > 0,
      'missing_meta_description',
      'Meta descriptions manquantes',
      `${missingMeta} URL(s) sans meta description.`,
      this.severityFromRatio(missingMeta, urls.length),
      0.9,
      'traffic',
      urls
        .filter((entry) => !(entry.metaDescription ?? '').trim())
        .map((entry) => entry.url),
      'Rédiger une meta description unique (80-170 caractères) pour chaque page stratégique.',
    );

    this.pushIfNeeded(
      findings,
      duplicateTitles.length > 0,
      'duplicate_titles',
      'Titles dupliqués',
      `${duplicateTitles.length} groupe(s) de titles dupliqués détectés.`,
      this.severityFromRatio(duplicateTitles.length, urls.length),
      0.86,
      'indexation',
      duplicateTitles.flatMap((group) => group.urls),
      'Rendre chaque title unique pour éviter la cannibalisation SEO.',
    );

    this.pushIfNeeded(
      findings,
      duplicateMetas.length > 0,
      'duplicate_meta_descriptions',
      'Meta descriptions dupliquées',
      `${duplicateMetas.length} groupe(s) de meta descriptions dupliquées détectés.`,
      this.severityFromRatio(duplicateMetas.length, urls.length),
      0.82,
      'traffic',
      duplicateMetas.flatMap((group) => group.urls),
      'Différencier les meta descriptions par page et intention utilisateur.',
    );

    this.pushIfNeeded(
      findings,
      badTitleLength > 0,
      'title_length_quality',
      'Qualité de longueur des titles',
      `${badTitleLength} URL(s) ont un title trop court ou trop long.`,
      this.severityFromRatio(badTitleLength, urls.length),
      0.78,
      'traffic',
      urls
        .filter((entry) => {
          const len = (entry.title ?? '').trim().length;
          return len > 0 && (len < 20 || len > 65);
        })
        .map((entry) => entry.url),
      'Ajuster les titles entre 20 et 65 caractères avec mot-clé principal.',
    );

    this.pushIfNeeded(
      findings,
      badMetaLength > 0,
      'meta_length_quality',
      'Qualité de longueur des meta descriptions',
      `${badMetaLength} URL(s) ont une meta description hors plage recommandée.`,
      this.severityFromRatio(badMetaLength, urls.length),
      0.74,
      'traffic',
      urls
        .filter((entry) => {
          const len = (entry.metaDescription ?? '').trim().length;
          return len > 0 && (len < 80 || len > 170);
        })
        .map((entry) => entry.url),
      'Ajuster les metas entre 80 et 170 caractères avec proposition de valeur claire.',
    );

    this.pushIfNeeded(
      findings,
      badH1Count > 0,
      'h1_structure',
      'Structure H1 non conforme',
      `${badH1Count} URL(s) n’ont pas exactement un H1.`,
      this.severityFromRatio(badH1Count, urls.length),
      0.8,
      'indexation',
      urls
        .filter((entry) => (entry.h1Count ?? 1) !== 1)
        .map((entry) => entry.url),
      'Conserver un seul H1 descriptif par page.',
    );

    this.pushIfNeeded(
      findings,
      missingLang > 0,
      'missing_lang',
      'Attribut lang manquant',
      `${missingLang} URL(s) sans attribut lang explicite.`,
      this.severityFromRatio(missingLang, urls.length),
      0.72,
      'conversion',
      urls.filter((entry) => !entry.htmlLang).map((entry) => entry.url),
      "Définir l'attribut lang pour améliorer accessibilité, compréhension et ciblage.",
    );

    this.pushIfNeeded(
      findings,
      canonicalIssues > 0,
      'canonical_consistency',
      'Canonicals manquantes ou incohérentes',
      `${canonicalIssues} URL(s) avec canonical absente ou multiple.`,
      this.severityFromRatio(canonicalIssues, urls.length),
      0.87,
      'indexation',
      canonicalIssueUrls,
      'Assurer une canonical unique et cohérente avec l’URL préférée.',
    );

    this.pushIfNeeded(
      findings,
      noindexConflicts > 0,
      'noindex_conflicts',
      'Conflits d’indexabilité',
      `${noindexConflicts} URL(s) répondent correctement mais ne sont pas indexables.`,
      this.severityFromRatio(noindexConflicts, urls.length),
      0.9,
      'indexation',
      noindexUrls,
      'Supprimer les directives noindex non intentionnelles (meta/x-robots-tag).',
    );

    this.pushIfNeeded(
      findings,
      errorUrls.length > 0,
      'http_errors',
      'Erreurs HTTP détectées',
      `${errorUrls.length} URL(s) retournent une erreur ou sont inaccessibles.`,
      this.severityFromRatio(errorUrls.length, urls.length),
      0.95,
      'traffic',
      errorUrls,
      'Corriger les pages en 4xx/5xx pour restaurer indexation et conversion.',
    );

    this.pushIfNeeded(
      findings,
      slowUrls.length > 0,
      'slow_pages',
      'Temps de réponse élevé',
      `${slowUrls.length} URL(s) dépassent ~2200ms de réponse.`,
      this.severityFromRatio(slowUrls.length, urls.length),
      0.76,
      'conversion',
      slowUrls,
      'Optimiser backend/caching/poids des pages pour accélérer le rendu.',
    );

    findings.sort(
      (a, b) => this.severityRank(b.severity) - this.severityRank(a.severity),
    );

    return {
      findings,
      metrics: {
        analyzedUrls: urls.length,
        duplicateTitles: duplicateTitles.length,
        duplicateMetaDescriptions: duplicateMetas.length,
        missingTitle,
        missingMetaDescription: missingMeta,
        badTitleLength,
        badMetaLength,
        badH1Count,
        missingLang,
        canonicalIssues,
        noindexConflicts,
        httpErrors: errorUrls.length,
        slowPages: slowUrls.length,
      },
    };
  }

  private pushIfNeeded(
    findings: DeepUrlFinding[],
    condition: boolean,
    code: string,
    title: string,
    description: string,
    severity: FindingSeverity,
    confidence: number,
    impact: FindingImpact,
    affectedUrls: string[],
    recommendation: string,
  ): void {
    if (!condition) return;
    findings.push({
      code,
      title,
      description,
      severity,
      confidence: Math.max(0, Math.min(1, confidence)),
      impact,
      affectedUrls: Array.from(new Set(affectedUrls)).slice(0, 30),
      recommendation,
    });
  }

  private duplicates(
    map: Map<string, string[]>,
  ): Array<{ value: string; urls: string[] }> {
    const duplicates: Array<{ value: string; urls: string[] }> = [];
    for (const [value, urls] of map.entries()) {
      if (urls.length > 1) {
        duplicates.push({ value, urls });
      }
    }
    return duplicates;
  }

  private severityFromRatio(affected: number, total: number): FindingSeverity {
    const ratio = total > 0 ? affected / total : 0;
    if (ratio >= 0.5) return 'high';
    if (ratio >= 0.2) return 'medium';
    return 'low';
  }

  private severityRank(severity: FindingSeverity): number {
    switch (severity) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      default:
        return 1;
    }
  }
}
