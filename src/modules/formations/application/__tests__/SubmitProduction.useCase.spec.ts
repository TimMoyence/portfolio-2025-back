/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecProductions,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  AnswerAlreadySubmittedError,
  EcranNonServiError,
  ParticipantNotFoundError,
  PhaseFermeeError,
  ProductionVideError,
  SessionClosedError,
  SessionNotStartedError,
  TypeDeQuestionError,
} from '../../domain/errors/FormationErrors';
import { SubmitProductionUseCase } from '../SubmitProduction.useCase';

const COURS = buildCoursAvecProductions();
const DERNIER_ECRAN = COURS.ecrans.length - 1;

describe('SubmitProductionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: SubmitProductionUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-TEST-FEUILLE',
    valeur: {
      type: 'feuille' as const,
      cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
    },
    dureeMs: 600000,
  };

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: DERNIER_ECRAN,
      }),
    );
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    mastery = createMockMasteryRepo();
    cache = createMockSessionStateCache();
    sut = new SubmitProductionUseCase(
      sessions,
      participants,
      answers,
      mastery,
      cache,
      creerCatalogueDeTest(COURS),
    );
  });

  it('corrige la feuille et enregistre le score et le detail', async () => {
    const verdict = await sut.execute(commande);

    expect(verdict.correcte).toBe(true);
    expect(verdict.score).toBe(1);
    expect(answers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: 'Q-TEST-FEUILLE',
        concept: 'tableur',
        score: 1,
        details: [
          { cle: 'D2', juste: true, confusion: null },
          { cle: 'D3', juste: true, confusion: null },
        ],
      }),
    );
  });

  it('enregistre la feuille debarrassee des cellules verrouillees', async () => {
    await sut.execute({
      ...commande,
      valeur: {
        type: 'feuille',
        cellules: { ...commande.valeur.cellules, A1: 'Canal piraté' },
      },
    });

    expect(answers.create).toHaveBeenCalledWith(
      expect.objectContaining({ valeur: commande.valeur }),
    );
  });

  it('signale l activite apres l ecriture de la reponse', async () => {
    await sut.execute(commande);

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
    expect(answers.create.mock.invocationCallOrder[0]).toBeLessThan(
      cache.signalerActivite.mock.invocationCallOrder[0],
    );
  });

  it('met la maitrise du concept a jour', async () => {
    await sut.execute(commande);

    expect(mastery.enregistrerTentative).toHaveBeenCalledWith(
      expect.objectContaining({ concept: 'tableur', reussi: true }),
    );
  });

  it('traduit la confusion dominante du detail', async () => {
    const verdict = await sut.execute({
      ...commande,
      valeur: {
        type: 'feuille',
        cellules: { D2: '=(C2-B2)/B2*100', D3: '=(C3-B3)/B3' },
      },
    });

    expect(verdict.correcte).toBe(false);
    expect(verdict.libelleConfusion).not.toBeNull();
    expect(verdict.details[0]).toEqual(
      expect.objectContaining({ cle: 'D2', juste: false }),
    );
  });

  it('compte « je ne sais pas » comme une reponse de score nul', async () => {
    const verdict = await sut.execute({
      ...commande,
      valeur: { type: 'feuille', neSaitPas: true },
    });

    expect(verdict).toEqual({
      correcte: false,
      score: 0,
      details: [],
      libelleConfusion: null,
    });
    expect(answers.create).toHaveBeenCalled();
  });

  it('refuse une question qui n est pas une production du cours', async () => {
    await expect(
      sut.execute({ ...commande, questionId: 'Q-TEST-NUM' }),
    ).rejects.toThrow(TypeDeQuestionError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('refuse une production sans aucune saisie', async () => {
    await expect(
      sut.execute({
        ...commande,
        valeur: { type: 'feuille', cellules: {} },
      }),
    ).rejects.toThrow(ProductionVideError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('refuse une production visant un ecran non projete', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, ecranCourant: 0 }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(EcranNonServiError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('refuse une production dont l ecran a deja revele sa correction', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: DERNIER_ECRAN,
        pilotageEcrans: { 'E-FEUILLE': { revele: true } },
      }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(PhaseFermeeError);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('F16 · remplace une feuille déjà rendue tant que la correction n est pas ouverte', async () => {
    answers.existsFor.mockResolvedValue(true);

    await sut.execute(commande);

    expect(answers.create).not.toHaveBeenCalled();
    expect(answers.remplacer).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: 'Q-TEST-FEUILLE',
        valeur: commande.valeur,
        score: 1,
      }),
    );
    expect(mastery.enregistrerTentative).not.toHaveBeenCalled();
    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('F16 · refuse la reprise d une feuille dont l étayage a déjà été montré', async () => {
    answers.existsFor.mockResolvedValue(true);
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: DERNIER_ECRAN,
        pilotageEcrans: { 'E-FEUILLE': { etayage: 0, etayageAtteint: 1 } },
      }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(PhaseFermeeError);
    expect(answers.remplacer).not.toHaveBeenCalled();
  });

  it('refuse une seconde production sur un même classement', async () => {
    answers.existsFor.mockResolvedValue(true);

    await expect(
      sut.execute({
        ...commande,
        questionId: 'Q-TEST-CLASSEMENT',
        valeur: {
          type: 'classement',
          classement: { 'ca-2025': 'valeur', inflation: 'ambigu' },
        },
      }),
    ).rejects.toThrow(AnswerAlreadySubmittedError);
    expect(answers.create).not.toHaveBeenCalled();
    expect(answers.remplacer).not.toHaveBeenCalled();
  });

  it('refuse un participant rattache a une autre seance', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ sessionId: 'autre-session' }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(
      ParticipantNotFoundError,
    );
  });

  it.each([
    ['avant le demarrage', 'attente', SessionNotStartedError],
    ['apres la cloture', 'terminee', SessionClosedError],
  ] as const)('refuse la production %s', async (_cas, etat, erreur) => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, etat }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(erreur);
    expect(answers.create).not.toHaveBeenCalled();
  });

  it('corrige un classement et rend un verdict par carte', async () => {
    const verdict = await sut.execute({
      ...commande,
      questionId: 'Q-TEST-CLASSEMENT',
      valeur: {
        type: 'classement',
        classement: { 'ca-2025': 'valeur', inflation: 'ambigu' },
      },
    });

    expect(verdict.score).toBe(1);
    expect(verdict.details).toHaveLength(2);
  });

  it('corrige un tableau et rend un verdict par ligne', async () => {
    const verdict = await sut.execute({
      ...commande,
      questionId: 'Q-TEST-TABLEAU',
      valeur: {
        type: 'tableau',
        saisies: [
          { rang: 0, cle: 'prix', valeur: 21.6 },
          { rang: 1, cle: 'prix', valeur: 20.52 },
        ],
      },
    });

    expect(verdict.correcte).toBe(true);
    expect(verdict.details.map((detail) => detail.cle)).toEqual([
      '0:prix',
      '1:prix',
    ]);
  });
});
