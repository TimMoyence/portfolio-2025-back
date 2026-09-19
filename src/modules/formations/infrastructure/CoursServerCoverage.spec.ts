/* eslint-disable @typescript-eslint/unbound-method */
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import { CoursCatalogueRepositoryTypeORM } from './CoursCatalogue.repository.typeorm';
import { FormationGroupsRepositoryTypeORM } from './FormationGroups.repository.typeorm';
import { FreeResponsesRepositoryTypeORM } from './FreeResponses.repository.typeorm';
import { ScoresRepositoryTypeORM } from './Scores.repository.typeorm';
import { StreamCapacityService } from './StreamCapacity.service';
import { TeacherAnnotationsRepositoryTypeORM } from './TeacherAnnotations.repository.typeorm';
import { IncidentsRepositoryTypeORM } from './Incidents.repository.typeorm';
import { ParticipantsRepositoryTypeORM } from './Participants.repository.typeorm';
import type { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import type { FormationScreenContentEntity } from './entities/FormationScreenContent.entity';
import type { FormationScoreEntity } from './entities/FormationScore.entity';
import type { FormationGroupEntity } from './entities/FormationGroup.entity';
import type { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import type { FormationFreeResponseEntity } from './entities/FormationFreeResponse.entity';
import type { FormationTeacherAnnotationEntity } from './entities/FormationTeacherAnnotation.entity';
import type { FormationIncidentEntity } from './entities/FormationIncident.entity';
import { FormationsPresenterController } from '../interfaces/FormationsPresenter.controller';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const TEACHER_ID = 'f1e2d3c4-b5a6-4978-8899-aabbccddeeff';

function screen(
  overrides: Partial<FormationScreenContentEntity> = {},
): FormationScreenContentEntity {
  return {
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
  } as FormationScreenContentEntity;
}

function course(
  overrides: Partial<FormationCourseContentEntity> = {},
): FormationCourseContentEntity {
  return {
    id: 'course-row',
    slug: 'b2-01',
    version: 2,
    titre: 'B2',
    niveau: 'B2',
    dureeMinutes: 90,
    concepts: ['proportion'],
    ecrans: [screen()],
    createdAt: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  } as FormationCourseContentEntity;
}

describe('CoursCatalogueRepositoryTypeORM', () => {
  it('charge la version courante et transforme un quiz en question de domaine', async () => {
    const entity = course();
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(entity),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as jest.Mocked<Repository<FormationCourseContentEntity>>;
    const sut = new CoursCatalogueRepositoryTypeORM(repo);

    const courant = await sut.trouverCourant('b2-01');
    const version = await sut.trouver('b2-01', 2);

    expect(courant?.version).toBe(2);
    expect(courant?.cours.ecrans[0].question?.id).toBe('quiz-1');
    expect(courant?.cours.ecrans[0].guide).toEqual({
      objective: 'Faire émerger le raisonnement',
    });
    expect(version?.ecrans).toHaveLength(1);
    expect(query.andWhere).toHaveBeenCalledWith('course.version = :version', {
      version: 2,
    });
  });

  it('retourne null quand le catalogue ne trouve aucune version', async () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as jest.Mocked<Repository<FormationCourseContentEntity>>;
    const sut = new CoursCatalogueRepositoryTypeORM(repo);

    await expect(sut.trouver('absent')).resolves.toBeNull();
    await expect(sut.trouverCourant('absent')).resolves.toBeNull();
  });

  it('refuse un écran sans brique connue ou un cours vide', async () => {
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValueOnce(course({ ecrans: [] }))
        .mockResolvedValueOnce(
          course({ ecrans: [screen({ brique: 'unknown' })] }),
        ),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as jest.Mocked<Repository<FormationCourseContentEntity>>;
    const sut = new CoursCatalogueRepositoryTypeORM(repo);

    await expect(sut.trouver('b2-01')).rejects.toThrow('aucun écran');
    await expect(sut.trouver('b2-01')).rejects.toThrow(
      'Brique de formation inconnue',
    );
  });

  it('ignore les interactions quiz invalides et garde les interactions valides sans optionIds', async () => {
    const invalid = screen({
      proprietes: { interaction: { type: 'quiz', options: ['A'] } },
    });
    const fallback = screen({
      proprietes: {
        interaction: {
          type: 'quiz',
          id: 'quiz-2',
          question: 'Question',
          options: ['A', 'B'],
          correctIndex: 0,
        },
      },
    });
    const query = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValueOnce(course({ ecrans: [invalid] }))
        .mockResolvedValueOnce(course({ ecrans: [fallback] })),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as jest.Mocked<Repository<FormationCourseContentEntity>>;
    const sut = new CoursCatalogueRepositoryTypeORM(repo);

    await expect(sut.trouver('b2-01')).resolves.toMatchObject({
      ecrans: [{ question: undefined }],
    });
    const result = await sut.trouver('b2-01');
    expect(result?.ecrans[0].question?.generer({} as never)).toMatchObject({
      bonne: 'o1',
      bonneLibelle: 'A',
    });
  });
});

describe('formation repositories for responses, annotations, groups and scores', () => {
  const date = new Date('2026-09-11T08:00:00.000Z');

  it('sauvegarde puis relit une réponse libre', async () => {
    const row = {
      id: 'free-row',
      sessionId: SESSION_ID,
      participantId: 'participant-1',
      screenId: 'B2-01-01',
      activityId: 'reflection-1',
      response: 'Ma réponse',
      dureeMs: 1200,
      status: 'enregistre',
      submittedAt: date,
    } as FormationFreeResponseEntity;
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(row),
      find: jest.fn().mockResolvedValue([row]),
    } as unknown as jest.Mocked<Repository<FormationFreeResponseEntity>>;
    const sut = new FreeResponsesRepositoryTypeORM(repo);

    const saved = await sut.save({
      sessionId: SESSION_ID,
      participantId: 'participant-1',
      screenId: 'B2-01-01',
      activityId: 'reflection-1',
      response: 'Ma réponse',
      dureeMs: 1200,
    });
    const listed = await sut.listBySession(SESSION_ID);

    expect(saved).toMatchObject({ id: 'free-row', status: 'enregistre' });
    expect(listed).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { sessionId: SESSION_ID },
      order: { submittedAt: 'ASC' },
    });
  });

  it('met à jour une annotation et filtre les postes par formateur', async () => {
    const row = {
      id: 'annotation-row',
      sessionId: SESSION_ID,
      teacherId: TEACHER_ID,
      screenId: 'B2-01-01',
      groupName: 'Classe entière',
      note: 'Relancer',
      updatedAt: date,
    } as FormationTeacherAnnotationEntity;
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(row),
      find: jest.fn().mockResolvedValue([row]),
    } as unknown as jest.Mocked<Repository<FormationTeacherAnnotationEntity>>;
    const sut = new TeacherAnnotationsRepositoryTypeORM(repo);

    await expect(
      sut.save({
        sessionId: SESSION_ID,
        teacherId: TEACHER_ID,
        screenId: 'B2-01-01',
        groupName: 'Classe entière',
        note: 'Relancer',
      }),
    ).resolves.toMatchObject({ teacherId: TEACHER_ID });
    await expect(sut.listBySession(SESSION_ID, TEACHER_ID)).resolves.toEqual([
      expect.objectContaining({ note: 'Relancer' }),
    ]);
  });

  it('gère la création, le renommage, le tri et l affectation des groupes', async () => {
    const group = {
      id: 'group-1',
      sessionId: SESSION_ID,
      name: 'A',
      createdAt: date,
      updatedAt: date,
    } as FormationGroupEntity;
    const participant = {
      id: 'participant-1',
      sessionId: SESSION_ID,
      groupId: null,
    } as FormationParticipantEntity;
    const groups = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(group),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue(group),
      find: jest.fn().mockResolvedValue([group]),
    } as unknown as jest.Mocked<Repository<FormationGroupEntity>>;
    const participants = {
      update: jest.fn().mockImplementation((_where, patch) => {
        Object.assign(participant, patch);
        return Promise.resolve({ affected: 1 });
      }),
    } as unknown as jest.Mocked<Repository<FormationParticipantEntity>>;
    const sut = new FormationGroupsRepositoryTypeORM(groups, participants);

    await expect(sut.create(SESSION_ID, 'A')).resolves.toMatchObject({
      id: 'group-1',
    });
    await expect(sut.rename(SESSION_ID, 'group-1', 'B')).resolves.toMatchObject(
      {
        name: 'A',
      },
    );
    await expect(sut.listBySession(SESSION_ID)).resolves.toHaveLength(1);
    await expect(
      sut.assignParticipant(SESSION_ID, 'participant-1', 'group-1'),
    ).resolves.toBeUndefined();
    await expect(
      sut.assignParticipant(SESSION_ID, 'participant-1', null),
    ).resolves.toBeUndefined();
    expect(participant.groupId).toBeNull();
  });

  it('refuse un groupe ou un participant qui n appartient pas à la séance', async () => {
    const groups = {
      update: jest.fn().mockResolvedValue({ affected: 0 }),
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<Repository<FormationGroupEntity>>;
    const participants = {
      update: jest.fn().mockResolvedValue({ affected: 0 }),
    } as unknown as jest.Mocked<Repository<FormationParticipantEntity>>;
    const sut = new FormationGroupsRepositoryTypeORM(groups, participants);

    await expect(sut.rename(SESSION_ID, 'missing', 'B')).rejects.toThrow(
      'Groupe introuvable',
    );
    await expect(
      sut.assignParticipant(SESSION_ID, 'participant-1', 'missing'),
    ).rejects.toThrow('Groupe introuvable');
    groups.findOne.mockResolvedValue({ id: 'group-1' } as FormationGroupEntity);
    await expect(
      sut.assignParticipant(SESSION_ID, 'participant-1', 'group-1'),
    ).rejects.toThrow('Participant introuvable');
  });

  it('persiste en une seule requete atomique les scores individuels, completion comprise', async () => {
    const repo = {
      upsert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<FormationScoreEntity>>;
    const sut = new ScoresRepositoryTypeORM(repo);

    await sut.saveIndividuals([
      {
        sessionId: SESSION_ID,
        participantId: 'participant-1',
        note: 9,
        completion: 0.45,
      },
    ]);
    await sut.saveIndividuals([]);

    expect(repo.upsert).toHaveBeenCalledTimes(1);
    expect(repo.upsert).toHaveBeenCalledWith(
      [
        {
          sessionId: SESSION_ID,
          participantId: 'participant-1',
          kind: 'individual',
          score: 9,
          percentage: 0.45,
          metrics: {},
        },
      ],
      ['sessionId', 'participantId', 'kind'],
    );
  });

  it('persiste le score de seance sur l index unique partiel des lignes sans participant', async () => {
    const repo = {
      upsert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<FormationScoreEntity>>;
    const sut = new ScoresRepositoryTypeORM(repo);

    await sut.saveSession({
      sessionId: SESSION_ID,
      moyenne: 8,
      mediane: 8,
      dispersion: 1.5,
      tauxParticipation: 0.9,
      tauxReussite: 0.8,
      questionsProblemes: ['Q1'],
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      {
        sessionId: SESSION_ID,
        participantId: null,
        kind: 'session',
        score: 8,
        percentage: 0.8,
        metrics: {
          mediane: 8,
          dispersion: 1.5,
          tauxParticipation: 0.9,
          questionsProblemes: ['Q1'],
        },
      },
      {
        conflictPaths: ['sessionId', 'kind'],
        indexPredicate: '"participant_id" IS NULL',
      },
    );
  });
});

describe('StreamCapacityService sans Redis', () => {
  it('désactive proprement le plafond lorsqu aucune configuration Redis n est fournie', async () => {
    const previous = {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    };
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    const sut = new StreamCapacityService();

    await expect(
      sut.acquire({ places: [{ key: 'session', limit: 1 }] }),
    ).resolves.toBeNull();
    await expect(
      sut.refresh({ token: 'token', keys: ['key'] }),
    ).resolves.toBeUndefined();
    await expect(
      sut.release({ token: 'token', keys: ['key'] }),
    ).resolves.toBeUndefined();
    await expect(sut.onModuleDestroy()).resolves.toBeUndefined();
    if (previous.url === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previous.url;
    if (previous.host === undefined) delete process.env.REDIS_HOST;
    else process.env.REDIS_HOST = previous.host;
    if (previous.port === undefined) delete process.env.REDIS_PORT;
    else process.env.REDIS_PORT = previous.port;
  });
});

describe('incidents et participants repositories', () => {
  it('ignore un lot d incidents vide et mappe les incidents persistés', async () => {
    const row = {
      id: 'incident-1',
      sessionId: SESSION_ID,
      participantId: 'participant-1',
      type: 'tab_hidden',
      contexte: null,
      horodatage: new Date('2026-09-11T08:00:00.000Z'),
    } as FormationIncidentEntity;
    const repo = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([row]),
    } as unknown as jest.Mocked<Repository<FormationIncidentEntity>>;
    const sut = new IncidentsRepositoryTypeORM(repo);

    await sut.createMany([]);
    await sut.createMany([
      {
        sessionId: SESSION_ID,
        participantId: 'participant-1',
        type: 'tab_hidden',
        contexte: null,
        horodatage: row.horodatage,
      },
    ]);
    await expect(sut.listBySession(SESSION_ID)).resolves.toEqual([
      expect.objectContaining({ id: 'incident-1', type: 'tab_hidden' }),
    ]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('gère les conflits et les lectures du participant', async () => {
    const row = {
      id: 'participant-1',
      sessionId: SESSION_ID,
      studentKey: 'student-1',
      prenom: 'Theo',
      nom: 'Martin',
      email: 'theo@example.com',
      groupId: null,
      seed: 1001,
      rejointLe: new Date('2026-09-11T08:00:00.000Z'),
      dernierPing: new Date('2026-09-11T08:00:00.000Z'),
    } as FormationParticipantEntity;
    const repo = {
      create: jest.fn((value: unknown) => value),
      save: jest.fn().mockResolvedValue(row),
      findOne: jest.fn().mockResolvedValue(row),
      find: jest.fn().mockResolvedValue([row]),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as jest.Mocked<Repository<FormationParticipantEntity>>;
    const sut = new ParticipantsRepositoryTypeORM(repo);
    const input = {
      sessionId: SESSION_ID,
      studentKey: 'student-1',
      prenom: 'Theo',
      nom: 'Martin',
      email: 'theo@example.com',
      seed: 1001,
    };

    await expect(sut.create(input)).resolves.toMatchObject({
      id: 'participant-1',
    });
    await expect(
      sut.findBySessionAndStudentKey(SESSION_ID, 'student-1'),
    ).resolves.toMatchObject({
      id: 'participant-1',
    });
    await expect(sut.findById('participant-1')).resolves.toMatchObject({
      id: 'participant-1',
    });
    await expect(sut.listBySession(SESSION_ID)).resolves.toHaveLength(1);
    await expect(sut.countBySession(SESSION_ID)).resolves.toBe(1);
    await expect(sut.listSeedsBySession(SESSION_ID)).resolves.toEqual([1001]);
    await expect(sut.touch('participant-1')).resolves.toBeUndefined();

    for (const constraint of [
      'UQ_formation_participants_session_seed',
      'UQ_formation_participants_session_key',
      'other_constraint',
    ]) {
      repo.save.mockRejectedValueOnce({ code: '23505', constraint });
      await expect(sut.create(input)).rejects.toBeDefined();
    }
    repo.findOne.mockResolvedValue(null);
    await expect(sut.findById('missing')).resolves.toBeNull();
  });
});

describe('FormationsPresenterController routes for annotations, responses and groups', () => {
  it('transmet l identité, protège la lecture et normalise les noms de groupe', async () => {
    const results = { execute: jest.fn().mockResolvedValue({}) };
    const annotations = {
      listBySession: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue({ id: 'annotation' }),
    };
    const freeResponses = {
      save: jest.fn(),
      listBySession: jest.fn().mockResolvedValue([]),
    };
    const groups = {
      listBySession: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'group' }),
      rename: jest.fn().mockResolvedValue({ id: 'group' }),
      assignParticipant: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new FormationsPresenterController(
      { execute: jest.fn() } as never,
      { start: jest.fn(), apply: jest.fn() } as never,
      { execute: jest.fn() } as never,
      results as never,
      { executeForTeacher: jest.fn() } as never,
      { execute: jest.fn() } as never,
      annotations,
      freeResponses,
      groups,
    );
    const request = {
      user: { sub: TEACHER_ID },
      once: jest.fn(),
      destroyed: false,
    } as unknown as Request;

    await expect(
      controller.getAnnotations(SESSION_ID, request),
    ).resolves.toEqual({
      annotations: [],
    });
    await expect(
      controller.saveAnnotation(
        SESSION_ID,
        { screenId: 'B2-01-01', groupName: ' G1 ', note: ' Note ' },
        request,
      ),
    ).resolves.toEqual({ id: 'annotation' });
    await expect(
      controller.getFreeResponses(SESSION_ID, request),
    ).resolves.toEqual({
      responses: [],
    });
    await expect(controller.getGroups(SESSION_ID, request)).resolves.toEqual({
      groups: [],
    });
    await expect(
      controller.createGroup(SESSION_ID, { name: ' Groupe 1 ' }, request),
    ).resolves.toEqual({ id: 'group' });
    await expect(
      controller.renameGroup(
        SESSION_ID,
        'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
        { name: ' Groupe 2 ' },
        request,
      ),
    ).resolves.toEqual({ id: 'group' });
    await controller.assignGroup(
      SESSION_ID,
      'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
      { groupId: 'b0b1c2d3-e4f5-4678-9012-abcdefabcdef' },
      request,
    );
    await controller.unassignGroup(
      SESSION_ID,
      'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
      request,
    );

    expect(results.execute).toHaveBeenCalledTimes(6);
    expect(groups.create).toHaveBeenCalledWith(SESSION_ID, 'Groupe 1');
    expect(groups.rename).toHaveBeenCalledWith(
      SESSION_ID,
      'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
      'Groupe 2',
    );
    expect(groups.assignParticipant).toHaveBeenNthCalledWith(
      1,
      SESSION_ID,
      'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
      'b0b1c2d3-e4f5-4678-9012-abcdefabcdef',
    );
    expect(groups.assignParticipant).toHaveBeenNthCalledWith(
      2,
      SESSION_ID,
      'a0b1c2d3-e4f5-4678-9012-abcdefabcdef',
      null,
    );
  });
});
