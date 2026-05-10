/**
 * Entite domaine d'une invitation a rejoindre un groupe de budget,
 * adressee a une cible (email) qui n'a pas encore de compte sur la
 * plateforme. Le token clair n'est jamais persiste : seul le hash
 * SHA-256 (`tokenHash`) est stocke en base.
 *
 * Cycle de vie : pending -> (accepted | revoked | expired). Les
 * invitations consommees restent en base pour audit.
 */
export class BudgetInvitation {
  readonly id: string;
  readonly groupId: string;
  readonly inviterUserId: string;
  readonly targetEmail: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly acceptedAt: Date | null;
  readonly acceptedByUserId: string | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    groupId: string;
    inviterUserId: string;
    targetEmail: string;
    tokenHash: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    acceptedByUserId: string | null;
    revokedAt: Date | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.groupId = props.groupId;
    this.inviterUserId = props.inviterUserId;
    this.targetEmail = props.targetEmail;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.acceptedAt = props.acceptedAt;
    this.acceptedByUserId = props.acceptedByUserId;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
  }

  /** True si l'invitation est consommable (ni acceptee, ni revoquee, ni expiree). */
  isPending(now: Date): boolean {
    return (
      this.acceptedAt === null &&
      this.revokedAt === null &&
      !this.isExpired(now)
    );
  }

  /** True si la date d'expiration est strictement passee. */
  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() < now.getTime();
  }
}
