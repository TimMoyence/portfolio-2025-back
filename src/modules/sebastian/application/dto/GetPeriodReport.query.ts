/** Requete pour un rapport de periode. */
export interface GetPeriodReportQuery {
  userId: string;
  period: 'week' | 'month' | 'quarter';
  startDate: string; // YYYY-MM-DD
}
