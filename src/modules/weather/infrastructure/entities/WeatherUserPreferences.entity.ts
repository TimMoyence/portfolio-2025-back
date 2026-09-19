import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from '../../../users/infrastructure/entities/Users.entity';
import type { FavoriteCity } from '../../domain/WeatherUserPreferences';

@Entity({ name: 'weather_user_preferences' })
export class WeatherUserPreferencesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey(() => UsersEntity, {
    name: 'weather_user_preferences_user_id_fkey',
    onDelete: 'CASCADE',
  })
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
    default: { temperature: 'celsius', speed: 'kmh', pressure: 'hpa' },
  })
  units: { temperature: string; speed: string; pressure: string };

  @Column({
    name: 'overview_granularity',
    type: 'varchar',
    length: 5,
    default: 'day',
  })
  overviewGranularity!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
