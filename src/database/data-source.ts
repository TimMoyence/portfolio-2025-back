// src/database/data-source.ts
import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? process.env.PGHOST,
  port: Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432),
  username:
    process.env.DB_USERNAME ?? process.env.DB_USER ?? process.env.POSTGRES_USER,
  password:
    process.env.DB_PASSWORD ??
    process.env.DATABASE_PASSWORD ??
    process.env.POSTGRES_PASSWORD,
  database:
    process.env.DB_NAME ??
    process.env.POSTGRES_DB ??
    process.env.DB_DATABASE ??
    process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});
