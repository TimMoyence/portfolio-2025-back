/** Requete pour lister les entrees de consommation avec filtres. */
export interface ListEntriesQuery {
  userId: string;
  from?: string;
  to?: string;
  category?: string;
}
