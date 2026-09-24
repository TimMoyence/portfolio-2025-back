import { ApiProperty } from '@nestjs/swagger';

export class SessionParticipantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Ada' })
  prenom: string;

  @ApiProperty({ example: 'Lovelace' })
  nom: string;

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
