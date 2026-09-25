import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import type {
  EtatParticipant,
  EtatPulse,
} from '../../../domain/contrats/pilotage';
import { ETATS_PULSE } from '../../../domain/contrats/pilotage';
import type { ValeurReponse } from '../../../domain/contrats/resultats';
import {
  MODELES_DE_PRODUCTION,
  SCHEMAS_DE_PRODUCTION,
} from './submit-production.request.dto';
import { ParticipantDeSeanceResponseDto } from '../participant-de-seance.response.dto';
import { DetailVerdictResponseDto } from './verdict-production.response.dto';

@ApiExtraModels(...MODELES_DE_PRODUCTION)
export class ReponseParticipantResponseDto {
  @ApiProperty({ example: 'b2-01-a4-feuille-canaux' })
  questionId: string;

  @ApiProperty({
    description:
      'Valeur enregistree : nombre, texte ou identifiant d option, « je ne sais pas » ou production',
    oneOf: [{ type: 'number' }, { type: 'string' }, ...SCHEMAS_DE_PRODUCTION],
  })
  valeur: ValeurReponse;

  @ApiProperty({ example: false })
  correcte: boolean;

  @ApiProperty({
    description: 'Score d une production, null pour une question fermee',
    nullable: true,
    type: Number,
    example: 0.7647,
  })
  score: number | null;

  @ApiProperty({ type: [DetailVerdictResponseDto], nullable: true })
  details: DetailVerdictResponseDto[] | null;

  @ApiProperty({ nullable: true, type: String })
  libelleConfusion: string | null;
}

export class ReponseLibreParticipantResponseDto {
  @ApiProperty({ example: 'b2-01-a1-diagnostic:rappel' })
  activityId: string;

  @ApiProperty({ example: 'Un taux se calcule sur la valeur de départ.' })
  response: string;
}

export class JalonParticipantResponseDto {
  @ApiProperty({ example: 'b2-01-jalon-1' })
  sondageId: string;

  @ApiProperty({ enum: ETATS_PULSE, example: 'ca-va' })
  etat: EtatPulse;
}

export class EnigmeResolueResponseDto {
  @ApiProperty({ example: 'enigme-1' })
  enigmeId: string;

  @ApiProperty({ example: '7' })
  fragment: string;
}

export class EnigmesParticipantResponseDto {
  @ApiProperty({ example: 'b2-01-a6-coffre' })
  parcoursId: string;

  @ApiProperty({ type: [EnigmeResolueResponseDto] })
  resolues: EnigmeResolueResponseDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Tentatives restantes par enigme ouverte',
    example: { 'enigme-2': 9 },
  })
  tentativesRestantes: Record<string, number>;
}

export class DefiParticipantResponseDto {
  @ApiProperty({ example: 'b2-01-a5-defi-recommandation' })
  defiId: string;

  @ApiProperty({ example: 'Renforcer la marketplace.' })
  premiereTentative: string;
}

export class RappelsServisResponseDto {
  @ApiProperty({ type: [String], example: ['b2-01-r-compensation'] })
  questionIds: string[];
}

export class EtatParticipantResponseDto
  extends ParticipantDeSeanceResponseDto
  implements EtatParticipant
{
  @ApiProperty({ example: 7 })
  revision: number;

  @ApiProperty({ type: [ReponseParticipantResponseDto] })
  reponses: ReponseParticipantResponseDto[];

  @ApiProperty({ type: [ReponseLibreParticipantResponseDto] })
  reponsesLibres: ReponseLibreParticipantResponseDto[];

  @ApiProperty({ type: [JalonParticipantResponseDto] })
  jalons: JalonParticipantResponseDto[];

  @ApiProperty({ type: [EnigmesParticipantResponseDto] })
  enigmes: EnigmesParticipantResponseDto[];

  @ApiProperty({ type: [DefiParticipantResponseDto] })
  defis: DefiParticipantResponseDto[];

  @ApiProperty({ type: RappelsServisResponseDto })
  rappels: RappelsServisResponseDto;
}
