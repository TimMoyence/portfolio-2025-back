/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursDeTest,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
  creerParticipationEnSeance,
} from '../../../../../test/factories/cours.factory';
import {
  buildSessionRecord,
  createMockFreeResponsesRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
  createMockSessionStateCache,
} from '../../../../../test/factories/formation.factory';
import {
  verifierGardesDeParticipant,
  verifierSeanceIntrouvable,
  verifierSignalementDActivite,
} from '../../../../../test/helpers/gardes-de-seance';
import type { PilotageEcran } from '../../domain/contrats/pilotage';
import type { SessionRecord } from '../../domain/ISessions.repository';
import {
  ActiviteInconnueError,
  BlankFieldError,
  CoursInconnuError,
  EcranNonServiError,
  PhaseFermeeError,
  SessionClosedError,
  SessionNotStartedError,
} from '../../domain/errors/FormationErrors';
import { SaveFreeResponseUseCase } from '../SaveFreeResponse.useCase';

const REPONSE = {
  sessionId: 'session-uuid',
  participantId: 'participant-uuid',
  screenId: 'E-REM',
  activityId: 'E-REM:etape-1',
  response: '  Je vérifie la base.  ',
  dureeMs: 1400,
};

const COURS = buildCoursDeTest();
const RANG_DE_L_EXEMPLE = 5;

function seanceEnCours(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return buildSessionRecord({
    etat: 'en_cours',
    courseSlug: COURS.slug,
    ecranCourant: RANG_DE_L_EXEMPLE,
    ...overrides,
  });
}

describe('SaveFreeResponseUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: SaveFreeResponseUseCase;

  const monter = (catalogue = creerCatalogueDeTest(COURS)) =>
    new SaveFreeResponseUseCase(
      creerParticipationEnSeance({ sessions, participants, catalogue, cache }),
      freeResponses,
    );

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(seanceEnCours());
    freeResponses = createMockFreeResponsesRepo();
    participants = createMockParticipantsRepo();
    cache = createMockSessionStateCache();
    sut = monter();
  });

  it('enregistre la reponse du participant d une seance en cours, sans blancs superflus', async () => {
    await sut.execute(REPONSE);

    expect(freeResponses.save).toHaveBeenCalledWith({
      ...REPONSE,
      response: 'Je vérifie la base.',
    });
  });

  verifierSignalementDActivite(
    () => ({ cache, executer: () => sut.execute(REPONSE) }),
    'F06 · signale l activité au pupitre après l enregistrement',
  );

  it.each<[string, PilotageEcran]>([
    [
      'ferme les réponses libres d un écran révélé et ne signale rien',
      { revele: true },
    ],
    [
      'SEC-2 · reste fermé sur une étape corrigée puis masquée',
      { etayage: 0, etayageAtteint: 1 },
    ],
    [
      'RET-23 · refuse la redaction d une etape dont la correction est revelee',
      { etayage: 1 },
    ],
  ])('%s', async (_cas, pilotage) => {
    sessions.findById.mockResolvedValue(
      seanceEnCours({ pilotageEcrans: { 'E-REM': pilotage } }),
    );

    await expect(sut.execute(REPONSE)).rejects.toThrow(PhaseFermeeError);
    expect(freeResponses.save).not.toHaveBeenCalled();
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it.each([
    ['avant le demarrage de la seance', 'attente', SessionNotStartedError],
    ['apres la cloture de la seance', 'terminee', SessionClosedError],
  ] as const)('refuse la reponse %s', async (_cas, etat, erreur) => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat, courseSlug: COURS.slug }),
    );

    await expect(sut.execute(REPONSE)).rejects.toThrow(erreur);
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  it('refuse une reponse vide avant toute lecture de la seance', async () => {
    await expect(sut.execute({ ...REPONSE, response: ' \n ' })).rejects.toThrow(
      BlankFieldError,
    );
    expect(sessions.findById).not.toHaveBeenCalled();
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  verifierSeanceIntrouvable(() => ({
    sessions,
    executer: () => sut.execute(REPONSE),
    effetsInterdits: () => [freeResponses.save],
  }));

  it('signale un cours introuvable', async () => {
    sut = monter(creerCatalogueAVersions({}));

    await expect(sut.execute(REPONSE)).rejects.toThrow(CoursInconnuError);
  });

  it('refuse une activite que l ecran n admet pas', async () => {
    await expect(
      sut.execute({ ...REPONSE, activityId: 'E-REM:etape-inventee' }),
    ).rejects.toThrow(ActiviteInconnueError);
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  it('refuse une reponse visant un ecran que le formateur n a pas projete', async () => {
    sessions.findById.mockResolvedValue(
      seanceEnCours({ ecranCourant: RANG_DE_L_EXEMPLE - 1 }),
    );

    await expect(sut.execute(REPONSE)).rejects.toThrow(EcranNonServiError);
    expect(freeResponses.save).not.toHaveBeenCalled();
  });

  it('refuse une reponse visant un ecran absent du cours', async () => {
    await expect(
      sut.execute({
        ...REPONSE,
        screenId: 'E-INCONNU',
        activityId: 'E-INCONNU:etape-1',
      }),
    ).rejects.toThrow(EcranNonServiError);
  });

  it('accepte le texte argumente du billet de sortie une fois la seance terminee pour tous', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        etat: 'en_cours',
        courseSlug: COURS.slug,
        modeRythme: 'libre',
        intervalleLibre: null,
      }),
    );

    await sut.execute({
      ...REPONSE,
      screenId: 'E-EXIT',
      activityId: 'Q-TEST-EXIT',
    });

    expect(freeResponses.save).toHaveBeenCalled();
  });

  verifierGardesDeParticipant(() => ({
    participants,
    executer: () => sut.execute(REPONSE),
    effetsInterdits: () => [freeResponses.save],
  }));
});
