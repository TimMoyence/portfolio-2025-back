/** Severite d'une alerte meteo. */
export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

/** Alerte meteo synthetique basee sur les conditions actuelles. */
export interface WeatherAlert {
  /** Type d'alerte (vent, pluie, neige, orage, etc.). */
  type: string;
  /** Severite de l'alerte. */
  severity: AlertSeverity;
  /** Titre court de l'alerte. */
  headline: string;
  /** Description detaillee. */
  description: string;
  /** Debut de la periode d'alerte (ISO 8601). */
  startTime: string;
  /** Fin de la periode d'alerte (ISO 8601). */
  endTime: string;
}

/** Resultat des alertes meteo pour des coordonnees donnees. */
export interface WeatherAlertResult {
  alerts: WeatherAlert[];
}
