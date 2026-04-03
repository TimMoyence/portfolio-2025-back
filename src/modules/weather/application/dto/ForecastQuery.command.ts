export interface ForecastQueryCommand {
  latitude: number;
  longitude: number;
  timezone?: string;
  forecastDays?: number;
}
