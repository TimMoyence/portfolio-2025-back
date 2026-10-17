import type {
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';

export abstract class DepotEnDomaine<
  E extends ObjectLiteral,
  R,
> extends PostgresErrorClassifier {
  protected constructor(protected readonly repo: Repository<E>) {
    super();
  }

  protected abstract toDomain(entite: E): R;

  protected async trouver(where: FindOptionsWhere<E>): Promise<R | null> {
    const entite = await this.repo.findOne({ where });
    return entite ? this.toDomain(entite) : null;
  }

  protected async lister(options: FindManyOptions<E>): Promise<readonly R[]> {
    const entites = await this.repo.find(options);
    return entites.map((entite) => this.toDomain(entite));
  }

  protected async relire(where: FindOptionsWhere<E>): Promise<R> {
    return this.toDomain(await this.repo.findOneOrFail({ where }));
  }

  protected async enregistrer(
    champs: DeepPartial<E>,
    erreurSiDoublon?: () => Error,
  ): Promise<R> {
    const entite = this.repo.create(champs);
    return this.toDomain(
      erreurSiDoublon === undefined
        ? await this.repo.save(entite)
        : await this.enregistrerSansDoublon(this.repo, entite, erreurSiDoublon),
    );
  }
}
