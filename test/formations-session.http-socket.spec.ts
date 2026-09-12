/* eslint-disable @typescript-eslint/unbound-method */
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../src/common/interfaces/auth/public.decorator';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import { CloseSessionUseCase } from '../src/modules/formations/application/CloseSession.useCase';
import { ControlSessionUseCase } from '../src/modules/formations/application/ControlSession.useCase';
import { GetSessionResultsUseCase } from '../src/modules/formations/application/GetSessionResults.useCase';
import { JoinSessionUseCase } from '../src/modules/formations/application/JoinSession.useCase';
import { OpenSessionUseCase } from '../src/modules/formations/application/OpenSession.useCase';
import { RecordIncidentsUseCase } from '../src/modules/formations/application/RecordIncidents.useCase';
import { StreamSessionUseCase } from '../src/modules/formations/application/StreamSession.useCase';
import { SubmitAnswerUseCase } from '../src/modules/formations/application/SubmitAnswer.useCase';
import type { Bareme } from '../src/modules/formations/domain/Bareme';
import type {
  AnswerRecord,
  IAnswersRepository,
} from '../src/modules/formations/domain/IAnswers.repository';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../src/modules/formations/domain/IParticipants.repository';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../src/modules/formations/domain/ISessions.repository';
import {
  ANSWERS_REPOSITORY,
  FORMATION_MAILER,
  INCIDENTS_REPOSITORY,
  MASTERY_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../src/modules/formations/domain/token';
import { SessionStateCacheService } from '../src/modules/formations/infrastructure/SessionStateCache.service';
import { FormationsPresenterController } from '../src/modules/formations/interfaces/FormationsPresenter.controller';
import { FormationsStudentController } from '../src/modules/formations/interfaces/FormationsStudent.controller';
import { ParticipantTokenService } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  createMockFormationMailer,
  createMockIncidentsRepo,
  createMockMasteryRepo,
} from './factories/formation.factory';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './helpers/validation-pipe';

const API_PREFIX = 'api/v1/portfolio25';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'synthese-formateur@example.com';

const FORMATEUR_A = 'a1111111-1111-4111-8111-111111111111';
const FORMATEUR_B = 'b2222222-2222-4222-8222-222222222222';

/**
 * Valeurs temoin du corrige. Aucune ne doit apparaitre dans une reponse
 * servie au poste etudiant : le point decimal et les lettres hors [0-9a-f]
 * les rendent impossibles a produire par hasard dans un identifiant ou une
 * empreinte hexadecimale, donc toute occurrence est une vraie fuite.
 */
const TEMOIN = {
  solution: 424242.42,
  piege: 919191.19,
  misconception: 'sentinelle-misconception',
  concept: 'sentinelle-concept',
  question: 'Q-SENTINELLE-01',
};

const BAREME: Bareme = {
  version: 1,
  questions: [
    {
      id: TEMOIN.question,
      type: 'numeric',
      concept: TEMOIN.concept,
      tolerance: { type: 'relative', valeur: 0.005 },
      noteCompte: true,
    },
  ],
  tirages: [
    {
      seed: 1001,
      solutions: {
        [TEMOIN.question]: {
          valeur: TEMOIN.solution,
          pieges: [
            { valeur: TEMOIN.piege, misconception: TEMOIN.misconception },
          ],
        },
      },
    },
    {
      seed: 1002,
      solutions: {
        [TEMOIN.question]: { valeur: TEMOIN.solution, pieges: [] },
      },
    },
  ],
};

const CORRIGE_EN_CLAIR = [
  String(TEMOIN.solution),
  String(TEMOIN.piege),
  TEMOIN.misconception,
  TEMOIN.concept,
];

function inscription(studentKey: string) {
  return {
    studentKey,
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
  };
}

function creerSessionsRepo(): ISessionsRepository {
  const sessions = new Map<string, SessionRecord>();
  const toutes = (): SessionRecord[] => [...sessions.values()];
  return {
    create: (input) => {
      const session: SessionRecord = {
        ...input,
        id: randomUUID(),
        etat: 'attente',
        modeRythme: 'pilote',
        ecranCourant: 0,
        intervalleLibre: null,
        ouverteLe: new Date(),
        fermeeLe: null,
        majLe: new Date(),
      };
      sessions.set(session.id, session);
      return Promise.resolve(session);
    },
    findById: (id) => Promise.resolve(sessions.get(id) ?? null),
    findActiveByCode: (code) =>
      Promise.resolve(
        toutes().find(
          (session) => session.code === code && session.etat !== 'terminee',
        ) ?? null,
      ),
    isCodeTaken: (code) =>
      Promise.resolve(toutes().some((session) => session.code === code)),
    update: (id, input) => {
      const courante = sessions.get(id);
      if (!courante) {
        throw new Error(`Session absente du depot de test: ${id}`);
      }
      const maj: SessionRecord = { ...courante, ...input, majLe: new Date() };
      sessions.set(id, maj);
      return Promise.resolve(maj);
    },
  };
}

function creerParticipantsRepo(): IParticipantsRepository {
  const participants = new Map<string, ParticipantRecord>();
  const deLaSession = (sessionId: string): ParticipantRecord[] =>
    [...participants.values()].filter(
      (participant) => participant.sessionId === sessionId,
    );
  return {
    create: (input) => {
      const participant: ParticipantRecord = {
        ...input,
        id: randomUUID(),
        rejointLe: new Date(),
        dernierPing: new Date(),
      };
      participants.set(participant.id, participant);
      return Promise.resolve(participant);
    },
    findBySessionAndStudentKey: (sessionId, studentKey) =>
      Promise.resolve(
        deLaSession(sessionId).find(
          (participant) => participant.studentKey === studentKey,
        ) ?? null,
      ),
    findById: (id) => Promise.resolve(participants.get(id) ?? null),
    listBySession: (sessionId) => Promise.resolve(deLaSession(sessionId)),
    listSeedsBySession: (sessionId) =>
      Promise.resolve(
        deLaSession(sessionId).map((participant) => participant.seed),
      ),
    touch: () => Promise.resolve(),
  };
}

function creerAnswersRepo(): IAnswersRepository {
  const reponses: AnswerRecord[] = [];
  return {
    create: (input) => {
      const reponse: AnswerRecord = {
        ...input,
        id: randomUUID(),
        soumisLe: new Date(),
      };
      reponses.push(reponse);
      return Promise.resolve(reponse);
    },
    existsFor: (participantId, questionId) =>
      Promise.resolve(
        reponses.some(
          (reponse) =>
            reponse.participantId === participantId &&
            reponse.questionId === questionId,
        ),
      ),
    listBySession: (sessionId) =>
      Promise.resolve(
        reponses.filter((reponse) => reponse.sessionId === sessionId),
      ),
    tallyBySession: () => Promise.resolve([]),
  };
}

@Injectable()
class IdentiteDeTestGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const estPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublic) return true;

    const requete = context.switchToHttp().getRequest<Request>();
    const entete = requete.headers['x-test-identite'];
    if (typeof entete !== 'string') {
      throw new UnauthorizedException();
    }
    const [sub, ...roles] = entete.split(':');
    requete.user = { sub, roles } as Request['user'];
    return true;
  }
}

describe('Session de formation (e2e http socket)', () => {
  let app: INestApplication;
  const mailer = createMockFormationMailer();

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${API_PREFIX}/formations${chemin}`;

  const ouvrirSession = async (
    formateur: string,
  ): Promise<{ sessionId: string; code: string }> => {
    const reponse = await request(serveur())
      .post(route('/sessions'))
      .set('x-test-identite', `${formateur}:teacher`)
      .send({ courseSlug: 'maths-bts-suites-numeriques', bareme: BAREME })
      .expect(201);
    return reponse.body as { sessionId: string; code: string };
  };

  const rejoindre = (code: string, studentKey: string) =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send(inscription(studentKey));

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;

    const moduleRef = await Test.createTestingModule({
      controllers: [FormationsPresenterController, FormationsStudentController],
      providers: [
        OpenSessionUseCase,
        ControlSessionUseCase,
        CloseSessionUseCase,
        GetSessionResultsUseCase,
        JoinSessionUseCase,
        SubmitAnswerUseCase,
        RecordIncidentsUseCase,
        StreamSessionUseCase,
        ParticipantTokenService,
        { provide: SESSIONS_REPOSITORY, useValue: creerSessionsRepo() },
        { provide: PARTICIPANTS_REPOSITORY, useValue: creerParticipantsRepo() },
        { provide: ANSWERS_REPOSITORY, useValue: creerAnswersRepo() },
        { provide: MASTERY_REPOSITORY, useValue: createMockMasteryRepo() },
        { provide: INCIDENTS_REPOSITORY, useValue: createMockIncidentsRepo() },
        { provide: FORMATION_MAILER, useValue: mailer },
        { provide: SESSION_STATE_CACHE, useClass: SessionStateCacheService },
        { provide: APP_GUARD, useClass: IdentiteDeTestGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('inscription de l etudiant', () => {
    it('refuse de rejoindre avec un code invalide', async () => {
      const reponse = await rejoindre(
        '42a1',
        '11111111-1111-4111-8111-111111111111',
      );

      expect(reponse.status).toBe(400);
    });

    it('refuse de rejoindre un code inconnu', async () => {
      const reponse = await rejoindre(
        '9999',
        '11111111-1111-4111-8111-111111111112',
      );

      expect(reponse.status).toBe(404);
    });

    it('ne renvoie jamais le bareme a l etudiant', async () => {
      const { code, sessionId } = await ouvrirSession(FORMATEUR_A);

      const reponse = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111113',
      ).expect(201);

      const cles = Object.keys(reponse.body as object).sort((a, b) =>
        a.localeCompare(b),
      );

      expect(cles).toEqual([
        'ecranCourant',
        'jeton',
        'modeRythme',
        'participantId',
        'seed',
        'sessionId',
      ]);
      expect(reponse.body).toMatchObject({
        sessionId,
        seed: 1001,
        ecranCourant: 0,
        modeRythme: 'pilote',
      });
      CORRIGE_EN_CLAIR.forEach((temoin) => {
        expect(reponse.text).not.toContain(temoin);
      });
    });
  });

  describe('soumission d une reponse', () => {
    let sessionId: string;
    let jeton: string;

    beforeAll(async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      sessionId = session.sessionId;
      const inscrit = await rejoindre(
        session.code,
        '11111111-1111-4111-8111-111111111114',
      ).expect(201);
      jeton = (inscrit.body as { jeton: string }).jeton;
    });

    it('refuse une reponse sans jeton de participant', async () => {
      const reponse = await request(serveur())
        .post(route(`/sessions/${sessionId}/answers`))
        .send({ questionId: TEMOIN.question, valeur: 1, dureeMs: 1000 });

      expect(reponse.status).toBe(401);
    });

    it('refuse un jeton emis pour une autre session', async () => {
      const autre = await ouvrirSession(FORMATEUR_A);

      const reponse = await request(serveur())
        .post(route(`/sessions/${autre.sessionId}/answers`))
        .set('x-participant-token', jeton)
        .send({ questionId: TEMOIN.question, valeur: 1, dureeMs: 1000 });

      expect(reponse.status).toBe(401);
    });

    it('ne renvoie pas la solution avec le verdict de correction', async () => {
      const reponse = await request(serveur())
        .post(route(`/sessions/${sessionId}/answers`))
        .set('x-participant-token', jeton)
        .send({
          questionId: TEMOIN.question,
          valeur: TEMOIN.piege,
          dureeMs: 42000,
        })
        .expect(201);

      expect(reponse.body).toEqual({
        correcte: false,
        misconception: TEMOIN.misconception,
      });
      expect(reponse.text).not.toContain(String(TEMOIN.solution));
      expect(reponse.text).not.toContain(TEMOIN.concept);
    });
  });

  describe('pilotage reserve au formateur proprietaire', () => {
    let sessionId: string;
    let code: string;

    beforeAll(async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      sessionId = session.sessionId;
      code = session.code;
    });

    it('refuse a un utilisateur sans role formateur', async () => {
      const reponse = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_B}:student`)
        .send({ ecran: 9 });

      expect(reponse.status).toBe(403);
    });

    it('refuse a un autre formateur de piloter, de clore et de lire', async () => {
      const entete = `${FORMATEUR_B}:teacher`;

      const pilotage = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', entete)
        .send({ ecran: 9 });
      const demarrage = await request(serveur())
        .post(route(`/sessions/${sessionId}/start`))
        .set('x-test-identite', entete);
      const cloture = await request(serveur())
        .post(route(`/sessions/${sessionId}/close`))
        .set('x-test-identite', entete);
      const lecture = await request(serveur())
        .get(route(`/sessions/${sessionId}/results`))
        .set('x-test-identite', entete);

      expect([
        pilotage.status,
        demarrage.status,
        cloture.status,
        lecture.status,
      ]).toEqual([403, 403, 403, 403]);
    });

    it('laisse la session intacte apres les tentatives du second formateur', async () => {
      const reponse = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111115',
      ).expect(201);

      expect(reponse.body).toMatchObject({ sessionId, ecranCourant: 0 });
    });

    it('accepte le pilotage du formateur proprietaire', async () => {
      await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .send({ ecran: 4 })
        .expect(204);

      const reponse = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111116',
      ).expect(201);
      expect(reponse.body).toMatchObject({ ecranCourant: 4 });
    });

    it('refuse un pilotage vide', async () => {
      const reponse = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .send({});

      expect(reponse.status).toBe(400);
    });
  });

  describe('cloture et flux temps reel', () => {
    let sessionId: string;

    beforeAll(async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      sessionId = session.sessionId;
      await rejoindre(
        session.code,
        '11111111-1111-4111-8111-111111111117',
      ).expect(201);
      mailer.sendSyntheseFormateur.mockClear();
    });

    it('cloture et adresse la synthese a la boite configuree, jamais au teacherId', async () => {
      await request(serveur())
        .post(route(`/sessions/${sessionId}/close`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .expect(204);

      expect(mailer.sendSyntheseFormateur).toHaveBeenCalledWith(
        SYNTHESE_A,
        expect.anything(),
      );
      expect(mailer.sendSyntheseFormateur).not.toHaveBeenCalledWith(
        FORMATEUR_A,
        expect.anything(),
      );
    });

    it('sert le flux SSE de la session close sans laisser filtrer le bareme', async () => {
      const reponse = await request(serveur())
        .get(route(`/sessions/${sessionId}/stream`))
        .expect(200);

      expect(reponse.headers['content-type']).toContain('text/event-stream');
      expect(reponse.text).toContain('event: fin');
      CORRIGE_EN_CLAIR.forEach((temoin) => {
        expect(reponse.text).not.toContain(temoin);
      });
    });
  });
});
