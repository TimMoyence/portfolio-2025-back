import { ApiProperty } from '@nestjs/swagger';
import type {
  ConceptFragile,
  RapportIncident,
} from '../../domain/IFormationMailer.port';
import {
  INCIDENT_TYPES,
  type IncidentType,
  type ValeurDeContexte,
} from '../../domain/IncidentType';

export class RapportQuestionResponseDto {
  @ApiProperty({ example: 'Q-OUV-RAPPEL' })
  questionId: string;

  @ApiProperty({ example: 'evolutions-successives' })
  concept: string;

  @ApiProperty({ description: 'Valeur envoyee par l etudiant', example: 'o2' })
  valeur: string;

  @ApiProperty({
    description:
      'Reponse lisible : libelle de l option pour un vote, « Je ne sais pas », sinon la valeur',
    example: 'plus bas qu’au départ',
  })
  reponse: string;

  @ApiProperty({ example: true })
  correcte: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
  })
  misconception: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
  })
  libelleConfusion: string | null;

  @ApiProperty({ example: 42000 })
  dureeMs: number;
}

export class RapportReponseLibreResponseDto {
  @ApiProperty({ example: 'B3-01-A3-12-CAHIER-DE-REGLES' })
  screenId: string;

  @ApiProperty({ example: 'b3-01-a3-regles:regle-visualiser' })
  activityId: string;

  @ApiProperty({
    example: 'Je lis le dictionnaire des données avant de calculer.',
  })
  reponse: string;
}

export class RapportIncidentResponseDto implements RapportIncident {
  @ApiProperty({
    enum: INCIDENT_TYPES,
    enumName: 'TypeDIncident',
    example: 'tab_hidden',
  })
  type: IncidentType;

  @ApiProperty({ format: 'date-time', example: '2026-09-11T10:00:00.000Z' })
  horodatage: string;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    },
    example: { duree: 1200 },
  })
  contexte: Readonly<Record<string, ValeurDeContexte>> | null;
}

export class RapportParticipantResponseDto {
  @ApiProperty({ example: 'Theo' })
  prenom: string;

  @ApiProperty({ example: 'Martin' })
  nom: string;

  @ApiProperty({ example: 'theo.martin@example.com' })
  email: string;

  @ApiProperty({
    description: 'Part des questions notees repondues',
    example: 1,
  })
  completion: number;

  @ApiProperty({ type: [RapportQuestionResponseDto] })
  reponses: readonly RapportQuestionResponseDto[];

  @ApiProperty({
    type: [RapportReponseLibreResponseDto],
    description:
      'Réponses libres du poste, dans l’ordre des écrans puis des activités',
  })
  reponsesLibres: readonly RapportReponseLibreResponseDto[];

  @ApiProperty({
    type: [RapportIncidentResponseDto],
    description: 'Incidents du poste, dans l ordre du temps',
  })
  incidents: readonly RapportIncidentResponseDto[];
}

export class ConfusionCompteeResponseDto {
  @ApiProperty({ example: 'base-arrivee' })
  id: string;

  @ApiProperty({
    example:
      'Diviser l’écart par la valeur d’arrivée au lieu de la valeur de départ.',
  })
  libelle: string;

  @ApiProperty({ example: 4 })
  nombre: number;
}

export class ResultatQuestionResponseDto {
  @ApiProperty({ example: 'Q-M2-PIVOT' })
  questionId: string;

  @ApiProperty({ example: 30 })
  total: number;

  @ApiProperty({ example: 21 })
  correctes: number;

  @ApiProperty({ example: 2 })
  neSaitPas: number;

  @ApiProperty({
    type: [ConfusionCompteeResponseDto],
    description: 'Confusions triees par frequence',
  })
  confusions: readonly ConfusionCompteeResponseDto[];
}

export class StatistiquesSeanceResponseDto {
  @ApiProperty({
    description: 'Part des participants ayant repondu a au moins une question',
    example: 0.9,
  })
  tauxParticipation: number;

  @ApiProperty({
    description:
      'Reussite des reponses, chaque question pesee par son nombre de reponses : score moyen d une production, part des correctes sinon',
    example: 0.64,
  })
  tauxReussite: number;

  @ApiProperty({
    type: [String],
    description: 'Questions dont le taux de reussite est sous le seuil',
    example: ['Q-M2-PIVOT'],
  })
  questionsProblemes: readonly string[];
}

export class RegleDeNotationResponseDto {
  @ApiProperty({
    description: 'Une reponse « Je ne sais pas » compte comme repondue',
    example: true,
  })
  neSaitPasCompteCommeReponse: boolean;

  @ApiProperty({
    description: 'Points d une question notee sans reponse',
    example: 0,
  })
  pointsNonReponse: number;

  @ApiProperty({
    description: 'Les reponses libres entrent-elles dans la note',
    example: false,
  })
  reponsesLibresNotees: boolean;

  @ApiProperty({
    description: 'Taux de reussite sous lequel une question est problematique',
    example: 0.7,
  })
  seuilQuestionProbleme: number;
}

export class ConceptFragileResponseDto implements ConceptFragile {
  @ApiProperty({ example: 'taux-evolution' })
  concept: string;

  @ApiProperty({ example: 'Taux d’évolution' })
  libelle: string;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 3,
    description:
      'Participants ayant au moins une réponse non correcte sur ce concept',
  })
  effectif: number;
}

export class SessionResultsResponseDto {
  @ApiProperty({ example: 'b2-01-traitement-information-chiffree' })
  courseSlug: string;

  @ApiProperty({ example: '4271' })
  code: string;

  @ApiProperty({ type: String, format: 'date-time' })
  ouverteLe: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Date de cloture, null tant que la seance est ouverte',
  })
  fermeeLe: Date | null;

  @ApiProperty({
    type: [RapportParticipantResponseDto],
    description: 'Participants dans leur ordre d arrivee',
  })
  participants: readonly RapportParticipantResponseDto[];

  @ApiProperty({
    type: [ConceptFragileResponseDto],
    description:
      'Concepts fragiles de la classe, du plus touché au moins touché',
  })
  conceptsFragiles: readonly ConceptFragileResponseDto[];

  @ApiProperty({
    type: StatistiquesSeanceResponseDto,
    description: 'Indicateurs calculés côté serveur pour le pilotage formateur',
  })
  statistiques: StatistiquesSeanceResponseDto;

  @ApiProperty({
    type: RegleDeNotationResponseDto,
    description: 'Barème appliqué aux statistiques du rapport',
  })
  notation: RegleDeNotationResponseDto;
}
