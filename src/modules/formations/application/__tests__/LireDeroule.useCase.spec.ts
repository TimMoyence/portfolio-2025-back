import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
  buildBareme,
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { deroulePresentateur } from '../../domain/cours/DeroulePresentateur';
import {
  CoursInconnuError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { LireDerouleUseCase } from '../LireDeroule.useCase';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const PROPRIETAIRE = buildActeurFormation({ id: TEACHER_ID });
const GRAINE_REFERENCE = 123_456;
const COURS = buildCoursDeTest();
const SESSION = buildSessionRecord({
  courseSlug: COURS.slug,
  teacherId: TEACHER_ID,
  bareme: buildBareme({ graineReference: GRAINE_REFERENCE }),
});

describe('LireDerouleUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: LireDerouleUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(SESSION);
    sut = new LireDerouleUseCase(sessions, creerCatalogueDeTest(COURS));
  });

  it('rend le deroule annote du cours a la graine de reference du bareme', async () => {
    const deroule = await sut.execute(SESSION.id, PROPRIETAIRE);

    expect(deroule).toEqual(deroulePresentateur(COURS, GRAINE_REFERENCE));
  });

  it('garde le déroulé sur la version ouverte même après une nouvelle publication', async () => {
    const catalogue = creerCatalogueDeTest(COURS);
    const trouver = jest.spyOn(catalogue, 'trouver').mockResolvedValue(COURS);
    sessions.findById.mockResolvedValue({ ...SESSION, courseVersion: 2 });
    sut = new LireDerouleUseCase(sessions, catalogue);

    await sut.execute(SESSION.id, PROPRIETAIRE);

    expect(trouver).toHaveBeenCalledWith(COURS.slug, 2);
  });

  it('refuse une session introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(sut.execute(SESSION.id, PROPRIETAIRE)).rejects.toBeInstanceOf(
      SessionNotFoundError,
    );
  });

  it('refuse le deroule a un formateur qui n est pas le proprietaire', async () => {
    await expect(
      sut.execute(SESSION.id, buildActeurFormation({ id: AUTRE_TEACHER_ID })),
    ).rejects.toBeInstanceOf(SessionNotOwnedError);
  });

  it('sert le deroule a un administrateur qui n est pas le proprietaire', async () => {
    await expect(
      sut.execute(SESSION.id, buildAdministrateur()),
    ).resolves.toEqual(deroulePresentateur(COURS, GRAINE_REFERENCE));
  });

  it('refuse un cours absent du catalogue', async () => {
    sut = new LireDerouleUseCase(
      sessions,
      creerCatalogueDeTest(buildCoursDeTest({ slug: 'un-autre-slug' })),
    );

    await expect(sut.execute(SESSION.id, PROPRIETAIRE)).rejects.toBeInstanceOf(
      CoursInconnuError,
    );
  });
});
