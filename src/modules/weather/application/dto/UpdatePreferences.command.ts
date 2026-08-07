import type {
  FavoriteCity,
  OverviewGranularity,
  UnitPreferences,
  WeatherLevel,
} from '../../domain/WeatherUserPreferences';

export interface UpdatePreferencesCommand {
  userId: string;
  level?: WeatherLevel;
  favoriteCities?: FavoriteCity[];
  defaultCityIndex?: number | null;
  tooltipsSeen?: string[];
  units?: Partial<UnitPreferences>;
  overviewGranularity?: OverviewGranularity;
}
