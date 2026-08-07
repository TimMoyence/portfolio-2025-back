import { Inject, Injectable } from '@nestjs/common';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import { WEATHER_PREFERENCES_REPOSITORY } from '../domain/token';
import type { WeatherLevel } from '../domain/WeatherUserPreferences';
import { WeatherUserPreferences } from '../domain/WeatherUserPreferences';
import type { UpdatePreferencesCommand } from './dto/UpdatePreferences.command';

const VALID_LEVELS: WeatherLevel[] = ['discovery', 'curious', 'expert'];

@Injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @Inject(WEATHER_PREFERENCES_REPOSITORY)
    private readonly repo: IWeatherPreferencesRepository,
  ) {}

  async execute(
    command: UpdatePreferencesCommand,
  ): Promise<WeatherUserPreferences> {
    if (command.level && !VALID_LEVELS.includes(command.level)) {
      throw new InvalidInputError(
        `Niveau invalide : ${command.level}. Valeurs autorisees : ${VALID_LEVELS.join(', ')}`,
      );
    }

    let prefs = await this.repo.findByUserId(command.userId);
    if (!prefs) {
      const defaults = WeatherUserPreferences.create(command.userId);
      prefs = await this.repo.create(defaults);
    }

    const updateData: Partial<WeatherUserPreferences> = {};
    if (command.level !== undefined) updateData.level = command.level;
    if (command.favoriteCities !== undefined)
      updateData.favoriteCities = command.favoriteCities;
    if (command.defaultCityIndex !== undefined)
      updateData.defaultCityIndex = command.defaultCityIndex;
    if (command.tooltipsSeen !== undefined)
      updateData.tooltipsSeen = command.tooltipsSeen;
    if (command.units !== undefined) {
      updateData.units = { ...prefs.units, ...command.units };
    }
    if (command.overviewGranularity !== undefined)
      updateData.overviewGranularity = command.overviewGranularity;

    return this.repo.update(prefs.id, updateData);
  }
}
