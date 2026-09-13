/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { SessionCodeAlreadyActiveError } from '../../domain/errors/FormationErrors';
import {
  buildBareme,
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { OpenSessionUseCase } from '../OpenSession.useCase';

const MAX_TENTATIVES_CODE = 20;

describe('OpenSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: OpenSessionUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sut = new OpenSessionUseCase(sessions);
  });

  it('ouvre une session et retourne son code', async () => {
    sessions.create.mockResolvedValue(buildSessionRecord({ code: '4271' }));
    const result = await sut.execute({
      courseSlug: 'b1-09-interets-composes',
      teacherId: 'teacher-uuid',
      bareme: buildBareme(),
    });
    expect(result.code).toBe('4271');
    expect(result.sessionId).toBe('session-uuid');
  });

  it('regenere un code tant qu il est deja pris', async () => {
    sessions.isCodeTaken
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await sut.execute({
      courseSlug: 'b1-09-interets-composes',
      teacherId: 'teacher-uuid',
      bareme: buildBareme(),
    });
    expect(sessions.isCodeTaken).toHaveBeenCalledTimes(3);
  });

  it('refuse un bareme sans tirage', async () => {
    await expect(
      sut.execute({
        courseSlug: 'b1-09-interets-composes',
        teacherId: 'teacher-uuid',
        bareme: buildBareme({ tirages: [] }),
      }),
    ).rejects.toThrow();
  });

  it('refuse un bareme dont un tirage ne couvre pas toutes les questions', async () => {
    const bareme = buildBareme({
      tirages: [{ seed: 1001, solutions: {} }],
    });
    await expect(
      sut.execute({
        courseSlug: 'b1-09-interets-composes',
        teacherId: 'teacher-uuid',
        bareme,
      }),
    ).rejects.toThrow();
  });

  it('retire un autre code quand la creation entre en conflit', async () => {
    sessions.create
      .mockRejectedValueOnce(new SessionCodeAlreadyActiveError('4271'))
      .mockResolvedValue(buildSessionRecord({ code: '5382' }));
    const result = await sut.execute({
      courseSlug: 'b1-09-interets-composes',
      teacherId: 'teacher-uuid',
      bareme: buildBareme(),
    });
    expect(result.code).toBe('5382');
    expect(sessions.create).toHaveBeenCalledTimes(2);
  });

  it('laisse remonter une erreur de creation qui n est pas un conflit de code', async () => {
    sessions.create.mockRejectedValue(new Error('panne du depot'));
    await expect(
      sut.execute({
        courseSlug: 'b1-09-interets-composes',
        teacherId: 'teacher-uuid',
        bareme: buildBareme(),
      }),
    ).rejects.toThrow('panne du depot');
    expect(sessions.create).toHaveBeenCalledTimes(1);
  });

  it('abandonne apres vingt conflits de code consecutifs', async () => {
    sessions.create.mockRejectedValue(
      new SessionCodeAlreadyActiveError('4271'),
    );
    await expect(
      sut.execute({
        courseSlug: 'b1-09-interets-composes',
        teacherId: 'teacher-uuid',
        bareme: buildBareme(),
      }),
    ).rejects.toThrow(DomainValidationError);
    expect(sessions.create).toHaveBeenCalledTimes(MAX_TENTATIVES_CODE);
  });

  it('refuse d ouvrir une session quand le code reste toujours pris', async () => {
    sessions.isCodeTaken.mockResolvedValue(true);
    await expect(
      sut.execute({
        courseSlug: 'b1-09-interets-composes',
        teacherId: 'teacher-uuid',
        bareme: buildBareme(),
      }),
    ).rejects.toThrow(DomainValidationError);
    expect(sessions.isCodeTaken).toHaveBeenCalledTimes(MAX_TENTATIVES_CODE);
  });
});
