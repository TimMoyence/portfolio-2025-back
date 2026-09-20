import { buildQuizNote } from '../../../../test/factories/cours-stocke.factory';
import { buildEcranStockeV3 } from '../../../../test/factories/ecrans-stockes.factory';
import {
  buildCourseContentEntity,
  buildScreenContentEntity,
  mockTypeOrmQueryBuilder,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import { ContenuDeCoursInvalideError } from '../domain/cours/CoursStocke';
import { CoursCatalogueRepositoryTypeORM } from './CoursCatalogue.repository.typeorm';
import type { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import type { FormationCoursePublicationEntity } from './entities/FormationCoursePublication.entity';

const SLUG = 'b2-01-traitement-information-chiffree';

function catalogueLisant(...lignes: (FormationCourseContentEntity | null)[]) {
  const getOne = jest.fn();
  for (const ligne of lignes) {
    getOne.mockResolvedValueOnce(ligne);
  }
  const requete = mockTypeOrmQueryBuilder(getOne);
  const depot = mockTypeOrmRepository<FormationCourseContentEntity>({
    createQueryBuilder: jest.fn().mockReturnValue(requete),
  });
  const publications = mockTypeOrmRepository<FormationCoursePublicationEntity>({
    findOne: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue(undefined),
  });
  return {
    requete,
    publications,
    sut: new CoursCatalogueRepositoryTypeORM(depot, publications),
  };
}

function coursAvecProprietes(
  proprietes: Readonly<Record<string, unknown>>,
): FormationCourseContentEntity {
  const ecran = buildScreenContentEntity();
  return buildCourseContentEntity({
    ecrans: [
      buildScreenContentEntity({
        proprietes: { ...ecran.proprietes, ...proprietes },
      }),
    ],
  });
}

describe('CoursCatalogueRepositoryTypeORM', () => {
  it('lit la version courante et construit la question notée du quiz stocké', async () => {
    const entite = buildCourseContentEntity();
    const { sut } = catalogueLisant(entite);

    const courant = await sut.trouverCourant(SLUG);

    expect(courant?.version).toBe(2);
    expect(courant?.cours.ecrans[0]).toMatchObject({
      id: 'B2-01-S03-PREDICTION',
      question: { id: 'quiz-1', type: 'vote' },
      guide: { aDire: 'Avant de commenter la pente, vérifiez le repère.' },
    });
  });

  it('lit le titre, la diffusion, les remédiations et les médias d une version 3', async () => {
    const ecran = buildEcranStockeV3('fp-quote');
    const media = {
      id: 'M4',
      chemins: ['/assets/cours/b2-01/v3/pacioli-1495.webp'],
      pageSource: 'https://commons.wikimedia.org/wiki/File:Pacioli.jpg',
      auteur: 'portrait attribué à Jacopo de’ Barbari, 1495',
      date: '1495',
      licence: 'domaine public (PD-Art)',
      attribution: 'Portrait attribué à Jacopo de’ Barbari, 1495',
    };
    const { sut } = catalogueLisant(
      buildCourseContentEntity({
        version: 3,
        remediations: { 'base-arrivee': ecran.screenId },
        medias: [media],
        ecrans: [
          buildScreenContentEntity({
            ...ecran,
            titre: ecran.titre ?? null,
            diffusion: ecran.diffusion,
          }),
        ],
      }),
    );

    const cours = await sut.trouver(SLUG, 3);

    expect(cours?.ecrans[0]).toMatchObject({
      titre: 'Écran fp-quote',
      diffusion: 'seance',
    });
    expect(cours?.remediations).toEqual({ 'base-arrivee': ecran.screenId });
    expect(cours?.medias).toEqual([media]);
  });

  it('filtre sur la version demandée', async () => {
    const { requete, sut } = catalogueLisant(buildCourseContentEntity());

    await expect(sut.trouver(SLUG, 2)).resolves.toMatchObject({ slug: SLUG });
    expect(requete.andWhere).toHaveBeenCalledWith('course.version = :version', {
      version: 2,
    });
  });

  it('retourne null quand le catalogue ne trouve aucune version', async () => {
    const { sut } = catalogueLisant(null, null);

    await expect(sut.trouver('absent')).resolves.toBeNull();
    await expect(sut.trouverCourant('absent')).resolves.toBeNull();
  });

  it.each([
    [
      'une confusion inconnue',
      coursAvecProprietes({
        interaction: buildQuizNote({
          confusions: ['raisonnement-additif', 'unite-oubliee'],
        }),
      }),
    ],
    [
      'un quiz sans concept',
      coursAvecProprietes({
        interaction: buildQuizNote({ concept: undefined }),
      }),
    ],
    [
      'un quiz sans identifiants d options',
      coursAvecProprietes({
        interaction: buildQuizNote({ optionIds: undefined }),
      }),
    ],
    [
      'un guide hors contrat',
      coursAvecProprietes({ guide: { objective: 'Faire émerger' } }),
    ],
    ['un cours sans écran', buildCourseContentEntity({ ecrans: [] })],
    [
      'une brique inconnue',
      buildCourseContentEntity({
        ecrans: [buildScreenContentEntity({ brique: 'unknown' })],
      }),
    ],
  ])(
    'refuse à la lecture %s au lieu de le rafistoler',
    async (_cas, entite) => {
      const { sut } = catalogueLisant(entite);

      await expect(sut.trouver(SLUG, 2)).rejects.toBeInstanceOf(
        ContenuDeCoursInvalideError,
      );
    },
  );
});
