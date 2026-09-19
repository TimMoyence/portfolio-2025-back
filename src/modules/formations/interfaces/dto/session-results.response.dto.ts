import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Note sur 20', example: 20 })
  note: number;

  @ApiProperty({ example: false })
  sousSeuil: boolean;

  @ApiProperty({ type: [RapportQuestionResponseDto] })
  reponses: RapportQuestionResponseDto[];

  @ApiProperty({ description: 'Nombre d incidents du poste', example: 0 })
  incidents: number;
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
  confusions: ConfusionCompteeResponseDto[];
}

export class ResultatsSeanceResponseDto {
  @ApiProperty({ description: 'Nombre de participants inscrits', example: 30 })
  participants: number;

  @ApiProperty({ type: [ResultatQuestionResponseDto] })
  questions: ResultatQuestionResponseDto[];
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
    description: 'Date de cloture, ou date de lecture si la seance est ouverte',
  })
  fermeeLe: Date;

  @ApiProperty({
    type: [RapportParticipantResponseDto],
    description: 'Participants dans leur ordre d arrivee',
  })
  participants: RapportParticipantResponseDto[];

  @ApiProperty({ type: [String], example: ['taux-evolution'] })
  conceptsFragiles: string[];

  @ApiProperty({ type: ResultatsSeanceResponseDto })
  resultats: ResultatsSeanceResponseDto;

  @ApiProperty({
    description: 'Indicateurs calculés côté serveur pour le pilotage formateur',
  })
  statistiques: {
    moyenne: number;
    mediane: number;
    dispersion: number;
    tauxParticipation: number;
    tauxReussite: number;
    questionsProblemes: string[];
  };
}
