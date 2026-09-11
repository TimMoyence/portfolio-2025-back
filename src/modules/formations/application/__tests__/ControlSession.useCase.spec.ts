/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSessionRecord,
  createMockSessionsRepo,
  createMockSessionStateCache,
} from '../../../../../test/factories/formation.factory';
import { ControlSessionUseCase } from '../ControlSession.useCase';
import {
  InvalidStateTransitionError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';

describe('ControlSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: ControlSessionUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    cache = createMockSessionStateCache();
    sut = new ControlSessionUseCase(sessions, cache);
  });

  it('change l ecran courant', async () => {
    await sut.setScreen('session-uuid', TEACHER_ID, 4);
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      ecranCourant: 4,
    });
  });

  it('publie l etat dans le cache apres avoir change l ecran', async () => {
    await sut.setScreen('session-uuid', TEACHER_ID, 4);
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ ecranCourant: 4 }),
    );
  });

  it('reprend le nombre de participants deja en cache lors de la publication', async () => {
    cache.read.mockReturnValue({
      etat: 'en_cours',
      modeRythme: 'pilote',
      ecranCourant: 0,
      intervalleLibre: null,
      participants: 9,
      majLe: new Date('2026-09-11T08:00:00.000Z'),
    });
    await sut.setScreen('session-uuid', TEACHER_ID, 4);
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ participants: 9 }),
    );
  });

  it('refuse un ecran negatif', async () => {
    await expect(
      sut.setScreen('session-uuid', TEACHER_ID, -1),
    ).rejects.toThrow();
  });

  it('refuse de piloter une session terminee', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    await expect(
      sut.setScreen('session-uuid', TEACHER_ID, 2),
    ).rejects.toThrow();
  });

  it('refuse de changer l ecran sans etre le formateur de la session', async () => {
    await expect(
      sut.setScreen('session-uuid', AUTRE_TEACHER_ID, 2),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('bascule en rythme libre avec un intervalle', async () => {
    await sut.setPacing('session-uuid', TEACHER_ID, 'libre', {
      premier: 3,
      dernier: 7,
    });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 7 },
    });
  });

  it('publie l etat dans le cache apres avoir change le rythme', async () => {
    await sut.setPacing('session-uuid', TEACHER_ID, 'libre', {
      premier: 3,
      dernier: 7,
    });
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({
        modeRythme: 'libre',
        intervalleLibre: { premier: 3, dernier: 7 },
      }),
    );
  });

  it('efface l intervalle en repassant en rythme pilote', async () => {
    await sut.setPacing('session-uuid', TEACHER_ID, 'pilote', null);
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      modeRythme: 'pilote',
      intervalleLibre: null,
    });
  });

  it('refuse un intervalle libre inverse', async () => {
    await expect(
      sut.setPacing('session-uuid', TEACHER_ID, 'libre', {
        premier: 7,
        dernier: 3,
      }),
    ).rejects.toThrow();
  });

  it('refuse de changer le rythme sans etre le formateur de la session', async () => {
    await expect(
      sut.setPacing('session-uuid', AUTRE_TEACHER_ID, 'pilote', null),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('demarre une session en attente', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await sut.start('session-uuid', TEACHER_ID);
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      etat: 'en_cours',
    });
  });

  it('publie l etat dans le cache apres avoir demarre la session', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await sut.start('session-uuid', TEACHER_ID);
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ etat: 'en_cours' }),
    );
  });

  it('refuse de demarrer une session sans en etre le formateur', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await expect(sut.start('session-uuid', AUTRE_TEACHER_ID)).rejects.toThrow(
      SessionNotOwnedError,
    );
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('refuse de redemarrer une session deja en cours', async () => {
    await expect(sut.start('session-uuid', TEACHER_ID)).rejects.toThrow(
      InvalidStateTransitionError,
    );
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });
});
