import { MoreThan, type FindOptionsWhere, type ObjectLiteral } from 'typeorm';

type EntiteDeJeton = ObjectLiteral & { expiresAt: Date };

export function nonExpire<E extends EntiteDeJeton>(
  critere: FindOptionsWhere<E>,
): FindOptionsWhere<E> {
  return { ...critere, expiresAt: MoreThan(new Date()) };
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
