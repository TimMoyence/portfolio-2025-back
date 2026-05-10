import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO HTTP pour une invitation budget en attente d'acceptation.
 *
 * Expose uniquement les champs lisibles cote owner (id, email cible,
 * dates ISO). N'expose JAMAIS le `tokenHash` ni le token clair.
 */
export class PendingInvitationResponseDto {
  @ApiProperty({ example: 'inv-uuid' })
  id: string;

  @ApiProperty({ example: 'bob@example.com' })
  targetEmail: string;

  @ApiProperty({ example: '2026-05-17T00:00:00.000Z' })
  expiresAt: string;

  @ApiProperty({ example: '2026-05-10T00:00:00.000Z' })
  createdAt: string;
}

/** Wrapper liste des invitations pending. */
export class PendingInvitationsListResponseDto {
  @ApiProperty({ type: [PendingInvitationResponseDto] })
  invitations: PendingInvitationResponseDto[];
}
