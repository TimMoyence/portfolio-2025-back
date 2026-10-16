import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { AuPlusElements } from '../../../../../common/interfaces/dto/bornes-annoncees.decorator';
import { AuPlusCaracteres } from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { LONGUEUR_MAX_FORMULE } from '../../../domain/cours/Formule';
import { CelluleDeTableauDto } from './submit-production.request.dto';

const SAISIES_MAX = 400;

class SaisieBruteDeTableauDto extends CelluleDeTableauDto {
  @ApiProperty({
    description: 'Saisie brute de l eleve, lue par le back a la francaise',
    example: '21,6',
  })
  @IsString()
  @AuPlusCaracteres(LONGUEUR_MAX_FORMULE)
  saisie: string;
}

export class EvaluerTableauRequestDto {
  @ApiProperty({ type: [SaisieBruteDeTableauDto] })
  @IsArray()
  @AuPlusElements(SAISIES_MAX)
  @ValidateNested({ each: true })
  @Type(() => SaisieBruteDeTableauDto)
  saisies: SaisieBruteDeTableauDto[];
}
