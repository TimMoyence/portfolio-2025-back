export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

export interface WeatherAlert {
  type: string;
  severity: AlertSeverity;
  headline: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface WeatherAlertResult {
  alerts: WeatherAlert[];
}
