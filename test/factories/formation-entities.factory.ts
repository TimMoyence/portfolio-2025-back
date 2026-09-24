import type { ObjectLiteral, Repository } from 'typeorm';
import { FormationCourseContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { FormationFreeResponseEntity } from '../../src/modules/formations/infrastructure/entities/FormationFreeResponse.entity';
import { FormationIncidentEntity } from '../../src/modules/formations/infrastructure/entities/FormationIncident.entity';
import { FormationParticipantEntity } from '../../src/modules/formations/infrastructure/entities/FormationParticipant.entity';
import { FormationScreenContentEntity } from '../../src/modules/formations/infrastructure/entities/FormationScreenContent.entity';
import { FormationTeacherAnnotationEntity } from '../../src/modules/formations/infrastructure/entities/FormationTeacherAnnotation.entity';
import { buildCoursStocke, buildEcranStocke } from './cours-stocke.factory';
import {
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

export interface GestionnaireSimule extends MethodesSimulees {
  readonly transaction: jest.Mock;
}

export function mockTypeOrmManager(
  methodes: MethodesSimulees,
): GestionnaireSimule {
  const gestionnaire = {
    ...methodes,
    transaction: jest
      .fn()
      .mockImplementation((travail: (manager: unknown) => unknown) =>
        Promise.resolve(travail(gestionnaire)),
      ),
  };
  return gestionnaire;
}

export function mockTypeOrmRepositoryAvecManager<E extends ObjectLiteral>(
  methodes: MethodesSimulees,
  manager: GestionnaireSimule,
): Repository<E> {
  return { ...methodes, manager } as unknown as Repository<E>;
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

export type PatchSimule = Readonly<Record<string, unknown>>;

export interface UpdateBuilderSimule {
  readonly update: jest.Mock;
  readonly set: jest.Mock;
  readonly where: jest.Mock;
  readonly execute: jest.Mock;
}

export function mockTypeOrmUpdateBuilder(
  appliquer: (id: string, patch: PatchSimule) => number,
): UpdateBuilderSimule {
  let patch: PatchSimule = {};
  let identifiant = '';
  const builder: UpdateBuilderSimule = {
    update: jest.fn(),
    set: jest.fn((valeurs: PatchSimule) => {
      patch = valeurs;
      return builder;
    }),
    where: jest.fn((_condition: string, params: { id: string }) => {
      identifiant = params.id;
      return builder;
    }),
    execute: jest.fn(() =>
      Promise.resolve({ affected: appliquer(identifiant, patch) }),
    ),
  };
  builder.update.mockReturnValue(builder);
  return builder;
}

export function buildScreenContentEntity(
  overrides: Partial<FormationScreenContentEntity> = {},
): FormationScreenContentEntity {
  return Object.assign(
    new FormationScreenContentEntity(),
    {
      id: 'screen-row',
      courseId: 'course-row',
      position: 0,
      titre: null,
      diffusion: 'catalogue',
    },
    buildEcranStocke(),
    overrides,
  );
}

export function buildCourseContentEntity(
  overrides: Partial<FormationCourseContentEntity> = {},
): FormationCourseContentEntity {
  const cours = buildCoursStocke();
  return Object.assign(
    new FormationCourseContentEntity(),
    {
      id: 'course-row',
      slug: cours.slug,
      version: cours.version,
      titre: cours.titre,
      niveau: cours.niveau,
      dureeMinutes: cours.dureeMinutes,
      concepts: cours.concepts,
      remediations: {},
      medias: [],
      ecrans: [buildScreenContentEntity()],
      createdAt: new Date('2026-09-11T08:00:00.000Z'),
    },
    overrides,
  );
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
    { groupName: 'Classe entière' },
    overrides,
  );
}

export function buildParticipantEntity(
  overrides: Partial<FormationParticipantEntity> = {},
): FormationParticipantEntity {
  return Object.assign(
    new FormationParticipantEntity(),
    buildParticipantRecord(),
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
