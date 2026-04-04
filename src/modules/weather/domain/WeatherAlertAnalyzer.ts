import type { ForecastResult } from './IWeatherProxy.port';
import type { AlertSeverity, WeatherAlert } from './WeatherAlert';

/**
 * Service de domaine qui analyse les previsions meteo pour detecter
 * des conditions d'alerte (vent, pluie, temperature, orages).
 * Pur — aucune dependance infrastructure.
 */
export class WeatherAlertAnalyzer {
  /**
   * Analyse les previsions horaires (24h) pour generer des alertes synthetiques.
   * Deduplique par type+severite (garde la premiere occurrence temporelle).
   */
  analyze(forecast: ForecastResult): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const { hourly } = forecast;
    const hoursToCheck = Math.min(hourly.time.length, 24);

    for (let i = 0; i < hoursToCheck; i++) {
      const time = hourly.time[i];
      const windGusts = hourly.wind_gusts_10m?.[i] ?? 0;
      const precipitation = hourly.precipitation[i] ?? 0;
      const temp = hourly.temperature_2m[i];
      const weatherCode = hourly.weather_code[i];

      this.checkWind(alerts, windGusts, time);
      this.checkPrecipitation(alerts, precipitation, time);
      this.checkTemperature(alerts, temp, time);
      this.checkStorm(alerts, weatherCode, time);
    }

    return this.deduplicate(alerts);
  }

  /** Detecte les alertes de vent selon les seuils de rafales. */
  private checkWind(
    alerts: WeatherAlert[],
    windGusts: number,
    time: string,
  ): void {
    if (windGusts > 80) {
      this.add(
        alerts,
        'vent',
        'severe',
        'Vent violent',
        `Rafales jusqu'a ${Math.round(windGusts)} km/h`,
        time,
      );
    } else if (windGusts > 60) {
      this.add(
        alerts,
        'vent',
        'moderate',
        'Vent fort',
        `Rafales jusqu'a ${Math.round(windGusts)} km/h`,
        time,
      );
    } else if (windGusts > 40) {
      this.add(
        alerts,
        'vent',
        'minor',
        'Vent modere',
        `Rafales jusqu'a ${Math.round(windGusts)} km/h`,
        time,
      );
    }
  }

  /** Detecte les alertes de precipitation selon les seuils horaires. */
  private checkPrecipitation(
    alerts: WeatherAlert[],
    precipitation: number,
    time: string,
  ): void {
    if (precipitation > 30) {
      this.add(
        alerts,
        'pluie',
        'severe',
        'Pluie torrentielle',
        `${precipitation} mm/h prevus`,
        time,
      );
    } else if (precipitation > 15) {
      this.add(
        alerts,
        'pluie',
        'moderate',
        'Forte pluie',
        `${precipitation} mm/h prevus`,
        time,
      );
    } else if (precipitation > 8) {
      this.add(
        alerts,
        'pluie',
        'minor',
        'Pluie notable',
        `${precipitation} mm/h prevus`,
        time,
      );
    }
  }

  /** Detecte les alertes de temperature extremes. */
  private checkTemperature(
    alerts: WeatherAlert[],
    temp: number,
    time: string,
  ): void {
    if (temp < -15 || temp > 40) {
      this.add(
        alerts,
        'temperature',
        'severe',
        temp < 0 ? 'Froid extreme' : 'Chaleur extreme',
        `Temperature prevue : ${Math.round(temp)}°C`,
        time,
      );
    } else if (temp < -10 || temp > 38) {
      this.add(
        alerts,
        'temperature',
        'moderate',
        temp < 0 ? 'Grand froid' : 'Forte chaleur',
        `Temperature prevue : ${Math.round(temp)}°C`,
        time,
      );
    }
  }

  /** Detecte les alertes d'orage et de neige forte via les codes WMO. */
  private checkStorm(
    alerts: WeatherAlert[],
    weatherCode: number,
    time: string,
  ): void {
    if (weatherCode >= 95) {
      this.add(
        alerts,
        'orage',
        'severe',
        'Orage violent',
        "Risque d'orage violent avec grele possible",
        time,
      );
    } else if (weatherCode >= 85) {
      this.add(
        alerts,
        'neige',
        'moderate',
        'Neige forte',
        'Chutes de neige importantes prevues',
        time,
      );
    }
  }

  /** Ajoute une alerte avec une fin par defaut de +3h. */
  private add(
    alerts: WeatherAlert[],
    type: string,
    severity: AlertSeverity,
    headline: string,
    description: string,
    time: string,
  ): void {
    const end = new Date(time);
    end.setHours(end.getHours() + 3);
    alerts.push({
      type,
      severity,
      headline,
      description,
      startTime: time,
      endTime: end.toISOString(),
    });
  }

  /** Deduplique les alertes par type et severite (garde la premiere occurrence). */
  private deduplicate(alerts: WeatherAlert[]): WeatherAlert[] {
    const seen = new Set<string>();
    return alerts.filter((a) => {
      const key = `${a.type}:${a.severity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
