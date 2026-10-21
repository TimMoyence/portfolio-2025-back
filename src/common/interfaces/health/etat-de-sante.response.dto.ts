import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  HealthCheckStatus,
  HealthIndicatorStatus,
} from '@nestjs/terminus';

export class IndicateurDeSanteResponseDto {
  @ApiProperty({ enum: ['up', 'down'], enumName: 'StatutDIndicateur' })
  status: HealthIndicatorStatus;

  @ApiPropertyOptional({
    description: 'Cause de la panne, rendue par l indicateur en echec',
  })
  message?: string;
}

export class IndicateursDeSanteResponseDto {
  @ApiPropertyOptional({ type: IndicateurDeSanteResponseDto })
  database?: IndicateurDeSanteResponseDto;

  @ApiPropertyOptional({ type: IndicateurDeSanteResponseDto })
  memory_heap?: IndicateurDeSanteResponseDto;
}

export class EtatDeSanteResponseDto {
  @ApiProperty({
    enum: ['error', 'ok', 'shutting_down'],
    enumName: 'StatutDeSante',
  })
  status: HealthCheckStatus;

  @ApiPropertyOptional({
    type: IndicateursDeSanteResponseDto,
    description: 'Indicateurs en etat de marche',
  })
  info?: IndicateursDeSanteResponseDto;

  @ApiPropertyOptional({
    type: IndicateursDeSanteResponseDto,
    description: 'Indicateurs en panne',
  })
  error?: IndicateursDeSanteResponseDto;

  @ApiProperty({ type: IndicateursDeSanteResponseDto })
  details: IndicateursDeSanteResponseDto;
}
