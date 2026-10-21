import { z } from 'zod';
import { nommeAuContrat } from '../../../../common/domain/registre-du-contrat';
import type { RapportClientServi } from '../RapportClientServi';
import { STATUTS_SCORE } from '../StatutScore';

const strict = <F extends z.ZodRawShape>(forme: F) => z.object(forme).strict();

const avancement = { done: z.number(), total: z.number() };

const avancementParPage = strict({
  phase: z.enum(['technical_pages', 'page_ai_recaps']),
  iaTask: z.enum(['technical_scan', 'page_ai_recap']),
  iaSubTask: z.string(),
  ...avancement,
  currentUrl: z.string(),
  recentCompletedUrls: z.array(z.string()),
});

const avancementDeLaSynthese = {
  phase: z.literal('synthesis'),
  iaTask: z.literal('synthesis'),
  iaSubTask: z.string(),
  ...avancement,
};

const statutDeSection = z.enum(['started', 'completed', 'failed', 'fallback']);

const avancementParSection = strict({
  ...avancementDeLaSynthese,
  section: z.enum([
    'summary',
    'executiveSection',
    'prioritySection',
    'executionSection',
    'clientCommsSection',
  ]),
  sectionStatus: statutDeSection,
  sectionStatuses: z.record(z.string(), statutDeSection),
});

export const AVANCEMENT_D_AUDIT = nommeAuContrat(
  z.union([
    avancementParPage,
    avancementParSection,
    strict(avancementDeLaSynthese),
  ]),
  'AvancementDAudit',
);

export type AvancementDAudit = z.output<typeof AVANCEMENT_D_AUDIT>;
export type AvancementParPage = z.output<typeof avancementParPage>;

const statutServi = {
  status: z.enum(STATUTS_SCORE),
  statusLabel: z.string(),
};

const scoreDeMoteur = strict({
  score: z.number(),
  summary: z.string(),
  ...statutServi,
});

const rapportClientServi: z.ZodType<RapportClientServi> = strict({
  executiveSummary: z.string(),
  topFindings: z.array(
    strict({
      title: z.string(),
      impact: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
    }),
  ),
  googleVsAiMatrix: strict({
    googleVisibility: scoreDeMoteur,
    aiVisibility: scoreDeMoteur,
  }),
  pillarScorecard: z.array(
    strict({
      pillar: z.string(),
      score: z.number(),
      target: z.number(),
      ...statutServi,
    }),
  ),
  quickWins: z.array(
    strict({
      title: z.string(),
      businessImpact: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
    }),
  ),
  cta: strict({
    title: z.string(),
    description: z.string(),
    actionLabel: z.string(),
  }),
});

export const RAPPORT_CLIENT_SERVI = nommeAuContrat(
  rapportClientServi,
  'RapportClientServi',
);
