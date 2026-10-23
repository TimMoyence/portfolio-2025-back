/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursDeClasse,
  buildCoursDeTest,
  buildSeanceRepondueAuRappel,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
  type SeanceRepondue,
} from '../../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockEscapeRepo,
  createMockFormationMailer,
  createMockFreeResponsesRepo,
  createMockIncidentsRepo,
  createMockPulsesRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../../test/helpers/avertissements';
import { installerVariables } from '../../../../../test/helpers/environnement';
import { verifierSeanceIntrouvable } from '../../../../../test/helpers/gardes-de-seance';
import {
  SessionClosedError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import type { RapportQuestion } from '../../domain/IFormationMailer.port';
import { CloseSessionUseCase } from '../CloseSession.useCase';
import { GetSessionResultsUseCase } from '../GetSessionResults.useCase';

const COURS = buildCoursDeTest();
const TEACHER_ID = 'teacher-uuid';
const AUTRE_TEACHER_ID = 'autre-teacher-uuid';
const TEACHER_NOTIFICATION_EMAIL = 'notifications-formateur@example.com';

describe('CloseSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let mailer: ReturnType<typeof createMockFormationMailer>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: CloseSessionUseCase;
  const avertissements = espionnerLesAvertissements();

  installerVariables(
    { FORMATION_TEACHER_NOTIFICATION_TO: TEACHER_NOTIFICATION_EMAIL },
    'chaque-test',
  );

  beforeEach(() => {
    sessions = createMockSessionsRepo({
      teacherId: TEACHER_ID,
      courseSlug: COURS.slug,
    });
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    incidents = createMockIncidentsRepo();
    mailer = createMockFormationMailer();
    cache = createMockSessionStateCache();
    sut = new CloseSessionUseCase(
      sessions,
      new GetSessionResultsUseCase(
        sessions,
        participants,
        answers,
        incidents,
        creerCatalogueDeTest(COURS),
        createMockPulsesRepo(),
        createMockEscapeRepo(),
        createMockFreeResponsesRepo(),
      ),
      mailer,
      cache,
    );
  });

  it('marque la session terminee', async () => {
    await sut.execute('session-uuid', TEACHER_ID);
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ etat: 'terminee' }),
    );
  });

  it('envoie la synthese a FORMATION_TEACHER_NOTIFICATION_TO par defaut, jamais a teacherId', async () => {
    await sut.execute('session-uuid', TEACHER_ID);
    expect(mailer.sendSyntheseFormateur).toHaveBeenCalledWith(
      TEACHER_NOTIFICATION_EMAIL,
      expect.objectContaining({ code: '4271' }),
    );
    expect(mailer.sendSyntheseFormateur).not.toHaveBeenCalledWith(
      TEACHER_ID,
      expect.anything(),
    );
  });

  it('envoie la synthese a l adresse fournie plutot qu au formateur', async () => {
    await sut.execute('session-uuid', TEACHER_ID, 'admin@example.com');
    expect(mailer.sendSyntheseFormateur).toHaveBeenCalledWith(
      'admin@example.com',
      expect.anything(),
    );
  });

  const deuxEtudiants = () =>
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
      buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
    ]);

  const cloturerMalgreLaPanne = async () => {
    await expect(
      sut.execute('session-uuid', TEACHER_ID),
    ).resolves.toBeUndefined();
    expect(sessions.update).toHaveBeenCalled();
  };

  it('envoie une copie a chaque etudiant', async () => {
    deuxEtudiants();
    await sut.execute('session-uuid', TEACHER_ID);
    expect(mailer.sendCopieEtudiant).toHaveBeenCalledTimes(2);
  });

  const copieDUnSeulEtudiant = async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    return mailer.sendCopieEtudiant.mock.calls[0][0];
  };

  it('ne confie a la copie d un etudiant que ce que sa copie exige', async () => {
    const copie = await copieDUnSeulEtudiant();
    expect(Object.keys(copie).sort((a, b) => a.localeCompare(b))).toEqual([
      'code',
      'courseSlug',
      'participant',
    ]);
  });

  it('ne laisse pas la cohorte entrer dans la copie d un seul etudiant', async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({
        id: 'p1',
        prenom: 'Theo',
        email: 'theo@example.com',
      }),
      buildParticipantRecord({
        id: 'p2',
        prenom: 'Lea',
        email: 'lea@example.com',
      }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    const [copieDeTheo] = mailer.sendCopieEtudiant.mock.calls[0];
    expect(JSON.stringify(copieDeTheo)).not.toContain('lea@example.com');
    expect(JSON.stringify(copieDeTheo)).not.toContain('Lea');
    expect(copieDeTheo.participant.email).toBe('theo@example.com');
  });

  it('calcule la completion sur les seules questions notees', async () => {
    answers.listBySession.mockResolvedValue([
      buildAnswerRecord({ participantId: 'participant-uuid' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    const rapport = mailer.sendSyntheseFormateur.mock.calls[0][1];
    expect(rapport.participants[0].completion).toBe(1);
  });

  it('remonte les concepts fragiles de la classe', async () => {
    answers.listBySession.mockResolvedValue([
      buildAnswerRecord({ correcte: false, misconception: 'interet-simple' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    const rapport = mailer.sendSyntheseFormateur.mock.calls[0][1];
    expect(rapport.conceptsFragiles).toEqual([
      expect.objectContaining({ concept: 'capitalisation' }),
    ]);
  });

  it('vide le cache d etat', async () => {
    await sut.execute('session-uuid', TEACHER_ID);
    expect(cache.drop).toHaveBeenCalledWith('session-uuid');
  });

  it('refuse de cloturer deux fois', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee', teacherId: TEACHER_ID }),
    );
    await expect(sut.execute('session-uuid', TEACHER_ID)).rejects.toThrow(
      SessionClosedError,
    );
    expect(sessions.update).not.toHaveBeenCalled();
  });

  it('refuse de cloturer sans etre le formateur de la session', async () => {
    await expect(sut.execute('session-uuid', AUTRE_TEACHER_ID)).rejects.toThrow(
      SessionNotOwnedError,
    );
    expect(participants.listBySession).not.toHaveBeenCalled();
    expect(answers.listBySession).not.toHaveBeenCalled();
    expect(incidents.listBySession).not.toHaveBeenCalled();
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.drop).not.toHaveBeenCalled();
    expect(mailer.sendSyntheseFormateur).not.toHaveBeenCalled();
    expect(mailer.sendCopieEtudiant).not.toHaveBeenCalled();
  });

  verifierSeanceIntrouvable(() => ({
    sessions,
    executer: () => sut.execute('session-uuid', TEACHER_ID),
    effetsInterdits: () => [
      sessions.update,
      cache.drop,
      mailer.sendSyntheseFormateur,
    ],
  }));

  it('n interrompt pas la cloture si un mail echoue', async () => {
    mailer.sendCopieEtudiant.mockRejectedValue(new Error('smtp indisponible'));
    await cloturerMalgreLaPanne();
  });

  it('journalise la cause d un echec d envoi de la synthese', async () => {
    mailer.sendSyntheseFormateur.mockRejectedValue(
      new Error('smtp indisponible'),
    );

    await cloturerMalgreLaPanne();

    await attendreLAvertissement(
      avertissements,
      `Envoi de la synthese formateur echoue pour ${TEACHER_NOTIFICATION_EMAIL}: smtp indisponible`,
    );
  });

  describe('libelles des copies', () => {
    const cloturerSeanceRepondue = async (
      seance: SeanceRepondue,
    ): Promise<readonly RapportQuestion[]> => {
      sessions.findById.mockResolvedValue(seance.session);
      sessions.update.mockResolvedValue({
        ...seance.session,
        etat: 'terminee',
      });
      participants.listBySession.mockResolvedValue([seance.participant]);
      answers.listBySession.mockResolvedValue([seance.reponse]);

      await sut.execute(seance.session.id, TEACHER_ID);

      return mailer.sendCopieEtudiant.mock.calls[0][0].participant.reponses;
    };

    it('envoie a l etudiant l option choisie lue dans le tirage du cours de la seance', async () => {
      const seance = buildSeanceRepondueAuRappel({ teacherId: TEACHER_ID });

      await expect(cloturerSeanceRepondue(seance)).resolves.toEqual([
        expect.objectContaining({
          questionId: 'Q-TEST-RAPPEL',
          reponse: 'plus bas qu’au départ',
        }),
      ]);
    });

    it('lit les libelles dans la version figee a l ouverture, pas dans la derniere publiee', async () => {
      const seance = buildSeanceRepondueAuRappel({
        teacherId: TEACHER_ID,
        courseVersion: 2,
      });
      sut = new CloseSessionUseCase(
        sessions,
        new GetSessionResultsUseCase(
          sessions,
          participants,
          answers,
          incidents,
          creerCatalogueAVersions({
            [COURS.slug]: {
              2: COURS,
              3: { ...buildCoursDeClasse(2), slug: COURS.slug },
            },
          }),
          createMockPulsesRepo(),
          createMockEscapeRepo(),
          createMockFreeResponsesRepo(),
        ),
        mailer,
        cache,
      );

      await expect(cloturerSeanceRepondue(seance)).resolves.toEqual([
        expect.objectContaining({ reponse: seance.libelleAttendu }),
      ]);
    });
  });
});
