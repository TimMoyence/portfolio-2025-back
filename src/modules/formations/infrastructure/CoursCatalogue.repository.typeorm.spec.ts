import { buildQuizNote } from '../../../../test/factories/cours-stocke.factory';
import {
  buildCourseContentEntity,
  buildScreenContentEntity,
  mockTypeOrmQueryBuilder,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import { ContenuDeCoursInvalideError } from '../domain/cours/CoursStocke';
import { CoursCatalogueRepositoryTypeORM } from './CoursCatalogue.repository.typeorm';
import type { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';

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
  return { requete, sut: new CoursCatalogueRepositoryTypeORM(depot) };
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
