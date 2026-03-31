/** Commande pour la requete de donnees meteo historiques. */
export interface HistoricalQueryCommand {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}
