import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
} from '@nestjs/swagger';
import { ReferenceOuNul } from '../../../../../common/interfaces/dto/reference-ou-nul.decorator';
import type { Diffusion } from '../../../domain/contrats/cours';
import { DIFFUSIONS } from '../../../domain/contrats/cours';
import type {
  CorrigeEcranPresentateur,
  DerouleCours,
  EcranDeroule,
} from '../../../domain/contrats/deroule';
import { CorrigePresentateurResponseDto } from '../deroule.response.dto';
import {
  CORRIGES_D_ECRAN,
  ExplicationDeCorrectionResponseDto,
  ReflexionPresentateurResponseDto,
} from './corrige-ecran.response.dto';
import { OptionPubliqueResponseDto } from './rappels.response.dto';
import { EcranPublicResponseDto, SujetResponseDto } from './sujet.response.dto';

export class QuestionDerouleResponseDto {
  @ApiProperty({ example: 'b2-01-a3-vote-hausse-baisse' })
  id: string;

  @ApiProperty({ example: 'Le prix monte de 20 %, puis baisse de 20 %.' })
  enonce: string;

  @ApiProperty({
    type: [OptionPubliqueResponseDto],
    nullable: true,
    description: 'Options d un vote, null pour une question numerique',
  })
  options: OptionPubliqueResponseDto[] | null;
}

@ApiExtraModels(...CORRIGES_D_ECRAN, ReflexionPresentateurResponseDto)
export class EcranDerouleResponseDto
  extends EcranPublicResponseDto
  implements EcranDeroule
{
  @ApiProperty({ description: 'Notes du formateur' })
  notes: string;

  @ApiProperty({ enum: DIFFUSIONS, enumName: 'Diffusion' })
  diffusion: Diffusion;

  @ApiProperty({ nullable: true, type: Number, example: 0.7 })
  seuil: number | null;

  @ApiProperty({ type: [CorrigePresentateurResponseDto] })
  corriges: CorrigePresentateurResponseDto[];

  @ApiProperty({ type: [QuestionDerouleResponseDto] })
  questions: QuestionDerouleResponseDto[];

  @ReferenceOuNul(
    CORRIGES_D_ECRAN,
    'Corrige de production, de defi, de revelation ou de reflexion ; servi au sujet seulement une fois l ecran revele, jamais au catalogue',
  )
  corrigeEcran: CorrigeEcranPresentateur | null;

  @ReferenceOuNul(
    [ReflexionPresentateurResponseDto],
    'Reponse attendue d un recit a reflexion, la meme que celle revelee a l etudiant',
  )
  reflexion: ReflexionPresentateurResponseDto | null;

  @ApiPropertyOptional({
    type: [ExplicationDeCorrectionResponseDto],
    description:
      'Explications d un exercice corrige sur place, devoilees une a une au pupitre',
  })
  explications?: ExplicationDeCorrectionResponseDto[];
}

export class DerouleResponseDto
  extends OmitType(SujetResponseDto, ['ecrans'] as const)
  implements DerouleCours
{
  @ApiProperty({ type: [EcranDerouleResponseDto] })
  ecrans: EcranDerouleResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { 'base-arrivee': 'B2-01-A3-04-FIL-TECHNIQUE' },
  })
  remediations: Record<string, string>;
}
