import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { WEATHER_PREFERENCES_REPOSITORY } from '../domain/token';
import type { WeatherLevel } from '../domain/WeatherUserPreferences';
import { WeatherUserPreferences } from '../domain/WeatherUserPreferences';
import type { UpdatePreferencesCommand } from './dto/UpdatePreferences.command';

/** Niveaux de preferences autorises. */
const VALID_LEVELS: WeatherLevel[] = ['discovery', 'curious', 'expert'];

/** Cas d'utilisation : mise a jour des preferences meteo d'un utilisateur. */
@Injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @Inject(WEATHER_PREFERENCES_REPOSITORY)
    private readonly repo: IWeatherPreferencesRepository,
  ) {}

  /**
   * Met a jour le niveau, les villes favorites et les tooltips vus.
   * Valide que le niveau est l'un des trois autorises.
   */
  async execute(
    command: UpdatePreferencesCommand,
  ): Promise<WeatherUserPreferences> {
    if (command.level && !VALID_LEVELS.includes(command.level)) {
      throw new BadRequestException(
        `Niveau invalide : ${command.level}. Valeurs autorisees : ${VALID_LEVELS.join(', ')}`,
      );
    }

    // Lazy init : si les preferences n'existent pas, les creer
    let prefs = await this.repo.findByUserId(command.userId);
    if (!prefs) {
      const defaults = WeatherUserPreferences.create(command.userId);
      prefs = await this.repo.create(defaults);
    }

    const updateData: Partial<WeatherUserPreferences> = {};
    if (command.level !== undefined) updateData.level = command.level;
    if (command.favoriteCities !== undefined)
      updateData.favoriteCities = command.favoriteCities;
    if (command.tooltipsSeen !== undefined)
      updateData.tooltipsSeen = command.tooltipsSeen;

    return this.repo.update(prefs.id, updateData);
  }
}
