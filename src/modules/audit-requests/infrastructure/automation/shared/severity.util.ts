export type RankedSeverity = 'high' | 'medium' | 'low';

export function normalizeSeverity(value: unknown): RankedSeverity {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  if (normalized === 'high' || normalized === 'critical') return 'high';
  if (normalized === 'low') return 'low';
  return 'medium';
}

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
