/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildParticipantRecord,
  buildSessionRecord,
  buildVoteBareme,
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { libelleDeConfusion } from '../../domain/cours/banque/confusions';
import { NE_SAIT_PAS } from '../../domain/GradingCore';
import {
  AnswerAlreadySubmittedError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotStartedError,
} from '../../domain/errors/FormationErrors';
import { SubmitAnswerUseCase } from '../SubmitAnswer.useCase';

describe('SubmitAnswerUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: SubmitAnswerUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-CAP-03',
    valeur: 1338.23,
    dureeMs: 42000,
  };

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    mastery = createMockMasteryRepo();
    cache = createMockSessionStateCache();
    sut = new SubmitAnswerUseCase(
      sessions,
      participants,
      answers,
      mastery,
      cache,
    );
  });

  it('signale une activite sur la session une fois la reponse enregistree', async () => {
    await sut.execute(commande);
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
    expect(answers.create.mock.invocationCallOrder[0]).toBeLessThan(
      cache.signalerActivite.mock.invocationCallOrder[0],
    );
  });

  it('ne signale aucune activite quand la reponse est refusee', async () => {
    answers.existsFor.mockResolvedValue(true);
    await expect(sut.execute(commande)).rejects.toThrow(
      AnswerAlreadySubmittedError,
    );
    expect(cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('accepte une reponse juste', async () => {
    const result = await sut.execute(commande);
    expect(result).toEqual({
      correcte: true,
      misconception: null,
      libelleConfusion: null,
    });
  });

  it('identifie la misconception d une reponse fausse et son libelle', async () => {
    const result = await sut.execute({ ...commande, valeur: 1300 });
    expect(result).toEqual({
      correcte: false,
      misconception: 'interet-simple',
      libelleConfusion: 'interet-simple',
    });
  });

  it('applique la tolerance relative du bareme', async () => {
    const result = await sut.execute({ ...commande, valeur: 1340 });
    expect(result.correcte).toBe(true);
  });

  it('corrige selon le seed du participant', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ seed: 1002 }),
    );
    const result = await sut.execute({ ...commande, valeur: 1500 });
    expect(result.correcte).toBe(true);
  });

  it('refuse une seconde soumission sur la meme question', async () => {
    answers.existsFor.mockResolvedValue(true);
    await expect(sut.execute(commande)).rejects.toThrow(
      AnswerAlreadySubmittedError,
    );
  });

  it('refuse une question absente du bareme', async () => {
    await expect(
      sut.execute({ ...commande, questionId: 'Q-INCONNU' }),
    ).rejects.toThrow(DomainValidationError);
  });

  it('refuse sans rendre la graine un participant dont le tirage manque au bareme', async () => {
    const graineAbsente = 7_654_321;
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ seed: graineAbsente }),
    );

    const refus = await sut
      .execute(commande)
      .catch((erreur: unknown) => erreur);

    expect(refus).toBeInstanceOf(DomainValidationError);
    expect((refus as DomainValidationError).message).not.toContain(
      String(graineAbsente),
    );
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('refuse une soumission sur une session terminee', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    await expect(sut.execute(commande)).rejects.toThrow(SessionClosedError);
  });

  it('refuse une soumission sur une session que le formateur n a pas demarree', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await expect(sut.execute(commande)).rejects.toThrow(SessionNotStartedError);
    expect(answers.create).not.toHaveBeenCalled();
    expect(mastery.upsert).not.toHaveBeenCalled();
  });

  it('dit a l etudiant que la seance n a pas commence plutot que de refuser sans raison', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await expect(sut.execute(commande)).rejects.toThrow(/pas encore commencé/);
  });

  it('refuse une soumission d un participant introuvable', async () => {
    participants.findById.mockResolvedValue(null);
    await expect(sut.execute(commande)).rejects.toThrow(
      ParticipantNotFoundError,
    );
  });

  it('fait monter la boite de Leitner apres une reussite', async () => {
    await sut.execute(commande);
    expect(mastery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        concept: 'capitalisation',
        boite: 2,
        succes: 1,
      }),
    );
  });

  it('redescend en premiere boite apres un echec', async () => {
    mastery.findByStudentKey.mockResolvedValue([
      {
        studentKey: '11111111-1111-4111-8111-111111111111',
        concept: 'capitalisation',
        boite: 3,
        derniereVue: new Date('2026-09-01T08:00:00.000Z'),
        succes: 4,
        echecs: 0,
      },
    ]);
    await sut.execute({ ...commande, valeur: 1300 });
    expect(mastery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ boite: 1, echecs: 1 }),
    );
  });

  it('enregistre la duree de reponse', async () => {
    await sut.execute(commande);
    expect(answers.create).toHaveBeenCalledWith(
      expect.objectContaining({ dureeMs: 42000 }),
    );
  });

  it('refuse une valeur hors des options connues sur une question de vote', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        bareme: buildVoteBareme([
          { valeur: 'a', misconception: 'interet-simple' },
        ]),
      }),
    );
    await expect(
      sut.execute({ ...commande, valeur: '<img src=x onerror=alert(1)>' }),
    ).rejects.toThrow(DomainValidationError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('accepte je ne sais pas sur une question de vote', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ bareme: buildVoteBareme() }),
    );
    const result = await sut.execute({ ...commande, valeur: NE_SAIT_PAS });
    expect(result.correcte).toBe(false);
  });

  it('traduit une misconception connue de la banque par son libelle humain', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        bareme: buildVoteBareme([
          { valeur: 'a', misconception: 'base-arrivee' },
        ]),
      }),
    );
    const result = await sut.execute({ ...commande, valeur: 'a' });
    expect(result.libelleConfusion).toBe(libelleDeConfusion('base-arrivee'));
  });
});
