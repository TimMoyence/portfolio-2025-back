export interface GetTrendsQuery {
  userId: string;
  period: '7d' | '30d';
}
