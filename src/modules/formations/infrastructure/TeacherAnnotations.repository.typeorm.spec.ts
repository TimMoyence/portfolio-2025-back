import {
  buildTeacherAnnotationEntity,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import type { FormationTeacherAnnotationEntity } from './entities/FormationTeacherAnnotation.entity';
import { TeacherAnnotationsRepositoryTypeORM } from './TeacherAnnotations.repository.typeorm';

const ANNOTATION = {
  sessionId: 'session-uuid',
  teacherId: 'teacher-uuid',
  screenId: 'B2-01-S11-REFLECTION',
  note: 'Relancer',
};

describe('TeacherAnnotationsRepositoryTypeORM', () => {
  const upsert = jest.fn();
  const findOneByOrFail = jest.fn();
  const find = jest.fn();
  const sut = new TeacherAnnotationsRepositoryTypeORM(
    mockTypeOrmRepository<FormationTeacherAnnotationEntity>({
      upsert,
      findOneByOrFail,
      find,
    }),
  );

  beforeEach(() => {
    const ligne = buildTeacherAnnotationEntity({ note: 'Relancer' });
    upsert.mockReset().mockResolvedValue(undefined);
    findOneByOrFail.mockReset().mockResolvedValue(ligne);
    find.mockReset().mockResolvedValue([ligne]);
  });

  it('ecrit une annotation par ecran en un seul upsert, sans portee de groupe, puis relit la ligne', async () => {
    await expect(sut.save(ANNOTATION)).resolves.toEqual({
      id: 'annotation-uuid',
      sessionId: 'session-uuid',
      teacherId: 'teacher-uuid',
      screenId: 'B2-01-S11-REFLECTION',
      note: 'Relancer',
      updatedAt: new Date('2026-09-11T08:25:00.000Z'),
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        ...ANNOTATION,
        updatedAt: expect.any(Date) as unknown,
      },
      ['sessionId', 'screenId'],
    );
    expect(findOneByOrFail).toHaveBeenCalledWith({
      sessionId: ANNOTATION.sessionId,
      screenId: ANNOTATION.screenId,
    });
  });

  it('ne relit que les annotations d ecran du formateur demande', async () => {
    await expect(
      sut.listBySession('session-uuid', 'teacher-uuid'),
    ).resolves.toEqual([expect.objectContaining({ note: 'Relancer' })]);
    expect(find).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-uuid',
        teacherId: 'teacher-uuid',
      },
      order: { screenId: 'ASC' },
    });
  });
});
