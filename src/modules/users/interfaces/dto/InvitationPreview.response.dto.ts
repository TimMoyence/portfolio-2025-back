import { ApiProperty } from '@nestjs/swagger';

/**
 * Reponse publique de la preview d'une invitation budget par token.
 *
 * Servi par `GET /auth/invitations/by-token/:token` pour permettre au front
 * d'afficher un bandeau contextuel sur la page register avant que l'utilisateur
 * n'ait cree son compte.
 *
 * Note securite : si le token est inconnu, expire, revoque ou deja consomme,
 * l'API repond 404 sans distinction (anti-enumeration). Cf
 * `2026-05-10-budget-share-invitations-design.md` § 5.4.
 */
export class InvitationPreviewResponseDto {
  /** Prenom de l'inviter, pour personnaliser le bandeau. */
  @ApiProperty({ example: 'Jean' })
  inviterFirstName!: string;

  /** Nom du groupe de budget cible. */
  @ApiProperty({ example: 'Budget couple T&M' })
  groupName!: string;

  /** Email cible de l'invitation (lock le champ email du formulaire register). */
  @ApiProperty({ example: 'bob@example.com' })
  targetEmail!: string;

  /** Date d'expiration ISO 8601. */
  @ApiProperty({ example: '2026-05-17T00:00:00.000Z' })
  expiresAt!: string;
}
