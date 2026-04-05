/** Requete pour les donnees de tendance. */
export interface GetTrendsQuery {
  userId: string;
  period: '7d' | '30d';
}
