import type { ObjectLiteral, Repository } from 'typeorm';
import { FormationCourseContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { FormationFreeResponseEntity } from '../../src/modules/formations/infrastructure/entities/FormationFreeResponse.entity';
import { FormationGroupEntity } from '../../src/modules/formations/infrastructure/entities/FormationGroup.entity';
import { FormationIncidentEntity } from '../../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { FormationParticipantEntity } from '../../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationScreenContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationScreenContent.entity';
import { FormationTeacherAnnotationEntity } from '../../src/modules/formations/infrastructure/entities/FormationTeacherAnnotation.entity';
import {
  buildFormationGroupRecord,
  buildFreeResponseRecord,
  buildIncidentInput,
  buildParticipantRecord,
  buildTeacherAnnotationRecord,
} from './formation.factory';

type MethodesSimulees = Readonly<Record<string, jest.Mock>>;

export function mockTypeOrmRepository<E extends ObjectLiteral>(
  methodes: MethodesSimulees,
): Repository<E> {
  return methodes as unknown as Repository<E>;
}

export interface QueryBuilderSimule {
  readonly leftJoinAndSelect: jest.Mock;
  readonly where: jest.Mock;
  readonly orderBy: jest.Mock;
  readonly addOrderBy: jest.Mock;
  readonly andWhere: jest.Mock;
  readonly getOne: jest.Mock;
}

export function mockTypeOrmQueryBuilder(getOne: jest.Mock): QueryBuilderSimule {
  const chainable = () => jest.fn();
  const builder: QueryBuilderSimule = {
    leftJoinAndSelect: chainable(),
    where: chainable(),
    orderBy: chainable(),
    addOrderBy: chainable(),
    andWhere: chainable(),
    getOne,
  };
  for (const methode of [
    builder.leftJoinAndSelect,
    builder.where,
    builder.orderBy,
    builder.addOrderBy,
    builder.andWhere,
  ]) {
    methode.mockReturnValue(builder);
  }
  return builder;
}

export function buildScreenContentEntity(
  overrides: Partial<FormationScreenContentEntity> = {},
): FormationScreenContentEntity {
  return Object.assign(new FormationScreenContentEntity(), {
    id: 'screen-row',
    courseId: 'course-row',
    position: 0,
    screenId: 'B2-01-01',
    brique: 'fp-quote',
    dureeMinutes: 5,
    concepts: ['proportion'],
    notes: 'Note formateur',
    proprietes: {
      presentation: {
        version: 2,
        renderer: 'hero',
        props: { title: 'Titre', bullets: ['Point'] },
      },
      interaction: {
        type: 'quiz',
        id: 'quiz-1',
        concept: 'proportion',
        question: 'Quelle option ?',
        options: ['A', 'B', 'C'],
        optionIds: ['a', 'b', 'c'],
        correctIndex: 1,
        confusions: ['raisonnement-additif', 'unite-oubliee'],
      },
      guide: { objective: 'Faire émerger le raisonnement' },
    },
    ...overrides,
  });
}

export function buildCourseContentEntity(
  overrides: Partial<FormationCourseContentEntity> = {},
): FormationCourseContentEntity {
  return Object.assign(new FormationCourseContentEntity(), {
    id: 'course-row',
    slug: 'b2-01',
    version: 2,
    titre: 'B2',
    niveau: 'B2',
    dureeMinutes: 90,
    concepts: ['proportion'],
    ecrans: [buildScreenContentEntity()],
    createdAt: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  });
}

export function buildFreeResponseEntity(
  overrides: Partial<FormationFreeResponseEntity> = {},
): FormationFreeResponseEntity {
  return Object.assign(
    new FormationFreeResponseEntity(),
    buildFreeResponseRecord(),
    overrides,
  );
}

export function buildTeacherAnnotationEntity(
  overrides: Partial<FormationTeacherAnnotationEntity> = {},
): FormationTeacherAnnotationEntity {
  return Object.assign(
    new FormationTeacherAnnotationEntity(),
    buildTeacherAnnotationRecord(),
    overrides,
  );
}

export function buildFormationGroupEntity(
  overrides: Partial<FormationGroupEntity> = {},
): FormationGroupEntity {
  return Object.assign(
    new FormationGroupEntity(),
    buildFormationGroupRecord(),
    overrides,
  );
}

export function buildParticipantEntity(
  overrides: Partial<FormationParticipantEntity> = {},
): FormationParticipantEntity {
  return Object.assign(
    new FormationParticipantEntity(),
    buildParticipantRecord({ groupId: null }),
    overrides,
  );
}

export function buildIncidentEntity(
  overrides: Partial<FormationIncidentEntity> = {},
): FormationIncidentEntity {
  return Object.assign(
    new FormationIncidentEntity(),
    { id: 'incident-uuid', ...buildIncidentInput() },
    overrides,
  );
}
