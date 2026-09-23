import { buildQuizNote } from '../../../../test/factories/cours-stocke.factory';
import { buildEcranDeBrique } from '../../../../test/factories/ecrans-stockes.factory';
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

function publicationDe(version: number): FormationCoursePublicationEntity {
  return {
    slug: SLUG,
    versionPubliee: version,
    publieeLe: new Date('2026-09-01T08:00:00.000Z'),
    publieePar: null,
  };
}

function catalogueLisant(...lignes: (FormationCourseContentEntity | null)[]) {
  const getOne = jest.fn();
  for (const ligne of lignes) {
    getOne.mockResolvedValueOnce(ligne);
  }
  const requete = mockTypeOrmQueryBuilder(getOne);
  const depot = mockTypeOrmRepository<FormationCourseContentEntity>({
    createQueryBuilder: jest.fn().mockReturnValue(requete),
  });
  const findOnePublication = jest.fn().mockResolvedValue(publicationDe(2));
  const publications = mockTypeOrmRepository<FormationCoursePublicationEntity>({
    findOne: findOnePublication,
    upsert: jest.fn().mockResolvedValue(undefined),
  });
  return {
    requete,
    findOnePublication,
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
    const ecran = buildEcranDeBrique('fp-quote');
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

  it('ne relit pas en base une version deja lue', async () => {
    const { requete, sut } = catalogueLisant(buildCourseContentEntity());

    const premier = await sut.trouver(SLUG, 2);
    const second = await sut.trouver(SLUG, 2);

    expect(second).toBe(premier);
    expect(requete.getOne).toHaveBeenCalledTimes(1);
  });

  it('relit en base une version differente du meme cours', async () => {
    const { requete, sut } = catalogueLisant(
      buildCourseContentEntity({ version: 1 }),
      buildCourseContentEntity({ version: 2 }),
    );

    await sut.trouver(SLUG, 1);
    await sut.trouver(SLUG, 2);

    expect(requete.getOne).toHaveBeenCalledTimes(2);
  });

  it('relit la publication a chaque appel mais sert le contenu deja lu', async () => {
    const { requete, findOnePublication, sut } = catalogueLisant(
      buildCourseContentEntity({ version: 2 }),
    );
    findOnePublication.mockResolvedValue({
      slug: SLUG,
      versionPubliee: 2,
      publieeLe: new Date('2026-09-11T08:00:00.000Z'),
      publieePar: null,
    });

    const premier = await sut.trouverCourant(SLUG);
    const second = await sut.trouverCourant(SLUG);

    expect(second?.cours).toBe(premier?.cours);
    expect(requete.getOne).toHaveBeenCalledTimes(1);
    expect(findOnePublication).toHaveBeenCalledTimes(2);
  });

  it('retourne null quand le catalogue ne trouve aucune version', async () => {
    const { sut } = catalogueLisant(null, null);

    await expect(sut.trouver('absent')).resolves.toBeNull();
    await expect(sut.trouverCourant('absent')).resolves.toBeNull();
  });

  it('ne sert aucune version courante tant que le slug n a pas de publication', async () => {
    const { sut, findOnePublication, requete } = catalogueLisant(
      buildCourseContentEntity(),
    );
    findOnePublication.mockResolvedValue(null);

    await expect(sut.trouverCourant(SLUG)).resolves.toBeNull();
    expect(requete.getOne).not.toHaveBeenCalled();
  });

  it('date la version courante par la bascule de publication, jamais par la création du contenu', async () => {
    const { sut, findOnePublication } = catalogueLisant(
      buildCourseContentEntity(),
    );
    const publication = publicationDe(2);
    findOnePublication.mockResolvedValue(publication);

    const courant = await sut.trouverCourant(SLUG);

    expect(courant?.publieLe).toBe(publication.publieeLe);
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
