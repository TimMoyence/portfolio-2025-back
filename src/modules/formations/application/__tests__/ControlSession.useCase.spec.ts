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
import {
  buildCorrectionDeReponses,
  buildCoursDeBriques,
  buildEcranDeBrique,
} from '../../../../../test/factories/ecrans-stockes.factory';
import type { ICatalogueCours } from '../../domain/cours/ICatalogueCours.port';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { ControlSessionUseCase } from '../ControlSession.useCase';
import {
  CoursInconnuError,
  InvalidStateTransitionError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
  RevisionDeSeanceObsoleteError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';

type Commande = Parameters<ControlSessionUseCase['apply']>[2];
type ErreurAttendue = Parameters<ReturnType<typeof expect>['toThrow']>[0];

const SESSION = 'session-uuid';
const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const COURS_SLUG = buildSessionRecord().courseSlug;
const COURS = buildCoursDeTest({ slug: COURS_SLUG });
const NOMBRE_ECRANS = COURS.ecrans.length;
const REVISION_LUE = buildSessionRecord().revision;
const COURS_ABSENT = { courseSlug: 'un-cours-absent-du-catalogue' };
const RYTHME_LIBRE_3_6: Commande = {
  mode: 'libre',
  intervalle: { premier: 3, dernier: 6 },
};
const ETAYAGE_REM: Commande = { pilotage: { screenId: 'E-REM', etayage: 1 } };
const AUTRE_ECRAN_PILOTE = { 'E-AUTRE': { etayage: 2 } };

function banc(catalogue: ICatalogueCours) {
  const sessions = createMockSessionsRepo();
  const cache = createMockSessionStateCache();
  const outils = {
    sessions,
    cache,
    sut: new ControlSessionUseCase(sessions, cache, catalogue),
    piloter: (commande: Commande, teacherId = TEACHER_ID) =>
      outils.sut.apply(SESSION, teacherId, commande),
    seanceLue: (surcharges: Parameters<typeof buildSessionRecord>[0]) =>
      sessions.findById.mockResolvedValue(buildSessionRecord(surcharges)),
    changerDeCatalogue: (autre: ICatalogueCours) => {
      outils.sut = new ControlSessionUseCase(sessions, cache, autre);
    },
    attendreEcriture: (champs: object, revision = REVISION_LUE) =>
      expect(sessions.update).toHaveBeenCalledWith(SESSION, champs, revision),
    attendreEcranEcrit: async (ecran: number) => {
      await outils.piloter({ ecran });
      outils.attendreEcriture({ ecranCourant: ecran });
    },
    attendrePublication: (champs: object) =>
      expect(cache.publish).toHaveBeenCalledWith(
        SESSION,
        expect.objectContaining(champs),
      ),
    attendreSansEffet: () => {
      expect(sessions.update).not.toHaveBeenCalled();
      expect(cache.publish).not.toHaveBeenCalled();
    },
    refuseSansEffet: async (
      action: Promise<unknown>,
      erreur?: ErreurAttendue,
    ) => {
      await expect(action).rejects.toThrow(erreur);
      outils.attendreSansEffet();
    },
  };
  return outils;
}

describe('ControlSessionUseCase', () => {
  let b: ReturnType<typeof banc>;

  beforeEach(() => {
    b = banc(creerCatalogueDeTest(COURS));
  });

  it('change l ecran courant', async () => {
    await b.attendreEcranEcrit(4);
  });

  it('publie l etat dans le cache apres avoir change l ecran', async () => {
    await b.piloter({ ecran: 4 });
    b.attendrePublication({ ecranCourant: 4 });
  });

  it('reprend le nombre de participants deja en cache lors de la publication', async () => {
    b.cache.read.mockReturnValue(buildLiveSessionState({ participants: 9 }));
    await b.piloter({ ecran: 4 });
    b.attendrePublication({ participants: 9 });
  });

  it('refuse un ecran negatif', async () => {
    await expect(b.piloter({ ecran: -1 })).rejects.toThrow();
  });

  it('accepte l ecran de la derniere position du cours', async () => {
    await b.attendreEcranEcrit(NOMBRE_ECRANS - 1);
  });

  it('borne l ecran par la version du cours figee a l ouverture, pas par la derniere publiee', async () => {
    b.seanceLue({ teacherId: TEACHER_ID, courseVersion: 2 });
    b.changerDeCatalogue(
      creerCatalogueAVersions({
        [COURS_SLUG]: {
          2: COURS,
          3: buildCoursDeTest({ slug: COURS_SLUG, ecrans: [COURS.ecrans[0]] }),
        },
      }),
    );

    await b.attendreEcranEcrit(NOMBRE_ECRANS - 1);
  });

  it('refuse un ecran hors du cours sans ecrire ni publier', async () => {
    await b.refuseSansEffet(
      b.piloter({ ecran: NOMBRE_ECRANS }),
      `Écran ${NOMBRE_ECRANS} hors du cours : ${NOMBRE_ECRANS} écrans`,
    );
  });

  it('refuse de piloter un ecran quand le cours est absent du catalogue', async () => {
    b.seanceLue(COURS_ABSENT);
    await b.refuseSansEffet(b.piloter({ ecran: 2 }), CoursInconnuError);
  });

  it('refuse de piloter une session terminee', async () => {
    b.seanceLue({ etat: 'terminee' });
    await expect(b.piloter({ ecran: 2 })).rejects.toThrow();
  });

  it('refuse de changer l ecran sans etre le formateur de la session', async () => {
    await b.refuseSansEffet(
      b.piloter({ ecran: 2 }, AUTRE_TEACHER_ID),
      SessionNotOwnedError,
    );
  });

  it('bascule en rythme libre avec un intervalle', async () => {
    await b.piloter(RYTHME_LIBRE_3_6);
    b.attendreEcriture({
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 6 },
    });
  });

  it('publie l etat dans le cache apres avoir change le rythme', async () => {
    await b.piloter(RYTHME_LIBRE_3_6);
    b.attendrePublication({
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 6 },
    });
  });

  it('efface l intervalle en repassant en rythme pilote', async () => {
    await b.piloter({ mode: 'pilote' });
    b.attendreEcriture({ modeRythme: 'pilote', intervalleLibre: null });
  });

  it('refuse un intervalle libre inverse en nommant la forme attendue', async () => {
    await expect(
      b.piloter({ mode: 'libre', intervalle: { premier: 7, dernier: 3 } }),
    ).rejects.toThrow(
      new DomainValidationError(
        'Intervalle de rythme libre invalide : premier et dernier écrans entiers, positifs, le premier avant le dernier',
      ),
    );
  });

  it('accepte un intervalle libre dans les bornes du cours', async () => {
    await b.piloter({ mode: 'libre', intervalle: { premier: 2, dernier: 6 } });
    b.attendreEcriture({
      modeRythme: 'libre',
      intervalleLibre: { premier: 2, dernier: 6 },
    });
  });

  it('refuse un intervalle libre dont la borne haute deborde le cours', async () => {
    await b.refuseSansEffet(
      b.piloter({ mode: 'libre', intervalle: { premier: 2, dernier: 7 } }),
      new DomainValidationError(
        `Intervalle de rythme libre hors du cours : ${NOMBRE_ECRANS} écrans`,
      ),
    );
  });

  it('refuse de piloter un intervalle libre quand le cours est absent du catalogue', async () => {
    b.seanceLue(COURS_ABSENT);
    await b.refuseSansEffet(b.piloter(RYTHME_LIBRE_3_6), CoursInconnuError);
  });

  it('refuse de changer le rythme sans etre le formateur de la session', async () => {
    await b.refuseSansEffet(
      b.piloter({ mode: 'pilote' }, AUTRE_TEACHER_ID),
      SessionNotOwnedError,
    );
  });

  it('change l ecran et le rythme en une seule ecriture et une seule publication', async () => {
    await b.piloter({ ecran: 4, ...RYTHME_LIBRE_3_6 });
    expect(b.sessions.update).toHaveBeenCalledTimes(1);
    b.attendreEcriture({
      ecranCourant: 4,
      modeRythme: 'libre',
      intervalleLibre: { premier: 3, dernier: 6 },
    });
    expect(b.cache.publish).toHaveBeenCalledTimes(1);
  });

  it('ne bascule pas les ecrans de la classe quand le rythme demande est invalide', async () => {
    await b.refuseSansEffet(
      b.piloter({ ecran: 4, mode: 'libre' }),
      DomainValidationError,
    );
    expect(b.sessions.findById).not.toHaveBeenCalled();
  });

  it('ne change pas le rythme quand l ecran demande est invalide', async () => {
    await b.refuseSansEffet(
      b.piloter({ ecran: -1, mode: 'pilote' }),
      DomainValidationError,
    );
  });

  describe('pilotage par ecran', () => {
    const avecVoteJumele = () =>
      b.changerDeCatalogue(
        creerCatalogueDeTest(buildCoursAvecVoteJumele({ slug: COURS_SLUG })),
      );

    it('inscrit l etayage d un exemple travaille', async () => {
      await b.piloter(ETAYAGE_REM);

      b.attendreEcriture({ pilotageEcrans: { 'E-REM': { etayage: 1 } } });
    });

    it('conserve le pilotage deja enregistre des autres ecrans', async () => {
      b.seanceLue({ pilotageEcrans: AUTRE_ECRAN_PILOTE });

      await b.piloter(ETAYAGE_REM);

      b.attendreEcriture({
        pilotageEcrans: { ...AUTRE_ECRAN_PILOTE, 'E-REM': { etayage: 1 } },
      });
    });

    it('refuse un ecran absent du cours sans ecrire ni publier', async () => {
      await b.refuseSansEffet(
        b.piloter({ pilotage: { screenId: 'E-INVENTE', etayage: 1 } }),
        DomainValidationError,
      );
    });

    it('refuse un pilotage incompatible avec la brique de l ecran', async () => {
      await expect(
        b.piloter({ pilotage: { screenId: 'E-NUM', etayage: 1 } }),
      ).rejects.toThrow(PilotageIncompatibleError);
      expect(b.sessions.update).not.toHaveBeenCalled();
    });

    it('avance la phase d un vote a question jumelle', async () => {
      avecVoteJumele();

      await b.piloter({ pilotage: { screenId: 'E-VOTE', phase: 'revote' } });

      b.attendreEcriture({ pilotageEcrans: { 'E-VOTE': { phase: 'revote' } } });
    });

    it('refuse de ramener une phase en arriere', async () => {
      b.seanceLue({ pilotageEcrans: { 'E-VOTE': { phase: 'revele' } } });
      avecVoteJumele();

      await expect(
        b.piloter({ pilotage: { screenId: 'E-VOTE', phase: 'vote' } }),
      ).rejects.toThrow(PhaseNonMonotoneError);
      expect(b.sessions.update).not.toHaveBeenCalled();
    });

    it('publie la revision et le pilotage relus en base', async () => {
      b.sessions.update.mockResolvedValue(
        buildSessionRecord({
          revision: 12,
          pilotageEcrans: { 'E-REM': { etayage: 1 } },
        }),
      );

      await b.piloter(ETAYAGE_REM);

      b.attendrePublication({
        revision: 12,
        pilotage: { 'E-REM': { etayage: 1 } },
      });
    });

    it('rejoue la commande sur l etat a jour quand une autre a gagne la course', async () => {
      b.sessions.findById
        .mockResolvedValueOnce(buildSessionRecord({ revision: 4 }))
        .mockResolvedValue(
          buildSessionRecord({
            revision: 5,
            pilotageEcrans: AUTRE_ECRAN_PILOTE,
          }),
        );
      b.sessions.update.mockRejectedValueOnce(
        new RevisionDeSeanceObsoleteError(SESSION),
      );

      await b.piloter(ETAYAGE_REM);

      expect(b.sessions.update).toHaveBeenNthCalledWith(
        1,
        SESSION,
        { pilotageEcrans: { 'E-REM': { etayage: 1 } } },
        4,
      );
      expect(b.sessions.update).toHaveBeenNthCalledWith(
        2,
        SESSION,
        { pilotageEcrans: { ...AUTRE_ECRAN_PILOTE, 'E-REM': { etayage: 1 } } },
        5,
      );
      expect(b.cache.publish).toHaveBeenCalledTimes(1);
    });

    it('abandonne apres cinq courses perdues plutot que d ecraser un etat qu il n a pas lu', async () => {
      b.sessions.update.mockRejectedValue(
        new RevisionDeSeanceObsoleteError(SESSION),
      );

      await expect(b.piloter(ETAYAGE_REM)).rejects.toThrow(
        RevisionDeSeanceObsoleteError,
      );
      expect(b.sessions.update).toHaveBeenCalledTimes(5);
      expect(b.cache.publish).not.toHaveBeenCalled();
    });
  });

  describe('demarrage', () => {
    const demarrer = (teacherId = TEACHER_ID) =>
      b.sut.start(SESSION, teacherId);

    it('demarre une session en attente', async () => {
      b.seanceLue({ etat: 'attente' });
      await demarrer();
      expect(b.sessions.update).toHaveBeenCalledWith(SESSION, {
        etat: 'en_cours',
      });
    });

    it('publie l etat dans le cache apres avoir demarre la session', async () => {
      b.seanceLue({ etat: 'attente' });
      await demarrer();
      b.attendrePublication({ etat: 'en_cours' });
    });

    it('refuse de demarrer une session sans en etre le formateur', async () => {
      b.seanceLue({ etat: 'attente' });
      await b.refuseSansEffet(demarrer(AUTRE_TEACHER_ID), SessionNotOwnedError);
    });

    it('refuse de redemarrer une session deja en cours', async () => {
      await b.refuseSansEffet(demarrer(), InvalidStateTransitionError);
    });
  });
});

describe('ControlSessionUseCase — révélation par l écran de correction (SEC-1)', () => {
  const ATELIER = buildEcranDeBrique('questionnaire', {
    screenId: 'B2-01-A2-03-ATELIER-1',
  });
  const COURS_CORRIGE = lireCoursStocke(
    buildCoursDeBriques(
      [
        buildEcranDeBrique('fp-quote'),
        ATELIER,
        buildCorrectionDeReponses(ATELIER.screenId),
      ],
      { slug: COURS_SLUG },
    ),
  );
  const REVELATION = { [ATELIER.screenId]: { revele: true } };
  let b: ReturnType<typeof banc>;

  beforeEach(() => {
    b = banc(creerCatalogueDeTest(COURS_CORRIGE));
  });

  it('révèle la source quand le pilote projette sa correction', async () => {
    await b.piloter({ ecran: 2 });

    b.attendreEcriture({ ecranCourant: 2, pilotageEcrans: REVELATION });
  });

  it('ne révèle rien tant que la correction n est pas atteinte', async () => {
    await b.attendreEcranEcrit(1);
  });

  it('révèle au passage en rythme pilote au-delà de la correction', async () => {
    b.seanceLue({
      modeRythme: 'libre',
      ecranCourant: 2,
      intervalleLibre: { premier: 0, dernier: 2 },
    });

    await b.piloter({ mode: 'pilote' });

    b.attendreEcriture(
      expect.objectContaining({
        modeRythme: 'pilote',
        pilotageEcrans: REVELATION,
      }) as object,
    );
  });

  it('ne révèle rien en rythme libre', async () => {
    b.seanceLue({
      modeRythme: 'libre',
      intervalleLibre: { premier: 0, dernier: 1 },
    });

    await b.attendreEcranEcrit(2);
  });
});
