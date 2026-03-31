import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IWeatherPreferencesRepository } from '../domain/IWeatherPreferences.repository';
import type { WeatherLevel } from '../domain/WeatherUserPreferences';
import { WeatherUserPreferences } from '../domain/WeatherUserPreferences';
import { WeatherUserPreferencesEntity } from './entities/WeatherUserPreferences.entity';

/** Implementation TypeORM du repository de preferences meteo. */
@Injectable()
export class WeatherPreferencesRepositoryTypeORM
  implements IWeatherPreferencesRepository
{
  constructor(
    @InjectRepository(WeatherUserPreferencesEntity)
    private readonly repo: Repository<WeatherUserPreferencesEntity>,
  ) {}

  /** Recherche les preferences d'un utilisateur par son identifiant. */
  async findByUserId(userId: string): Promise<WeatherUserPreferences | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  /** Cree de nouvelles preferences en base. */
  async create(prefs: WeatherUserPreferences): Promise<WeatherUserPreferences> {
    const entity = this.repo.create({
      userId: prefs.userId,
      level: prefs.level,
      favoriteCities: prefs.favoriteCities,
      daysUsed: prefs.daysUsed,
      lastUsedAt: prefs.lastUsedAt,
      tooltipsSeen: prefs.tooltipsSeen,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  /** Met a jour partiellement les preferences d'un utilisateur. */
  async update(
    id: string,
    data: Partial<WeatherUserPreferences>,
  ): Promise<WeatherUserPreferences> {
    const updateData: Partial<WeatherUserPreferencesEntity> = {};

    if (data.level !== undefined) updateData.level = data.level;
    if (data.favoriteCities !== undefined)
      updateData.favoriteCities = data.favoriteCities;
    if (data.daysUsed !== undefined) updateData.daysUsed = data.daysUsed;
    if (data.lastUsedAt !== undefined) updateData.lastUsedAt = data.lastUsedAt;
    if (data.tooltipsSeen !== undefined)
      updateData.tooltipsSeen = data.tooltipsSeen;

    updateData.updatedAt = new Date();

    await this.repo.update({ id }, updateData);
    const updated = await this.repo.findOne({ where: { id } });

    if (!updated) {
      throw new Error(
        `Les preferences meteo avec l'id ${id} n'ont pas pu etre mises a jour`,
      );
    }

    return this.toDomain(updated);
  }

  /** Convertit une entite TypeORM en objet de domaine. */
  private toDomain(
    entity: WeatherUserPreferencesEntity,
  ): WeatherUserPreferences {
    return WeatherUserPreferences.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      level: entity.level as WeatherLevel,
      favoriteCities: entity.favoriteCities,
      daysUsed: entity.daysUsed,
      lastUsedAt: entity.lastUsedAt,
      tooltipsSeen: entity.tooltipsSeen,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
