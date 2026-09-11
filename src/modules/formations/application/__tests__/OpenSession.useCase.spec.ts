/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildBareme,
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { OpenSessionUseCase } from '../OpenSession.useCase';

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
});
