import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { LONGUEUR_MAX_FORMULE } from '../../../domain/cours/Formule';
import { DictionnaireDeTextes } from './submit-production.request.dto';

const LONGUEUR_MAX_REFERENCE = 12;

class RecopieDeCelluleDto {
  @ApiProperty({
    description: 'Cellule recopiee vers la cellule du dessous',
    example: 'D2',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(LONGUEUR_MAX_REFERENCE)
  de: string;
}

export class EvaluerFeuilleRequestDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string', maxLength: LONGUEUR_MAX_FORMULE },
    description: 'Saisie brute de chaque cellule de l eleve, formule ou valeur',
    example: { D2: '=C2*2' },
  })
  @Validate(DictionnaireDeTextes, [LONGUEUR_MAX_FORMULE])
  cellules: Record<string, string>;

  @ApiPropertyOptional({ type: RecopieDeCelluleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecopieDeCelluleDto)
  recopie?: RecopieDeCelluleDto;
}
