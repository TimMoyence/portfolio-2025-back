import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class ValeurDuTableauResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Valeur de la cellule, null si elle ne se calcule pas',
    example: 21.6,
  })
  valeur: number | null;

  @ApiProperty({
    description:
      'Valeur ecrite au nombre de decimales de sa colonne, virgule decimale, tiret si elle ne se calcule pas',
    example: '21,60',
  })
  affichage: string;
}

@ApiExtraModels(ValeurDuTableauResponseDto)
export class LigneDuTableauResponseDto {
  @ApiProperty({ example: 0 })
  rang: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(ValeurDuTableauResponseDto) },
    description: 'Valeur de chaque colonne de la ligne, par cle de colonne',
  })
  valeurs: Record<string, ValeurDuTableauResponseDto>;
}

@ApiExtraModels(ValeurDuTableauResponseDto)
export class TableauEvalueResponseDto {
  @ApiProperty({ type: [LigneDuTableauResponseDto] })
  lignes: readonly LigneDuTableauResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(ValeurDuTableauResponseDto) },
    description: 'Total de chaque colonne totalisee, par cle de colonne',
  })
  totaux: Record<string, ValeurDuTableauResponseDto>;

  @ApiProperty({
    type: [ValeurDuTableauResponseDto],
    description:
      'Resultat de chaque element de synthese du plan, dans son ordre, unite comprise',
  })
  synthese: readonly ValeurDuTableauResponseDto[];

  @ApiProperty({
    type: ValeurDuTableauResponseDto,
    nullable: true,
    description:
      'Reste a verser apres la derniere ligne, null sans colonne soldee',
  })
  soldeFinal: ValeurDuTableauResponseDto | null;
}
