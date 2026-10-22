import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { EtatDeSanteResponseDto } from './etat-de-sante.response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @SkipThrottle()
  @HealthCheck({ noCache: true, swaggerDocumentation: false })
  @ApiOperation({
    summary: "Verifier l'etat de sante de l'API (base de donnees et memoire)",
  })
  @ApiOkResponse({
    type: EtatDeSanteResponseDto,
    description: 'Etat de sante : base de donnees et heap memoire',
  })
  @ApiServiceUnavailableResponse({
    type: EtatDeSanteResponseDto,
    description: 'Un indicateur au moins est en panne',
  })
  check(): Promise<EtatDeSanteResponseDto> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),
    ]);
  }
}
