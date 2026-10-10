import type { AuditLocale } from '../../../domain/audit-locale.util';
import type {
  FindingImpact,
  ReportSeverity,
} from '../../../domain/AuditReportTiers';
import { localizedText } from './locale-text.util';

interface FindingLike {
  title: string;
  description: string;
  recommendation: string;
  severity: ReportSeverity;
  impact: FindingImpact;
}

interface PriorityFromFinding {
  title: string;
  severity: ReportSeverity;
  whyItMatters: string;
  recommendedFix: string;
  estimatedHours: number;
}

export function impactLocalise(
  finding: Pick<FindingLike, 'impact' | 'description'>,
  locale: AuditLocale,
): string {
  return localizedText(
    locale,
    `Impact ${finding.impact}: ${finding.description}`,
    `${finding.impact} impact: ${finding.description}`,
  );
}

export function priorityFromFinding(
  finding: FindingLike,
  locale: AuditLocale,
): PriorityFromFinding {
  return {
    title: finding.title,
    severity: finding.severity,
    whyItMatters: impactLocalise(finding, locale),
    recommendedFix: finding.recommendation,
    estimatedHours: finding.severity === 'high' ? 6 : 4,
  };
}
