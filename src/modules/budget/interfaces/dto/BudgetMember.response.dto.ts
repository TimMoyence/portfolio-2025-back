import { ApiProperty } from '@nestjs/swagger';

/** DTO HTTP pour les reponses listant un membre de groupe budget. */
export class BudgetMemberResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Alice' })
  displayName: string;

  @ApiProperty({ example: false })
  isOwner: boolean;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z' })
  joinedAt: string;
}
