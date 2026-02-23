import { AuditLocale } from '../../domain/audit-locale.util';
import { localizedText } from './shared/locale-text.util';
import { severityRank } from './shared/severity.util';
import type {
  ExpertReport,
  LangchainAuditInput,
} from './langchain-audit-report.service';

export interface DeterministicCostConfig {
  rateCurrency: string;
  rateHourlyMin: number;
  rateHourlyMax: number;
}

export function buildFallbackSummary(input: LangchainAuditInput): string {
  const topQuickWins = input.quickWins.slice(0, 3);

  if (input.locale === 'en') {
    return `Context: Audit completed for ${input.normalizedUrl} with SEO, performance, conversion, trust, and technical checks.
Blockers: ${topQuickWins.join(', ') || 'Technical SEO baseline requires stabilization'}.
Business impact: Unresolved blockers can reduce qualified traffic, lead generation, and conversion predictability.
Immediate priorities: 1) Fix critical indexability/metadata issues. 2) Improve core page speed and mobile UX. 3) Strengthen CTA clarity and contact flow. 4) Validate stack-level reliability and tracking signals.`;
  }

  return `Contexte: Audit finalise pour ${input.normalizedUrl} avec analyse SEO, performance, conversion, confiance et technique.
Blocages: ${topQuickWins.join(', ') || 'La base SEO technique doit etre stabilisee'}.
Impacts business: Ces points peuvent freiner le trafic qualifie, la generation de leads et la conversion.
Priorites immediates: 1) Corriger indexabilite et metadata critiques. 2) Ameliorer vitesse des pages cles et mobile. 3) Clarifier CTA et parcours de contact. 4) Stabiliser le socle technique, securite et tracking.`;
}

export function buildFallbackExpertReport(
  input: LangchainAuditInput,
  reason: string,
): ExpertReport {
  const topQuickWins = input.quickWins.slice(0, 8);
  const fallbackTechFingerprint = {
    primaryStack:
      input.techFingerprint.primaryStack ||
      localizedText(input.locale, 'Non verifiable', 'Not verifiable'),
    confidence: Math.max(
      0,
      Math.min(1, Number(input.techFingerprint.confidence || 0)),
    ),
    evidence: (input.techFingerprint.evidence ?? []).slice(0, 8),
    alternatives: (input.techFingerprint.alternatives ?? []).slice(0, 4),
    unknowns: (input.techFingerprint.unknowns ?? []).slice(0, 5),
  };
  const fallbackChapters = {
    conversionAndClarity: localizedText(
      input.locale,
      'Proposition de valeur et CTA a renforcer sur les pages business. Prioriser la reduction des frictions du formulaire et la clarte mobile. Evidence: quickWins + recaps pages.',
      'Value proposition and CTA quality should be strengthened on business pages. Prioritize contact friction reduction and mobile clarity. Evidence: quickWins + page recaps.',
    ),
    speedAndPerformance: localizedText(
      input.locale,
      'Des pages lentes et des poids de pages eleves ralentissent crawl et conversion. Prioriser cache, compression images, JS critique, et verification Core Web Vitals.',
      'Slow pages and page-weight overhead limit crawl and conversion. Prioritize caching, image compression, critical JS reduction, and Core Web Vitals checks.',
    ),
    seoFoundations: localizedText(
      input.locale,
      "Les fondations SEO (title, meta, H1, canonical, indexation) doivent etre standardisees sur les templates prioritaires pour eviter la cannibalisation et les pertes d'indexation.",
      'SEO foundations (title, meta, H1, canonical, indexability) should be standardized across priority templates to avoid cannibalization and indexation loss.',
    ),
    credibilityAndTrust: localizedText(
      input.locale,
      'Renforcer preuves sociales, pages legales, signaux de confiance et schemas pour augmenter CTR et conversion.',
      'Strengthen social proof, legal pages, trust signals, and schema coverage to improve CTR and conversion.',
    ),
    techAndScalability: localizedText(
      input.locale,
      `Stack principal detecte: ${fallbackTechFingerprint.primaryStack} (confiance ${Math.round(fallbackTechFingerprint.confidence * 100)}%). Prioriser securite headers, hygiene erreurs, supervision et maintenabilite des templates.`,
      `Detected primary stack: ${fallbackTechFingerprint.primaryStack} (confidence ${Math.round(fallbackTechFingerprint.confidence * 100)}%). Prioritize security headers, error hygiene, monitoring, and template maintainability.`,
    ),
    scorecardAndBusinessOpportunities: localizedText(
      input.locale,
      'Quick wins immediats + plan P0/P1/P2 pour maximiser trafic qualifie et conversion en 30 jours, avec validation continue.',
      'Immediate quick wins + a P0/P1/P2 roadmap to maximize qualified traffic and conversion in 30 days, with continuous validation.',
    ),
  };

  const implementationTodo = topQuickWins.map((quickWin, index) => ({
    phase: input.locale === 'en' ? `Phase ${index + 1}` : `Phase ${index + 1}`,
    objective: quickWin,
    deliverable: localizedText(
      input.locale,
      `Implementation validee pour: ${quickWin}`,
      `Validated implementation for: ${quickWin}`,
    ),
    estimatedHours: 2 + Math.min(index, 6),
    dependencies: index === 0 ? [] : [`Phase ${index}`],
  }));

  const whatToFixThisWeek = topQuickWins.slice(0, 5).map((quickWin, index) => ({
    task: quickWin,
    goal: localizedText(
      input.locale,
      'Corriger les blocages a fort impact SEO et conversion',
      'Fix high-impact SEO and conversion blockers',
    ),
    estimatedHours: 2 + Math.min(index, 4),
    risk: localizedText(
      input.locale,
      'Dependance technique faible a moderee',
      'Low to medium technical dependency risk',
    ),
    dependencies: index === 0 ? [] : [topQuickWins[0]],
  }));

  const whatToFixThisMonth = input.deepFindings.slice(0, 8).map((finding, index) => ({
    task: finding.title,
    goal: finding.recommendation,
    estimatedHours: 3 + Math.min(index, 6),
    risk:
      finding.severity === 'high'
        ? localizedText(
            input.locale,
            'Risque business eleve si reporte',
            'High business risk if delayed',
          )
        : localizedText(input.locale, 'Risque modere', 'Moderate risk'),
    dependencies: [],
  }));

  const fastImplementationPlan = topQuickWins.slice(0, 5).map((quickWin) => ({
    task: quickWin,
    whyItMatters: localizedText(
      input.locale,
      'Action rapide avec impact direct sur la visibilite, l indexation ou la conversion.',
      'Fast action with direct impact on visibility, indexation, or conversion.',
    ),
    implementationSteps:
      input.locale === 'en'
        ? [
            'Validate impacted templates/pages',
            'Deploy in staging then production',
            'Verify via crawl and Search Console',
          ]
        : [
            'Valider les templates/pages impactees',
            'Deployer en preproduction puis production',
            'Verifier via crawl et Search Console',
          ],
    estimatedHours: 3,
    expectedImpact: localizedText(
      input.locale,
      'Gain SEO/conversion court terme',
      'Short-term SEO/conversion gain',
    ),
    priority: 'high' as const,
  }));

  const implementationBacklog = input.deepFindings.slice(0, 10).map((finding) => ({
    task: finding.title,
    priority: finding.severity,
    details: finding.recommendation,
    estimatedHours: finding.severity === 'high' ? 6 : 4,
    dependencies: [],
    acceptanceCriteria:
      input.locale === 'en'
        ? [
            'Fix deployed and verified',
            'Crawl/indexability validation without regression',
          ]
        : [
            'Correction deployee et verifiee',
            'Validation crawl/indexabilite sans regression',
          ],
  }));

  const invoiceScope = implementationTodo.map((todo) => ({
    item: todo.phase,
    description: todo.objective,
    estimatedHours: todo.estimatedHours,
  }));

  return {
    executiveSummary: localizedText(
      input.locale,
      'Rapport genere en mode fallback: les priorites restent exploitables pour planifier la mise en oeuvre.',
      'Fallback report generated: priorities remain actionable for implementation planning.',
    ),
    reportExplanation: localizedText(
      input.locale,
      'Ce document propose un plan d action SEO/technique oriente livraison et impact business, avec une priorisation rapide puis durable.',
      'This document provides a delivery-oriented SEO/technical action plan with fast-track and durable prioritization.',
    ),
    strengths: [],
    diagnosticChapters: fallbackChapters,
    techFingerprint: fallbackTechFingerprint,
    priorities: topQuickWins.map((quickWin, index) => ({
      title: quickWin,
      severity: index < 2 ? 'high' : index < 5 ? 'medium' : 'low',
      whyItMatters: localizedText(
        input.locale,
        'Ce point influence directement l indexabilite, la visibilite SEO ou la conversion.',
        'This point directly impacts indexability, SEO visibility, or conversion.',
      ),
      recommendedFix: quickWin,
      estimatedHours: 2 + Math.min(index, 6),
    })),
    urlLevelImprovements: input.sampledUrls
      .filter((item) => item.error || !item.indexable)
      .slice(0, 12)
      .map((item) => ({
        url: item.url,
        issue:
          item.error ??
          localizedText(
            input.locale,
            'URL non indexable',
            'Potentially non-indexable URL',
          ),
        recommendation: localizedText(
          input.locale,
          'Corriger statut HTTP, directives robots et canonical pour securiser l indexation.',
          'Fix HTTP status, robots directives, and canonical signals to secure indexability.',
        ),
        impact: 'high' as const,
      })),
    implementationTodo,
    whatToFixThisWeek,
    whatToFixThisMonth,
    clientMessageTemplate: localizedText(
      input.locale,
      'Bonjour, suite a l audit, nous recommandons une phase de corrections prioritaires immediates, puis un plan d optimisation structure sur les prochaines semaines.',
      'Hello, following the audit, we recommend an immediate priority remediation phase, followed by a structured optimization plan over the next weeks.',
    ),
    clientLongEmail:
      input.locale === 'en'
        ? 'Hello,\n\nWe completed a full audit of your site and identified high-impact actions for SEO visibility and conversion. We recommend a first 7-day remediation batch to remove blockers, then a deeper 3-4 week optimization batch to consolidate performance.\n\nEach action is prioritized, estimated, and mapped to validation criteria so execution can be tracked with low delivery risk.'
        : 'Bonjour,\n\nNous avons finalise un audit complet de votre site et identifie des actions a tres fort impact sur la visibilite SEO et la conversion. Nous proposons un premier lot de corrections rapides (7 jours) pour traiter les points bloquants, puis un second lot d optimisations plus profondes (3 a 4 semaines) pour consolider la performance.\n\nChaque action est priorisee, chiffree en charge, et associee a des criteres de validation pour piloter la mise en oeuvre de facon claire.',
    fastImplementationPlan,
    implementationBacklog,
    invoiceScope,
    warning: 'LLM fallback used',
    reason,
    keyChecks: input.keyChecks,
    quickWins: input.quickWins,
    pillarScores: input.pillarScores,
    sampledUrls: input.sampledUrls,
    pageRecaps: input.pageRecaps,
    pageSummary: input.pageSummary,
  } as ExpertReport;
}

export function ensurePriorityDepth(
  report: ExpertReport,
  input: LangchainAuditInput,
  locale: AuditLocale,
): ExpertReport {
  const minimumPriorities = 8;
  const maximumPriorities = 12;

  const unique = new Set<string>();
  const priorities = [...report.priorities]
    .filter((entry) => entry.title.trim().length > 0)
    .slice(0, maximumPriorities);

  for (const entry of priorities) {
    unique.add(entry.title.trim().toLowerCase());
  }

  const sortedFindings = [...input.deepFindings].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  );

  for (const finding of sortedFindings) {
    if (priorities.length >= maximumPriorities) break;
    const key = finding.title.trim().toLowerCase();
    if (!key || unique.has(key)) continue;

    priorities.push({
      title: finding.title,
      severity: finding.severity,
      whyItMatters: localizedText(
        locale,
        `Impact ${finding.impact}: ${finding.description}`,
        `${finding.impact} impact: ${finding.description}`,
      ),
      recommendedFix: finding.recommendation,
      estimatedHours: finding.severity === 'high' ? 6 : 4,
    });
    unique.add(key);
  }

  for (const win of input.quickWins) {
    if (priorities.length >= minimumPriorities) break;
    const key = win.trim().toLowerCase();
    if (!key || unique.has(key)) continue;

    priorities.push({
      title: win,
      severity: 'medium',
      whyItMatters: localizedText(
        locale,
        'Action rapide pour renforcer la base SEO technique et la conversion.',
        'Fast action to strengthen technical SEO baseline and conversion.',
      ),
      recommendedFix: win,
      estimatedHours: 3,
    });
    unique.add(key);
  }

  return {
    ...report,
    priorities: priorities.slice(0, maximumPriorities),
  };
}

export function withDeterministicCost(
  report: ExpertReport,
  locale: AuditLocale,
  config: DeterministicCostConfig,
): Record<string, unknown> {
  const invoiceHours = sumHours(report.invoiceScope.map((item) => item.estimatedHours));
  const backlogHours = sumHours(
    report.implementationBacklog.map((item) => item.estimatedHours),
  );
  const todoHours = sumHours(
    report.implementationTodo.map((item) => item.estimatedHours),
  );
  const prioritiesHours = sumHours(
    report.priorities.map((item) => item.estimatedHours),
  );
  const totalHours = invoiceHours || backlogHours || todoHours || prioritiesHours;

  const fastTrackHours = sumHours(
    report.fastImplementationPlan.map((item) => item.estimatedHours),
  );
  const rateMin = config.rateHourlyMin;
  const rateMax = config.rateHourlyMax;

  return {
    ...report,
    costEstimate: {
      currency: config.rateCurrency,
      hourlyRateMin: rateMin,
      hourlyRateMax: rateMax,
      totalEstimatedHours: totalHours,
      estimatedCostMin: roundCurrency(totalHours * rateMin),
      estimatedCostMax: roundCurrency(totalHours * rateMax),
      fastTrackHours,
      fastTrackCostMin: roundCurrency(fastTrackHours * rateMin),
      fastTrackCostMax: roundCurrency(fastTrackHours * rateMax),
      assumptions:
        locale === 'en'
          ? [
              'Estimation is automatically derived from estimated implementation hours.',
              'Hourly rates come from server configuration.',
              'Final budget may vary with real technical complexity and business constraints.',
            ]
          : [
              'Le chiffrage est determine automatiquement a partir des heures estimees.',
              'Les taux horaires proviennent de la configuration serveur.',
              'Le budget final peut varier selon complexite technique reelle et contraintes metier.',
            ],
    },
  };
}

function sumHours(values: number[]): number {
  const total = values.reduce<number>((acc, value) => {
    return Number.isFinite(value) ? acc + Math.max(0, value) : acc;
  }, 0);
  return Math.round(total * 10) / 10;
}

function roundCurrency(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}
