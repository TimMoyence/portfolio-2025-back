import {
  ApiExtraModels,
  ApiProperty,
  getSchemaPath,
  OmitType,
} from '@nestjs/swagger';
import type { TypeQuestion } from '../../../domain/contrats/cours';
import { TYPES_QUESTION } from '../../../domain/contrats/cours';
import type { RegleDeNotation } from '../../../domain/contrats/notation';
import type {
  ComptesJalon,
  ProgressionEnigme,
  RapportQuestion,
  ResultatQuestion,
  ResultatsDeSeance,
  ResultatsSeance,
  ResumeBareme,
} from '../../../domain/contrats/resultats';
import {
  RapportParticipantResponseDto as RapportParticipantServiResponseDto,
  RapportQuestionResponseDto as RapportQuestionServieResponseDto,
  RegleDeNotationResponseDto as RegleDeNotationServieResponseDto,
  ResultatQuestionResponseDto as ResultatQuestionServiResponseDto,
  SessionResultsResponseDto as SessionResultsServiResponseDto,
} from '../session-results.response.dto';

export class RapportQuestionResponseDto
  extends RapportQuestionServieResponseDto
  implements RapportQuestion
{
  @ApiProperty({ enum: TYPES_QUESTION, example: 'feuille' })
  type: TypeQuestion;

  @ApiProperty({
    description: 'Score d une production, null pour une question fermee',
    nullable: true,
    type: Number,
    example: 0.8235,
  })
  score: number | null;
}

export class RapportParticipantResponseDto extends OmitType(
  RapportParticipantServiResponseDto,
  ['reponses'] as const,
) {
  @ApiProperty({ type: [RapportQuestionResponseDto] })
  reponses: RapportQuestionResponseDto[];
}

export class JustesParCleResponseDto {
  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 19 })
  justes: number;
}

@ApiExtraModels(JustesParCleResponseDto)
export class ResultatQuestionResponseDto
  extends ResultatQuestionServiResponseDto
  implements ResultatQuestion
{
  @ApiProperty({ example: 'B2-01-A4-02-FEUILLE-CANAUX' })
  ecranId: string;

  @ApiProperty({ enum: TYPES_QUESTION, example: 'feuille' })
  type: TypeQuestion;

  @ApiProperty({ example: true })
  noteCompte: boolean;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
    description:
      'Votes : nombre par identifiant stable d option, et __je_ne_sais_pas__',
    example: { 'plus-25-pct-ecd953a1': 12, __je_ne_sais_pas__: 2 },
  })
  parOption: Record<string, number> | null;

  @ApiProperty({
    description: 'Productions : score moyen',
    nullable: true,
    type: Number,
    example: 0.71,
  })
  scoreMoyen: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(JustesParCleResponseDto) },
    nullable: true,
    description: 'Productions : justesse par cellule, carte ou ligne',
  })
  parCle: Record<string, JustesParCleResponseDto> | null;
}

export class ResultatsSeanceResponseDto implements ResultatsSeance {
  @ApiProperty({ description: 'Nombre de participants inscrits', example: 30 })
  participants: number;

  @ApiProperty({ type: [ResultatQuestionResponseDto] })
  questions: ResultatQuestionResponseDto[];
}

export class RegleDeNotationResponseDto
  extends RegleDeNotationServieResponseDto
  implements RegleDeNotation
{
  @ApiProperty({
    enum: TYPES_QUESTION,
    isArray: true,
    example: ['vote', 'numeric', 'classement', 'feuille', 'tableau'],
  })
  typesNotables: TypeQuestion[];

  @ApiProperty({ enum: ['au-moins-une-saisie'] })
  productionCompteSi: 'au-moins-une-saisie';

  @ApiProperty({
    description: 'Les statistiques ne portent que sur les questions notees',
    example: true,
  })
  statistiquesSurQuestionsNotees: boolean;
}

export class NotationParTypeResponseDto {
  @ApiProperty({ example: 19 })
  notees: number;

  @ApiProperty({ example: 13 })
  nonNotees: number;
}

export class ParTypeDeQuestionResponseDto implements Record<
  TypeQuestion,
  NotationParTypeResponseDto
> {
  @ApiProperty({ type: NotationParTypeResponseDto })
  numeric: NotationParTypeResponseDto;

  @ApiProperty({ type: NotationParTypeResponseDto })
  vote: NotationParTypeResponseDto;

  @ApiProperty({ type: NotationParTypeResponseDto })
  feuille: NotationParTypeResponseDto;

  @ApiProperty({ type: NotationParTypeResponseDto })
  tableau: NotationParTypeResponseDto;

  @ApiProperty({ type: NotationParTypeResponseDto })
  classement: NotationParTypeResponseDto;

  @ApiProperty({ type: NotationParTypeResponseDto })
  enigme: NotationParTypeResponseDto;
}

export class ResumeBaremeResponseDto implements ResumeBareme {
  @ApiProperty({ example: 31 })
  questionsNotees: number;

  @ApiProperty({ type: ParTypeDeQuestionResponseDto })
  parType: ParTypeDeQuestionResponseDto;
}

export class ComptesJalonResponseDto implements ComptesJalon {
  @ApiProperty({ example: 3 })
  perdu: number;

  @ApiProperty({ example: 12 })
  'ca-va': number;

  @ApiProperty({ example: 9 })
  clair: number;

  @ApiProperty({ example: 24 })
  total: number;
}

export class ProgressionEnigmeResponseDto implements ProgressionEnigme {
  @ApiProperty({ example: 'b2-01-a6-coffre' })
  parcoursId: string;

  @ApiProperty({ example: 'enigme-1' })
  enigmeId: string;

  @ApiProperty({ example: 20 })
  ouvertes: number;

  @ApiProperty({ example: 17 })
  resolues: number;

  @ApiProperty({ example: 1.6 })
  tentativesMoyennes: number;

  @ApiProperty({ example: 1 })
  epuisees: number;
}

@ApiExtraModels(ComptesJalonResponseDto)
export class SessionResultsResponseDto
  extends OmitType(SessionResultsServiResponseDto, [
    'participants',
    'notation',
  ] as const)
  implements ResultatsDeSeance
{
  @ApiProperty({
    type: [RapportParticipantResponseDto],
    description: 'Participants dans leur ordre d arrivee',
  })
  participants: RapportParticipantResponseDto[];

  @ApiProperty({ type: ResultatsSeanceResponseDto })
  resultats: ResultatsSeanceResponseDto;

  @ApiProperty({ type: RegleDeNotationResponseDto })
  notation: RegleDeNotationResponseDto;

  @ApiProperty({
    type: ResumeBaremeResponseDto,
    description: 'Denominateur de la note : questions notees par type',
  })
  bareme: ResumeBaremeResponseDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(ComptesJalonResponseDto) },
    description: 'Comptes de chaque jalon de confiance',
  })
  jalons: Record<string, ComptesJalonResponseDto>;

  @ApiProperty({ type: [ProgressionEnigmeResponseDto] })
  enigmes: ProgressionEnigmeResponseDto[];
}
