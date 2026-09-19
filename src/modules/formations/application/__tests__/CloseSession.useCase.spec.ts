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
  createMockFormationMailer,
  createMockIncidentsRepo,
  createMockParticipantsRepo,
  createMockScoresRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
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
const REVIEW_SECRET_VALIDE = 'a'.repeat(32);
const TEACHER_NOTIFICATION_EMAIL = 'notifications-formateur@example.com';
const ORIGINAL_REVIEW_TOKEN_SECRET = process.env.FORMATION_REVIEW_TOKEN_SECRET;
const ORIGINAL_TEACHER_NOTIFICATION_TO =
  process.env.FORMATION_TEACHER_NOTIFICATION_TO;

describe('CloseSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let mailer: ReturnType<typeof createMockFormationMailer>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let scores: ReturnType<typeof createMockScoresRepo>;
  let sut: CloseSessionUseCase;

  beforeEach(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = REVIEW_SECRET_VALIDE;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = TEACHER_NOTIFICATION_EMAIL;
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID }),
    );
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    incidents = createMockIncidentsRepo();
    mailer = createMockFormationMailer();
    cache = createMockSessionStateCache();
    scores = createMockScoresRepo();
    sut = new CloseSessionUseCase(
      sessions,
      new GetSessionResultsUseCase(
        sessions,
        participants,
        answers,
        incidents,
        creerCatalogueDeTest(COURS),
      ),
      scores,
      mailer,
      cache,
    );
  });

  afterAll(() => {
    if (ORIGINAL_REVIEW_TOKEN_SECRET === undefined) {
      delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    } else {
      process.env.FORMATION_REVIEW_TOKEN_SECRET = ORIGINAL_REVIEW_TOKEN_SECRET;
    }
  });

  afterEach(() => {
    if (ORIGINAL_TEACHER_NOTIFICATION_TO === undefined) {
      delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
    } else {
      process.env.FORMATION_TEACHER_NOTIFICATION_TO =
        ORIGINAL_TEACHER_NOTIFICATION_TO;
    }
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

  it('envoie une copie a chaque etudiant', async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
      buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    expect(mailer.sendCopieEtudiant).toHaveBeenCalledTimes(2);
  });

  it('construit un lien de revision individualise pour chaque etudiant', async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    const [copie] = mailer.sendCopieEtudiant.mock.calls[0];
    expect(copie.lienRevision).toContain('p1');
    expect(copie.lienRevision).toContain('session-uuid');
  });

  it('ne confie a la copie d un etudiant que ce que sa copie exige', async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
    ]);
    await sut.execute('session-uuid', TEACHER_ID);
    const [copie] = mailer.sendCopieEtudiant.mock.calls[0];
    expect(Object.keys(copie).sort((a, b) => a.localeCompare(b))).toEqual([
      'code',
      'courseSlug',
      'lienRevision',
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
    expect(rapport.conceptsFragiles).toContain('capitalisation');
  });

  describe('scores de la seance', () => {
    beforeEach(() => {
      participants.listBySession.mockResolvedValue([
        buildParticipantRecord({ id: 'p1', email: 'a@example.com' }),
        buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
      ]);
      answers.listBySession.mockResolvedValue([
        buildAnswerRecord({ participantId: 'p1' }),
      ]);
    });

    it('enregistre a la cloture la note et la completion de chaque participant', async () => {
      await sut.execute('session-uuid', TEACHER_ID);

      expect(scores.saveIndividuals).toHaveBeenCalledWith([
        {
          sessionId: 'session-uuid',
          participantId: 'p1',
          note: 20,
          completion: 1,
        },
        {
          sessionId: 'session-uuid',
          participantId: 'p2',
          note: 0,
          completion: 0,
        },
      ]);
    });

    it('enregistre a la cloture les statistiques de la seance', async () => {
      await sut.execute('session-uuid', TEACHER_ID);

      expect(scores.saveSession).toHaveBeenCalledWith({
        sessionId: 'session-uuid',
        moyenne: 10,
        mediane: 10,
        dispersion: 10,
        tauxParticipation: 0.5,
        tauxReussite: 1,
        questionsProblemes: [],
      });
    });
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
    expect(scores.saveIndividuals).not.toHaveBeenCalled();
    expect(scores.saveSession).not.toHaveBeenCalled();
    expect(mailer.sendSyntheseFormateur).not.toHaveBeenCalled();
    expect(mailer.sendCopieEtudiant).not.toHaveBeenCalled();
  });

  it('n interrompt pas la cloture si un mail echoue', async () => {
    mailer.sendCopieEtudiant.mockRejectedValue(new Error('smtp indisponible'));
    await expect(
      sut.execute('session-uuid', TEACHER_ID),
    ).resolves.toBeUndefined();
    expect(sessions.update).toHaveBeenCalled();
  });

  it('cloture tout de meme mais ne produit aucun jeton si le secret de revision est absent', async () => {
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    await expect(
      sut.execute('session-uuid', TEACHER_ID),
    ).resolves.toBeUndefined();
    expect(sessions.update).toHaveBeenCalled();
    expect(mailer.sendCopieEtudiant).not.toHaveBeenCalled();
  });

  it('ne produit aucun jeton quand le secret de revision est trop court', async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = 'trop-court';
    await sut.execute('session-uuid', TEACHER_ID);
    expect(mailer.sendCopieEtudiant).not.toHaveBeenCalled();
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
        ),
        scores,
        mailer,
        cache,
      );

      await expect(cloturerSeanceRepondue(seance)).resolves.toEqual([
        expect.objectContaining({ reponse: seance.libelleAttendu }),
      ]);
    });
  });
});
