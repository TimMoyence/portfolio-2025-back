import type { WeatherUserPreferences } from './WeatherUserPreferences';

export interface IWeatherPreferencesRepository {
  findByUserId(userId: string): Promise<WeatherUserPreferences | null>;

  create(prefs: WeatherUserPreferences): Promise<WeatherUserPreferences>;

  update(
    id: string,
    data: Partial<WeatherUserPreferences>,
  ): Promise<WeatherUserPreferences>;
}
