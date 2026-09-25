import type { Repository } from 'typeorm';
import { DepotEnDomaine } from './DepotEnDomaine';

interface Ligne {
  id: string;
  rang: number;
}

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

  protected toDomain(ligne: Ligne): string {
    return `${ligne.id}#${ligne.rang}`;
  }
}

const depotSur = (repo: Partial<Repository<Ligne>>) =>
  new DepotTemoin(repo as Repository<Ligne>);

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
});
