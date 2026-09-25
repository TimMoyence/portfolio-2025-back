/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecDefi,
  DEFI_DE_TEST,
  monterParticipationSurLeDernierEcran,
  STRATEGIES_REVELEES_DU_DEFI,
} from '../../../../../test/factories/cours.factory';
import {
  buildFreeResponseRecord,
  buildSessionRecord,
  createMockFreeResponsesRepo,
} from '../../../../../test/factories/formation.factory';
import {
  verifierContratDeParticipation,
  verifierGardesDeParticipant,
} from '../../../../../test/helpers/gardes-de-seance';
import {
  BlankFieldError,
  DefiInconnuError,
  DefiSansTentativeError,
  PhaseFermeeError,
} from '../../domain/errors/FormationErrors';
import { DefisUseCase } from '../Defis.useCase';

const COURS = buildCoursAvecDefi();
const ECRAN_DU_DEFI = 'E-DEFI';

describe('DefisUseCase', () => {
  let depots: ReturnType<typeof monterParticipationSurLeDernierEcran>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let sut: DefisUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    defiId: DEFI_DE_TEST,
    texte: '  Je lis l’origine de l’axe.  ',
    dureeMs: 120000,
  };

  const reveler = () =>
    depots.sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: COURS.ecrans.length - 1,
        pilotageEcrans: { [ECRAN_DU_DEFI]: { revele: true } },
      }),
    );

  const lireStrategies = () =>
    sut.strategies('session-uuid', 'participant-uuid', DEFI_DE_TEST);

  const strategiesApresTentative = () => {
    freeResponses.trouverParActivite.mockResolvedValue(
      buildFreeResponseRecord({ activityId: DEFI_DE_TEST }),
    );
    return lireStrategies();
  };

  beforeEach(() => {
    depots = monterParticipationSurLeDernierEcran(COURS);
    freeResponses = createMockFreeResponsesRepo();
    sut = new DefisUseCase(depots.participation, freeResponses);
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

  it('SEC-4 · refuse une tentative une fois le defi revele, sans rien ecrire', async () => {
    reveler();

    await expect(sut.tenter(commande)).rejects.toThrow(PhaseFermeeError);
    expect(freeResponses.enregistrerTentativeDeDefi).not.toHaveBeenCalled();
  });

  it('ajoute la justesse une fois la revelation pilotee', async () => {
    reveler();

    const rendu = await strategiesApresTentative();

    expect(rendu.strategies).toEqual(STRATEGIES_REVELEES_DU_DEFI);
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

  verifierContratDeParticipation(() => ({
    ...depots,
    executer: () => sut.tenter(commande),
    effetsInterdits: () => [freeResponses.enregistrerTentativeDeDefi],
  }));

  it('refuse de servir les strategies sans tentative du participant', async () => {
    await expect(lireStrategies()).rejects.toThrow(DefiSansTentativeError);
  });

  it('resert les strategies au participant qui a deja tente', async () => {
    const rendu = await strategiesApresTentative();

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

  describe('corrige du defi deja revele', () => {
    beforeEach(() => {
      reveler();
    });

    verifierGardesDeParticipant(() => ({
      participants: depots.participants,
      executer: lireStrategies,
      effetsInterdits: () => [freeResponses.trouverParActivite],
    }));
  });
});
