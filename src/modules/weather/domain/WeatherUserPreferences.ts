export type WeatherLevel = 'discovery' | 'curious' | 'expert';

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type SpeedUnit = 'kmh' | 'mph';

export type PressureUnit = 'hpa' | 'inhg';

export type OverviewGranularity = 'day' | '3h' | '1h';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
  pressure: PressureUnit;
}

export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

export const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'celsius',
  speed: 'kmh',
  pressure: 'hpa',
};

export class WeatherUserPreferences {
  id: string;
  userId: string;
  level: WeatherLevel;
  favoriteCities: FavoriteCity[];
  defaultCityIndex: number | null;
  daysUsed: number;
  lastUsedAt: Date | null;
  tooltipsSeen: string[];
  units: UnitPreferences;
  overviewGranularity: OverviewGranularity;
  createdAt: Date;
  updatedAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    level: WeatherLevel;
    favoriteCities: FavoriteCity[];
    defaultCityIndex: number | null;
    daysUsed: number;
    lastUsedAt: Date | null;
    tooltipsSeen: string[];
    units: UnitPreferences;
    overviewGranularity: OverviewGranularity;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.level = props.level;
    this.favoriteCities = props.favoriteCities;
    this.defaultCityIndex = props.defaultCityIndex;
    this.daysUsed = props.daysUsed;
    this.lastUsedAt = props.lastUsedAt;
    this.tooltipsSeen = props.tooltipsSeen;
    this.units = props.units;
    this.overviewGranularity = props.overviewGranularity;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(userId: string): WeatherUserPreferences {
    const now = new Date();
    return new WeatherUserPreferences({
      id: '',
      userId,
      level: 'discovery',
      favoriteCities: [],
      defaultCityIndex: null,
      daysUsed: 0,
      lastUsedAt: null,
      tooltipsSeen: [],
      units: { ...DEFAULT_UNITS },
      overviewGranularity: 'day',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: {
    id: string;
    userId: string;
    level: WeatherLevel;
    favoriteCities: FavoriteCity[];
    defaultCityIndex: number | null;
    daysUsed: number;
    lastUsedAt: Date | null;
    tooltipsSeen: string[];
    units: UnitPreferences;
    overviewGranularity: OverviewGranularity;
    createdAt: Date;
    updatedAt: Date;
  }): WeatherUserPreferences {
    return new WeatherUserPreferences(props);
  }
}
