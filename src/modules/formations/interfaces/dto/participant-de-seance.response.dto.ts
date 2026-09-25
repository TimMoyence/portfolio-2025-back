import { ApiProperty } from '@nestjs/swagger';

export class ParticipantDeSeanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  sessionId: string;

  @ApiProperty({ format: 'uuid' })
  participantId: string;
}
