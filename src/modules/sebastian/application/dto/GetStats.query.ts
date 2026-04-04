/** Requete pour obtenir les statistiques de consommation. */
export interface GetStatsQuery {
  userId: string;
  period: 'week' | 'month' | 'year';
}
