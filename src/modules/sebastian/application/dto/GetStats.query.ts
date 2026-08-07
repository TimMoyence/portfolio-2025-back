export interface GetStatsQuery {
  userId: string;
  period: 'week' | 'month' | 'year';
}
