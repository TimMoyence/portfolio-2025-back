/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildBaremeV2,
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
  EcranNonServiError,
  ParticipantNotFoundError,
  PhaseFermeeError,
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
    expect(mastery.enregistrerTentative).not.toHaveBeenCalled();
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

  it('enregistre une tentative reussie sur le concept de la question', async () => {
    await sut.execute(commande);
    expect(mastery.enregistrerTentative).toHaveBeenCalledWith(
      expect.objectContaining({
        studentKey: '11111111-1111-4111-8111-111111111111',
        concept: 'capitalisation',
        reussi: true,
      }),
    );
  });

  it('enregistre une tentative ratee sans relire la maitrise existante', async () => {
    await sut.execute({ ...commande, valeur: 1300 });
    expect(mastery.enregistrerTentative).toHaveBeenCalledWith(
      expect.objectContaining({ concept: 'capitalisation', reussi: false }),
    );
    expect(mastery.findByStudentKey).not.toHaveBeenCalled();
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

  describe('sur un barème v2', () => {
    beforeEach(() => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ bareme: buildBaremeV2() }),
      );
      participants.findById.mockResolvedValue(
        buildParticipantRecord({ seed: 11 }),
      );
    });

    it('refuse une reponse visant un ecran que le formateur n a pas projete', async () => {
      await expect(
        sut.execute({
          ...commande,
          questionId: 'b2-01-a2-part-marketplace',
          valeur: 45.478261,
        }),
      ).rejects.toThrow(EcranNonServiError);
      expect(answers.create).not.toHaveBeenCalled();
    });

    it('accepte la reponse une fois l ecran projete', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ bareme: buildBaremeV2(), ecranCourant: 13 }),
      );

      const result = await sut.execute({
        ...commande,
        questionId: 'b2-01-a2-part-marketplace',
        valeur: 45.478261,
      });

      expect(result.correcte).toBe(true);
    });

    it('corrige un vote par son identifiant stable, dans les solutions communes', async () => {
      const result = await sut.execute({
        ...commande,
        questionId: 'b2-01-a1-diagnostic',
        valeur: 'plus-25-pct-ecd953a1',
      });

      expect(result.correcte).toBe(true);
    });

    it('corrige une question numérique par l écart de la graine du participant', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ bareme: buildBaremeV2(), ecranCourant: 13 }),
      );
      participants.findById.mockResolvedValue(
        buildParticipantRecord({ seed: 12 }),
      );

      const result = await sut.execute({
        ...commande,
        questionId: 'b2-01-a2-part-marketplace',
        valeur: 12.5,
      });

      expect(result.correcte).toBe(true);
    });

    it('refuse une production, qui a sa propre route', async () => {
      await expect(
        sut.execute({
          ...commande,
          questionId: 'b2-01-a4-feuille-canaux',
          valeur: 1,
        }),
      ).rejects.toThrow(DomainValidationError);
      expect(answers.create).not.toHaveBeenCalled();
    });
  });

  describe('phases d un vote à question jumelle', () => {
    const bareme = buildBaremeV2({
      questions: [
        {
          id: 'Q-PRINCIPALE',
          type: 'vote',
          concept: 'evolutions-successives',
          noteCompte: true,
          ecranId: 'E-VOTE',
          rangEcran: 0,
          ouverture: 'principale',
        },
        {
          id: 'Q-JUMELLE',
          type: 'vote',
          concept: 'evolutions-successives',
          noteCompte: true,
          ecranId: 'E-VOTE',
          rangEcran: 0,
          ouverture: 'jumelle',
        },
      ],
      solutionsCommunes: {
        'Q-PRINCIPALE': { valeur: 'a', pieges: [] },
        'Q-JUMELLE': { valeur: 'b', pieges: [] },
      },
      tirages: [{ seed: 1001, ecarts: {} }],
    });

    const seanceEnPhase = (phase?: 'discussion' | 'revote' | 'revele') =>
      buildSessionRecord({
        bareme,
        pilotageEcrans: phase === undefined ? {} : { 'E-VOTE': { phase } },
      });

    it('accepte la principale avant toute phase pilotée', async () => {
      sessions.findById.mockResolvedValue(seanceEnPhase());

      const result = await sut.execute({
        ...commande,
        questionId: 'Q-PRINCIPALE',
        valeur: 'a',
      });

      expect(result.correcte).toBe(true);
    });

    it('refuse la jumelle avant le revote', async () => {
      sessions.findById.mockResolvedValue(seanceEnPhase());

      await expect(
        sut.execute({ ...commande, questionId: 'Q-JUMELLE', valeur: 'b' }),
      ).rejects.toThrow(PhaseFermeeError);
      expect(answers.create).not.toHaveBeenCalled();
    });

    it('ferme les deux questions pendant la discussion', async () => {
      sessions.findById.mockResolvedValue(seanceEnPhase('discussion'));

      await expect(
        sut.execute({ ...commande, questionId: 'Q-PRINCIPALE', valeur: 'a' }),
      ).rejects.toThrow(PhaseFermeeError);
    });

    it('ouvre la jumelle seule au revote', async () => {
      sessions.findById.mockResolvedValue(seanceEnPhase('revote'));

      const result = await sut.execute({
        ...commande,
        questionId: 'Q-JUMELLE',
        valeur: 'b',
      });

      expect(result.correcte).toBe(true);
      await expect(
        sut.execute({ ...commande, questionId: 'Q-PRINCIPALE', valeur: 'a' }),
      ).rejects.toThrow(PhaseFermeeError);
    });
  });
});
