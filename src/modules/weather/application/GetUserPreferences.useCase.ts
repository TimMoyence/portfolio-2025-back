import { Inject, Injectable } from '@nestjs/common';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { WEATHER_PREFERENCES_REPOSITORY } from '../domain/token';
import { WeatherUserPreferences } from '../domain/WeatherUserPreferences';

/** Cas d'utilisation : recuperation des preferences meteo d'un utilisateur. */
@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @Inject(WEATHER_PREFERENCES_REPOSITORY)
    private readonly repo: IWeatherPreferencesRepository,
  ) {}

  /**
   * Trouve les preferences de l'utilisateur identifie par son JWT.
   * Si aucune preference n'existe, cree des preferences par defaut (lazy init).
   */
  async execute(userId: string): Promise<WeatherUserPreferences> {
    const existing = await this.repo.findByUserId(userId);
    if (existing) return existing;

    const defaults = WeatherUserPreferences.create(userId);
    return this.repo.create(defaults);
  }
}
