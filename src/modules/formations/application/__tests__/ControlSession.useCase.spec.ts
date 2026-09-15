/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockSessionsRepo,
  createMockSessionStateCache,
} from '../../../../../test/factories/formation.factory';
import { ControlSessionUseCase } from '../ControlSession.useCase';
import {
  CoursInconnuError,
  InvalidStateTransitionError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const COURS_SLUG = buildSessionRecord().courseSlug;
const COURS = buildCoursDeTest({ slug: COURS_SLUG });
const NOMBRE_ECRANS = COURS.ecrans.length;

describe('ControlSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: ControlSessionUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    cache = createMockSessionStateCache();
    sut = new ControlSessionUseCase(
      sessions,
      cache,
      creerCatalogueDeTest(COURS),
    );
  });

  it('change l ecran courant', async () => {
    await sut.apply('session-uuid', TEACHER_ID, { ecran: 4 });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      ecranCourant: 4,
    });
  });

  it('publie l etat dans le cache apres avoir change l ecran', async () => {
    await sut.apply('session-uuid', TEACHER_ID, { ecran: 4 });
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
    await sut.apply('session-uuid', TEACHER_ID, { ecran: 4 });
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ participants: 9 }),
    );
  });

  it('refuse un ecran negatif', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: -1 }),
    ).rejects.toThrow();
  });

  it('accepte l ecran de la derniere position du cours', async () => {
    const dernierEcran = NOMBRE_ECRANS - 1;
    await sut.apply('session-uuid', TEACHER_ID, { ecran: dernierEcran });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      ecranCourant: dernierEcran,
    });
  });

  it('refuse un ecran hors du cours sans ecrire ni publier', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: NOMBRE_ECRANS }),
    ).rejects.toThrow(
      `Écran ${NOMBRE_ECRANS} hors du cours : ${NOMBRE_ECRANS} écrans`,
    );
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('refuse de piloter un ecran quand le cours est absent du catalogue', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: 'un-cours-absent-du-catalogue' }),
    );
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: 2 }),
    ).rejects.toBeInstanceOf(CoursInconnuError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('refuse de piloter une session terminee', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: 2 }),
    ).rejects.toThrow();
  });

  it('refuse de changer l ecran sans etre le formateur de la session', async () => {
    await expect(
      sut.apply('session-uuid', AUTRE_TEACHER_ID, { ecran: 2 }),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('bascule en rythme libre avec un intervalle', async () => {
    await sut.apply('session-uuid', TEACHER_ID, {
      mode: 'libre',
      intervalle: { premier: 3, dernier: 6 },
    });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 6 },
    });
  });

  it('publie l etat dans le cache apres avoir change le rythme', async () => {
    await sut.apply('session-uuid', TEACHER_ID, {
      mode: 'libre',
      intervalle: { premier: 3, dernier: 6 },
    });
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({
        modeRythme: 'libre',
        intervalleLibre: { premier: 3, dernier: 6 },
      }),
    );
  });

  it('efface l intervalle en repassant en rythme pilote', async () => {
    await sut.apply('session-uuid', TEACHER_ID, { mode: 'pilote' });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      modeRythme: 'pilote',
      intervalleLibre: null,
    });
  });

  it('refuse un intervalle libre inverse', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, {
        mode: 'libre',
        intervalle: { premier: 7, dernier: 3 },
      }),
    ).rejects.toThrow();
  });

  it('accepte un intervalle libre dans les bornes du cours', async () => {
    await sut.apply('session-uuid', TEACHER_ID, {
      mode: 'libre',
      intervalle: { premier: 2, dernier: 6 },
    });
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      modeRythme: 'libre',
      intervalleLibre: { premier: 2, dernier: 6 },
    });
  });

  it('refuse un intervalle libre dont la borne haute deborde le cours', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, {
        mode: 'libre',
        intervalle: { premier: 2, dernier: 7 },
      }),
    ).rejects.toThrow(DomainValidationError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('refuse de piloter un intervalle libre quand le cours est absent du catalogue', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: 'un-cours-absent-du-catalogue' }),
    );
    await expect(
      sut.apply('session-uuid', TEACHER_ID, {
        mode: 'libre',
        intervalle: { premier: 2, dernier: 6 },
      }),
    ).rejects.toBeInstanceOf(CoursInconnuError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('refuse de changer le rythme sans etre le formateur de la session', async () => {
    await expect(
      sut.apply('session-uuid', AUTRE_TEACHER_ID, { mode: 'pilote' }),
    ).rejects.toThrow(SessionNotOwnedError);
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('change l ecran et le rythme en une seule ecriture et une seule publication', async () => {
    await sut.apply('session-uuid', TEACHER_ID, {
      ecran: 4,
      mode: 'libre',
      intervalle: { premier: 3, dernier: 6 },
    });
    expect(sessions.update).toHaveBeenCalledTimes(1);
    expect(sessions.update).toHaveBeenCalledWith('session-uuid', {
      ecranCourant: 4,
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 6 },
    });
    expect(cache.publish).toHaveBeenCalledTimes(1);
  });

  it('ne bascule pas les ecrans de la classe quand le rythme demande est invalide', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: 4, mode: 'libre' }),
    ).rejects.toThrow(DomainValidationError);
    expect(sessions.findById).not.toHaveBeenCalled();
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.publish).not.toHaveBeenCalled();
  });

  it('ne change pas le rythme quand l ecran demande est invalide', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, { ecran: -1, mode: 'pilote' }),
    ).rejects.toThrow(DomainValidationError);
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
