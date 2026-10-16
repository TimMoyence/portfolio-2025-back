import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { TexteBorne } from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { LONGUEUR_MAX_FORMULE } from '../../../domain/cours/Formule';
import { DictionnaireDeTextes } from './submit-production.request.dto';

const LONGUEUR_MAX_REFERENCE = 12;

class RecopieDeCelluleDto {
  @ApiProperty({
    description: 'Cellule recopiee vers la cellule du dessous',
    example: 'D2',
  })
  @TexteBorne(2, LONGUEUR_MAX_REFERENCE)
  de: string;
}

export class EvaluerFeuilleRequestDto {
  @ApiProperty({
    description: 'Saisie brute de chaque cellule de l eleve, formule ou valeur',
    example: { D2: '=C2*2' },
  })
  @DictionnaireDeTextes(LONGUEUR_MAX_FORMULE)
  cellules: Record<string, string>;

  @ApiPropertyOptional({ type: RecopieDeCelluleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecopieDeCelluleDto)
  recopie?: RecopieDeCelluleDto;
}
