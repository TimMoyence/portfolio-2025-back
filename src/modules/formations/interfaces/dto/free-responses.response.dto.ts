import { ApiProperty } from '@nestjs/swagger';

export class FreeResponseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  sessionId: string;

  @ApiProperty({ format: 'uuid' })
  participantId: string;

  @ApiProperty({ example: 'B2-01-S11-REFLECTION' })
  screenId: string;

  @ApiProperty({ example: 'b2-s11-c1' })
  activityId: string;

  @ApiProperty({ example: 'Je vérifie la base avant de comparer.' })
  response: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Première tentative d’un défi, jamais réécrite',
  })
  premiereReponse: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Date à laquelle les stratégies du défi ont été servies',
  })
  strategiesServiesLe: Date | null;

  @ApiProperty({ example: 12000 })
  dureeMs: number;

  @ApiProperty({ enum: ['enregistre', 'en_attente', 'echec'] })
  status: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Date du premier envoi, conservée lors d’une reprise',
  })
  submittedAt: Date;
}

export class FreeResponsesResponseDto {
  @ApiProperty({
    type: [FreeResponseResponseDto],
    description: 'Réponses libres de la séance, non notées',
  })
  responses: FreeResponseResponseDto[];
}

export class FreeResponseSavedResponseDto {
  @ApiProperty({ enum: ['enregistre'], example: 'enregistre' })
  status: 'enregistre';
}
