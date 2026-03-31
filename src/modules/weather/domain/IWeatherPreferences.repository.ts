import type { WeatherUserPreferences } from './WeatherUserPreferences';

/** Port du repository de preferences meteo utilisateur. */
export interface IWeatherPreferencesRepository {
  /** Recherche les preferences d'un utilisateur par son identifiant. */
  findByUserId(userId: string): Promise<WeatherUserPreferences | null>;

  /** Cree de nouvelles preferences en base. */
  create(prefs: WeatherUserPreferences): Promise<WeatherUserPreferences>;

  /** Met a jour partiellement les preferences d'un utilisateur. */
  update(
    id: string,
    data: Partial<WeatherUserPreferences>,
  ): Promise<WeatherUserPreferences>;
}
