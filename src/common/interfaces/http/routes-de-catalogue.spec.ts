import { PATH_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { createPaginatedResult } from '../../domain/pagination.types';
import {
  ControleurDeCatalogue,
  pageDemandee,
  reponsePaginee,
} from './routes-de-catalogue';

describe('reponsePaginee', () => {
  it('projette chaque element et reprend la pagination en meta', () => {
    const resultat = createPaginatedResult([1, 2], 5, 2, 2);

    expect(reponsePaginee(resultat, (n) => ({ valeur: n * 10 }))).toEqual({
      items: [{ valeur: 10 }, { valeur: 20 }],
      meta: { page: 2, limit: 2, total: 5, totalPages: 3 },
    });
  });
});

describe('pageDemandee', () => {
  it('ne retient que la page, la taille et le tri de la requete', () => {
    const requete = {
      page: 2,
      limit: 10,
      sortBy: 'slug',
      order: 'ASC' as const,
      status: 'PUBLISHED',
    };

    expect(pageDemandee(requete)).toEqual({
      page: 2,
      limit: 10,
      sortBy: 'slug',
      order: 'ASC',
    });
  });
});

describe('ControleurDeCatalogue', () => {
  @ControleurDeCatalogue('catalogue')
  class CatalogueTemoin {}

  it('monte le controleur sous son chemin', () => {
    expect(Reflect.getMetadata(PATH_METADATA, CatalogueTemoin)).toBe(
      'catalogue',
    );
  });

  it('le range sous le tag Swagger du meme nom', () => {
    expect(Reflect.getMetadata(DECORATORS.API_TAGS, CatalogueTemoin)).toEqual([
      'catalogue',
    ]);
  });
});
