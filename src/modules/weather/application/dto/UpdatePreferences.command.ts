import type {
  FavoriteCity,
  UnitPreferences,
  WeatherLevel,
} from '../../domain/WeatherUserPreferences';

/** Commande de mise a jour des preferences meteo. */
export interface UpdatePreferencesCommand {
  userId: string;
  level?: WeatherLevel;
  favoriteCities?: FavoriteCity[];
  tooltipsSeen?: string[];
  units?: Partial<UnitPreferences>;
}
