import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type {
  EtatDesEnigmes,
  EtatEnigme,
} from '../../../domain/contrats/pilotage';
import { ETATS_D_ENIGME } from '../../../domain/contrats/pilotage';

export class EtatDEnigmeResponseDto {
  @ApiProperty({ enum: ETATS_D_ENIGME, example: 'ouverte' })
  etat: EtatEnigme;

  @ApiProperty({ minimum: 0, maximum: 10, example: 9 })
  tentativesRestantes: number;
}

@ApiExtraModels(EtatDEnigmeResponseDto)
export class EtatDesEnigmesResponseDto implements EtatDesEnigmes {
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(EtatDEnigmeResponseDto) },
    description:
      'Etat et tentatives restantes de chaque enigme du parcours, par identifiant',
    example: { 'enigme-1': { etat: 'ouverte', tentativesRestantes: 10 } },
  })
  etats: Record<string, EtatDEnigmeResponseDto>;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Enigme qui recoit la prochaine tentative, null si aucune',
    example: 'enigme-1',
  })
  enigmeOuverte: string | null;

  @ApiProperty({
    description: 'Parcours fini : plus aucune enigme ouverte',
    example: false,
  })
  acheve: boolean;
}

export class TentativeEnigmeResponseDto extends EtatDesEnigmesResponseDto {
  @ApiProperty({ example: true })
  correcte: boolean;

  @ApiProperty({
    description: 'Fragment du code, livre seulement a la resolution',
    nullable: true,
    type: String,
    example: '7',
  })
  fragment: string | null;

  @ApiProperty({ minimum: 0, maximum: 10, example: 9 })
  tentativesRestantes: number;
}
