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

  it.each([
    ['une violation d unicite', violationDUnicite()],
    [
      'une erreur du pilote rejetee seule',
      { code: '23505' } as unknown as Error,
    ],
  ])('traduit %s en erreur metier', async (_nom, rejet) => {
    const depot = depotQuiRepond(() => Promise.reject(rejet));

    await expect(depot.inserer({ id: 'a' })).rejects.toThrow('doublon');
  });

  it('laisse passer un rejet qui n est pas un objet', async () => {
    const rejet = 'panne' as unknown as Error;
    const depot = depotQuiRepond(() => Promise.reject(rejet));

    await expect(depot.inserer({ id: 'a' })).rejects.toBe(rejet);
  });

  it('laisse passer toute autre erreur', async () => {
    const panne = new Error('connexion perdue');
    const depot = depotQuiRepond(() => Promise.reject(panne));

    await expect(depot.inserer({ id: 'a' })).rejects.toBe(panne);
  });
});
