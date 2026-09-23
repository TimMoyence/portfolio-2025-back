import type { Repository } from 'typeorm';
import {
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import { AnswerAlreadySubmittedError } from '../domain/errors/FormationErrors';
import {
  AnswersRepositoryTypeORM,
  regrouperParQuestion,
} from './Answers.repository.typeorm';
import type { FormationAnswerEntity } from './entities/FormationAnswer.entity';

describe('regrouperParQuestion', () => {
  it('agrege plusieurs lignes de la meme question en un seul total', () => {
    const resultat = regrouperParQuestion([
      { questionId: 'Q1', total: '3', correctes: '2', misconception: null },
      {
        questionId: 'Q1',
        total: '1',
        correctes: '0',
        misconception: 'interet-simple',
      },
    ]);
    expect(resultat).toEqual([
      {
        questionId: 'Q1',
        total: 4,
        correctes: 2,
        parMisconception: { 'interet-simple': 1 },
      },
    ]);
  });

  it('ne cree pas d entree dans parMisconception pour une ligne sans misconception', () => {
    const resultat = regrouperParQuestion([
      { questionId: 'Q2', total: '5', correctes: '5', misconception: null },
    ]);
    expect(resultat).toEqual([
      { questionId: 'Q2', total: 5, correctes: 5, parMisconception: {} },
    ]);
  });

  it('garde des questions distinctes separees', () => {
    const resultat = regrouperParQuestion([
      { questionId: 'Q1', total: '2', correctes: '2', misconception: null },
      { questionId: 'Q2', total: '3', correctes: '1', misconception: null },
    ]);
    expect(resultat.map((tally) => tally.questionId)).toEqual(['Q1', 'Q2']);
  });

  it('retourne une liste vide pour une session sans reponse', () => {
    expect(regrouperParQuestion([])).toEqual([]);
  });
});

describe('AnswersRepositoryTypeORM', () => {
  let repo: jest.Mocked<Repository<FormationAnswerEntity>>;
  let sut: AnswersRepositoryTypeORM;

  const input = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-CAP-03',
    concept: 'capitalisation',
    valeur: 1338.23,
    seed: 1001,
    correcte: true,
    misconception: null,
    dureeMs: 42000,
  };

  beforeEach(() => {
    repo = {
      create: mockTypeOrmCreate(),
      save: mockTypeOrmSave({
        id: 'answer-uuid',
        soumisLe: new Date('2026-09-11T08:10:00.000Z'),
      }),
    } as unknown as jest.Mocked<Repository<FormationAnswerEntity>>;
    sut = new AnswersRepositoryTypeORM(repo);
  });

  it('cree une reponse', async () => {
    const answer = await sut.create(input);
    expect(answer.id).toBe('answer-uuid');
    expect(answer.questionId).toBe('Q-CAP-03');
  });

  it('traduit la violation de UQ_formation_answers_participant_question en reponse deja soumise', async () => {
    repo.save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_formation_answers_participant_question',
    });
    await expect(sut.create(input)).rejects.toBeInstanceOf(
      AnswerAlreadySubmittedError,
    );
    await expect(sut.create(input)).rejects.toThrow(
      'Votre réponse à la question Q-CAP-03 est déjà enregistrée : passez à la suivante.',
    );
  });

  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    repo.save.mockRejectedValue(new Error('connexion perdue'));
    await expect(sut.create(input)).rejects.toThrow('connexion perdue');
  });

  it('F16 · remplace la production du participant sur la même question', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    repo.update = update;

    await sut.remplacer({ ...input, score: 0.5, details: [] });

    expect(update).toHaveBeenCalledWith(
      { participantId: 'participant-uuid', questionId: 'Q-CAP-03' },
      {
        valeur: 1338.23,
        correcte: true,
        misconception: null,
        score: 0.5,
        details: [],
        dureeMs: 42000,
      },
    );
  });

  it('F16 · signale une reprise sans production à remplacer', async () => {
    repo.update = jest.fn().mockResolvedValue({ affected: 0 });

    await expect(sut.remplacer(input)).rejects.toThrow(/Q-CAP-03/);
  });
});
