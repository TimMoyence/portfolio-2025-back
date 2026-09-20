/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecDefi,
  creerCatalogueDeTest,
  DEFI_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  buildFreeResponseRecord,
  buildSessionRecord,
  createMockFreeResponsesRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  BlankFieldError,
  DefiInconnuError,
  DefiSansTentativeError,
  EcranNonServiError,
  SessionClosedError,
} from '../../domain/errors/FormationErrors';
import { DefisUseCase } from '../Defis.useCase';

const COURS = buildCoursAvecDefi();
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const ECRAN_DU_DEFI = 'E-DEFI';

describe('DefisUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: DefisUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    defiId: DEFI_DE_TEST,
    texte: '  Je lis l’origine de l’axe.  ',
    dureeMs: 120000,
  };

  const seance = (pilotage: Record<string, { revele: boolean }> = {}) =>
    buildSessionRecord({
      courseSlug: COURS.slug,
      ecranCourant: DERNIER_ECRAN,
      pilotageEcrans: pilotage,
    });

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(seance());
    freeResponses = createMockFreeResponsesRepo();
    cache = createMockSessionStateCache();
    sut = new DefisUseCase(
      sessions,
      freeResponses,
      cache,
      creerCatalogueDeTest(COURS),
    );
  });

  it('enregistre la tentative sans blancs superflus et fige la premiere', async () => {
    await sut.tenter(commande);

    expect(freeResponses.enregistrerTentativeDeDefi).toHaveBeenCalledWith({
      sessionId: 'session-uuid',
      participantId: 'participant-uuid',
      screenId: ECRAN_DU_DEFI,
      activityId: DEFI_DE_TEST,
      response: 'Je lis l’origine de l’axe.',
      dureeMs: 120000,
    });
  });

  it('rend les strategies sans leur justesse avant la revelation', async () => {
    const rendu = await sut.tenter(commande);

    expect(rendu.strategies).toEqual([
      { id: 'axe', libelle: expect.any(String) },
      { id: 'couleur', libelle: expect.any(String) },
    ]);
  });

  it('ajoute la justesse une fois la revelation pilotee', async () => {
    sessions.findById.mockResolvedValue(
      seance({ [ECRAN_DU_DEFI]: { revele: true } }),
    );

    const rendu = await sut.tenter(commande);

    expect(rendu.strategies).toEqual([
      { id: 'axe', libelle: expect.any(String), fausse: false },
      { id: 'couleur', libelle: expect.any(String), fausse: true },
    ]);
  });

  it('refuse une tentative vide avant toute ecriture', async () => {
    await expect(sut.tenter({ ...commande, texte: '   ' })).rejects.toThrow(
      BlankFieldError,
    );
    expect(freeResponses.enregistrerTentativeDeDefi).not.toHaveBeenCalled();
  });

  it('refuse un defi absent du cours', async () => {
    await expect(
      sut.tenter({ ...commande, defiId: 'defi-invente' }),
    ).rejects.toThrow(DefiInconnuError);
  });

  it('refuse une tentative visant un ecran non projete', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, ecranCourant: 0 }),
    );

    await expect(sut.tenter(commande)).rejects.toThrow(EcranNonServiError);
  });

  it('refuse une tentative apres la cloture', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, etat: 'terminee' }),
    );

    await expect(sut.tenter(commande)).rejects.toThrow(SessionClosedError);
  });

  it('signale l activite de la seance', async () => {
    await sut.tenter(commande);

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('refuse de servir les strategies sans tentative du participant', async () => {
    await expect(
      sut.strategies('session-uuid', 'participant-uuid', DEFI_DE_TEST),
    ).rejects.toThrow(DefiSansTentativeError);
  });

  it('resert les strategies au participant qui a deja tente', async () => {
    freeResponses.trouverParActivite.mockResolvedValue(
      buildFreeResponseRecord({ activityId: DEFI_DE_TEST }),
    );

    const rendu = await sut.strategies(
      'session-uuid',
      'participant-uuid',
      DEFI_DE_TEST,
    );

    expect(rendu.strategies.map((strategie) => strategie.id)).toEqual([
      'axe',
      'couleur',
    ]);
    expect(rendu.strategies[0]).not.toHaveProperty('fausse');
  });

  it('lit les strategies du participant qui a tente, pas celles d un autre', async () => {
    freeResponses.trouverParActivite.mockResolvedValue(null);

    await expect(
      sut.strategies('session-uuid', 'autre-participant', DEFI_DE_TEST),
    ).rejects.toThrow(DefiSansTentativeError);
    expect(freeResponses.trouverParActivite).toHaveBeenCalledWith(
      'autre-participant',
      DEFI_DE_TEST,
    );
  });
});
