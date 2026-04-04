/** Niveau d'experience de l'utilisateur avec le module meteo. */
export type WeatherLevel = 'discovery' | 'curious' | 'expert';

/** Unite de temperature. */
export type TemperatureUnit = 'celsius' | 'fahrenheit';

/** Unite de vitesse (vent). */
export type SpeedUnit = 'kmh' | 'mph';

/** Unite de pression atmospherique. */
export type PressureUnit = 'hpa' | 'inhg';

/** Preferences d'unites de mesure. */
export interface UnitPreferences {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
  pressure: PressureUnit;
}

/** Ville favorite enregistree par l'utilisateur. */
export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

/** Valeurs par defaut pour les preferences d'unites. */
export const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'celsius',
  speed: 'kmh',
  pressure: 'hpa',
};

/** Entite de domaine representant les preferences meteo d'un utilisateur. */
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
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Cree des preferences par defaut pour un nouvel utilisateur. */
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
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstruit une instance a partir de donnees persistees. */
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
    createdAt: Date;
    updatedAt: Date;
  }): WeatherUserPreferences {
    return new WeatherUserPreferences(props);
  }
}
