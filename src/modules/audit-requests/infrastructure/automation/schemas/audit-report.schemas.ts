import { z } from 'zod';

/**
 * Schemas Zod pour les outputs structures du pipeline LLM audit.
 *
 * Extrait de langchain-audit-report.service.ts (P4 refactor) pour :
 *   - reduire la taille du service (god object) et ameliorer la lisibilite
 *   - permettre la reutilisation des schemas dans les tests (golden + mocks)
 *   - faciliter l'evolution independante des types vs la logique orchestration
 *
 * Tous les schemas alimentent `llm.withStructuredOutput(...)` ; leur
 * modification impacte directement le format attendu de l'IA.
 */

export const userSummarySchema = z.object({
  summaryText: z.string().min(1),
});

export const diagnosticChaptersSchema = z.object({
  conversionAndClarity: z.string(),
  speedAndPerformance: z.string(),
  seoFoundations: z.string(),
  credibilityAndTrust: z.string(),
  techAndScalability: z.string(),
  scorecardAndBusinessOpportunities: z.string(),
});

export const techFingerprintSchema = z.object({
  primaryStack: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  alternatives: z.array(z.string()),
  unknowns: z.array(z.string()),
});

export const engineScoreInputSchema = z.object({
  engine: z.enum(['google', 'bing_chatgpt', 'perplexity', 'gemini_overviews']),
  score: z.number().min(0).max(100),
  indexable: z.boolean(),
  strengths: z.array(z.string()).max(5),
  blockers: z.array(z.string()).max(5),
  opportunities: z.array(z.string()).max(5),
});

export const engineCoverageInputSchema = z.object({
  google: engineScoreInputSchema,
  bingChatGpt: engineScoreInputSchema,
  perplexity: engineScoreInputSchema,
  geminiOverviews: engineScoreInputSchema,
});

export const perPageDetailedAnalysisSchema = z.object({
  url: z.string().min(1),
  title: z.string(),
  engineScores: engineCoverageInputSchema,
  topIssues: z.array(z.string()).max(6),
  recommendations: z.array(z.string()).max(6),
  evidence: z.array(z.string()).max(6),
});

export const clientEmailDraftSchema = z.object({
  subject: z.string().min(1).max(100),
  body: z.string().min(1),
});

export const expertReportSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
  diagnosticChapters: diagnosticChaptersSchema,
  techFingerprint: techFingerprintSchema,
  perPageAnalysis: z.array(perPageDetailedAnalysisSchema),
  clientEmailDraft: clientEmailDraftSchema,
  internalNotes: z.string(),
  priorities: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
      whyItMatters: z.string(),
      recommendedFix: z.string(),
      estimatedHours: z.number().min(0).max(200),
    }),
  ),
  urlLevelImprovements: z.array(
    z.object({
      url: z.string(),
      issue: z.string(),
      recommendation: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
    }),
  ),
  implementationTodo: z.array(
    z.object({
      phase: z.string(),
      objective: z.string(),
      deliverable: z.string(),
      estimatedHours: z.number().min(0).max(200),
      dependencies: z.array(z.string()),
    }),
  ),
  whatToFixThisWeek: z.array(
    z.object({
      task: z.string(),
      goal: z.string(),
      estimatedHours: z.number().min(0).max(200),
      risk: z.string(),
      dependencies: z.array(z.string()),
    }),
  ),
  whatToFixThisMonth: z.array(
    z.object({
      task: z.string(),
      goal: z.string(),
      estimatedHours: z.number().min(0).max(400),
      risk: z.string(),
      dependencies: z.array(z.string()),
    }),
  ),
  clientMessageTemplate: z.string(),
  clientLongEmail: z.string(),
  fastImplementationPlan: z.array(
    z.object({
      task: z.string(),
      whyItMatters: z.string(),
      implementationSteps: z.array(z.string()),
      estimatedHours: z.number().min(0).max(200),
      expectedImpact: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
  implementationBacklog: z.array(
    z.object({
      task: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      details: z.string(),
      estimatedHours: z.number().min(0).max(400),
      dependencies: z.array(z.string()),
      acceptanceCriteria: z.array(z.string()),
    }),
  ),
  invoiceScope: z.array(
    z.object({
      item: z.string(),
      description: z.string(),
      estimatedHours: z.number().min(0).max(200),
    }),
  ),
});

export const executiveSectionSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
  scorecardAndBusinessOpportunities: z.string(),
});

export const prioritySectionSchema = z.object({
  priorities: expertReportSchema.shape.priorities,
  urlLevelImprovements: expertReportSchema.shape.urlLevelImprovements,
  seoFoundations: z.string(),
});

export const executionSectionSchema = z.object({
  implementationTodo: expertReportSchema.shape.implementationTodo,
  whatToFixThisWeek: expertReportSchema.shape.whatToFixThisWeek,
  whatToFixThisMonth: expertReportSchema.shape.whatToFixThisMonth,
  fastImplementationPlan: expertReportSchema.shape.fastImplementationPlan,
  implementationBacklog: expertReportSchema.shape.implementationBacklog,
  invoiceScope: expertReportSchema.shape.invoiceScope,
  conversionAndClarity: z.string(),
  speedAndPerformance: z.string(),
  credibilityAndTrust: z.string(),
  techAndScalability: z.string(),
  techFingerprint: techFingerprintSchema,
  perPageAnalysis: expertReportSchema.shape.perPageAnalysis,
  internalNotes: expertReportSchema.shape.internalNotes,
});

export const clientCommsSectionSchema = z.object({
  clientMessageTemplate: expertReportSchema.shape.clientMessageTemplate,
  clientLongEmail: expertReportSchema.shape.clientLongEmail,
  clientEmailDraft: expertReportSchema.shape.clientEmailDraft,
});

// Types derives depuis les schemas (single source of truth).
export type ExpertReport = z.infer<typeof expertReportSchema>;
export type ExecutiveSection = z.infer<typeof executiveSectionSchema>;
export type PrioritySection = z.infer<typeof prioritySectionSchema>;
export type ExecutionSection = z.infer<typeof executionSectionSchema>;
export type ClientCommsSection = z.infer<typeof clientCommsSectionSchema>;

export type FanoutSectionName =
  | 'executiveSection'
  | 'prioritySection'
  | 'executionSection'
  | 'clientCommsSection';
