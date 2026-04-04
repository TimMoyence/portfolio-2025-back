import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../modules/users/interfaces/decorators/public.decorator';

/**
 * Controller de health check.
 *
 * Verifie l'etat de la base de donnees PostgreSQL et la consommation
 * memoire du heap. Le endpoint est public et exempt de rate-limiting
 * pour permettre les sondes Docker/Kubernetes.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * Retourne l'etat de sante de l'API.
   *
   * Indicateurs verifies :
   * - **database** : ping PostgreSQL via TypeORM
   * - **memory_heap** : heap Node.js < 256 Mo
   */
  @Get()
  @Public()
  @SkipThrottle()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
    ]);
  }
}
