import {
  buildCourseContentEntity,
  buildScreenContentEntity,
  mockTypeOrmQueryBuilder,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import { CoursCatalogueRepositoryTypeORM } from './CoursCatalogue.repository.typeorm';
import type { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';

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

describe('CoursCatalogueRepositoryTypeORM', () => {
  it('charge la version courante et transforme un quiz en question de domaine', async () => {
    const entite = buildCourseContentEntity();
    const { requete, sut } = catalogueLisant(entite, entite);

    const courant = await sut.trouverCourant('b2-01');
    const version = await sut.trouver('b2-01', 2);

    expect(courant?.version).toBe(2);
    expect(courant?.cours.ecrans[0].question?.id).toBe('quiz-1');
    expect(courant?.cours.ecrans[0].guide).toEqual({
      objective: 'Faire émerger le raisonnement',
    });
    expect(version?.ecrans).toHaveLength(1);
    expect(requete.andWhere).toHaveBeenCalledWith('course.version = :version', {
      version: 2,
    });
  });

  it('retourne null quand le catalogue ne trouve aucune version', async () => {
    const { sut } = catalogueLisant(null, null);

    await expect(sut.trouver('absent')).resolves.toBeNull();
    await expect(sut.trouverCourant('absent')).resolves.toBeNull();
  });

  it('refuse un écran sans brique connue ou un cours vide', async () => {
    const { sut } = catalogueLisant(
      buildCourseContentEntity({ ecrans: [] }),
      buildCourseContentEntity({
        ecrans: [buildScreenContentEntity({ brique: 'unknown' })],
      }),
    );

    await expect(sut.trouver('b2-01')).rejects.toThrow('aucun écran');
    await expect(sut.trouver('b2-01')).rejects.toThrow(
      'Brique de formation inconnue',
    );
  });

  it('ignore les interactions quiz invalides et garde les interactions valides sans optionIds', async () => {
    const { sut } = catalogueLisant(
      buildCourseContentEntity({
        ecrans: [
          buildScreenContentEntity({
            proprietes: { interaction: { type: 'quiz', options: ['A'] } },
          }),
        ],
      }),
      buildCourseContentEntity({
        ecrans: [
          buildScreenContentEntity({
            proprietes: {
              interaction: {
                type: 'quiz',
                id: 'quiz-2',
                question: 'Question',
                options: ['A', 'B'],
                correctIndex: 0,
              },
            },
          }),
        ],
      }),
    );

    await expect(sut.trouver('b2-01')).resolves.toMatchObject({
      ecrans: [{ question: undefined }],
    });
    const result = await sut.trouver('b2-01');
    expect(result?.ecrans[0].question?.generer({} as never)).toMatchObject({
      bonne: 'o1',
      bonneLibelle: 'A',
    });
  });
});
