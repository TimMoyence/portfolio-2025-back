import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type {
  LigneDeMachine,
  SortiesMachine,
  ValeurDeMachine,
} from '../../../domain/contrats/donnees-publiques';

export class ValeurDeMachineResponseDto implements ValeurDeMachine {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Valeur calculee, null si la machine ne la calcule pas',
    example: 99,
  })
  valeur: number | null;

  @ApiProperty({
    description:
      'Valeur arrondie au centieme, virgule decimale, tiret si elle ne se calcule pas',
    example: '99',
  })
  affichage: string;
}

export class PointDeCourbeResponseDto {
  @ApiProperty({ example: 10 })
  x: number;

  @ApiProperty({ type: Number, nullable: true, example: 99 })
  y: number | null;
}

export class LigneDeMachineResponseDto implements LigneDeMachine {
  @ApiProperty({ type: ValeurDeMachineResponseDto })
  valeur: ValeurDeMachineResponseDto;

  @ApiProperty({ type: ValeurDeMachineResponseDto })
  resultat: ValeurDeMachineResponseDto;

  @ApiProperty({ description: 'Ligne du reglage courant du curseur' })
  courante: boolean;
}

@ApiExtraModels(PointDeCourbeResponseDto, LigneDeMachineResponseDto)
export class MachineEvalueeResponseDto implements SortiesMachine {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Reglage de chaque curseur, defauts compris, par cle',
    example: { depart: 100, tauxUn: 10, tauxDeux: -10 },
  })
  valeurs: Record<string, number>;

  @ApiProperty({ type: ValeurDeMachineResponseDto })
  resultat: ValeurDeMachineResponseDto;

  @ApiProperty({
    type: [ValeurDeMachineResponseDto],
    description: 'Valeur a la sortie de chaque etape, dans son ordre',
  })
  etapes: readonly ValeurDeMachineResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: getSchemaPath(PointDeCourbeResponseDto) },
    },
    description:
      'Resultat le long de chaque curseur, les autres a leur reglage, par cle',
  })
  courbes: Record<string, readonly PointDeCourbeResponseDto[]>;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: getSchemaPath(LigneDeMachineResponseDto) },
    },
    description: 'Table de valeurs de chaque curseur, par cle',
  })
  lignes: Record<string, readonly LigneDeMachineResponseDto[]>;

  @ApiProperty({
    description: 'Phrase de la machine, resultat ecrit a sa place',
    example: 'Le prix final vaut 99 €.',
  })
  phrase: string;
}
