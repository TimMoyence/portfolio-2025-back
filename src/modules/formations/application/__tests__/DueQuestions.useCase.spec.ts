/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import type { MasteryRecord } from '../../domain/IMastery.repository';
import type { Boite } from '../../domain/LeitnerBox';
import { DueQuestionsUseCase } from '../DueQuestions.useCase';

const SEANCE_ID = 'session-uuid';
const THEO = '11111111-1111-4111-8111-111111111111';
const LEA = '22222222-2222-4222-8222-222222222222';
const PARTICIPANT_DE_LEA = 'participant-de-lea';
const CONCEPT_DE_LEA = 'rendement-lea';
const QUESTION_DE_LEA = 'Q-LEA-09';
const MISCONCEPTION = 'taux-nominal-confondu';

const BAREME = buildBareme({
  questions: [
    {
      id: 'Q-AMO-07',
      type: 'numeric',
      concept: 'amortissement',
      noteCompte: true,
    },
    {
      id: 'Q-CAP-03',
      type: 'numeric',
      concept: 'capitalisation',
      tolerance: { type: 'relative', valeur: 0.005 },
      noteCompte: true,
    },
    {
      id: 'Q-TEG-02',
      type: 'numeric',
      concept: 'teg',
      tolerance: { type: 'absolue', valeur: 0.01 },
      noteCompte: true,
    },
    {
      id: 'Q-ACT-01',
      type: 'numeric',
      concept: 'actualisation',
      noteCompte: true,
    },
    { id: 'Q-ANN-05', type: 'numeric', concept: 'annuites', noteCompte: true },
    {
      id: QUESTION_DE_LEA,
      type: 'numeric',
      concept: CONCEPT_DE_LEA,
      noteCompte: true,
    },
  ],
  tirages: [
    {
      seed: 1001,
      solutions: {
        'Q-TEG-02': {
          valeur: 4.27,
          pieges: [{ valeur: 3.98, misconception: MISCONCEPTION }],
        },
      },
    },
  ],
});

const SEANCE = buildSessionRecord({
  bareme: BAREME,
  ouverteLe: new Date('2026-09-12T08:00:00.000Z'),
});

function maitrise(
  concept: string,
  boite: Boite,
  jour: string,
  studentKey: string = THEO,
): MasteryRecord {
  return {
    studentKey,
    concept,
    boite,
    derniereVue: new Date(`2026-${jour}T09:00:00.000Z`),
    succes: 2,
    echecs: 1,
  };
}

const BASE: readonly MasteryRecord[] = [
  maitrise('amortissement', 3, '08-25'),
  maitrise('annuites', 1, '09-01'),
  maitrise('teg', 2, '09-03'),
  maitrise('capitalisation', 3, '09-05'),
  maitrise('actualisation', 1, '09-11'),
  maitrise(CONCEPT_DE_LEA, 1, '08-01', LEA),
];

const ATTENDU_DE_THEO = [
  { questionId: 'Q-ACT-01', concept: 'actualisation', boite: 1 },
  { questionId: 'Q-ANN-05', concept: 'annuites', boite: 1 },
  { questionId: 'Q-TEG-02', concept: 'teg', boite: 2 },
  { questionId: 'Q-AMO-07', concept: 'amortissement', boite: 3 },
];

describe('DueQuestionsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let sut: DueQuestionsUseCase;

  const demander = () =>
    sut.execute({ sessionId: SEANCE_ID, participantId: 'participant-uuid' });

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    mastery = createMockMasteryRepo();
    sessions.findById.mockResolvedValue(SEANCE);
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ studentKey: THEO }),
    );
    mastery.findByStudentKey.mockImplementation((cle: string) =>
      Promise.resolve(BASE.filter((entree) => entree.studentKey === cle)),
    );
    sut = new DueQuestionsUseCase(sessions, participants, mastery);
  });

  it('rend les questions dues boite 1 puis 2 puis 3', async () => {
    const reponse = await demander();

    expect(reponse.map((question) => question.boite)).toEqual([1, 1, 2, 3]);
    expect(reponse).toEqual(ATTENDU_DE_THEO);
  });

  it('laisse de cote un concept dont l echeance n est pas atteinte', async () => {
    const reponse = await demander();

    expect(reponse.map((question) => question.concept)).not.toContain(
      'capitalisation',
    );
  });

  it('ne rend aucune question d un autre etudiant', async () => {
    const reponse = await demander();

    expect(reponse.map((question) => question.questionId)).not.toContain(
      QUESTION_DE_LEA,
    );
    expect(reponse.map((question) => question.concept)).not.toContain(
      CONCEPT_DE_LEA,
    );
    expect(mastery.findByStudentKey).toHaveBeenCalledWith(THEO);
    expect(reponse).toEqual(ATTENDU_DE_THEO);
  });

  it('ecarte une maitrise que le depot rend sans porter la cle demandee', async () => {
    mastery.findByStudentKey.mockResolvedValue(BASE);

    const reponse = await demander();

    expect(reponse.map((question) => question.questionId)).not.toContain(
      QUESTION_DE_LEA,
    );
    expect(reponse).toEqual(ATTENDU_DE_THEO);
  });

  it('refuse de servir un participant inscrit dans une autre seance', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        id: PARTICIPANT_DE_LEA,
        sessionId: 'autre-session-uuid',
        studentKey: LEA,
      }),
    );

    await expect(demander()).rejects.toThrow(ParticipantNotFoundError);
    expect(mastery.findByStudentKey).not.toHaveBeenCalled();
  });

  it('ne laisse redescendre aucune valeur de bareme', async () => {
    const reponse = await demander();

    const serialise = JSON.stringify(reponse);
    expect(serialise).not.toContain(MISCONCEPTION);
    expect(serialise).not.toContain('4.27');
    expect(serialise).not.toContain('tolerance');
    expect(serialise).not.toContain('0.005');
    for (const question of reponse) {
      const cles = Object.keys(question).sort((une, autre) =>
        une.localeCompare(autre),
      );
      expect(cles).toEqual(['boite', 'concept', 'questionId']);
    }
  });

  it('rend une liste vide a l etudiant sans aucune maitrise enregistree', async () => {
    mastery.findByStudentKey.mockResolvedValue([]);

    await expect(demander()).resolves.toEqual([]);
  });

  it('refuse une seance inconnue', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(demander()).rejects.toThrow(SessionNotFoundError);
  });

  it('refuse un participant introuvable', async () => {
    participants.findById.mockResolvedValue(null);

    await expect(demander()).rejects.toThrow(ParticipantNotFoundError);
  });
});
