import { ApiProperty } from '@nestjs/swagger';
import { PACING_MODES, type PacingMode } from '../../domain/PacingMode';
import { EN_TETE_JETON } from '../ParticipantToken.service';

export class JoinSessionResponseDto {
  @ApiProperty({ example: '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c' })
  participantId: string;

  @ApiProperty({ example: '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90' })
  sessionId: string;

  @ApiProperty({ example: 0 })
  ecranCourant: number;

  @ApiProperty({ enum: PACING_MODES, example: 'pilote' })
  modeRythme: PacingMode;

  @ApiProperty({
    description: `Jeton de participant a renvoyer dans l en-tete ${EN_TETE_JETON}`,
  })
  jeton: string;

  @ApiProperty({
    description:
      'Secret a conserver sur le poste et a presenter pour reprendre la place ; renouvele a chaque jonction',
  })
  secretDeReprise: string;
}
