import { ApiProperty } from '@nestjs/swagger';
import type {
  OptionPublique,
  SpacedQuestionPublique,
} from '../../../domain/contrats/donnees-publiques';

export class OptionPubliqueResponseDto implements OptionPublique {
  @ApiProperty({
    description: 'Identifiant stable de l option, sans lien avec sa justesse',
    example: 'plus-25-pct-ecd953a1',
  })
  id: string;

  @ApiProperty({ example: '+25 %' })
  libelle: string;
}

export class SpacedQuestionPubliqueResponseDto implements SpacedQuestionPublique {
  @ApiProperty({ example: 'b2-01-r-compensation' })
  questionId: string;

  @ApiProperty({ example: 'evolution-reciproque' })
  concept: string;

  @ApiProperty({ enum: [1, 2, 3], example: 1 })
  boite: 1 | 2 | 3;

  @ApiProperty({ example: 'B2-01 · Traitement de l’information chiffrée' })
  cours: string;

  @ApiProperty({
    example: 'Après une baisse de 20 %, quelle hausse ramène au départ ?',
  })
  enonce: string;

  @ApiProperty({
    type: [OptionPubliqueResponseDto],
    description: 'Options melangees selon la graine du participant',
  })
  options: OptionPubliqueResponseDto[];
}

export class RappelsResponseDto {
  @ApiProperty({
    type: [SpacedQuestionPubliqueResponseDto],
    description: 'Liste figee au premier appel',
  })
  questions: SpacedQuestionPubliqueResponseDto[];
}
