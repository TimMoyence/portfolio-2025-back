import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Module de health check.
 *
 * Expose un endpoint `/health` public qui verifie l'etat de la base de
 * donnees (TypeORM ping) et de la memoire heap du processus.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
