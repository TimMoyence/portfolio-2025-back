import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { TexteBorne } from '../../../../../../common/interfaces/dto/champs/longueur-de-texte.decorator';
import { ValeurDuContrat } from '../../../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import {
  SENS_DE_RECOPIE,
  type SensDeRecopie,
} from '../../../../domain/cours/evaluation/FeuilleEvaluee';
import { LONGUEUR_MAX_FORMULE } from '../../../../domain/cours/formule/Formule';
import { DictionnaireDeTextes } from '../submit-production.request.dto';

const LONGUEUR_MAX_REFERENCE = 12;

class RecopieDeCelluleDto {
  @ApiProperty({
    description: 'Cellule recopiee vers sa voisine',
    example: 'D2',
  })
  @TexteBorne(2, LONGUEUR_MAX_REFERENCE)
  de: string;

  @ValeurDuContrat(SENS_DE_RECOPIE, 'SensDeRecopie', {
    facultative: true,
    documentation: { description: 'Sens de la recopie, vers le bas si absent' },
  })
  sens?: SensDeRecopie;
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
