export interface GetPeriodReportQuery {
  userId: string;
  period: 'week' | 'month' | 'quarter';
  startDate: string;
}
