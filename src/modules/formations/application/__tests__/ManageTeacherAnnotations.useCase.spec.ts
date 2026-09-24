/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildActeurFormation,
  buildAdministrateur,
  buildSessionRecord,
  buildTeacherAnnotationRecord,
  createMockSessionsRepo,
  createMockTeacherAnnotationsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  BlankFieldError,
  CoursInconnuError,
  EcranInconnuError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { ManageTeacherAnnotationsUseCase } from '../ManageTeacherAnnotations.useCase';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = 'teacher-uuid';
const AUTRE_FORMATEUR = 'autre-teacher-uuid';
const COURS = buildCoursDeTest();
const ECRAN_DU_COURS = COURS.ecrans[0].id;
const ANNOTATION = {
  screenId: ECRAN_DU_COURS,
  note: ' Relancer sur la base. ',
};

describe('ManageTeacherAnnotationsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let annotations: ReturnType<typeof createMockTeacherAnnotationsRepo>;
  let sut: ManageTeacherAnnotationsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        id: SESSION_ID,
        teacherId: PROPRIETAIRE,
        courseSlug: COURS.slug,
        courseVersion: 1,
      }),
    );
    annotations = createMockTeacherAnnotationsRepo();
    sut = new ManageTeacherAnnotationsUseCase(
      sessions,
      annotations,
      creerCatalogueDeTest(COURS),
    );
  });

  describe('lecture', () => {
    it('rend au formateur proprietaire les annotations de sa seance', async () => {
      await expect(
        sut.list(SESSION_ID, buildActeurFormation({ id: PROPRIETAIRE })),
      ).resolves.toEqual([buildTeacherAnnotationRecord()]);
      expect(annotations.listBySession).toHaveBeenCalledWith(
        SESSION_ID,
        PROPRIETAIRE,
      );
    });

    it('rend a un administrateur les annotations du formateur proprietaire', async () => {
      await sut.list(SESSION_ID, buildAdministrateur());

      expect(annotations.listBySession).toHaveBeenCalledWith(
        SESSION_ID,
        PROPRIETAIRE,
      );
    });

    it('refuse la lecture a un autre formateur au lieu de lui rendre une liste vide', async () => {
      await expect(
        sut.list(SESSION_ID, buildActeurFormation({ id: AUTRE_FORMATEUR })),
      ).rejects.toThrow(SessionNotOwnedError);
      expect(annotations.listBySession).not.toHaveBeenCalled();
    });

    it('signale une seance introuvable', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        sut.list(SESSION_ID, buildActeurFormation({ id: PROPRIETAIRE })),
      ).rejects.toThrow(SessionNotFoundError);
    });
  });

  describe('ecriture', () => {
    it('enregistre l annotation d ecran du proprietaire, note sans blancs superflus', async () => {
      await sut.save(SESSION_ID, PROPRIETAIRE, ANNOTATION);

      expect(annotations.save).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        teacherId: PROPRIETAIRE,
        screenId: ECRAN_DU_COURS,
        note: 'Relancer sur la base.',
      });
    });

    it('S8 · refuse une annotation sur un ecran que le cours ne contient pas', async () => {
      await expect(
        sut.save(SESSION_ID, PROPRIETAIRE, {
          ...ANNOTATION,
          screenId: 'ECRAN-INVENTE',
        }),
      ).rejects.toThrow(EcranInconnuError);
      expect(annotations.save).not.toHaveBeenCalled();
    });

    it('S8 · refuse une annotation quand le cours de la seance a disparu du catalogue', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({
          id: SESSION_ID,
          teacherId: PROPRIETAIRE,
          courseSlug: 'cours-retire',
        }),
      );

      await expect(
        sut.save(SESSION_ID, PROPRIETAIRE, ANNOTATION),
      ).rejects.toThrow(CoursInconnuError);
      expect(annotations.save).not.toHaveBeenCalled();
    });

    it.each([
      ['un autre formateur', AUTRE_FORMATEUR],
      ['un administrateur qui n est pas le proprietaire', 'admin-uuid'],
    ])(
      'refuse a %s d ecraser les annotations de la seance',
      async (_cas, appelant) => {
        await expect(
          sut.save(SESSION_ID, appelant, ANNOTATION),
        ).rejects.toThrow(SessionNotOwnedError);
        expect(annotations.save).not.toHaveBeenCalled();
      },
    );

    it('refuse une note vide sans rien ecrire', async () => {
      await expect(
        sut.save(SESSION_ID, PROPRIETAIRE, { ...ANNOTATION, note: '   ' }),
      ).rejects.toThrow(BlankFieldError);
      expect(annotations.save).not.toHaveBeenCalled();
    });
  });
});
