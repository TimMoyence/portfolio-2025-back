import { AuditLocale } from './audit-locale.util';

export type AuditProcessingStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export interface AuditSnapshot {
  id: string;
  requestId: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
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
  pillarScores: Record<string, number>;
  summaryText: string | null;
  fullReport: Record<string, unknown> | null;
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
  pillarScores: Record<string, number>;
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
  pillarScores?: Record<string, number>;
  summaryText?: string | null;
  fullReport?: Record<string, unknown> | null;
  done?: boolean;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}
