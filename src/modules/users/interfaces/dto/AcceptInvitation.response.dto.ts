import { ApiProperty } from '@nestjs/swagger';

/**
 * Reponse de l'endpoint `POST /auth/invitations/:token/accept`.
 *
 * Retourne les identifiants du groupe de budget rejoint pour permettre
 * au frontend de rediriger vers le bon budget apres acceptation.
 */
export class AcceptInvitationResponseDto {
  /** Identifiant du groupe rejoint. */
  @ApiProperty({ example: 'group-1' })
  groupId!: string;

  /** Nom du groupe rejoint, pour affichage UI. */
  @ApiProperty({ example: 'Budget couple T&M' })
  groupName!: string;
}
