import {
  MoreThan,
  type DeepPartial,
  type FindOptionsWhere,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';

type EntiteDeJeton = ObjectLiteral & { expiresAt: Date };

function jetonNonExpire<E extends EntiteDeJeton>(
  repo: Repository<E>,
  critere: FindOptionsWhere<E>,
): Promise<E | null> {
  return repo.findOne({
    where: { ...critere, expiresAt: MoreThan(new Date()) },
  });
}

export async function enregistrerJeton<E extends EntiteDeJeton, D>(
  repo: Repository<E>,
  champs: DeepPartial<E>,
  versDomaine: (entite: E) => D,
): Promise<D> {
  return versDomaine(await repo.save(repo.create(champs)));
}

export async function jetonActif<E extends EntiteDeJeton, D>(
  repo: Repository<E>,
  critere: FindOptionsWhere<E>,
  versDomaine: (entite: E) => D,
): Promise<D | null> {
  const entite = await jetonNonExpire(repo, critere);
  return entite ? versDomaine(entite) : null;
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
