import type { Repository, SelectQueryBuilder } from 'typeorm';
import { DepotPagine, pageDeRequete } from './page-de-requete';

interface Ligne {
  readonly id: number;
}

function requeteEnregistree(lignes: Ligne[], total: number) {
  const appels: Record<string, unknown[]> = {};
  const qb = {
    alias: 'ligne',
    andWhere: (...args: unknown[]) => (
      (appels.andWhere = [...(appels.andWhere ?? []), args]),
      qb
    ),
    orderBy: (...args: unknown[]) => ((appels.orderBy = args), qb),
    skip: (...args: unknown[]) => ((appels.skip = args), qb),
    take: (...args: unknown[]) => ((appels.take = args), qb),
    getManyAndCount: () => Promise.resolve([lignes, total]),
  };
  return { qb: qb as unknown as SelectQueryBuilder<Ligne>, appels };
}

describe('pageDeRequete', () => {
  it('trie, decoupe la page demandee et projette les lignes', async () => {
    const { qb, appels } = requeteEnregistree([{ id: 7 }, { id: 8 }], 9);

    const page = await pageDeRequete(
      qb,
      { page: 3, limit: 2, order: 'DESC', colonneDeTri: 'ligne.id' },
      (ligne) => `#${ligne.id}`,
    );

    expect(appels).toEqual({
      orderBy: ['ligne.id', 'DESC'],
      skip: [4],
      take: [2],
    });
    expect(page).toEqual({
      items: ['#7', '#8'],
      total: 9,
      page: 3,
      limit: 2,
      totalPages: 5,
    });
  });

  it('filtre sur chaque colonne renseignee et ignore les filtres absents', async () => {
    const { qb, appels } = requeteEnregistree([], 0);

    await pageDeRequete(
      qb,
      {
        page: 1,
        limit: 10,
        order: 'ASC',
        colonneDeTri: 'ligne.id',
        filtres: { status: 'published', type: undefined, enabled: false },
      },
      (ligne) => ligne,
    );

    expect(appels.andWhere).toEqual([
      ['ligne.status = :status', { status: 'published' }],
      ['ligne.enabled = :enabled', { enabled: false }],
    ]);
  });
});

interface RequeteDeLignes {
  page: number;
  limit: number;
  order: 'ASC' | 'DESC';
  sortBy: 'id' | 'rang';
  statut?: string;
}

class DepotDeLignes extends DepotPagine<Ligne, string, RequeteDeLignes> {
  constructor(qb: SelectQueryBuilder<Ligne>) {
    const depot = { createQueryBuilder: () => qb };
    super(depot as unknown as Repository<Ligne>, {
      alias: 'ligne',
      colonnes: ['id', 'rang'],
      parDefaut: 'rang',
      filtres: (requete) => ({ status: requete.statut }),
    });
  }

  protected toDomain(ligne: Ligne): string {
    return `#${ligne.id}`;
  }
}

describe('DepotPagine', () => {
  const requete: RequeteDeLignes = {
    page: 1,
    limit: 5,
    order: 'ASC',
    sortBy: 'id',
    statut: 'published',
  };

  it('trie sur la colonne demandee, filtre et projette vers le domaine', async () => {
    const { qb, appels } = requeteEnregistree([{ id: 3 }], 1);

    const page = await new DepotDeLignes(qb).findAll(requete);

    expect(appels.orderBy).toEqual(['ligne.id', 'ASC']);
    expect(appels.andWhere).toEqual([
      ['ligne.status = :status', { status: 'published' }],
    ]);
    expect(page.items).toEqual(['#3']);
  });

  it('retombe sur la colonne par defaut pour un tri inconnu', async () => {
    const { qb, appels } = requeteEnregistree([], 0);
    const triInconnu = {
      ...requete,
      sortBy: 'nom',
    } as unknown as RequeteDeLignes;

    await new DepotDeLignes(qb).findAll(triInconnu);

    expect(appels.orderBy).toEqual(['ligne.rang', 'ASC']);
  });
});
