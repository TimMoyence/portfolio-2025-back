import {
  MoreThan,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';

export function jetonNonExpire<E extends ObjectLiteral & { expiresAt: Date }>(
  repo: Repository<E>,
  critere: FindOptionsWhere<E>,
): Promise<E | null> {
  return repo.findOne({
    where: { ...critere, expiresAt: MoreThan(new Date()) },
  });
}

export function champsDuJeton(jeton: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): { userId: string; tokenHash: string; expiresAt: Date } {
  return {
    userId: jeton.userId,
    tokenHash: jeton.tokenHash,
    expiresAt: jeton.expiresAt,
  };
}
