/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursDeTest,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockFreeResponsesRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ActiviteInconnueError,
  BlankFieldError,
  CoursInconnuError,
  EcranNonServiError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
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

describe('SaveFreeResponseUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: SaveFreeResponseUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        etat: 'en_cours',
        courseSlug: COURS.slug,
        ecranCourant: RANG_DE_L_EXEMPLE,
      }),
    );
    freeResponses = createMockFreeResponsesRepo();
    participants = createMockParticipantsRepo();
    sut = new SaveFreeResponseUseCase(
      sessions,
      freeResponses,
      creerCatalogueDeTest(COURS),
      participants,
    );
  });

  it('enregistre la reponse du participant d une seance en cours, sans blancs superflus', async () => {
    await sut.execute(REPONSE);

    expect(freeResponses.save).toHaveBeenCalledWith({
      ...REPONSE,
      response: 'Je vérifie la base.',
    });
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

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(sut.execute(REPONSE)).rejects.toThrow(SessionNotFoundError);
  });

  it('signale un cours introuvable', async () => {
    sut = new SaveFreeResponseUseCase(
      sessions,
      freeResponses,
      creerCatalogueAVersions({}),
      participants,
    );

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
      buildSessionRecord({
        etat: 'en_cours',
        courseSlug: COURS.slug,
        ecranCourant: RANG_DE_L_EXEMPLE - 1,
      }),
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

  it('refuse la reponse libre d un participant evince', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        evinceLe: new Date('2026-09-20T09:00:00.000Z'),
      }),
    );

    await expect(sut.execute(REPONSE)).rejects.toThrow(
      ParticipantNotFoundError,
    );
    expect(freeResponses.save).not.toHaveBeenCalled();
  });
});
