/**
 * Helpers purs pour la synthese LangChain.
 *
 * Ce module regroupe les fonctions utilitaires deterministes utilisees
 * par `LangchainAuditReportService` pour :
 * - projeter un rapport admin brut vers le type domaine
 *   `ExpertReportSynthesis` (Tier Expert),
 * - normaliser les champs optionnels du LLM (email draft, per-page),
 * - construire les fallbacks locales-aware (email, notes),
 * - convertir priorite/effort issus du LLM vers le vocabulaire domaine,
 * - resoudre le profil LLM (canary bucket deterministe).
 *
 * Regles :
 * - Aucun acces a `this`, aucun logger, aucune dependance Nest/Zod.
 * - Types purs uniquement ; l'orchestrateur conserve les side effects.
 */

import type { AuditAutomationConfig, AuditLlmProfile } from './audit.config';
import type {
  ExpertReportSynthesis,
  LangchainAuditInput,
  PerPageDetailedAnalysis,
} from './contracts/langchain-contracts';

/**
 * Convertit une valeur brute (issue du LLM) en niveau d'impact domaine.
 * Valeurs reconnues : `'high'`, `'low'`. Tout le reste retombe sur
 * `'medium'` pour garantir un defaut deterministe.
 */
export function toImpact(value: unknown): 'high' | 'medium' | 'low' {
  if (value === 'high') return 'high';
  if (value === 'low') return 'low';
  return 'medium';
}

/**
 * Convertit un nombre d'heures estime en niveau d'effort domaine.
 * - >= 8h => `high`
 * - <= 3h => `low`
 * - sinon, ou valeur invalide => `medium`
 */
export function toEffort(value: unknown): 'high' | 'medium' | 'low' {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'medium';
  if (value >= 8) return 'high';
  if (value <= 3) return 'low';
  return 'medium';
}

/**
 * Normalise un draft d'email client brut. Retourne `null` si les
 * champs obligatoires sont manquants ou vides apres trim.
 */
export function normalizeClientEmailDraft(
  raw: unknown,
): { subject: string; body: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const subject = typeof record.subject === 'string' ? record.subject : '';
  const body = typeof record.body === 'string' ? record.body : '';
  if (!subject.trim() || !body.trim()) return null;
  return { subject: subject.trim(), body: body.trim() };
}

/**
 * Construit un draft d'email client fallback, localise fr/en,
 * utilise lorsque le LLM n'a pas produit de contenu exploitable.
 */
export function buildFallbackEmailDraft(input: LangchainAuditInput): {
  subject: string;
  body: string;
} {
  const subject =
    input.locale === 'en'
      ? `Audit findings for ${input.websiteName}`
      : `Audit ${input.websiteName} : vos priorites`;
  const body =
    input.locale === 'en'
      ? `Hello,\n\nThe audit of ${input.websiteName} is ready. I would love to walk you through it in 30 minutes.\n\nTim / Asili Design`
      : `Bonjour,\n\nL'audit de ${input.websiteName} est pret. J'aimerais vous le presenter en 30 minutes.\n\nTim / Asili Design`;
  return { subject, body };
}

/**
 * Construit les notes internes fallback (localisees fr/en) injectees
 * dans `ExpertReportSynthesis.internalNotes` quand le LLM ne fournit
 * pas de contenu.
 */
export function buildFallbackNotes(input: LangchainAuditInput): string {
  return input.locale === 'en'
    ? `Internal notes for ${input.websiteName}: review the priorities and prepare the 30-minute pitch.`
    : `Notes internes pour ${input.websiteName} : revue des priorites et preparation du pitch 30 minutes.`;
}

/**
 * Projette le champ brut `perPageAnalysis` du rapport admin vers le
 * type domaine `PerPageDetailedAnalysis[]`. Filtre les entrees sans
 * url ou sans engineScores (les champs load-bearing), tronque les
 * arrays a 6 elements pour borner la taille.
 */
export function projectPerPageAnalysis(
  raw: unknown,
): ReadonlyArray<PerPageDetailedAnalysis> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): PerPageDetailedAnalysis | null => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const url = typeof record.url === 'string' ? record.url : '';
      if (!url) return null;
      const engineScores = record.engineScores as
        | PerPageDetailedAnalysis['engineScores']
        | undefined;
      if (!engineScores) return null;
      return {
        url,
        title: typeof record.title === 'string' ? record.title : '',
        engineScores,
        topIssues: Array.isArray(record.topIssues)
          ? (record.topIssues as string[]).map(String).slice(0, 6)
          : [],
        recommendations: Array.isArray(record.recommendations)
          ? (record.recommendations as string[]).map(String).slice(0, 6)
          : [],
        evidence: Array.isArray(record.evidence)
          ? (record.evidence as string[]).map(String).slice(0, 6)
          : [],
      };
    })
    .filter((entry): entry is PerPageDetailedAnalysis => entry !== null);
}

/**
 * Projette un rapport admin enrichi vers le type domaine
 * `ExpertReportSynthesis` (Tier Expert). Construit
 * `perPageAnalysis`, `crossPageFindings`, `priorityBacklog`,
 * `clientEmailDraft` et `internalNotes` en garantissant des defauts
 * deterministes si le LLM a omis certains champs.
 */
export function buildExpertSynthesis(
  summaryText: string,
  adminReport: Record<string, unknown>,
  input: LangchainAuditInput,
): ExpertReportSynthesis {
  const executiveSummary =
    typeof adminReport.executiveSummary === 'string' &&
    adminReport.executiveSummary.trim().length > 0
      ? adminReport.executiveSummary
      : summaryText;

  const perPageAnalysis = projectPerPageAnalysis(adminReport.perPageAnalysis);

  const crossPageFindings = input.deepFindings.map((finding) => ({
    title: finding.title,
    severity: finding.severity as 'critical' | 'high' | 'medium' | 'low',
    affectedUrls: [...finding.affectedUrls],
    rootCause: finding.description,
    remediation: finding.recommendation,
  }));

  const priorityBacklog = Array.isArray(adminReport.implementationBacklog)
    ? (adminReport.implementationBacklog as Array<Record<string, unknown>>)
        .slice(0, 12)
        .map((entry) => ({
          title: typeof entry.task === 'string' ? entry.task : '',
          impact: toImpact(entry.priority),
          effort: toEffort(entry.estimatedHours),
          acceptanceCriteria: Array.isArray(entry.acceptanceCriteria)
            ? (entry.acceptanceCriteria as string[]).map(String)
            : [],
        }))
        .filter((entry) => entry.title.length > 0)
    : [];

  const clientEmailDraft =
    normalizeClientEmailDraft(adminReport.clientEmailDraft) ??
    buildFallbackEmailDraft(input);

  const internalNotes =
    typeof adminReport.internalNotes === 'string' &&
    adminReport.internalNotes.trim().length > 0
      ? adminReport.internalNotes.trim()
      : buildFallbackNotes(input);

  return {
    executiveSummary,
    perPageAnalysis,
    crossPageFindings,
    priorityBacklog,
    clientEmailDraft,
    internalNotes,
  };
}

/**
 * Hash deterministe simple (variant DJB-like) d'une chaine vers
 * un bucket [0, 100[ pour le canary routing.
 */
export function hashToPercent(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

/**
 * Resout le profil LLM effectif selon la config et l'auditId.
 * - Si la config n'est pas en mode parallele, retourne sequential.
 * - Sinon, applique le canary percent : 100 force parallele,
 *   0 force sequentiel, et entre les deux le bucket dependant de
 *   `auditId` decide (absence d'auditId => parallele par defaut).
 */
export function resolveProfile(
  auditId: string | undefined,
  config: AuditAutomationConfig,
): AuditLlmProfile {
  const configured = config.llmProfile;
  if (configured !== 'parallel_sections_v1') {
    return 'stability_first_sequential';
  }

  const canaryPercent = config.llmProfileCanaryPercent;
  if (canaryPercent >= 100) return 'parallel_sections_v1';
  if (canaryPercent <= 0) return 'stability_first_sequential';
  if (!auditId) return 'parallel_sections_v1';

  const bucket = hashToPercent(auditId);
  return bucket < canaryPercent
    ? 'parallel_sections_v1'
    : 'stability_first_sequential';
}
