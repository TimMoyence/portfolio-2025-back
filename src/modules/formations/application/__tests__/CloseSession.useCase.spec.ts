/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildAnswerRecord,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockFormationMailer,
  createMockIncidentsRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionClosedError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import { CloseSessionUseCase } from '../CloseSession.useCase';

const TEACHER_ID = 'prof@example.com';
const AUTRE_TEACHER_ID = 'autre-prof@example.com';
const REVIEW_SECRET_VALIDE = 'a'.repeat(32);
const ORIGINAL_REVIEW_TOKEN_SECRET = process.env.FORMATION_REVIEW_TOKEN_SECRET;

describe('CloseSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let incidents: ReturnType<typeof createMockIncidentsRepo>;
  let mailer: ReturnType<typeof createMockFormationMailer>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: CloseSessionUseCase;

  beforeEach(() => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = REVIEW_SECRET_VALIDE;
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID }),
    );
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    incidents = createMockIncidentsRepo();
    mailer = createMockFormationMailer();
    cache = createMockSessionStateCache();
    sut = new CloseSessionUseCase(
      sessions,
      participants,
      answers,
      incidents,
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

  it('marque la session terminee', async () => {
    await sut.execute('session-uuid', TEACHER_ID);
    expect(sessions.update).toHaveBeenCalledWith(
      'session-uuid',
      expect.objectContaining({ etat: 'terminee' }),
    );
  });

  it('envoie la synthese au formateur par defaut', async () => {
    await sut.execute('session-uuid', TEACHER_ID);
    expect(mailer.sendSyntheseFormateur).toHaveBeenCalledWith(
      TEACHER_ID,
      expect.objectContaining({ code: '4271' }),
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
    const [, , lien] = mailer.sendCopieEtudiant.mock.calls[0];
    expect(lien).toContain('p1');
    expect(lien).toContain('session-uuid');
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
    expect(sessions.update).not.toHaveBeenCalled();
    expect(cache.drop).not.toHaveBeenCalled();
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
});
