import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type { ApiPropertyOptions } from '@nestjs/swagger';
import { referenceAuContrat } from '../../../../common/interfaces/http/schemas-du-contrat';
import type { TypeDEcranServi } from '../../domain/contrats/donnees-publiques';
import { DONNEES_PAR_BRIQUE } from '../../domain/contrats/donnees-servies';
import type { EcranPublic } from '../../domain/cours/CoursPublic';

export class EcranPublicResponseDto {
  @ApiProperty({ example: 'E-OUV-RAPPEL' })
  id: string;

  type: TypeDEcranServi;

  @ApiProperty({ description: 'Duree de l ecran en minutes', example: 4 })
  duree: number;

  @ApiProperty({ example: true })
  interactif: boolean;

  donnees: EcranPublic['donnees'];
}

export function ecransDuContrat(
  socle: typeof EcranPublicResponseDto,
): ApiPropertyOptions {
  return {
    type: 'array',
    description:
      'Ecrans, chacun avec les donnees de la brique nommee par son type ; sans solution, piege, confusion ni notes',
    items: {
      oneOf: Object.entries(DONNEES_PAR_BRIQUE).map(([brique, donnees]) => ({
        allOf: [
          { $ref: getSchemaPath(socle) },
          {
            type: 'object',
            properties: {
              type: { type: 'string', enum: [brique] },
              donnees: referenceAuContrat(donnees),
            },
            required: ['type', 'donnees'],
          },
        ],
      })),
    },
  };
}

export class SujetResponseDto {
  @ApiProperty({
    description: 'Slug du cours',
    example: 'b2-01-traitement-information-chiffree',
  })
  id: string;

  @ApiProperty({ example: 'Proportions, taux et évolutions' })
  titre: string;

  @ApiProperty({ example: 'B2' })
  niveau: string;

  @ApiProperty({ description: 'Duree du cours en minutes', example: 195 })
  duree: number;

  @ApiProperty({ type: [String], example: ['proportion'] })
  concepts: readonly string[];
}
