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

export class StatistiquesSeanceResponseDto {
  @ApiProperty({ description: 'Moyenne des notes sur 20', example: 12.5 })
  moyenne: number;

  @ApiProperty({ description: 'Mediane des notes sur 20', example: 13 })
  mediane: number;

  @ApiProperty({ description: 'Ecart type des notes', example: 3.21 })
  dispersion: number;

  @ApiProperty({
    description: 'Part des participants ayant repondu a au moins une question',
    example: 0.9,
  })
  tauxParticipation: number;

  @ApiProperty({
    description: 'Part des reponses correctes parmi toutes les reponses',
    example: 0.64,
  })
  tauxReussite: number;

  @ApiProperty({
    type: [String],
    description: 'Questions dont le taux de reussite est sous le seuil',
    example: ['Q-M2-PIVOT'],
  })
  questionsProblemes: string[];
}

export class RegleDeNotationResponseDto {
  @ApiProperty({ description: 'Note maximale', example: 20 })
  noteMax: number;

  @ApiProperty({
    enum: ['participation-relative-cohorte'],
    description:
      'Note de participation : part des questions notees repondues, rapportee a la reference de la cohorte',
    example: 'participation-relative-cohorte',
  })
  base: 'participation-relative-cohorte';

  @ApiProperty({
    description:
      'Part de la cohorte qui fixe la reference : completion du participant classe a ce rang, qui obtient la note maximale',
    example: 0.2,
  })
  partCohorteReference: number;

  @ApiProperty({
    description:
      'Seuil de validation, en fraction de la completion de reference',
    example: 0.4,
  })
  ratioSeuilValidation: number;

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

  @ApiProperty({
    description: 'Nombre de decimales des statistiques arrondies',
    example: 2,
  })
  decimalesStatistiques: number;
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

  @ApiProperty({
    type: StatistiquesSeanceResponseDto,
    description: 'Indicateurs calculés côté serveur pour le pilotage formateur',
  })
  statistiques: StatistiquesSeanceResponseDto;

  @ApiProperty({
    type: RegleDeNotationResponseDto,
    description: 'Barème appliqué aux notes et aux statistiques du rapport',
  })
  notation: RegleDeNotationResponseDto;
}
