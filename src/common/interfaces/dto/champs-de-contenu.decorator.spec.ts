import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  RangDAffichage,
  SlugDeContenu,
  StatutDePublication,
  StatutPublie,
} from './champs-de-contenu.decorator';

class ContenuTemoin {
  @SlugDeContenu('mon-contenu')
  slug: string;

  @StatutDePublication()
  status?: string;

  @RangDAffichage()
  order?: number;
}

const erreursPour = (corps: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(ContenuTemoin, corps)).map(
    (erreur) => erreur.property,
  );

describe('StatutPublie', () => {
  class ReponseTemoin {
    @StatutPublie()
    status: string;
  }

  it('documente le statut publie et ses trois valeurs', () => {
    const proprietes = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      ReponseTemoin.prototype,
      'status',
    ) as { example: string; enum: string[] };

    expect(proprietes.example).toBe('PUBLISHED');
    expect(proprietes.enum).toEqual(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
  });
});

describe('champs de contenu', () => {
  it('accepte un contenu complet et valide', () => {
    expect(
      erreursPour({ slug: 'mon-contenu', status: 'DRAFT', order: 10000 }),
    ).toEqual([]);
  });

  it('rend le statut et le rang facultatifs', () => {
    expect(erreursPour({ slug: 'mon-contenu' })).toEqual([]);
  });

  it('refuse un slug hors format kebab ou trop court', () => {
    expect(erreursPour({ slug: 'Mon Contenu' })).toEqual(['slug']);
    expect(erreursPour({ slug: 'a' })).toEqual(['slug']);
    expect(erreursPour({ slug: 'a'.repeat(121) })).toEqual(['slug']);
  });

  it('refuse un statut inconnu', () => {
    expect(erreursPour({ slug: 'ok', status: 'HIDDEN' })).toEqual(['status']);
  });

  it('refuse un rang negatif, decimal ou au dela de 10000', () => {
    expect(erreursPour({ slug: 'ok', order: -1 })).toEqual(['order']);
    expect(erreursPour({ slug: 'ok', order: 1.5 })).toEqual(['order']);
    expect(erreursPour({ slug: 'ok', order: 10001 })).toEqual(['order']);
  });
});
