export type RankedSeverity = 'high' | 'medium' | 'low';

export function severityRank(severity: RankedSeverity): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}
