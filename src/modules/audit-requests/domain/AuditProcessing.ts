import type { MethodeDeContact } from './AuditRequest';
import { AuditLocale } from './audit-locale.util';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from './AuditReportTiers';
import type { EngineCoverage } from './EngineCoverage';
import type { ScoresDesPiliers } from './Piliers';

export const STATUTS_D_AUDIT = Object.freeze([
  'UNCONFIRMED',
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const);
export type AuditProcessingStatus = (typeof STATUTS_D_AUDIT)[number];

export type StatutDuFluxDAudit = AuditProcessingStatus | 'TIMEOUT';

export interface AuditSnapshot {
  id: string;
  requestId: string;
  websiteName: string;
  contactMethod: MethodeDeContact;
  contactValue: string;
  locale: AuditLocale;
  done: boolean;
  processingStatus: AuditProcessingStatus;
  progress: number;
  step: string | null;
  error: string | null;
  normalizedUrl: string | null;
  finalUrl: string | null;
  redirectChain: string[];
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: ScoresDesPiliers;
  summaryText: string | null;
  fullReport: Record<string, unknown> | null;
  clientReport?: ClientReportSynthesis | null;
  expertReport?: ExpertReportSynthesis | null;
  engineCoverage?: EngineCoverage | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface AuditSummarySnapshot {
  auditId: string;
  ready: boolean;
  status: AuditProcessingStatus;
  progress: number;
  summaryText: string | null;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: ScoresDesPiliers;
}

export interface UpdateAuditStateInput {
  processingStatus?: AuditProcessingStatus;
  progress?: number;
  step?: string | null;
  error?: string | null;
  normalizedUrl?: string | null;
  finalUrl?: string | null;
  redirectChain?: string[];
  keyChecks?: Record<string, unknown>;
  quickWins?: string[];
  pillarScores?: ScoresDesPiliers;
  summaryText?: string | null;
  fullReport?: Record<string, unknown> | null;
  clientReport?: ClientReportSynthesis | null;
  expertReport?: ExpertReportSynthesis | null;
  engineCoverage?: EngineCoverage | null;
  done?: boolean;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}
