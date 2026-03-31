import { Inject, Injectable } from '@nestjs/common';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { WEATHER_PREFERENCES_REPOSITORY } from '../domain/token';
import { WeatherUserPreferences } from '../domain/WeatherUserPreferences';
import type { RecordUsageCommand } from './dto/RecordUsage.command';

/** Cas d'utilisation : enregistrement d'utilisation du dashboard meteo. */
@Injectable()
export class RecordUsageUseCase {
  constructor(
    @Inject(WEATHER_PREFERENCES_REPOSITORY)
    private readonly repo: IWeatherPreferencesRepository,
  ) {}

  /**
   * Enregistre l'utilisation quotidienne du dashboard.
   * Si lastUsedAt est un jour different d'aujourd'hui, incremente daysUsed.
   * Si c'est le meme jour, met seulement a jour lastUsedAt.
   */
  async execute(command: RecordUsageCommand): Promise<void> {
    let prefs = await this.repo.findByUserId(command.userId);
    if (!prefs) {
      const defaults = WeatherUserPreferences.create(command.userId);
      prefs = await this.repo.create(defaults);
    }

    const now = new Date();
    const isNewDay =
      !prefs.lastUsedAt || !this.isSameDay(prefs.lastUsedAt, now);

    const updateData: Partial<WeatherUserPreferences> = {
      lastUsedAt: now,
    };

    if (isNewDay) {
      updateData.daysUsed = prefs.daysUsed + 1;
    }

    await this.repo.update(prefs.id, updateData);
  }

  /** Verifie si deux dates tombent le meme jour calendaire (UTC). */
  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    );
  }
}
