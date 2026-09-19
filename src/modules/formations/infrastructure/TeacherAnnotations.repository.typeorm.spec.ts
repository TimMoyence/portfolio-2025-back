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
  groupName: 'Classe entière',
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

  it('ecrit une annotation en un seul upsert sur seance, ecran et groupe puis relit la ligne', async () => {
    await expect(sut.save(ANNOTATION)).resolves.toMatchObject({
      id: 'annotation-uuid',
      teacherId: 'teacher-uuid',
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining(ANNOTATION), [
      'sessionId',
      'screenId',
      'groupName',
    ]);
    expect(findOneByOrFail).toHaveBeenCalledWith({
      sessionId: ANNOTATION.sessionId,
      screenId: ANNOTATION.screenId,
      groupName: ANNOTATION.groupName,
    });
  });

  it('ne relit que les annotations du formateur demande', async () => {
    await expect(
      sut.listBySession('session-uuid', 'teacher-uuid'),
    ).resolves.toEqual([expect.objectContaining({ note: 'Relancer' })]);
    expect(find).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid', teacherId: 'teacher-uuid' },
      order: { screenId: 'ASC', groupName: 'ASC' },
    });
  });
});
