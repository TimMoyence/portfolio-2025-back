import type { Piege } from '../../src/modules/formations/domain/AnswerGrading';
import type { Bareme } from '../../src/modules/formations/domain/Bareme';
import type { BaremeV2 } from '../../src/modules/formations/domain/contrats/bareme';
import type {
  AnswerRecord,
  CreateAnswerInput,
  IAnswersRepository,
} from '../../src/modules/formations/domain/IAnswers.repository';
import type {
  IIncidentsRepository,
  IncidentInput,
} from '../../src/modules/formations/domain/IIncidents.repository';
import type {
  FormationGroupRecord,
  IFormationGroupsRepository,
} from '../../src/modules/formations/domain/IFormationGroups.repository';
import type { IFormationMailer } from '../../src/modules/formations/domain/IFormationMailer.port';
import type {
  FreeResponseRecord,
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../../src/modules/formations/domain/IFreeResponses.repository';
import type {
  ITeacherAnnotationsRepository,
  SaveTeacherAnnotationInput,
  TeacherAnnotationRecord,
} from '../../src/modules/formations/domain/ITeacherAnnotations.repository';
import type { IEscapeRepository } from '../../src/modules/formations/domain/IEscape.repository';
import type { IMasteryRepository } from '../../src/modules/formations/domain/IMastery.repository';
import type { IPulsesRepository } from '../../src/modules/formations/domain/IPulses.repository';
import type { IScoresRepository } from '../../src/modules/formations/domain/IScores.repository';
import type {
  ISessionStateCache,
  LiveSessionState,
} from '../../src/modules/formations/domain/ISessionStateCache.port';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../../src/modules/formations/domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../../src/modules/formations/domain/ISessions.repository';
import type { ActeurFormation } from '../../src/modules/formations/domain/SessionOwnership';

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

export function buildBaremeV2(overrides: Partial<BaremeV2> = {}): BaremeV2 {
  return {
    version: 2,
    graineReference: 7,
    questions: [
      {
        id: 'b2-01-a1-diagnostic',
        type: 'vote',
        concept: 'taux-evolution',
        noteCompte: true,
        ecranId: 'B2-01-A1-01-DIAGNOSTIC',
        rangEcran: 0,
      },
      {
        id: 'b2-01-a2-part-marketplace',
        type: 'numeric',
        concept: 'proportion',
        noteCompte: true,
        ecranId: 'B2-01-A2-03-ATELIER-1',
        rangEcran: 13,
        tolerance: { type: 'absolue', valeur: 0.05 },
      },
      {
        id: 'b2-01-a4-feuille-canaux',
        type: 'feuille',
        concept: 'tableur',
        noteCompte: true,
        ecranId: 'B2-01-A4-02-FEUILLE-CANAUX',
        rangEcran: 30,
      },
      {
        id: 'b2-01-r-compensation',
        type: 'vote',
        concept: 'controle-coherence',
        noteCompte: false,
        ecranId: 'B2-01-A6-05-RAPPEL',
        rangEcran: 48,
        origine: 'banque',
      },
    ],
    solutionsCommunes: {
      'b2-01-a1-diagnostic': {
        valeur: 'plus-25-pct-ecd953a1',
        pieges: [
          { valeur: 'plus-20-pct-0a1b2c3d', misconception: 'base-arrivee' },
        ],
      },
      'b2-01-a2-part-marketplace': {
        valeur: 45.478261,
        pieges: [
          { valeur: 0.454783, misconception: 'taux-valeur-facteur-cent' },
        ],
      },
      'b2-01-r-compensation': {
        valeur: 'non-deux-erreurs-12345678',
        pieges: [
          {
            valeur: 'oui-le-total-87654321',
            misconception: 'total-concordant-vaut-preuve',
          },
        ],
      },
    },
    tirages: [
      { seed: 11, ecarts: {} },
      {
        seed: 12,
        ecarts: {
          'b2-01-a2-part-marketplace': { valeur: 12.5, pieges: [] },
        },
      },
    ],
    corriges: {},
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
    courseVersion: 1,
    teacherId: 'teacher-uuid',
    code: '4271',
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    pilotageEcrans: {},
    revision: 0,
    bareme: buildBareme(),
    ouverteLe: new Date('2026-09-11T08:00:00.000Z'),
    fermeeLe: null,
    majLe: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  };
}

export function buildLiveSessionState(
  overrides: Partial<LiveSessionState> = {},
): LiveSessionState {
  return {
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    participants: 0,
    revision: 0,
    pilotage: {},
    majLe: new Date('2026-09-11T08:00:00.000Z'),
    ...overrides,
  };
}

export function buildActeurFormation(
  overrides: Partial<ActeurFormation> = {},
): ActeurFormation {
  return { id: 'teacher-uuid', roles: ['teacher'], ...overrides };
}

export function buildAdministrateur(): ActeurFormation {
  return buildActeurFormation({ id: 'admin-uuid', roles: ['admin'] });
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
    score: null,
    details: null,
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
    countBySession: jest.fn().mockResolvedValue(1),
    listSeedsBySession: jest.fn().mockResolvedValue([]),
    touch: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockAnswersRepo(): jest.Mocked<IAnswersRepository> {
  return {
    listerDuParticipant: jest.fn().mockResolvedValue([]),
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

export function buildFreeResponseRecord(
  overrides: Partial<FreeResponseRecord> = {},
): FreeResponseRecord {
  return {
    id: 'free-response-uuid',
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    screenId: 'B2-01-S11-REFLECTION',
    activityId: 'b2-s11-c1',
    response: 'Je vérifie la base avant de comparer.',
    premiereReponse: null,
    strategiesServiesLe: null,
    dureeMs: 12000,
    status: 'enregistre',
    submittedAt: new Date('2026-09-11T08:20:00.000Z'),
    ...overrides,
  };
}

export function createMockFreeResponsesRepo(): jest.Mocked<IFreeResponsesRepository> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    enregistrerTentativeDeDefi: jest
      .fn()
      .mockImplementation((input: SaveFreeResponseInput) =>
        Promise.resolve(
          buildFreeResponseRecord({
            ...input,
            premiereReponse: input.response,
          }),
        ),
      ),
    trouverParActivite: jest.fn().mockResolvedValue(null),
    listerDuParticipant: jest.fn().mockResolvedValue([]),
    listBySession: jest.fn().mockResolvedValue([buildFreeResponseRecord()]),
  };
}

export function buildTeacherAnnotationRecord(
  overrides: Partial<TeacherAnnotationRecord> = {},
): TeacherAnnotationRecord {
  return {
    id: 'annotation-uuid',
    sessionId: 'session-uuid',
    teacherId: 'teacher-uuid',
    screenId: 'B2-01-S11-REFLECTION',
    groupName: 'Classe entière',
    note: 'Faire expliciter la base de comparaison.',
    updatedAt: new Date('2026-09-11T08:25:00.000Z'),
    ...overrides,
  };
}

export function createMockTeacherAnnotationsRepo(): jest.Mocked<ITeacherAnnotationsRepository> {
  return {
    save: jest
      .fn()
      .mockImplementation((input: SaveTeacherAnnotationInput) =>
        Promise.resolve(buildTeacherAnnotationRecord(input)),
      ),
    listBySession: jest
      .fn()
      .mockResolvedValue([buildTeacherAnnotationRecord()]),
  };
}

export function buildFormationGroupRecord(
  overrides: Partial<FormationGroupRecord> = {},
): FormationGroupRecord {
  return {
    id: 'group-uuid',
    sessionId: 'session-uuid',
    name: 'Groupe A',
    createdAt: new Date('2026-09-11T08:15:00.000Z'),
    updatedAt: new Date('2026-09-11T08:15:00.000Z'),
    ...overrides,
  };
}

export function createMockFormationGroupsRepo(): jest.Mocked<IFormationGroupsRepository> {
  return {
    create: jest
      .fn()
      .mockImplementation((sessionId: string, name: string) =>
        Promise.resolve(buildFormationGroupRecord({ sessionId, name })),
      ),
    rename: jest
      .fn()
      .mockImplementation((sessionId: string, id: string, name: string) =>
        Promise.resolve(buildFormationGroupRecord({ id, sessionId, name })),
      ),
    listBySession: jest.fn().mockResolvedValue([buildFormationGroupRecord()]),
    assignParticipant: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockEscapeRepo(): jest.Mocked<IEscapeRepository> {
  return {
    listerProgression: jest.fn().mockResolvedValue([]),
    listerProgressionDeSeance: jest.fn().mockResolvedValue([]),
    listerProgressionDuParticipant: jest.fn().mockResolvedValue([]),
    incrementerTentative: jest.fn().mockResolvedValue(1),
    marquerResolue: jest.fn().mockResolvedValue(undefined),
    journaliser: jest.fn().mockResolvedValue(undefined),
    tentativeDejaFaite: jest.fn().mockResolvedValue(false),
  };
}

export function createMockPulsesRepo(): jest.Mocked<IPulsesRepository> {
  return {
    declarer: jest.fn().mockResolvedValue(undefined),
    compterParSondage: jest.fn().mockResolvedValue({}),
    listerDuParticipant: jest.fn().mockResolvedValue([]),
  };
}

export function createMockScoresRepo(): jest.Mocked<IScoresRepository> {
  return {
    saveIndividuals: jest.fn().mockResolvedValue(undefined),
    saveSession: jest.fn().mockResolvedValue(undefined),
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

export function createMockDepotsFormations() {
  return {
    sessions: createMockSessionsRepo(),
    participants: createMockParticipantsRepo(),
    answers: createMockAnswersRepo(),
    incidents: createMockIncidentsRepo(),
    mastery: createMockMasteryRepo(),
    scores: createMockScoresRepo(),
    freeResponses: createMockFreeResponsesRepo(),
    annotations: createMockTeacherAnnotationsRepo(),
    groups: createMockFormationGroupsRepo(),
    escape: createMockEscapeRepo(),
    pulses: createMockPulsesRepo(),
    mailer: createMockFormationMailer(),
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
