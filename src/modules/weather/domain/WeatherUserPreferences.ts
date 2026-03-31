/** Niveau d'experience de l'utilisateur avec le module meteo. */
export type WeatherLevel = 'discovery' | 'curious' | 'expert';

/** Ville favorite enregistree par l'utilisateur. */
export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

/** Entite de domaine representant les preferences meteo d'un utilisateur. */
export class WeatherUserPreferences {
  id: string;
  userId: string;
  level: WeatherLevel;
  favoriteCities: FavoriteCity[];
  daysUsed: number;
  lastUsedAt: Date | null;
  tooltipsSeen: string[];
  createdAt: Date;
  updatedAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    level: WeatherLevel;
    favoriteCities: FavoriteCity[];
    daysUsed: number;
    lastUsedAt: Date | null;
    tooltipsSeen: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.level = props.level;
    this.favoriteCities = props.favoriteCities;
    this.daysUsed = props.daysUsed;
    this.lastUsedAt = props.lastUsedAt;
    this.tooltipsSeen = props.tooltipsSeen;
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
      daysUsed: 0,
      lastUsedAt: null,
      tooltipsSeen: [],
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
    daysUsed: number;
    lastUsedAt: Date | null;
    tooltipsSeen: string[];
    createdAt: Date;
    updatedAt: Date;
  }): WeatherUserPreferences {
    return new WeatherUserPreferences(props);
  }
}
