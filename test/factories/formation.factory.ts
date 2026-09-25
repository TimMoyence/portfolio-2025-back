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
import type {
  IMasteryRepository,
  MasteryRecord,
} from '../../src/modules/formations/domain/IMastery.repository';
import type { IPulsesRepository } from '../../src/modules/formations/domain/IPulses.repository';
import type {
  IRappelsServisRepository,
  RappelServiRecord,
} from '../../src/modules/formations/domain/IRappelsServis.repository';
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
  EtatDeSeanceRecord,
  ISessionsRepository,
  SessionRecord,
} from '../../src/modules/formations/domain/ISessions.repository';
import type {
  QuestionAAgreger,
  ResultatQuestion,
} from '../../src/modules/formations/domain/ResultatsSeance';
import type { ActeurFormation } from '../../src/modules/formations/domain/SessionOwnership';

export const QUESTION_DE_CAPITALISATION = {
  id: 'Q-CAP-03',
  type: 'numeric',
  concept: 'capitalisation',
  tolerance: { type: 'relative', valeur: 0.005 },
  noteCompte: true,
} as const satisfies Bareme['questions'][number];

export function buildBareme(overrides: Partial<Bareme> = {}): Bareme {
  return {
    version: 1,
    graineReference: 9_999_999,
    questions: [QUESTION_DE_CAPITALISATION],
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

export const PARTICIPANT_DE_TEST = {
  sessionId: 'session-uuid',
  participantId: 'participant-uuid',
} as const;

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
    capacite: 40,
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
    evinceLe: null,
    generationDeJeton: 0,
    ...overrides,
  };
}

export function buildCreateAnswerInput(
  overrides: Partial<CreateAnswerInput> = {},
): CreateAnswerInput {
  return {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-CAP-03',
    concept: 'capitalisation',
    valeur: 1338.23,
    seed: 1001,
    correcte: true,
    misconception: null,
    dureeMs: 42000,
    ...overrides,
  };
}

export function buildAnswerRecord(
  overrides: Partial<AnswerRecord> = {},
): AnswerRecord {
  return {
    id: 'answer-uuid',
    ...buildCreateAnswerInput(),
    score: null,
    details: null,
    soumisLe: new Date('2026-09-11T08:10:00.000Z'),
    ...overrides,
  };
}

export function detailsDeFeuilleJuste(): NonNullable<AnswerRecord['details']> {
  return [
    { cle: 'D2', juste: true, confusion: null },
    { cle: 'D3', juste: true, confusion: null },
  ];
}

export function detailsDeFeuilleAMoitieJuste(): NonNullable<
  AnswerRecord['details']
> {
  return [
    { cle: 'D2', juste: false, confusion: 'base-arrivee' },
    { cle: 'D3', juste: true, confusion: null },
  ];
}

export function buildQuestionAAgreger(
  overrides: Partial<QuestionAAgreger> = {},
): QuestionAAgreger {
  return {
    id: 'Q-CAP-03',
    type: 'numeric',
    noteCompte: true,
    ecranId: 'E-NUM',
    ...overrides,
  };
}

export function buildResultatQuestion(
  overrides: Partial<ResultatQuestion> = {},
): ResultatQuestion {
  return {
    questionId: 'Q-CAP-03',
    ecranId: 'E-NUM',
    type: 'numeric',
    noteCompte: true,
    total: 0,
    correctes: 0,
    neSaitPas: 0,
    confusions: [],
    parOption: null,
    scoreMoyen: null,
    parCle: null,
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

export function etatDeSeance(session: SessionRecord): EtatDeSeanceRecord {
  return {
    etat: session.etat,
    modeRythme: session.modeRythme,
    ecranCourant: session.ecranCourant,
    intervalleLibre: session.intervalleLibre,
    pilotageEcrans: session.pilotageEcrans,
    revision: session.revision,
    majLe: session.majLe,
  };
}

export function createMockSessionsRepo(
  overrides: Partial<SessionRecord> = {},
): jest.Mocked<ISessionsRepository> {
  const session = buildSessionRecord(overrides);
  const findById = jest.fn().mockResolvedValue(session);
  return {
    create: jest.fn().mockResolvedValue(session),
    findById,
    lireEtat: jest.fn((id: string) =>
      (findById(id) as Promise<SessionRecord | null>).then((trouvee) =>
        trouvee === null ? null : etatDeSeance(trouvee),
      ),
    ),
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
    inscrire: jest.fn().mockResolvedValue({ participant, nouveau: true }),
    findBySessionAndStudentKey: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(participant),
    listBySession: jest.fn().mockResolvedValue([participant]),
    listEvincesBySession: jest.fn().mockResolvedValue([]),
    countBySession: jest.fn().mockResolvedValue(1),
    touch: jest.fn().mockResolvedValue(undefined),
    evincer: jest.fn().mockResolvedValue(true),
    readmettre: jest.fn().mockResolvedValue(true),
    libererPoste: jest.fn().mockResolvedValue(true),
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
    remplacer: jest.fn().mockResolvedValue(true),
    listBySession: jest.fn().mockResolvedValue([buildAnswerRecord()]),
    tallyBySession: jest.fn().mockResolvedValue([]),
  };
}

export function buildMasteryRecord(
  overrides: Partial<MasteryRecord> = {},
): MasteryRecord {
  return {
    studentKey: '11111111-1111-4111-8111-111111111111',
    concept: 'taux-evolution',
    boite: 1,
    derniereVue: new Date('2026-09-11T08:00:00.000Z'),
    succes: 0,
    echecs: 0,
    ...overrides,
  };
}

export function createMockMasteryRepo(): jest.Mocked<IMasteryRepository> {
  return {
    findByStudentKey: jest.fn().mockResolvedValue([]),
    enregistrerTentative: jest.fn().mockResolvedValue(undefined),
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

export function createMockRappelsServisRepo(): jest.Mocked<IRappelsServisRepository> {
  const servis: RappelServiRecord[] = [];
  return {
    lister: jest.fn().mockImplementation(() => Promise.resolve([...servis])),
    figer: jest
      .fn()
      .mockImplementation(
        (input: { participantId: string; questionIds: string[] }) => {
          servis.push(
            ...input.questionIds.map((questionId, rang) => ({
              participantId: input.participantId,
              questionId,
              rang,
            })),
          );
          return Promise.resolve([...servis]);
        },
      ),
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
    escape: createMockEscapeRepo(),
    pulses: createMockPulsesRepo(),
    rappels: createMockRappelsServisRepo(),
    mailer: createMockFormationMailer(),
  };
}

export function mockTypeOrmCreate(): jest.Mock {
  return jest
    .fn()
    .mockImplementation((...args: unknown[]) => args[args.length - 1]);
}

export function mockTypeOrmSave(extra: Record<string, unknown>): jest.Mock {
  return jest
    .fn()
    .mockImplementation((entity: object) =>
      Promise.resolve({ ...entity, ...extra }),
    );
}
