import { QueryFailedError, type Repository } from 'typeorm';
import { PostgresErrorClassifier } from './PostgresErrorClassifier';

interface Ligne {
  id: string;
}

class DepotTemoin extends PostgresErrorClassifier {
  constructor(private readonly repo: Repository<Ligne>) {
    super();
  }

  inserer(ligne: Ligne): Promise<Ligne> {
    return this.enregistrerSansDoublon(
      this.repo,
      ligne,
      () => new Error('doublon'),
    );
  }
}

const depotQuiRepond = (save: () => Promise<Ligne>) =>
  new DepotTemoin({ save } as unknown as Repository<Ligne>);

const violationDUnicite = () =>
  new QueryFailedError('INSERT', [], { code: '23505' } as unknown as Error);

describe('PostgresErrorClassifier.enregistrerSansDoublon', () => {
  it('rend la ligne enregistree', async () => {
    const depot = depotQuiRepond(() => Promise.resolve({ id: 'a' }));

    await expect(depot.inserer({ id: 'a' })).resolves.toEqual({ id: 'a' });
  });

  it('traduit une violation d unicite en erreur metier', async () => {
    const depot = depotQuiRepond(() => Promise.reject(violationDUnicite()));

    await expect(depot.inserer({ id: 'a' })).rejects.toThrow('doublon');
  });

  it('laisse passer toute autre erreur', async () => {
    const panne = new Error('connexion perdue');
    const depot = depotQuiRepond(() => Promise.reject(panne));

    await expect(depot.inserer({ id: 'a' })).rejects.toBe(panne);
  });
});
