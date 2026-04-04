import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { FavoriteCity } from '../../domain/WeatherUserPreferences';

/** Entite TypeORM representant les preferences meteo d'un utilisateur. */
@Entity({ name: 'weather_user_preferences' })
export class WeatherUserPreferencesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'discovery' })
  level: string;

  @Column({ name: 'favorite_cities', type: 'jsonb', default: '[]' })
  favoriteCities: FavoriteCity[];

  @Column({
    name: 'default_city_index',
    type: 'int',
    nullable: true,
    default: null,
  })
  defaultCityIndex: number | null;

  @Column({ name: 'days_used', type: 'int', default: 0 })
  daysUsed: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'tooltips_seen', type: 'jsonb', default: '[]' })
  tooltipsSeen: string[];

  @Column({
    type: 'jsonb',
    default: '{"temperature":"celsius","speed":"kmh","pressure":"hpa"}',
  })
  units: { temperature: string; speed: string; pressure: string };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
