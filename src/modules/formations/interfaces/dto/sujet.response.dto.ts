import { ApiProperty } from '@nestjs/swagger';
import { referenceAuContrat } from '../../../../common/interfaces/http/schemas-du-contrat';
import type { TypeDEcranServi } from '../../domain/contrats/donnees-publiques';
import {
  DONNEES_PAR_BRIQUE,
  TYPES_D_ECRAN_SERVI,
} from '../../domain/contrats/donnees-servies';
import type { EcranPublic } from '../../domain/cours/CoursPublic';

export class EcranPublicResponseDto {
  @ApiProperty({ example: 'E-OUV-RAPPEL' })
  id: string;

  @ApiProperty({
    enum: TYPES_D_ECRAN_SERVI,
    enumName: 'TypeDEcranServi',
    description: 'Brique qui rend l ecran',
    example: 'fp-recall',
  })
  type: TypeDEcranServi;

  @ApiProperty({ description: 'Duree de l ecran en minutes', example: 4 })
  duree: number;

  @ApiProperty({ example: true })
  interactif: boolean;

  @ApiProperty({
    oneOf: Object.values(DONNEES_PAR_BRIQUE).map(referenceAuContrat),
    description:
      'Proprietes de la brique nommee par type, rangees sous la propriete de la brique ; sans solution, piege, confusion ni notes',
  })
  donnees: EcranPublic['donnees'];
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

  @ApiProperty({ type: [EcranPublicResponseDto] })
  ecrans: readonly EcranPublicResponseDto[];
}
