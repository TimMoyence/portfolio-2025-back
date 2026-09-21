/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursAvecVoteJumele,
  buildCoursDeTest,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildLiveSessionState,
  buildSessionRecord,
  createMockSessionsRepo,
  createMockSessionStateCache,
} from '../../../../../test/factories/formation.factory';
import { ControlSessionUseCase } from '../ControlSession.useCase';
import {
  CoursInconnuError,
  InvalidStateTransitionError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
  RevisionDeSeanceObsoleteError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';

const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const COURS_SLUG = buildSessionRecord().courseSlug;
const COURS = buildCoursDeTest({ slug: COURS_SLUG });
const NOMBRE_ECRANS = COURS.ecrans.length;
const REVISION_LUE = buildSessionRecord().revision;

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
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { ecranCourant: 4 },
      REVISION_LUE,
    );
  });

  it('publie l etat dans le cache apres avoir change l ecran', async () => {
    await sut.apply('session-uuid', TEACHER_ID, { ecran: 4 });
    expect(cache.publish).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ ecranCourant: 4 }),
    );
  });

  it('reprend le nombre de participants deja en cache lors de la publication', async () => {
    cache.read.mockReturnValue(buildLiveSessionState({ participants: 9 }));
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
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { ecranCourant: dernierEcran },
      REVISION_LUE,
    );
  });

  it('borne l ecran par la version du cours figee a l ouverture, pas par la derniere publiee', async () => {
    const dernierEcran = NOMBRE_ECRANS - 1;
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID, courseVersion: 2 }),
    );
    sut = new ControlSessionUseCase(
      sessions,
      cache,
      creerCatalogueAVersions({
        [COURS_SLUG]: {
          2: COURS,
          3: buildCoursDeTest({ slug: COURS_SLUG, ecrans: [COURS.ecrans[0]] }),
        },
      }),
    );

    await sut.apply('session-uuid', TEACHER_ID, { ecran: dernierEcran });

    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { ecranCourant: dernierEcran },
      REVISION_LUE,
    );
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
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { modeRythme: 'libre', intervalleLibre: { premier: 3, dernier: 6 } },
      REVISION_LUE,
    );
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
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { modeRythme: 'pilote', intervalleLibre: null },
      REVISION_LUE,
    );
  });

  it('refuse un intervalle libre inverse en nommant la forme attendue', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, {
        mode: 'libre',
        intervalle: { premier: 7, dernier: 3 },
      }),
    ).rejects.toThrow(
      new DomainValidationError(
        'Intervalle de rythme libre invalide : premier et dernier écrans entiers, positifs, le premier avant le dernier',
      ),
    );
  });

  it('accepte un intervalle libre dans les bornes du cours', async () => {
    await sut.apply('session-uuid', TEACHER_ID, {
      mode: 'libre',
      intervalle: { premier: 2, dernier: 6 },
    });
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      { modeRythme: 'libre', intervalleLibre: { premier: 2, dernier: 6 } },
      REVISION_LUE,
    );
  });

  it('refuse un intervalle libre dont la borne haute deborde le cours', async () => {
    await expect(
      sut.apply('session-uuid', TEACHER_ID, {
        mode: 'libre',
        intervalle: { premier: 2, dernier: 7 },
      }),
    ).rejects.toThrow(
      new DomainValidationError(
        `Intervalle de rythme libre hors du cours : ${NOMBRE_ECRANS} écrans`,
      ),
    );
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
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      {
        ecranCourant: 4,
        modeRythme: 'libre',
        intervalleLibre: { premier: 3, dernier: 6 },
      },
      REVISION_LUE,
    );
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

  describe('pilotage par ecran', () => {
    it('inscrit l etayage d un exemple travaille', async () => {
      await sut.apply('session-uuid', TEACHER_ID, {
        pilotage: { screenId: 'E-REM', etayage: 1 },
      });

      expect(sessions.update).toHaveBeenCalledWith(
        'session-uuid',
        { pilotageEcrans: { 'E-REM': { etayage: 1 } } },
        REVISION_LUE,
      );
    });

    it('conserve le pilotage deja enregistre des autres ecrans', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({
          pilotageEcrans: { 'E-AUTRE': { etayage: 2 } },
        }),
      );

      await sut.apply('session-uuid', TEACHER_ID, {
        pilotage: { screenId: 'E-REM', etayage: 1 },
      });

      expect(sessions.update).toHaveBeenCalledWith(
        'session-uuid',
        {
          pilotageEcrans: {
            'E-AUTRE': { etayage: 2 },
            'E-REM': { etayage: 1 },
          },
        },
        REVISION_LUE,
      );
    });

    it('refuse un ecran absent du cours sans ecrire ni publier', async () => {
      await expect(
        sut.apply('session-uuid', TEACHER_ID, {
          pilotage: { screenId: 'E-INVENTE', etayage: 1 },
        }),
      ).rejects.toThrow(DomainValidationError);
      expect(sessions.update).not.toHaveBeenCalled();
      expect(cache.publish).not.toHaveBeenCalled();
    });

    it('refuse un pilotage incompatible avec la brique de l ecran', async () => {
      await expect(
        sut.apply('session-uuid', TEACHER_ID, {
          pilotage: { screenId: 'E-NUM', etayage: 1 },
        }),
      ).rejects.toThrow(PilotageIncompatibleError);
      expect(sessions.update).not.toHaveBeenCalled();
    });

    it('avance la phase d un vote a question jumelle', async () => {
      sut = new ControlSessionUseCase(
        sessions,
        cache,
        creerCatalogueDeTest(buildCoursAvecVoteJumele({ slug: COURS_SLUG })),
      );

      await sut.apply('session-uuid', TEACHER_ID, {
        pilotage: { screenId: 'E-VOTE', phase: 'revote' },
      });

      expect(sessions.update).toHaveBeenCalledWith(
        'session-uuid',
        { pilotageEcrans: { 'E-VOTE': { phase: 'revote' } } },
        REVISION_LUE,
      );
    });

    it('refuse de ramener une phase en arriere', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({
          pilotageEcrans: { 'E-VOTE': { phase: 'revele' } },
        }),
      );
      sut = new ControlSessionUseCase(
        sessions,
        cache,
        creerCatalogueDeTest(buildCoursAvecVoteJumele({ slug: COURS_SLUG })),
      );

      await expect(
        sut.apply('session-uuid', TEACHER_ID, {
          pilotage: { screenId: 'E-VOTE', phase: 'vote' },
        }),
      ).rejects.toThrow(PhaseNonMonotoneError);
      expect(sessions.update).not.toHaveBeenCalled();
    });

    it('publie la revision et le pilotage relus en base', async () => {
      sessions.update.mockResolvedValue(
        buildSessionRecord({
          revision: 12,
          pilotageEcrans: { 'E-REM': { etayage: 1 } },
        }),
      );

      await sut.apply('session-uuid', TEACHER_ID, {
        pilotage: { screenId: 'E-REM', etayage: 1 },
      });

      expect(cache.publish).toHaveBeenCalledWith(
        'session-uuid',
        expect.objectContaining({
          revision: 12,
          pilotage: { 'E-REM': { etayage: 1 } },
        }),
      );
    });

    it('rejoue la commande sur l etat a jour quand une autre a gagne la course', async () => {
      sessions.findById
        .mockResolvedValueOnce(buildSessionRecord({ revision: 4 }))
        .mockResolvedValue(
          buildSessionRecord({
            revision: 5,
            pilotageEcrans: { 'E-AUTRE': { etayage: 2 } },
          }),
        );
      sessions.update.mockRejectedValueOnce(
        new RevisionDeSeanceObsoleteError('session-uuid'),
      );

      await sut.apply('session-uuid', TEACHER_ID, {
        pilotage: { screenId: 'E-REM', etayage: 1 },
      });

      expect(sessions.update).toHaveBeenNthCalledWith(
        1,
        'session-uuid',
        { pilotageEcrans: { 'E-REM': { etayage: 1 } } },
        4,
      );
      expect(sessions.update).toHaveBeenNthCalledWith(
        2,
        'session-uuid',
        {
          pilotageEcrans: {
            'E-AUTRE': { etayage: 2 },
            'E-REM': { etayage: 1 },
          },
        },
        5,
      );
      expect(cache.publish).toHaveBeenCalledTimes(1);
    });

    it('abandonne apres cinq courses perdues plutot que d ecraser un etat qu il n a pas lu', async () => {
      sessions.update.mockRejectedValue(
        new RevisionDeSeanceObsoleteError('session-uuid'),
      );

      await expect(
        sut.apply('session-uuid', TEACHER_ID, {
          pilotage: { screenId: 'E-REM', etayage: 1 },
        }),
      ).rejects.toThrow(RevisionDeSeanceObsoleteError);
      expect(sessions.update).toHaveBeenCalledTimes(5);
      expect(cache.publish).not.toHaveBeenCalled();
    });
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
