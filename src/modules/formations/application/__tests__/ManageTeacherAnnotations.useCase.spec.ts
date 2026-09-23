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
  BlankFieldError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { ManageTeacherAnnotationsUseCase } from '../ManageTeacherAnnotations.useCase';

const SESSION_ID = 'session-uuid';
const PROPRIETAIRE = 'teacher-uuid';
const AUTRE_FORMATEUR = 'autre-teacher-uuid';
const ANNOTATION = {
  screenId: 'B2-01-S11-REFLECTION',
  note: ' Relancer sur la base. ',
};

describe('ManageTeacherAnnotationsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let annotations: ReturnType<typeof createMockTeacherAnnotationsRepo>;
  let sut: ManageTeacherAnnotationsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ id: SESSION_ID, teacherId: PROPRIETAIRE }),
    );
    annotations = createMockTeacherAnnotationsRepo();
    sut = new ManageTeacherAnnotationsUseCase(sessions, annotations);
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
        screenId: 'B2-01-S11-REFLECTION',
        note: 'Relancer sur la base.',
      });
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
