import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CODES_D_ERREUR,
  type CodeDErreur,
} from '../../domain/errors/codes-d-erreur';

export class ProblemeDeFormationResponseDto {
  @ApiProperty({ example: 'https://httpstatuses.com/409' })
  type: string;

  @ApiProperty({ example: 'CONFLICT' })
  title: string;

  @ApiProperty({ type: 'integer', example: 409 })
  status: number;

  @ApiProperty({ example: 'La séance est terminée.' })
  detail: string;

  @ApiProperty({ example: '/api/v1/portfolio25/formations/sessions/4271' })
  instance: string;

  @ApiPropertyOptional({
    enum: CODES_D_ERREUR,
    enumName: 'CodeDErreur',
    description: 'Motif métier du refus, que le client traduit',
  })
  code?: CodeDErreur;
}
