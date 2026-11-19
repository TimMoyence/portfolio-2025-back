import {
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../../test/factories/formations/formation.factory';
import {
  RevisionDeSeanceObsoleteError,
  SessionClosedError,
} from '../../../domain/errors/FormationErrors';
import type { ISessionsRepository } from '../../../domain/seance/acces/ISessions.repository';
import { ecrireSurLaRevisionLue } from './SessionAccess';

const SESSION = 'session-uuid';
const TEACHER_ID = 'teacher-uuid';
const ACCES = { sessionId: SESSION, teacherId: TEACHER_ID };
const ECRITURE = () => Promise.resolve({ ecranCourant: 2 });

describe('ecrireSurLaRevisionLue', () => {
  let update: jest.Mocked<ISessionsRepository>['update'];
  let sessions: ReturnType<typeof createMockSessionsRepo>;

  beforeEach(() => {
    update = jest.fn();
    sessions = {
      ...createMockSessionsRepo({ teacherId: TEACHER_ID, revision: 3 }),
      update,
    };
  });

  it('ecrit sur la revision lue et rend la seance ecrite', async () => {
    const ecrite = buildSessionRecord({ teacherId: TEACHER_ID, revision: 4 });
    update.mockResolvedValue(ecrite);

    await expect(
      ecrireSurLaRevisionLue(sessions, ACCES, ECRITURE),
    ).resolves.toBe(ecrite);
    expect(update).toHaveBeenCalledWith(SESSION, { ecranCourant: 2 }, 3);
  });

  it('relit puis reecrit sur la revision a jour quand une autre ecriture a gagne la course', async () => {
    sessions.findById
      .mockResolvedValueOnce(
        buildSessionRecord({ teacherId: TEACHER_ID, revision: 3 }),
      )
      .mockResolvedValue(
        buildSessionRecord({ teacherId: TEACHER_ID, revision: 4 }),
      );
    update.mockRejectedValueOnce(new RevisionDeSeanceObsoleteError(SESSION));

    await ecrireSurLaRevisionLue(sessions, ACCES, ECRITURE);

    expect(update).toHaveBeenLastCalledWith(SESSION, { ecranCourant: 2 }, 4);
  });

  it('abandonne en conflit apres cinq tentatives perdues', async () => {
    update.mockRejectedValue(new RevisionDeSeanceObsoleteError(SESSION));

    const refus = ecrireSurLaRevisionLue(sessions, ACCES, ECRITURE);

    await expect(refus).rejects.toThrow(RevisionDeSeanceObsoleteError);
    await expect(refus).rejects.toThrow(
      `Le pilotage de la séance ${SESSION} a changé à chaque relecture : la commande n’est pas passée, réessaie.`,
    );
    expect(update).toHaveBeenCalledTimes(5);
  });

  it('laisse passer sans relance une erreur qui n est pas un conflit de revision', async () => {
    const panne = new Error('base indisponible');
    update.mockRejectedValue(panne);

    await expect(
      ecrireSurLaRevisionLue(sessions, ACCES, ECRITURE),
    ).rejects.toBe(panne);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('refuse sans ecrire une seance terminee a la relecture', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID, etat: 'terminee' }),
    );

    await expect(
      ecrireSurLaRevisionLue(sessions, ACCES, ECRITURE),
    ).rejects.toThrow(SessionClosedError);
    expect(update).not.toHaveBeenCalled();
  });
});
