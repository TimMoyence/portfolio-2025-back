import { getMetadataArgsStorage } from 'typeorm';
import {
  ColonneLocale,
  ContenuASlugUnique,
  SlugDeTraduction,
  TraductionDeContenu,
} from './ColonnesDeContenu';
import { ColonnesDeTrace } from './ColonnesDeTrace';

class TraductionTemoin {
  @ColonneLocale()
  locale: string;

  @SlugDeTraduction()
  slug: string;
}

const storage = getMetadataArgsStorage();

type Cible = (typeof storage.columns)[number]['target'];

const colonne = (cible: Cible, propriete: string) =>
  storage.columns.find(
    (args) => args.target === cible && args.propertyName === propriete,
  );

const index = (cible: Cible, propriete: string) =>
  storage.indices.find(
    (args) =>
      args.target === cible &&
      Array.isArray(args.columns) &&
      args.columns.includes(propriete),
  );

describe('ContenuASlugUnique', () => {
  it('herite des colonnes de trace', () => {
    expect(ContenuASlugUnique.prototype).toBeInstanceOf(ColonnesDeTrace);
  });

  it('declare un identifiant uuid genere', () => {
    expect(
      storage.generations.find(
        (args) =>
          args.target === ContenuASlugUnique && args.propertyName === 'id',
      )?.strategy,
    ).toBe('uuid');
  });

  it('declare un slug texte indexe de facon unique', () => {
    expect(colonne(ContenuASlugUnique, 'slug')?.options.type).toBe('text');
    expect(index(ContenuASlugUnique, 'slug')?.unique).toBe(true);
  });
});

describe('TraductionDeContenu', () => {
  it('herite des colonnes de trace', () => {
    expect(TraductionDeContenu.prototype).toBeInstanceOf(ColonnesDeTrace);
  });

  it('declare un identifiant uuid, une locale et un slug indexe', () => {
    expect(
      storage.generations.find(
        (args) =>
          args.target === TraductionDeContenu && args.propertyName === 'id',
      )?.strategy,
    ).toBe('uuid');
    expect(colonne(TraductionDeContenu, 'locale')?.options.type).toBe('text');
    expect(index(TraductionDeContenu, 'slug')?.unique).toBeFalsy();
  });
});

describe('colonnes de traduction', () => {
  it('stocke la locale en texte', () => {
    expect(colonne(TraductionTemoin, 'locale')?.options).toEqual({
      type: 'text',
    });
  });

  it('indexe le slug traduit sans unicite', () => {
    expect(colonne(TraductionTemoin, 'slug')?.options).toEqual({
      type: 'text',
    });
    expect(index(TraductionTemoin, 'slug')?.unique).toBeFalsy();
  });
});
