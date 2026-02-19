import { Injectable } from '@nestjs/common';
import { AuditLocale } from '../../domain/audit-locale.util';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
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

interface StackCandidate {
  score: number;
  evidence: string[];
}

export interface TechFingerprint {
  primaryStack: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  unknowns: string[];
}

@Injectable()
export class DeepUrlAnalysisService {
  analyze(
    urls: UrlIndexabilityResult[],
    locale: AuditLocale = 'fr',
  ): DeepUrlAnalysisResult {
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
          languageMismatch: 0,
          canonicalIssues: 0,
          canonicalSelfReferenceMismatch: 0,
          noindexConflicts: 0,
          urlPatternIssues: 0,
          thinContentPages: 0,
          contentDepthBuckets: {
            veryThin: 0,
            thin: 0,
            normal: 0,
            rich: 0,
          },
          weakInternalLinking: 0,
          internalLinkDistribution: {
            none: 0,
            weak: 0,
            strong: 0,
          },
          templateDuplicatePatterns: 0,
          missingStructuredDataPages: 0,
          missingOpenGraphPages: 0,
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
    let languageMismatch = 0;
    let canonicalIssues = 0;
    let canonicalSelfReferenceMismatch = 0;
    let noindexConflicts = 0;
    let urlPatternIssues = 0;

    const errorUrls: string[] = [];
    const slowUrls: string[] = [];
    const canonicalIssueUrls: string[] = [];
    const canonicalMismatchUrls: string[] = [];
    const noindexUrls: string[] = [];
    const thinContentUrls: string[] = [];
    const weakInternalLinkingUrls: string[] = [];
    const missingStructuredDataUrls: string[] = [];
    const missingOpenGraphUrls: string[] = [];
    const languageMismatchUrls: string[] = [];
    const urlPatternIssueUrls: string[] = [];
    const contentDepthBuckets = {
      veryThin: 0,
      thin: 0,
      normal: 0,
      rich: 0,
    };
    const internalLinkDistribution = {
      none: 0,
      weak: 0,
      strong: 0,
    };
    const templatePatternCount = new Map<string, string[]>();

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
      } else {
        const normalizedLang = entry.htmlLang.toLowerCase();
        if (
          (locale === 'fr' && normalizedLang.startsWith('en')) ||
          (locale === 'en' && normalizedLang.startsWith('fr'))
        ) {
          languageMismatch += 1;
          languageMismatchUrls.push(pageUrl);
        }
      }

      if (!entry.canonical || (entry.canonicalCount ?? 0) !== 1) {
        canonicalIssues += 1;
        canonicalIssueUrls.push(pageUrl);
      } else if (!this.isSelfReferencingCanonical(entry)) {
        canonicalSelfReferenceMismatch += 1;
        canonicalMismatchUrls.push(pageUrl);
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

      if (
        typeof entry.wordCount === 'number' &&
        entry.wordCount > 0 &&
        entry.wordCount < 180
      ) {
        thinContentUrls.push(pageUrl);
      }
      const contentDepth = this.classifyContentDepth(entry.wordCount ?? 0);
      contentDepthBuckets[contentDepth] += 1;

      if (
        typeof entry.internalLinkCount === 'number' &&
        entry.internalLinkCount > 0 &&
        entry.internalLinkCount < 2
      ) {
        weakInternalLinkingUrls.push(pageUrl);
      }
      const internalLinkLevel = this.classifyInternalLinks(
        entry.internalLinkCount ?? 0,
      );
      internalLinkDistribution[internalLinkLevel] += 1;

      if (entry.hasStructuredData === false) {
        missingStructuredDataUrls.push(pageUrl);
      }

      if (
        typeof entry.openGraphTagCount === 'number' &&
        entry.openGraphTagCount === 0
      ) {
        missingOpenGraphUrls.push(pageUrl);
      }

      if (this.hasUrlPatternIssue(pageUrl)) {
        urlPatternIssues += 1;
        urlPatternIssueUrls.push(pageUrl);
      }

      const templatePattern = this.extractTemplatePattern(pageUrl);
      templatePatternCount.set(templatePattern, [
        ...(templatePatternCount.get(templatePattern) ?? []),
        pageUrl,
      ]);
    }

    const duplicateTitles = this.duplicates(titleMap);
    const duplicateMetas = this.duplicates(metaMap);
    const templateDuplicatePatterns = [...templatePatternCount.entries()]
      .filter(([, templateUrls]) => templateUrls.length >= 3)
      .map(([template, templateUrls]) => ({
        template,
        urls: templateUrls,
      }));

    this.pushIfNeeded(
      findings,
      missingTitle > 0,
      'missing_title',
      this.message(locale, 'Balises title manquantes', 'Missing title tags'),
      this.message(
        locale,
        `${missingTitle} URL(s) sans balise title.`,
        `${missingTitle} URL(s) are missing a title tag.`,
      ),
      this.severityFromRatio(missingTitle, urls.length),
      0.92,
      'traffic',
      urls.filter((entry) => !entry.title).map((entry) => entry.url),
      this.message(
        locale,
        'Ajouter un title unique et orienté intention de recherche sur chaque page.',
        'Add a unique title aligned with search intent on every page.',
      ),
    );

    this.pushIfNeeded(
      findings,
      missingMeta > 0,
      'missing_meta_description',
      this.message(
        locale,
        'Meta descriptions manquantes',
        'Missing meta descriptions',
      ),
      this.message(
        locale,
        `${missingMeta} URL(s) sans meta description.`,
        `${missingMeta} URL(s) are missing a meta description.`,
      ),
      this.severityFromRatio(missingMeta, urls.length),
      0.9,
      'traffic',
      urls
        .filter((entry) => !(entry.metaDescription ?? '').trim())
        .map((entry) => entry.url),
      this.message(
        locale,
        'Rediger une meta description unique (80-170 caracteres) pour chaque page strategique.',
        'Write a unique meta description (80-170 characters) for every strategic page.',
      ),
    );

    this.pushIfNeeded(
      findings,
      duplicateTitles.length > 0,
      'duplicate_titles',
      this.message(locale, 'Titles dupliques', 'Duplicate titles'),
      this.message(
        locale,
        `${duplicateTitles.length} groupe(s) de titles dupliques detectes.`,
        `${duplicateTitles.length} duplicate title group(s) detected.`,
      ),
      this.severityFromRatio(duplicateTitles.length, urls.length),
      0.86,
      'indexation',
      duplicateTitles.flatMap((group) => group.urls),
      this.message(
        locale,
        'Rendre chaque title unique pour eviter la cannibalisation SEO.',
        'Make each title unique to avoid SEO cannibalization.',
      ),
    );

    this.pushIfNeeded(
      findings,
      duplicateMetas.length > 0,
      'duplicate_meta_descriptions',
      this.message(
        locale,
        'Meta descriptions dupliquees',
        'Duplicate meta descriptions',
      ),
      this.message(
        locale,
        `${duplicateMetas.length} groupe(s) de meta descriptions dupliquees detectes.`,
        `${duplicateMetas.length} duplicate meta description group(s) detected.`,
      ),
      this.severityFromRatio(duplicateMetas.length, urls.length),
      0.82,
      'traffic',
      duplicateMetas.flatMap((group) => group.urls),
      this.message(
        locale,
        'Differencier les meta descriptions par page et intention utilisateur.',
        'Differentiate meta descriptions by page and user intent.',
      ),
    );

    this.pushIfNeeded(
      findings,
      badTitleLength > 0,
      'title_length_quality',
      this.message(
        locale,
        'Qualite de longueur des titles',
        'Title length quality issues',
      ),
      this.message(
        locale,
        `${badTitleLength} URL(s) ont un title trop court ou trop long.`,
        `${badTitleLength} URL(s) have a title that is too short or too long.`,
      ),
      this.severityFromRatio(badTitleLength, urls.length),
      0.78,
      'traffic',
      urls
        .filter((entry) => {
          const len = (entry.title ?? '').trim().length;
          return len > 0 && (len < 20 || len > 65);
        })
        .map((entry) => entry.url),
      this.message(
        locale,
        'Ajuster les titles entre 20 et 65 caracteres avec mot-cle principal.',
        'Adjust titles to 20-65 characters with the primary keyword.',
      ),
    );

    this.pushIfNeeded(
      findings,
      badMetaLength > 0,
      'meta_length_quality',
      this.message(
        locale,
        'Qualite de longueur des meta descriptions',
        'Meta description length quality issues',
      ),
      this.message(
        locale,
        `${badMetaLength} URL(s) ont une meta description hors plage recommandee.`,
        `${badMetaLength} URL(s) have a meta description outside the recommended range.`,
      ),
      this.severityFromRatio(badMetaLength, urls.length),
      0.74,
      'traffic',
      urls
        .filter((entry) => {
          const len = (entry.metaDescription ?? '').trim().length;
          return len > 0 && (len < 80 || len > 170);
        })
        .map((entry) => entry.url),
      this.message(
        locale,
        'Ajuster les metas entre 80 et 170 caracteres avec une proposition de valeur claire.',
        'Adjust meta descriptions to 80-170 characters with a clear value proposition.',
      ),
    );

    this.pushIfNeeded(
      findings,
      badH1Count > 0,
      'h1_structure',
      this.message(locale, 'Structure H1 non conforme', 'H1 structure issues'),
      this.message(
        locale,
        `${badH1Count} URL(s) n'ont pas exactement un H1.`,
        `${badH1Count} URL(s) do not have exactly one H1.`,
      ),
      this.severityFromRatio(badH1Count, urls.length),
      0.8,
      'indexation',
      urls
        .filter((entry) => (entry.h1Count ?? 1) !== 1)
        .map((entry) => entry.url),
      this.message(
        locale,
        'Conserver un seul H1 descriptif par page.',
        'Keep one descriptive H1 per page.',
      ),
    );

    this.pushIfNeeded(
      findings,
      missingLang > 0,
      'missing_lang',
      this.message(locale, 'Attribut lang manquant', 'Missing lang attribute'),
      this.message(
        locale,
        `${missingLang} URL(s) sans attribut lang explicite.`,
        `${missingLang} URL(s) are missing an explicit lang attribute.`,
      ),
      this.severityFromRatio(missingLang, urls.length),
      0.72,
      'conversion',
      urls.filter((entry) => !entry.htmlLang).map((entry) => entry.url),
      this.message(
        locale,
        "Definir l'attribut lang pour ameliorer accessibilite, comprehension et ciblage.",
        'Set html lang to improve accessibility, relevance, and geo/language targeting.',
      ),
    );

    this.pushIfNeeded(
      findings,
      languageMismatch > 0,
      'language_mismatch',
      this.message(
        locale,
        'Langue de page incoherente avec la locale cible',
        'Page language mismatch against selected locale',
      ),
      this.message(
        locale,
        `${languageMismatch} URL(s) ont un html[lang] en conflit avec la locale cible.`,
        `${languageMismatch} URL(s) have html[lang] conflicting with selected locale.`,
      ),
      this.severityFromRatio(languageMismatch, urls.length),
      0.82,
      'traffic',
      languageMismatchUrls,
      this.message(
        locale,
        "Aligner html[lang], templates et contenu avec la locale cible de l'audit.",
        'Align html[lang], templates, and content with the selected audit locale.',
      ),
    );

    this.pushIfNeeded(
      findings,
      canonicalIssues > 0,
      'canonical_consistency',
      this.message(
        locale,
        'Canonicals manquantes ou incoherentes',
        'Missing or inconsistent canonical tags',
      ),
      this.message(
        locale,
        `${canonicalIssues} URL(s) avec canonical absente ou multiple.`,
        `${canonicalIssues} URL(s) with missing or multiple canonical tags.`,
      ),
      this.severityFromRatio(canonicalIssues, urls.length),
      0.87,
      'indexation',
      canonicalIssueUrls,
      this.message(
        locale,
        "Assurer une canonical unique et coherente avec l'URL preferee.",
        'Ensure one canonical tag per page and align it with the preferred URL.',
      ),
    );

    this.pushIfNeeded(
      findings,
      canonicalSelfReferenceMismatch > 0,
      'canonical_self_reference_mismatch',
      this.message(
        locale,
        'Canonical non auto-referente',
        'Canonical not self-referencing',
      ),
      this.message(
        locale,
        `${canonicalSelfReferenceMismatch} URL(s) ont une canonical differente de l'URL finale.`,
        `${canonicalSelfReferenceMismatch} URL(s) have canonical URLs different from final URLs.`,
      ),
      this.severityFromRatio(canonicalSelfReferenceMismatch, urls.length),
      0.84,
      'indexation',
      canonicalMismatchUrls,
      this.message(
        locale,
        "Faire pointer la canonical vers l'URL canonique finale de la page.",
        'Point canonical to the page final canonical URL.',
      ),
    );

    this.pushIfNeeded(
      findings,
      noindexConflicts > 0,
      'noindex_conflicts',
      this.message(locale, "Conflits d'indexabilite", 'Indexability conflicts'),
      this.message(
        locale,
        `${noindexConflicts} URL(s) repondent correctement mais ne sont pas indexables.`,
        `${noindexConflicts} URL(s) return a valid response but are not indexable.`,
      ),
      this.severityFromRatio(noindexConflicts, urls.length),
      0.9,
      'indexation',
      noindexUrls,
      this.message(
        locale,
        'Supprimer les directives noindex non intentionnelles (meta/x-robots-tag).',
        'Remove unintended noindex directives (meta/x-robots-tag).',
      ),
    );

    this.pushIfNeeded(
      findings,
      errorUrls.length > 0,
      'http_errors',
      this.message(locale, 'Erreurs HTTP detectees', 'Detected HTTP errors'),
      this.message(
        locale,
        `${errorUrls.length} URL(s) retournent une erreur ou sont inaccessibles.`,
        `${errorUrls.length} URL(s) return an error or are inaccessible.`,
      ),
      this.severityFromRatio(errorUrls.length, urls.length),
      0.95,
      'traffic',
      errorUrls,
      this.message(
        locale,
        'Corriger les pages en 4xx/5xx pour restaurer indexation et conversion.',
        'Fix 4xx/5xx pages to recover indexation and conversion.',
      ),
    );

    this.pushIfNeeded(
      findings,
      slowUrls.length > 0,
      'slow_pages',
      this.message(locale, 'Temps de reponse eleve', 'High response times'),
      this.message(
        locale,
        `${slowUrls.length} URL(s) depassent ~2200ms de reponse.`,
        `${slowUrls.length} URL(s) exceed ~2200ms response time.`,
      ),
      this.severityFromRatio(slowUrls.length, urls.length),
      0.76,
      'conversion',
      slowUrls,
      this.message(
        locale,
        'Optimiser backend/caching/poids des pages pour accelerer le rendu.',
        'Optimize backend, caching, and page weight to improve render speed.',
      ),
    );

    this.pushIfNeeded(
      findings,
      thinContentUrls.length > 0,
      'thin_content',
      this.message(locale, 'Contenu insuffisant', 'Thin content pages'),
      this.message(
        locale,
        `${thinContentUrls.length} URL(s) semblent trop pauvres en contenu editorial.`,
        `${thinContentUrls.length} URL(s) appear to have thin editorial content.`,
      ),
      this.severityFromRatio(thinContentUrls.length, urls.length),
      0.68,
      'traffic',
      thinContentUrls,
      this.message(
        locale,
        'Enrichir les pages (intention, preuves, FAQ, sections utiles) pour augmenter la profondeur semantique.',
        'Expand page content (intent coverage, proof points, FAQ, useful sections) to increase semantic depth.',
      ),
    );

    this.pushIfNeeded(
      findings,
      weakInternalLinkingUrls.length > 0,
      'weak_internal_linking',
      this.message(
        locale,
        'Maillage interne insuffisant',
        'Weak internal linking',
      ),
      this.message(
        locale,
        `${weakInternalLinkingUrls.length} URL(s) ont un maillage interne faible.`,
        `${weakInternalLinkingUrls.length} URL(s) have weak internal linking.`,
      ),
      this.severityFromRatio(weakInternalLinkingUrls.length, urls.length),
      0.69,
      'indexation',
      weakInternalLinkingUrls,
      this.message(
        locale,
        'Ajouter des liens internes contextuels vers les pages business prioritaires.',
        'Add contextual internal links to priority business pages.',
      ),
    );

    this.pushIfNeeded(
      findings,
      urlPatternIssues > 0,
      'url_pattern_quality',
      this.message(
        locale,
        "Qualite de structure d'URL a corriger",
        'URL pattern quality issues',
      ),
      this.message(
        locale,
        `${urlPatternIssues} URL(s) contiennent des patterns peu SEO-friendly (query string, uppercase, underscore, slash multiples).`,
        `${urlPatternIssues} URL(s) contain non SEO-friendly patterns (query string, uppercase, underscore, multiple slashes).`,
      ),
      this.severityFromRatio(urlPatternIssues, urls.length),
      0.71,
      'traffic',
      urlPatternIssueUrls,
      this.message(
        locale,
        'Standardiser les URLs en slug lisible, lowercase, sans paramètres inutiles.',
        'Standardize URLs to readable lowercase slugs without unnecessary parameters.',
      ),
    );

    this.pushIfNeeded(
      findings,
      templateDuplicatePatterns.length > 0,
      'template_duplicate_pattern',
      this.message(
        locale,
        'Pattern template duplique detecte',
        'Duplicated template URL pattern detected',
      ),
      this.message(
        locale,
        `${templateDuplicatePatterns.length} pattern(s) template presentent une repetition elevee.`,
        `${templateDuplicatePatterns.length} template pattern(s) show high duplication.`,
      ),
      this.severityFromRatio(templateDuplicatePatterns.length, urls.length),
      0.66,
      'indexation',
      templateDuplicatePatterns.flatMap((entry) => entry.urls),
      this.message(
        locale,
        'Consolider les templates similaires et renforcer la differenciation semantique.',
        'Consolidate similar templates and strengthen semantic differentiation.',
      ),
    );

    this.pushIfNeeded(
      findings,
      missingStructuredDataUrls.length > 0,
      'missing_structured_data',
      this.message(
        locale,
        'Donnees structurees absentes',
        'Missing structured data',
      ),
      this.message(
        locale,
        `${missingStructuredDataUrls.length} URL(s) sans schema.org exploitable.`,
        `${missingStructuredDataUrls.length} URL(s) are missing usable schema.org structured data.`,
      ),
      this.severityFromRatio(missingStructuredDataUrls.length, urls.length),
      0.73,
      'conversion',
      missingStructuredDataUrls,
      this.message(
        locale,
        'Ajouter des schemas adaptes (Organization, LocalBusiness, Product, FAQ, Breadcrumb).',
        'Implement relevant schemas (Organization, LocalBusiness, Product, FAQ, Breadcrumb).',
      ),
    );

    this.pushIfNeeded(
      findings,
      missingOpenGraphUrls.length > 0,
      'missing_open_graph',
      this.message(
        locale,
        'Balises OpenGraph manquantes',
        'Missing OpenGraph tags',
      ),
      this.message(
        locale,
        `${missingOpenGraphUrls.length} URL(s) sans metadonnees OpenGraph.`,
        `${missingOpenGraphUrls.length} URL(s) are missing OpenGraph metadata.`,
      ),
      this.severityFromRatio(missingOpenGraphUrls.length, urls.length),
      0.67,
      'conversion',
      missingOpenGraphUrls,
      this.message(
        locale,
        'Definir au minimum og:title, og:description et og:image sur les pages strategiques.',
        'Define at least og:title, og:description, and og:image on strategic pages.',
      ),
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
        languageMismatch,
        canonicalIssues,
        canonicalSelfReferenceMismatch,
        noindexConflicts,
        urlPatternIssues,
        httpErrors: errorUrls.length,
        slowPages: slowUrls.length,
        thinContentPages: thinContentUrls.length,
        contentDepthBuckets,
        weakInternalLinking: weakInternalLinkingUrls.length,
        internalLinkDistribution,
        templateDuplicatePatterns: templateDuplicatePatterns.length,
        missingStructuredDataPages: missingStructuredDataUrls.length,
        missingOpenGraphPages: missingOpenGraphUrls.length,
      },
    };
  }

  inferTechFingerprint(
    homepage: HomepageAuditSnapshot,
    urls: UrlIndexabilityResult[],
    locale: AuditLocale = 'fr',
  ): TechFingerprint {
    const snapshots: Array<{
      url: string;
      detectedCmsHints?: string[];
      server?: string | null;
      xPoweredBy?: string | null;
      setCookiePatterns?: string[];
    }> = [
      {
        url: homepage.finalUrl,
        detectedCmsHints: homepage.detectedCmsHints,
        server: homepage.server,
        xPoweredBy: homepage.xPoweredBy,
        setCookiePatterns: homepage.setCookiePatterns,
      },
      ...urls,
    ];
    const candidates = new Map<string, StackCandidate>();
    const unknowns = new Set<string>();

    const addCandidate = (
      name: string,
      score: number,
      evidence: string,
    ): void => {
      const normalized = name.trim();
      if (!normalized || score <= 0) return;
      const current = candidates.get(normalized) ?? { score: 0, evidence: [] };
      current.score += score;
      if (evidence && !current.evidence.includes(evidence)) {
        current.evidence.push(evidence);
      }
      candidates.set(normalized, current);
    };

    for (const snapshot of snapshots) {
      const url = snapshot.url;
      const cmsHints = snapshot.detectedCmsHints ?? [];
      for (const hint of cmsHints) {
        addCandidate(hint, 3, `${hint} hint detected on ${url}`);
      }

      const server = (snapshot.server ?? '').toLowerCase();
      if (!server) {
        unknowns.add(
          locale === 'en'
            ? 'Server header not disclosed on most pages'
            : 'Header Server non expose sur la majorite des pages',
        );
      }
      if (server.includes('cloudflare')) {
        addCandidate(
          'Cloudflare edge stack',
          1,
          `Server header includes ${server}`,
        );
      }
      if (server.includes('nginx')) {
        addCandidate('Nginx web stack', 1, `Server header includes ${server}`);
      }
      if (server.includes('apache')) {
        addCandidate('Apache web stack', 1, `Server header includes ${server}`);
      }
      if (server.includes('iis')) {
        addCandidate(
          'Microsoft IIS / ASP.NET',
          3,
          `Server header includes ${server}`,
        );
      }
      if (server.includes('vercel')) {
        addCandidate(
          'Next.js on Vercel',
          2,
          `Server header includes ${server}`,
        );
      }

      const xPoweredBy = (snapshot.xPoweredBy ?? '').toLowerCase();
      if (!xPoweredBy) {
        unknowns.add(
          locale === 'en'
            ? 'x-powered-by header is hidden'
            : 'Header x-powered-by masque',
        );
      }
      if (xPoweredBy.includes('next.js')) {
        addCandidate('Next.js', 4, `x-powered-by includes ${xPoweredBy}`);
      }
      if (
        xPoweredBy.includes('node') ||
        xPoweredBy.includes('express') ||
        xPoweredBy.includes('nestjs')
      ) {
        addCandidate(
          'Node.js runtime',
          3,
          `x-powered-by includes ${xPoweredBy}`,
        );
      }
      if (xPoweredBy.includes('php')) {
        addCandidate('PHP runtime', 3, `x-powered-by includes ${xPoweredBy}`);
      }
      if (xPoweredBy.includes('asp.net')) {
        addCandidate(
          'ASP.NET runtime',
          3,
          `x-powered-by includes ${xPoweredBy}`,
        );
      }

      const cookies = (snapshot.setCookiePatterns ?? []).map((entry) =>
        entry.toLowerCase(),
      );
      if (cookies.length === 0) {
        unknowns.add(
          locale === 'en'
            ? 'No deterministic Set-Cookie framework signature'
            : 'Aucune signature framework deterministe dans Set-Cookie',
        );
      }
      if (cookies.some((cookie) => cookie.startsWith('wordpress_'))) {
        addCandidate(
          'WordPress',
          5,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
      if (cookies.some((cookie) => cookie.includes('woocommerce'))) {
        addCandidate(
          'WordPress + WooCommerce',
          5,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
      if (cookies.some((cookie) => cookie.includes('_shopify'))) {
        addCandidate(
          'Shopify',
          5,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
      if (cookies.some((cookie) => cookie === 'phpsessid')) {
        addCandidate(
          'PHP runtime',
          3,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
      if (cookies.some((cookie) => cookie.startsWith('__next'))) {
        addCandidate(
          'Next.js',
          2,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
      if (cookies.some((cookie) => cookie.includes('wix'))) {
        addCandidate(
          'Wix',
          4,
          `Cookie signatures detected: ${cookies.join(', ')}`,
        );
      }
    }

    const ranked = [...candidates.entries()].sort(
      (a, b) => b[1].score - a[1].score,
    );
    const best = ranked[0];

    if (!best || best[1].score < 3) {
      return {
        primaryStack: locale === 'en' ? 'Not verifiable' : 'Non verifiable',
        confidence: 0.2,
        evidence: [],
        alternatives: [],
        unknowns: Array.from(unknowns).slice(0, 5),
      };
    }

    const confidence = Math.max(0.3, Math.min(0.95, best[1].score / 10));
    return {
      primaryStack: best[0],
      confidence: Math.round(confidence * 100) / 100,
      evidence: best[1].evidence.slice(0, 8),
      alternatives: ranked.slice(1, 4).map(([name]) => name),
      unknowns: Array.from(unknowns).slice(0, 5),
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

  private isSelfReferencingCanonical(entry: UrlIndexabilityResult): boolean {
    if (!entry.canonical || !entry.finalUrl) return false;
    try {
      const canonical = new URL(entry.canonical, entry.finalUrl);
      const final = new URL(entry.finalUrl);
      canonical.hash = '';
      final.hash = '';
      const canonicalPath = canonical.pathname.replace(/\/+$/, '') || '/';
      const finalPath = final.pathname.replace(/\/+$/, '') || '/';
      return (
        canonical.origin === final.origin &&
        canonicalPath === finalPath &&
        canonical.search === final.search
      );
    } catch {
      return false;
    }
  }

  private hasUrlPatternIssue(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.search.length > 0) return true;
      if (/[A-Z]/.test(parsed.pathname)) return true;
      if (parsed.pathname.includes('_')) return true;
      if (parsed.pathname.includes('//')) return true;
      return false;
    } catch {
      return false;
    }
  }

  private classifyContentDepth(
    wordCount: number,
  ): 'veryThin' | 'thin' | 'normal' | 'rich' {
    if (wordCount <= 0 || wordCount < 120) return 'veryThin';
    if (wordCount < 260) return 'thin';
    if (wordCount < 900) return 'normal';
    return 'rich';
  }

  private classifyInternalLinks(
    internalLinkCount: number,
  ): 'none' | 'weak' | 'strong' {
    if (internalLinkCount <= 0) return 'none';
    if (internalLinkCount < 3) return 'weak';
    return 'strong';
  }

  private extractTemplatePattern(url: string): string {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname
        .split('/')
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (segments.length === 0) return '/';
      if (segments.length === 1) return `/${segments[0]}/*`;
      return `/${segments[0]}/${segments[1]}/*`;
    } catch {
      return '/';
    }
  }

  private message(locale: AuditLocale, fr: string, en: string): string {
    return locale === 'en' ? en : fr;
  }
}
