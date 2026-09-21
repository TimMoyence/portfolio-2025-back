import { ApiProperty } from '@nestjs/swagger';

export class FormationGroupResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  sessionId: string;

  @ApiProperty({ example: 'Groupe A' })
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class FormationGroupsResponseDto {
  @ApiProperty({
    type: [FormationGroupResponseDto],
    description: 'Groupes de la séance, triés par nom',
  })
  groups: FormationGroupResponseDto[];
}

export class SessionParticipantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ada' })
  prenom: string;

  @ApiProperty({ example: 'Lovelace' })
  nom: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Groupe du participant, null s’il n’est affecté à aucun',
  })
  groupId: string | null;

  @ApiProperty({
    example: false,
    description:
      'Vrai si le participant a été évincé : sa place est libérée, il reste réadmissible',
  })
  evince: boolean;
}

export class SessionParticipantsResponseDto {
  @ApiProperty({
    type: [SessionParticipantResponseDto],
    description:
      'Participants inscrits dans leur ordre d’arrivée, puis les évincés, sans adresse',
  })
  participants: SessionParticipantResponseDto[];
}
