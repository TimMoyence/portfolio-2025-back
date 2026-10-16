import {
  EntityNotFoundError,
  QueryFailedError,
  type Repository,
} from 'typeorm';
import { mockTypeOrmRepository } from '../../../../test/factories/formation-entities.factory';
import { DepotEnDomaine } from './DepotEnDomaine';

interface Ligne {
  id: string;
  rang: number;
}

class DoublonDeLigneError extends Error {}

class DepotTemoin extends DepotEnDomaine<Ligne, string> {
  constructor(repo: Repository<Ligne>) {
    super(repo);
  }

  parId(id: string): Promise<string | null> {
    return this.trouver({ id });
  }

  tout(): Promise<readonly string[]> {
    return this.lister({ order: { rang: 'ASC' } });
  }

  ajouter(rang: number): Promise<string> {
    return this.enregistrer({ rang });
  }

  ajouterSansDoublon(rang: number): Promise<string> {
    return this.enregistrer({ rang }, () => new DoublonDeLigneError());
  }

  relu(id: string): Promise<string> {
    return this.relire({ id });
  }

  protected toDomain(ligne: Ligne): string {
    return `${ligne.id}#${ligne.rang}`;
  }
}

const depotSur = (methodes: Readonly<Record<string, jest.Mock>>) =>
  new DepotTemoin(mockTypeOrmRepository<Ligne>(methodes));

const violationUnique = () =>
  new QueryFailedError(
    'INSERT',
    [],
    Object.assign(new Error('duplicate'), { code: '23505' }),
  );

function depotQuiEnregistre(save: jest.Mock) {
  const create = jest.fn((champs: Partial<Ligne>) => ({ ...champs }));
  return {
    create,
    save,
    depot: depotSur({ create, save }),
  };
}

describe('DepotEnDomaine', () => {
  it('traduit la ligne trouvee en objet du domaine', async () => {
    const findOne = jest.fn().mockResolvedValue({ id: 'a', rang: 1 });

    await expect(depotSur({ findOne }).parId('a')).resolves.toBe('a#1');
    expect(findOne).toHaveBeenCalledWith({ where: { id: 'a' } });
  });

  it('rend null quand aucune ligne ne correspond', async () => {
    const findOne = jest.fn().mockResolvedValue(null);

    await expect(depotSur({ findOne }).parId('z')).resolves.toBeNull();
  });

  it('traduit chaque ligne listee en respectant les options de recherche', async () => {
    const find = jest.fn().mockResolvedValue([
      { id: 'a', rang: 1 },
      { id: 'b', rang: 2 },
    ]);

    await expect(depotSur({ find }).tout()).resolves.toEqual(['a#1', 'b#2']);
    expect(find).toHaveBeenCalledWith({ order: { rang: 'ASC' } });
  });

  it('enregistre la ligne creee puis traduit la ligne sauvegardee', async () => {
    const { create, save, depot } = depotQuiEnregistre(
      jest.fn((ligne: Partial<Ligne>) =>
        Promise.resolve({ ...ligne, id: 'n' }),
      ),
    );

    await expect(depot.ajouter(3)).resolves.toBe('n#3');
    expect(create).toHaveBeenCalledWith({ rang: 3 });
    expect(save).toHaveBeenCalledWith(create.mock.results[0].value);
  });

  it('traduit la violation d unicite en l erreur du domaine quand elle est fournie', async () => {
    const { depot } = depotQuiEnregistre(
      jest.fn().mockRejectedValue(violationUnique()),
    );

    await expect(depot.ajouterSansDoublon(3)).rejects.toBeInstanceOf(
      DoublonDeLigneError,
    );
  });

  it('laisse passer la violation d unicite quand aucune erreur du domaine n est fournie', async () => {
    const violation = violationUnique();
    const { depot } = depotQuiEnregistre(
      jest.fn().mockRejectedValue(violation),
    );

    await expect(depot.ajouter(3)).rejects.toBe(violation);
  });

  it('laisse passer toute autre panne d ecriture meme avec une erreur du domaine', async () => {
    const panne = new Error('connexion perdue');
    const { depot } = depotQuiEnregistre(jest.fn().mockRejectedValue(panne));

    await expect(depot.ajouterSansDoublon(3)).rejects.toBe(panne);
  });

  it('relit la ligne exigee et la traduit', async () => {
    const findOneOrFail = jest.fn().mockResolvedValue({ id: 'a', rang: 7 });

    await expect(depotSur({ findOneOrFail }).relu('a')).resolves.toBe('a#7');
    expect(findOneOrFail).toHaveBeenCalledWith({ where: { id: 'a' } });
  });

  it('refuse de rendre une ligne disparue a la relecture', async () => {
    const absente = new EntityNotFoundError('Ligne', { where: { id: 'z' } });
    const findOneOrFail = jest.fn().mockRejectedValue(absente);

    await expect(depotSur({ findOneOrFail }).relu('z')).rejects.toBe(absente);
  });
});
