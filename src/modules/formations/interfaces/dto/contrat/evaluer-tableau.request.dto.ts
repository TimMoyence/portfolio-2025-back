import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LONGUEUR_MAX_FORMULE } from '../../../domain/cours/Formule';
import { CelluleDeTableauDto } from './submit-production.request.dto';

const SAISIES_MAX = 400;

class SaisieBruteDeTableauDto extends CelluleDeTableauDto {
  @ApiProperty({
    description: 'Saisie brute de l eleve, lue par le back a la francaise',
    example: '21,6',
  })
  @IsString()
  @MaxLength(LONGUEUR_MAX_FORMULE)
  saisie: string;
}

export class EvaluerTableauRequestDto {
  @ApiProperty({ type: [SaisieBruteDeTableauDto] })
  @IsArray()
  @ArrayMaxSize(SAISIES_MAX)
  @ValidateNested({ each: true })
  @Type(() => SaisieBruteDeTableauDto)
  saisies: SaisieBruteDeTableauDto[];
}
