import { Injectable } from '@nestjs/common';
import type { ClientReportSynthesis } from '../../domain/AuditReportTiers';
import { AuditLocale } from '../../domain/audit-locale.util';
import { hasLanguageMismatch } from './report-quality-gate/language-check.util';
import {
  validateClientReport as runClientTierValidation,
  validateExpertReport as runExpertTierValidation,
  type TierValidationResult,
} from './report-quality-gate/tier-validators';
import { priorityFromFinding } from './shared/finding-priority.util';
import { localizedText } from './shared/locale-text.util';
import {
  ACTIONABLE_PILLARS,
  type ActionablePillarKey,
} from './scoring.service';

export type { TierValidationResult };

type PrioritySeverity = 'high' | 'medium' | 'low';

const PILLAR_DEGRADED_SCORE = 65;

interface PillarActionTemplate {
  title: [string, string];
  whyItMatters: [string, string];
  recommendedFix: [string, string];
  degradedHours: number;
  standardHours: number;
}

const PILLAR_ACTION_TEMPLATES: Record<
  ActionablePillarKey,
  PillarActionTemplate
> = {
  seo: {
    title: [
      'Corriger la qualite SEO on-page sur les templates prioritaires',
      'Fix on-page SEO quality on priority templates',
    ],
    whyItMatters: [
      'Le deficit SEO degrade la visibilite organique et la couverture des intentions.',
      'SEO gaps reduce organic visibility and intent coverage.',
    ],
    recommendedFix: [
      'Standardiser title/meta/H1/canonical/lang sur les pages a fort potentiel.',
      'Standardize title/meta/H1/canonical/lang on high-potential pages.',
    ],
    degradedHours: 8,
    standardHours: 5,
  },
  performance: {
    title: [
      'Optimiser les pages lentes et le budget de rendu',
      'Optimize slow pages and rendering budget',
    ],
    whyItMatters: [
      'La lenteur penalise conversion, crawl budget et experience utilisateur.',
      'Slowness hurts conversion, crawl budget, and user experience.',
    ],
    recommendedFix: [
      'Prioriser cache, poids des assets, critical CSS et reduction JS.',
      'Prioritize caching, asset weight reduction, critical CSS, and JS reduction.',
    ],
    degradedHours: 10,
    standardHours: 6,
  },
  technical: {
    title: [
      "Stabiliser l'indexabilite et la conformite technique",
      'Stabilize indexability and technical compliance',
    ],
    whyItMatters: [
      'Les defauts techniques bloquent la decouverte et la consolidation SEO.',
      'Technical defects block discovery and SEO consolidation.',
    ],
    recommendedFix: [
      'Auditer robots, canonicals, statuts HTTP, sitemap et redirections.',
      'Audit robots, canonicals, HTTP status, sitemap, and redirects.',
    ],
    degradedHours: 9,
    standardHours: 6,
  },
  trust: {
    title: [
      'Renforcer les signaux de confiance et le marquage schema.org',
      'Strengthen trust signals and schema.org coverage',
    ],
    whyItMatters: [
      'Les signaux de confiance influencent CTR, conversion et perception de marque.',
      'Trust signals influence CTR, conversion, and brand perception.',
    ],
    recommendedFix: [
      'Ajouter schemas, preuves sociales, mentions legale et coherence marque.',
      'Add schema, social proof, legal pages, and brand consistency signals.',
    ],
    degradedHours: 7,
    standardHours: 4,
  },
  conversion: {
    title: [
      'Ameliorer le tunnel de conversion et les points de contact',
      'Improve conversion funnel and contact touchpoints',
    ],
    whyItMatters: [
      'Les frictions de conversion reduisent la valeur business des visites SEO.',
      'Conversion friction reduces business value of SEO traffic.',
    ],
    recommendedFix: [
      'Renforcer CTA, formulaires et navigation vers les pages commerciales.',
      'Strengthen CTA, forms, and paths to commercial pages.',
    ],
    degradedHours: 8,
    standardHours: 5,
  },
};

export interface ExpertPriority {
  title: string;
  severity: PrioritySeverity;
  whyItMatters: string;
  recommendedFix: string;
  estimatedHours: number;
}

export interface DiagnosticChaptersShape {
  conversionAndClarity: string;
  speedAndPerformance: string;
  seoFoundations: string;
  credibilityAndTrust: string;
  techAndScalability: string;
  scorecardAndBusinessOpportunities: string;
}

export interface TechFingerprintShape {
  primaryStack: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  unknowns: string[];
}

interface ClientEmailDraftShape {
  subject: string;
  body: string;
}

export interface ExpertReportShape {
  executiveSummary: string;
  reportExplanation: string;
  strengths: string[];
  diagnosticChapters: DiagnosticChaptersShape;
  techFingerprint: TechFingerprintShape;
  /**
   * Laissé en `unknown[]` pour découpler la shape du gate du type Zod
   * interne de `langchain-audit-report.service.ts`. Le gate valide les
   * champs via `validateExpertReport`.
   */
  perPageAnalysis: unknown[];
  clientEmailDraft: ClientEmailDraftShape;
  internalNotes: string;
  priorities: ExpertPriority[];
  urlLevelImprovements: Array<{
    url: string;
    issue: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  implementationTodo: Array<{
    phase: string;
    objective: string;
    deliverable: string;
    estimatedHours: number;
    dependencies: string[];
  }>;
  whatToFixThisWeek: Array<{
    task: string;
    goal: string;
    estimatedHours: number;
    risk: string;
    dependencies: string[];
  }>;
  whatToFixThisMonth: Array<{
    task: string;
    goal: string;
    estimatedHours: number;
    risk: string;
    dependencies: string[];
  }>;
  clientMessageTemplate: string;
  clientLongEmail: string;
  fastImplementationPlan: Array<{
    task: string;
    whyItMatters: string;
    implementationSteps: string[];
    estimatedHours: number;
    expectedImpact: string;
    priority: PrioritySeverity;
  }>;
  implementationBacklog: Array<{
    task: string;
    priority: PrioritySeverity;
    details: string;
    estimatedHours: number;
    dependencies: string[];
    acceptanceCriteria: string[];
  }>;
  invoiceScope: Array<{
    item: string;
    description: string;
    estimatedHours: number;
  }>;
  [key: string]: unknown;
}

export interface ReportQualityGateContext {
  locale: AuditLocale;
  websiteName: string;
  normalizedUrl: string;
  quickWins: string[];
  pillarScores: Record<string, number>;
  deepFindings: Array<{
    title: string;
    description: string;
    recommendation: string;
    severity: PrioritySeverity;
    impact: 'traffic' | 'indexation' | 'conversion';
  }>;
}

export interface ReportQualityGateResult {
  summaryText: string;
  report: ExpertReportShape;
  valid: boolean;
  reasons: string[];
}

@Injectable()
export class ReportQualityGateService {
  private readonly minPriorities = 10;
  private readonly maxPriorities = 12;

  apply(
    summaryText: string,
    report: ExpertReportShape,
    context: ReportQualityGateContext,
  ): ReportQualityGateResult {
    const reasons: string[] = [];
    const locale = context.locale;

    const summary = this.cleanText(summaryText);
    const normalizedSummary =
      summary ||
      localizedText(
        locale,
        `Resume d'audit indisponible pour ${context.normalizedUrl}.`,
        `Audit summary unavailable for ${context.normalizedUrl}.`,
      );
    if (!summary) {
      reasons.push('missing_summary_text');
    }

    const normalizedReport: ExpertReportShape = {
      ...report,
      executiveSummary: this.requireText(
        report.executiveSummary,
        localizedText(
          locale,
          'Resume executif indisponible.',
          'Executive summary unavailable.',
        ),
        reasons,
        'missing_executive_summary',
      ),
      reportExplanation: this.requireText(
        report.reportExplanation,
        localizedText(
          locale,
          'Explication du rapport indisponible.',
          'Report explanation unavailable.',
        ),
        reasons,
        'missing_report_explanation',
      ),
      clientMessageTemplate: this.requireText(
        report.clientMessageTemplate,
        localizedText(
          locale,
          'Bonjour, voici les priorites a traiter en premier.',
          'Hello, here are the top priorities to address first.',
        ),
        reasons,
        'missing_client_message_template',
      ),
      clientLongEmail: this.requireText(
        report.clientLongEmail,
        normalizedSummary,
        reasons,
        'missing_client_long_email',
      ),
      strengths: this.normalizeStringArray(report.strengths),
      diagnosticChapters: this.normalizeDiagnosticChapters(
        report.diagnosticChapters,
        locale,
      ),
      techFingerprint: this.normalizeTechFingerprint(
        report.techFingerprint,
        locale,
      ),
      urlLevelImprovements: this.normalizeUrlLevelImprovements(
        report.urlLevelImprovements,
      ),
      implementationTodo: this.normalizeImplementationTodo(
        report.implementationTodo,
      ),
      whatToFixThisWeek: this.normalizePlan(report.whatToFixThisWeek, locale),
      whatToFixThisMonth: this.normalizePlan(report.whatToFixThisMonth, locale),
      fastImplementationPlan: this.normalizeFastPlan(
        report.fastImplementationPlan,
      ),
      implementationBacklog: this.normalizeBacklog(
        report.implementationBacklog,
      ),
      invoiceScope: this.normalizeInvoiceScope(report.invoiceScope),
      perPageAnalysis: Array.isArray(report.perPageAnalysis)
        ? report.perPageAnalysis
        : [],
      clientEmailDraft:
        report.clientEmailDraft &&
        typeof report.clientEmailDraft === 'object' &&
        typeof report.clientEmailDraft.subject === 'string' &&
        typeof report.clientEmailDraft.body === 'string'
          ? report.clientEmailDraft
          : { subject: '', body: '' },
      internalNotes:
        typeof report.internalNotes === 'string' ? report.internalNotes : '',
      priorities: [],
    };

    normalizedReport.priorities = this.buildPriorities(
      report.priorities,
      context,
      locale,
      reasons,
    );

    if (normalizedReport.priorities.length < this.minPriorities) {
      reasons.push('priority_count_below_minimum');
    }

    const languageCorpus = [
      normalizedSummary,
      normalizedReport.executiveSummary,
      normalizedReport.reportExplanation,
      normalizedReport.clientMessageTemplate,
      normalizedReport.clientLongEmail,
      normalizedReport.diagnosticChapters.conversionAndClarity,
      normalizedReport.diagnosticChapters.speedAndPerformance,
      normalizedReport.diagnosticChapters.seoFoundations,
      normalizedReport.diagnosticChapters.credibilityAndTrust,
      normalizedReport.diagnosticChapters.techAndScalability,
      normalizedReport.diagnosticChapters.scorecardAndBusinessOpportunities,
      normalizedReport.techFingerprint.primaryStack,
      ...normalizedReport.techFingerprint.evidence,
      ...normalizedReport.techFingerprint.unknowns,
      ...normalizedReport.priorities.flatMap((entry) => [
        entry.title,
        entry.whyItMatters,
        entry.recommendedFix,
      ]),
    ]
      .filter(Boolean)
      .join(' ');

    if (hasLanguageMismatch(languageCorpus, locale)) {
      reasons.push('language_mismatch_detected');
    }

    const valid = reasons.length === 0;
    return {
      summaryText: normalizedSummary,
      report: normalizedReport,
      valid,
      reasons: Array.from(new Set(reasons)),
    };
  }

  private buildPriorities(
    basePriorities: ExpertPriority[] | undefined,
    context: ReportQualityGateContext,
    locale: AuditLocale,
    reasons: string[],
  ): ExpertPriority[] {
    const unique = new Set<string>();
    const priorities: ExpertPriority[] = [];

    this.appendPriorities(
      priorities,
      unique,
      (Array.isArray(basePriorities) ? basePriorities : []).map((entry) =>
        this.normalizePriority(entry),
      ),
      null,
    );

    this.appendPriorities(
      priorities,
      unique,
      context.deepFindings.map((finding) =>
        this.normalizePriority(priorityFromFinding(finding, locale)),
      ),
      this.maxPriorities,
    );

    this.appendPriorities(
      priorities,
      unique,
      context.quickWins.map((quickWin) =>
        this.normalizePriority({
          title: quickWin,
          severity: 'medium',
          whyItMatters: localizedText(
            locale,
            'Action rapide pour renforcer la base SEO technique et la conversion.',
            'Fast action to strengthen technical SEO baseline and conversion.',
          ),
          recommendedFix: quickWin,
          estimatedHours: 3,
        }),
      ),
      this.maxPriorities,
    );

    this.appendPriorities(
      priorities,
      unique,
      this.pillarBasedActions(context.pillarScores, locale),
      this.maxPriorities,
    );

    this.appendPriorities(
      priorities,
      unique,
      this.genericActions(locale, context.websiteName),
      this.maxPriorities,
    );

    if (priorities.length < this.minPriorities) {
      reasons.push('priority_enrichment_exhausted');
    }

    return priorities.slice(0, this.maxPriorities);
  }

  private appendPriorities(
    target: ExpertPriority[],
    seenTitles: Set<string>,
    candidates: ReadonlyArray<ExpertPriority | null>,
    cap: number | null,
  ): void {
    for (const candidate of candidates) {
      if (cap !== null && target.length >= cap) break;
      if (!candidate) continue;
      const key = candidate.title.toLowerCase();
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);
      target.push(candidate);
    }
  }

  private pillarBasedActions(
    pillarScores: Record<string, number>,
    locale: AuditLocale,
  ): ExpertPriority[] {
    const entries = ACTIONABLE_PILLARS.map(
      (key) => [key, pillarScores[key]] as const,
    )
      .filter(([, score]) => Number.isFinite(score))
      .sort((a, b) => a[1] - b[1]);

    const actions: ExpertPriority[] = [];

    for (const [pillar, score] of entries) {
      if (score >= 90) continue;
      actions.push(this.buildPillarAction(pillar, score, locale));
    }

    return actions;
  }

  private buildPillarAction(
    pillar: ActionablePillarKey,
    score: number,
    locale: AuditLocale,
  ): ExpertPriority {
    const template = PILLAR_ACTION_TEMPLATES[pillar];
    const degraded = score < PILLAR_DEGRADED_SCORE;

    return {
      title: localizedText(locale, ...template.title),
      severity: degraded ? 'high' : 'medium',
      whyItMatters: localizedText(locale, ...template.whyItMatters),
      recommendedFix: localizedText(locale, ...template.recommendedFix),
      estimatedHours: degraded
        ? template.degradedHours
        : template.standardHours,
    };
  }

  private genericActions(
    locale: AuditLocale,
    websiteName: string,
  ): ExpertPriority[] {
    const fr = [
      {
        title: `Mettre en place un tableau de bord SEO hebdomadaire pour ${websiteName}`,
        severity: 'medium' as const,
        whyItMatters:
          'Le pilotage hebdomadaire permet de mesurer rapidement les regressions et gains.',
        recommendedFix:
          'Suivre indexation, pages critiques, performances et conversions par cohortes.',
        estimatedHours: 3,
      },
      {
        title: 'Valider chaque correction avec un protocole de QA SEO',
        severity: 'medium' as const,
        whyItMatters:
          "Sans QA, les regressions techniques annulent les gains d'optimisation.",
        recommendedFix:
          'Ajouter checklist preprod/prod: crawl, canonicals, title/meta, logs, tracking.',
        estimatedHours: 4,
      },
      {
        title: 'Planifier un sprint mensuel de hardening SEO technique',
        severity: 'medium' as const,
        whyItMatters:
          'Un sprint recurrent consolide durablement les fondations SEO.',
        recommendedFix:
          'Allouer un lot mensuel aux fixes indexabilite, performance et maillage interne.',
        estimatedHours: 5,
      },
    ];

    const en = [
      {
        title: `Set up a weekly SEO health dashboard for ${websiteName}`,
        severity: 'medium' as const,
        whyItMatters: 'Weekly tracking detects regressions and gains quickly.',
        recommendedFix:
          'Track indexation, critical pages, performance, and conversion cohorts.',
        estimatedHours: 3,
      },
      {
        title: 'Validate every fix with a technical SEO QA protocol',
        severity: 'medium' as const,
        whyItMatters:
          'Without QA, technical regressions erase optimization gains.',
        recommendedFix:
          'Use preprod/prod checklists: crawl, canonicals, title/meta, logs, tracking.',
        estimatedHours: 4,
      },
      {
        title: 'Schedule a monthly technical SEO hardening sprint',
        severity: 'medium' as const,
        whyItMatters:
          'A recurring sprint hardens the SEO foundation over time.',
        recommendedFix:
          'Reserve monthly capacity for indexability, performance, and internal-link fixes.',
        estimatedHours: 5,
      },
    ];

    return locale === 'en' ? en : fr;
  }

  private normalizePriority(
    entry: Partial<ExpertPriority>,
  ): ExpertPriority | null {
    const title = this.cleanText(entry.title);
    const whyItMatters = this.cleanText(entry.whyItMatters);
    const recommendedFix =
      this.cleanText(entry.recommendedFix) || this.cleanText(entry.title);

    if (!title || !whyItMatters || !recommendedFix) {
      return null;
    }

    return {
      title,
      severity: this.normalizeSeverity(entry.severity),
      whyItMatters,
      recommendedFix,
      estimatedHours: this.normalizeHours(entry.estimatedHours, 3),
    };
  }

  private normalizeDiagnosticChapters(
    chapters: Partial<DiagnosticChaptersShape> | undefined,
    locale: AuditLocale,
  ): DiagnosticChaptersShape {
    return {
      conversionAndClarity:
        this.cleanText(chapters?.conversionAndClarity) ||
        localizedText(
          locale,
          'Conversion et clarte: Non verifiable.',
          'Conversion and clarity: Not verifiable.',
        ),
      speedAndPerformance:
        this.cleanText(chapters?.speedAndPerformance) ||
        localizedText(
          locale,
          'Vitesse et performance: Non verifiable.',
          'Speed and performance: Not verifiable.',
        ),
      seoFoundations:
        this.cleanText(chapters?.seoFoundations) ||
        localizedText(
          locale,
          'Fondations SEO: Non verifiable.',
          'SEO foundations: Not verifiable.',
        ),
      credibilityAndTrust:
        this.cleanText(chapters?.credibilityAndTrust) ||
        localizedText(
          locale,
          'Credibilite et confiance: Non verifiable.',
          'Credibility and trust: Not verifiable.',
        ),
      techAndScalability:
        this.cleanText(chapters?.techAndScalability) ||
        localizedText(
          locale,
          'Tech et scalabilite: Non verifiable.',
          'Tech and scalability: Not verifiable.',
        ),
      scorecardAndBusinessOpportunities:
        this.cleanText(chapters?.scorecardAndBusinessOpportunities) ||
        localizedText(
          locale,
          'Scorecard et opportunites business: Non verifiable.',
          'Scorecard and business opportunities: Not verifiable.',
        ),
    };
  }

  private normalizeTechFingerprint(
    value: Partial<TechFingerprintShape> | undefined,
    locale: AuditLocale,
  ): TechFingerprintShape {
    const confidence = Number(value?.confidence);
    return {
      primaryStack:
        this.cleanText(value?.primaryStack) ||
        localizedText(locale, 'Non verifiable', 'Not verifiable'),
      confidence: Number.isFinite(confidence)
        ? Math.max(0, Math.min(1, Math.round(confidence * 100) / 100))
        : 0,
      evidence: this.normalizeStringArray(value?.evidence).slice(0, 8),
      alternatives: this.normalizeStringArray(value?.alternatives).slice(0, 4),
      unknowns: this.normalizeStringArray(value?.unknowns).slice(0, 5),
    };
  }

  private normalizeUrlLevelImprovements(
    entries: ExpertReportShape['urlLevelImprovements'],
  ): ExpertReportShape['urlLevelImprovements'] {
    return this.normaliserLesEntrees(
      entries,
      (entry) => ({
        url: this.cleanText(entry?.url),
        issue: this.cleanText(entry?.issue),
        recommendation: this.cleanText(entry?.recommendation),
        impact: this.normalizeSeverity(entry?.impact),
      }),
      (entry) => entry.url && entry.issue && entry.recommendation,
    );
  }

  private normalizeImplementationTodo(
    entries: ExpertReportShape['implementationTodo'],
  ): ExpertReportShape['implementationTodo'] {
    return this.normaliserLesEntrees(
      entries,
      (entry, index) => ({
        phase: this.cleanText(entry?.phase) || `Phase ${index + 1}`,
        objective: this.cleanText(entry?.objective),
        deliverable: this.cleanText(entry?.deliverable),
        estimatedHours: this.normalizeHours(entry?.estimatedHours, 3),
        dependencies: this.normalizeStringArray(entry?.dependencies),
      }),
      (entry) => entry.objective && entry.deliverable,
    );
  }

  private normalizePlan(
    entries: ExpertReportShape['whatToFixThisWeek'],
    locale: AuditLocale,
  ): ExpertReportShape['whatToFixThisWeek'] {
    return this.normaliserLesEntrees(
      entries,
      (entry) => ({
        task: this.cleanText(entry?.task),
        goal:
          this.cleanText(entry?.goal) ||
          localizedText(
            locale,
            'Ameliorer les signaux SEO critiques',
            'Improve critical SEO signals',
          ),
        estimatedHours: this.normalizeHours(entry?.estimatedHours, 3),
        risk:
          this.cleanText(entry?.risk) ||
          localizedText(locale, 'Risque modere', 'Moderate risk'),
        dependencies: this.normalizeStringArray(entry?.dependencies),
      }),
      (entry) => entry.task,
    );
  }

  private normalizeFastPlan(
    entries: ExpertReportShape['fastImplementationPlan'],
  ): ExpertReportShape['fastImplementationPlan'] {
    return this.normaliserLesEntrees(
      entries,
      (entry) => ({
        task: this.cleanText(entry?.task),
        whyItMatters: this.cleanText(entry?.whyItMatters),
        implementationSteps: this.normalizeStringArray(
          entry?.implementationSteps,
        ),
        estimatedHours: this.normalizeHours(entry?.estimatedHours, 3),
        expectedImpact: this.cleanText(entry?.expectedImpact),
        priority: this.normalizeSeverity(entry?.priority),
      }),
      (entry) => entry.task && entry.whyItMatters && entry.expectedImpact,
    );
  }

  private normalizeBacklog(
    entries: ExpertReportShape['implementationBacklog'],
  ): ExpertReportShape['implementationBacklog'] {
    return this.normaliserLesEntrees(
      entries,
      (entry) => ({
        task: this.cleanText(entry?.task),
        priority: this.normalizeSeverity(entry?.priority),
        details: this.cleanText(entry?.details),
        estimatedHours: this.normalizeHours(entry?.estimatedHours, 4),
        dependencies: this.normalizeStringArray(entry?.dependencies),
        acceptanceCriteria: this.normalizeStringArray(
          entry?.acceptanceCriteria,
        ),
      }),
      (entry) => entry.task && entry.details,
    );
  }

  private normalizeInvoiceScope(
    entries: ExpertReportShape['invoiceScope'],
  ): ExpertReportShape['invoiceScope'] {
    return this.normaliserLesEntrees(
      entries,
      (entry, index) => ({
        item: this.cleanText(entry?.item) || `Lot ${index + 1}`,
        description: this.cleanText(entry?.description),
        estimatedHours: this.normalizeHours(entry?.estimatedHours, 3),
      }),
      (entry) => entry.description,
    );
  }

  private normaliserLesEntrees<E, S>(
    entries: readonly E[],
    normaliser: (entry: E, index: number) => S,
    estComplete: (entry: S) => unknown,
  ): S[] {
    if (!Array.isArray(entries)) return [];
    return entries
      .map(normaliser)
      .filter((entry) => Boolean(estComplete(entry)));
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => this.cleanText(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  private requireText(
    value: unknown,
    fallback: string,
    reasons: string[],
    reasonCode: string,
  ): string {
    const normalized = this.cleanText(value);
    if (normalized) return normalized;
    reasons.push(reasonCode);
    return fallback;
  }

  private cleanText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeHours(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return fallback;
    }
    return Math.round(value * 10) / 10;
  }

  private normalizeSeverity(value: unknown): PrioritySeverity {
    const normalized = typeof value === 'string' ? value.toLowerCase() : '';
    if (normalized === 'high') return 'high';
    if (normalized === 'low') return 'low';
    return 'medium';
  }

  validateClientReport(report: ClientReportSynthesis): TierValidationResult {
    return runClientTierValidation(report);
  }

  validateExpertReport(
    report: Parameters<typeof runExpertTierValidation>[0],
  ): TierValidationResult {
    return runExpertTierValidation(report);
  }
}
