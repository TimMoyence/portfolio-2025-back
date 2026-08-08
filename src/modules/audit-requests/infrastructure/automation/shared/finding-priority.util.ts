import type { AuditLocale } from '../../../domain/audit-locale.util';
import { localizedText } from './locale-text.util';

interface FindingLike {
  title: string;
  description: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
  impact: 'traffic' | 'indexation' | 'conversion';
}

interface PriorityFromFinding {
  title: string;
  severity: 'high' | 'medium' | 'low';
  whyItMatters: string;
  recommendedFix: string;
  estimatedHours: number;
}

export function priorityFromFinding(
  finding: FindingLike,
  locale: AuditLocale,
): PriorityFromFinding {
  return {
    title: finding.title,
    severity: finding.severity,
    whyItMatters: localizedText(
      locale,
      `Impact ${finding.impact}: ${finding.description}`,
      `${finding.impact} impact: ${finding.description}`,
    ),
    recommendedFix: finding.recommendation,
    estimatedHours: finding.severity === 'high' ? 6 : 4,
  };
}
