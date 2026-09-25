/* eslint-disable @typescript-eslint/unbound-method */
import { LessThan, type Repository } from 'typeorm';
import {
  buildCreateAnswerInput,
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import { verifierPanneDEcritureTransmise } from '../../../../test/helpers/pannes-d-ecriture';
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
  let update: jest.Mock;
  let count: jest.Mock;
  let sut: AnswersRepositoryTypeORM;

  const input = buildCreateAnswerInput();

  beforeEach(() => {
    update = jest.fn();
    count = jest.fn();
    repo = {
      create: mockTypeOrmCreate(),
      save: mockTypeOrmSave({
        id: 'answer-uuid',
        soumisLe: new Date('2026-09-11T08:10:00.000Z'),
      }),
      update,
      count,
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

  verifierPanneDEcritureTransmise(() => ({
    save: repo.save,
    ecrire: () => sut.create(input),
  }));

  it('F16 · remplace la production du participant sur la même question', async () => {
    update.mockResolvedValue({ affected: 1 });

    const remplacee = await sut.remplacer(
      { ...input, score: 0.5, details: [] },
      3,
    );

    expect(remplacee).toBe(true);
    expect(update).toHaveBeenCalledWith(
      {
        participantId: 'participant-uuid',
        questionId: 'Q-CAP-03',
        soumissions: LessThan(3),
      },
      {
        valeur: 1338.23,
        correcte: true,
        misconception: null,
        score: 0.5,
        details: [],
        dureeMs: 42000,
        soumissions: expect.any(Function) as unknown,
      },
    );
    const [, modifications] = update.mock.calls[0] as [
      unknown,
      { soumissions: () => string },
    ];
    expect(modifications.soumissions()).toBe('soumissions + 1');
  });

  it('SEC-4.1 · refuse la reprise d une production qui a atteint le plafond de soumissions', async () => {
    update.mockResolvedValue({ affected: 0 });
    count.mockResolvedValue(1);

    await expect(sut.remplacer(input, 3)).resolves.toBe(false);
  });

  it('F16 · signale une reprise sans production à remplacer', async () => {
    update.mockResolvedValue({ affected: 0 });
    count.mockResolvedValue(0);

    await expect(sut.remplacer(input, 3)).rejects.toThrow(/Q-CAP-03/);
  });
});
