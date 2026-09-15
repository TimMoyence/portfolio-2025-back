import type { Piege } from '../../src/modules/formations/domain/AnswerGrading';
import type { Bareme } from '../../src/modules/formations/domain/Bareme';
import type {
  AnswerRecord,
  CreateAnswerInput,
  IAnswersRepository,
} from '../../src/modules/formations/domain/IAnswers.repository';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../../src/modules/formations/domain/IIncidents.repository';
import type { IFormationMailer } from '../../src/modules/formations/domain/IFormationMailer.port';
import type { IMasteryRepository } from '../../src/modules/formations/domain/IMastery.repository';
import type { ISessionStateCache } from '../../src/modules/formations/domain/ISessionStateCache.port';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../../src/modules/formations/domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../../src/modules/formations/domain/ISessions.repository';

export function buildBareme(overrides: Partial<Bareme> = {}): Bareme {
  return {
    version: 1,
    graineReference: 9_999_999,
    questions: [
      {
        id: 'Q-CAP-03',
        type: 'numeric',
        concept: 'capitalisation',
        tolerance: { type: 'relative', valeur: 0.005 },
        noteCompte: true,
      },
    ],
    tirages: [
      {
        seed: 1001,
        solutions: {
          'Q-CAP-03': {
            valeur: 1338.23,
            pieges: [{ valeur: 1300, misconception: 'interet-simple' }],
          },
        },
      },
      {
        seed: 1002,
        solutions: { 'Q-CAP-03': { valeur: 1500, pieges: [] } },
      },
    ],
    ...overrides,
  };
}

export function buildVoteBareme(pieges: readonly Piege[] = []): Bareme {
  return buildBareme({
    questions: [
      {
        id: 'Q-CAP-03',
        type: 'vote',
        concept: 'capitalisation',
        noteCompte: true,
      },
    ],
    tirages: [
      {
        seed: 1001,
        solutions: { 'Q-CAP-03': { valeur: 'b', pieges } },
      },
    ],
  });
}

export function buildSessionRecord(
  overrides: Partial<SessionRecord> = {},
): SessionRecord {
  return {
    id: 'session-uuid',
    courseSlug: 'b1-09-interets-composes',
    teacherId: 'teacher-uuid',
    code: '4271',
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    bareme: buildBareme(),
    ouverteLe: new Date('2026-09-11T08:00:00.000Z'),
    fermeeLe: null,
    majLe: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  };
}

export function buildParticipantRecord(
  overrides: Partial<ParticipantRecord> = {},
): ParticipantRecord {
  return {
    id: 'participant-uuid',
    sessionId: 'session-uuid',
    studentKey: '11111111-1111-4111-8111-111111111111',
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
    seed: 1001,
    rejointLe: new Date('2026-09-11T08:05:00.000Z'),
    dernierPing: new Date('2026-09-11T08:05:00.000Z'),
    ...overrides,
  };
}

export function buildAnswerRecord(
  overrides: Partial<AnswerRecord> = {},
): AnswerRecord {
  return {
    id: 'answer-uuid',
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-CAP-03',
    concept: 'capitalisation',
    valeur: 1338.23,
    seed: 1001,
    correcte: true,
    misconception: null,
    dureeMs: 42000,
    soumisLe: new Date('2026-09-11T08:10:00.000Z'),
    ...overrides,
  };
}

export function buildIncidentInput(
  overrides: Partial<IncidentInput> = {},
): IncidentInput {
  return {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    type: 'tab_hidden',
    contexte: null,
    horodatage: new Date('2026-09-11T08:12:00.000Z'),
    ...overrides,
  };
}

export function createMockSessionsRepo(): jest.Mocked<ISessionsRepository> {
  const session = buildSessionRecord();
  return {
    create: jest.fn().mockResolvedValue(session),
    findById: jest.fn().mockResolvedValue(session),
    findActiveByCode: jest.fn().mockResolvedValue(session),
    isCodeTaken: jest.fn().mockResolvedValue(false),
    update: jest
      .fn()
      .mockImplementation((_id, input) =>
        Promise.resolve({ ...session, ...input }),
      ),
  };
}

export function createMockParticipantsRepo(): jest.Mocked<IParticipantsRepository> {
  const participant = buildParticipantRecord();
  return {
    create: jest.fn().mockResolvedValue(participant),
    findBySessionAndStudentKey: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(participant),
    listBySession: jest.fn().mockResolvedValue([participant]),
    listSeedsBySession: jest.fn().mockResolvedValue([]),
    touch: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockAnswersRepo(): jest.Mocked<IAnswersRepository> {
  return {
    create: jest
      .fn()
      .mockImplementation((input: CreateAnswerInput) =>
        Promise.resolve(buildAnswerRecord(input)),
      ),
    existsFor: jest.fn().mockResolvedValue(false),
    listBySession: jest.fn().mockResolvedValue([buildAnswerRecord()]),
    tallyBySession: jest.fn().mockResolvedValue([]),
  };
}

export function createMockMasteryRepo(): jest.Mocked<IMasteryRepository> {
  return {
    findByStudentKey: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockIncidentsRepo(): jest.Mocked<IIncidentsRepository> {
  return {
    createMany: jest.fn().mockResolvedValue(undefined),
    listBySession: jest.fn().mockResolvedValue([]),
  };
}

export function createMockSessionStateCache(): jest.Mocked<ISessionStateCache> {
  return {
    publish: jest.fn(),
    read: jest.fn().mockReturnValue(null),
    drop: jest.fn(),
    fingerprint: jest.fn().mockReturnValue(''),
    signalerActivite: jest.fn(),
    activite: jest.fn().mockReturnValue(0),
  };
}

export function createMockFormationMailer(): jest.Mocked<IFormationMailer> {
  return {
    sendSyntheseFormateur: jest.fn().mockResolvedValue(undefined),
    sendCopieEtudiant: jest.fn().mockResolvedValue(undefined),
  };
}

export function mockTypeOrmCreate(): jest.Mock {
  return jest.fn().mockImplementation((data: unknown) => data);
}

export function mockTypeOrmSave(extra: Record<string, unknown>): jest.Mock {
  return jest
    .fn()
    .mockImplementation((entity: object) =>
      Promise.resolve({ ...entity, ...extra }),
    );
}
