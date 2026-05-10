import { ApiProperty } from '@nestjs/swagger';

/**
 * Statut renvoye par POST /budget/share.
 *
 * - `shared`         → l'email cible a un compte et a ete ajoute au groupe.
 * - `already-member` → l'email cible est deja membre du groupe (no-op idempotent).
 * - `invited`        → l'email cible n'a pas de compte, une invitation magic-link
 *   a ete creee et envoyee par mail.
 */
export type ShareBudgetStatus = 'shared' | 'already-member' | 'invited';

/** DTO HTTP de la reponse de partage de budget. */
export class ShareBudgetResponseDto {
  @ApiProperty({
    enum: ['shared', 'already-member', 'invited'],
    example: 'invited',
    description:
      "Statut du partage : 'shared' = ajout direct, 'already-member' = no-op, 'invited' = magic-link envoye.",
  })
  status: ShareBudgetStatus;
}
