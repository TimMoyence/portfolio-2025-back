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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { request as requeteNode } from 'node:http';
import request from 'supertest';
import { IS_PUBLIC_KEY } from '../src/common/interfaces/auth/public.decorator';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import type {
  Cours,
  Ecran,
} from '../src/modules/formations/domain/contrats/cours';
import { libelleDeConfusion } from '../src/modules/formations/domain/cours/banque/confusions';
import { questionNumerique } from '../src/modules/formations/domain/cours/Cours';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import type { DerouleCours } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import type { ICatalogueCours } from '../src/modules/formations/domain/cours/ICatalogueCours.port';
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
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../src/modules/formations/domain/token';
import type { SessionStateCacheService } from '../src/modules/formations/infrastructure/SessionStateCache.service';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursDeClasse,
  buildCoursDeTest,
  buildCoursSansTirageValide,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { buildCoursStocke } from './factories/cours-stocke.factory';
import {
  createMockEscapeRepo,
  createMockFormationGroupsRepo,
  createMockFormationMailer,
  createMockFreeResponsesRepo,
  createMockIncidentsRepo,
  createMockMasteryRepo,
  createMockPulsesRepo,
  createMockRappelsServisRepo,
  createMockScoresRepo,
  createMockTeacherAnnotationsRepo,
} from './factories/formation.factory';
import {
  abonnerAuFlux,
  attendreQue,
  CONTROLEURS_FORMATIONS,
  fermetureCoteServeur,
  fournisseursFormations,
} from './helpers/formations-harness';
import { ecartsAuSchemaDeReponse } from './helpers/schema-openapi';
import {
  ADRESSE_BOUCLE_LOCALE,
  ecouterEnBoucleLocale,
  fermerApplication,
} from './helpers/nest-test-app';
import { GLOBAL_VALIDATION_PIPE_OPTIONS } from './helpers/validation-pipe';

const API_PREFIX = 'api/v1/portfolio25';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'synthese-formateur@example.com';

const FORMATEUR_A = 'a1111111-1111-4111-8111-111111111111';
const FORMATEUR_B = 'b2222222-2222-4222-8222-222222222222';

/**
 * Valeurs temoin du corrige. Aucune ne doit apparaitre dans une reponse
 * servie par FormationsStudent.controller.ts : le point decimal et les
 * lettres hors [0-9a-f] les rendent impossibles a produire par hasard dans
 * un identifiant ou une empreinte hexadecimale, donc toute occurrence est
 * une vraie fuite.
 */
const TEMOIN = {
  solution: 424242.42,
  piege: 919191.19,
  misconception: 'ecart-absolu-au-lieu-du-taux',
  concept: 'taux-evolution',
  question: 'Q-SENTINELLE-01',
} as const;

function construireCoursSentinelle(solution: number): Cours {
  const question = questionNumerique({
    id: TEMOIN.question,
    concept: TEMOIN.concept,
    noteCompte: true,
    donnees: () => ({}),
    enonce: () => 'Quelle est la valeur sentinelle ?',
    unite: null,
    solution: () => solution,
    tolerance: { type: 'relative', valeur: 0.005 },
    pieges: [{ confusion: TEMOIN.misconception, valeur: () => TEMOIN.piege }],
  });
  const [premier, ...suite] = buildCoursDeTest().ecrans.map(
    (ecran): Ecran =>
      ecran.id === 'E-NUM' && ecran.brique === 'fp-numeric'
        ? { ...ecran, question }
        : ecran,
  );
  return buildCoursDeTest({ ecrans: [premier, ...suite] });
}

const COURS_SENTINELLE = construireCoursSentinelle(TEMOIN.solution);

const RANG_DE_LA_SENTINELLE = COURS_SENTINELLE.ecrans.findIndex(
  (ecran) => ecran.question?.id === TEMOIN.question,
);

const QUESTIONS_DU_COURS_DE_CLASSE = 12;
const COURS_DE_CLASSE = buildCoursDeClasse(QUESTIONS_DU_COURS_DE_CLASSE);
const COURS_SANS_TIRAGE = buildCoursSansTirageValide();
const COURS_GUIDE = lireCoursStocke(
  buildCoursStocke({ slug: 'cours-stocke-avec-guide' }),
);

const CORRIGE_EN_CLAIR = [
  String(TEMOIN.solution),
  String(TEMOIN.piege),
  TEMOIN.misconception,
  TEMOIN.concept,
];

const TAILLE_CLASSE = 30;
const DELAI_FERMETURE_FLUX_MS = 2000;

function cleEtudiant(index: number): string {
  return `22222222-2222-4222-8222-${String(index).padStart(12, '0')}`;
}

function inscription(studentKey: string) {
  return {
    studentKey,
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
  };
}

interface CatalogueMutable {
  readonly catalogue: ICatalogueCours;
  remplacer(nouveau: ICatalogueCours): void;
}

function creerCatalogueMutable(initial: ICatalogueCours): CatalogueMutable {
  let courant = initial;
  return {
    catalogue: {
      trouver: (slug, version) => courant.trouver(slug, version),
      trouverCourant: (slug) => courant.trouverCourant(slug),
      publier: (entree) => courant.publier(entree),
    },
    remplacer(nouveau) {
      courant = nouveau;
    },
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
        pilotageEcrans: {},
        revision: 0,
        capacite: input.capacite ?? 40,
        ouverteLe: new Date(),
        fermeeLe: null,
        majLe: new Date(),
      };
      sessions.set(session.id, session);
      return Promise.resolve(session);
    },
    findById: (id) => Promise.resolve(sessions.get(id) ?? null),
    lireEtat: (id) => {
      const session = sessions.get(id);
      return Promise.resolve(
        session === undefined
          ? null
          : {
              etat: session.etat,
              modeRythme: session.modeRythme,
              ecranCourant: session.ecranCourant,
              intervalleLibre: session.intervalleLibre,
              pilotageEcrans: session.pilotageEcrans,
              revision: session.revision,
              majLe: session.majLe,
            },
      );
    },
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
      const maj: SessionRecord = {
        ...courante,
        ...input,
        revision: courante.revision + 1,
        majLe: new Date(),
      };
      sessions.set(id, maj);
      return Promise.resolve(maj);
    },
  };
}

function creerParticipantsRepo(): IParticipantsRepository {
  const participants = new Map<string, ParticipantRecord>();
  const deLaSession = (sessionId: string): ParticipantRecord[] =>
    [...participants.values()].filter(
      (participant) =>
        participant.sessionId === sessionId && participant.evinceLe === null,
    );
  const evincesDeLaSession = (sessionId: string): ParticipantRecord[] =>
    [...participants.values()].filter(
      (participant) =>
        participant.sessionId === sessionId && participant.evinceLe !== null,
    );
  return {
    create: (input) => {
      const participant: ParticipantRecord = {
        ...input,
        id: randomUUID(),
        rejointLe: new Date(),
        dernierPing: new Date(),
        evinceLe: null,
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
    listEvincesBySession: (sessionId) =>
      Promise.resolve(evincesDeLaSession(sessionId)),
    countBySession: (sessionId) =>
      Promise.resolve(deLaSession(sessionId).length),
    listSeedsBySession: (sessionId) =>
      Promise.resolve(
        deLaSession(sessionId).map((participant) => participant.seed),
      ),
    touch: () => Promise.resolve(),
    evincer: (sessionId, participantId) => {
      const cible = participants.get(participantId);
      if (!cible || cible.sessionId !== sessionId || cible.evinceLe !== null) {
        return Promise.resolve(false);
      }
      participants.set(participantId, { ...cible, evinceLe: new Date() });
      return Promise.resolve(true);
    },
    readmettre: (sessionId, participantId) => {
      const cible = participants.get(participantId);
      if (!cible || cible.sessionId !== sessionId || cible.evinceLe === null) {
        return Promise.resolve(false);
      }
      participants.set(participantId, { ...cible, evinceLe: null });
      return Promise.resolve(true);
    },
  };
}

function creerAnswersRepo(): IAnswersRepository {
  const reponses: AnswerRecord[] = [];
  return {
    create: (input) => {
      const reponse: AnswerRecord = {
        ...input,
        score: input.score ?? null,
        details: input.details ?? null,
        id: randomUUID(),
        soumisLe: new Date(),
      };
      reponses.push(reponse);
      return Promise.resolve(reponse);
    },
    listerDuParticipant: (sessionId, participantId) =>
      Promise.resolve(
        reponses.filter(
          (reponse) =>
            reponse.sessionId === sessionId &&
            reponse.participantId === participantId,
        ),
      ),
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

interface HarnaisFormations {
  app: INestApplication;
  mailer: ReturnType<typeof createMockFormationMailer>;
  scores: ReturnType<typeof createMockScoresRepo>;
  port: number;
}

/**
 * Le `ThrottlerGuard` est monte comme en production (app.module.ts) : sans
 * lui, les decorateurs `@Throttle` du controleur etudiant restent inertes et
 * une limite qui ferme la porte a une classe entiere traverse la revue sans
 * qu'aucun test ne bronche.
 */
async function creerHarnais(
  catalogueHttp: ICatalogueCours = creerCatalogueDeTest(
    COURS_SENTINELLE,
    COURS_DE_CLASSE,
    COURS_SANS_TIRAGE,
    COURS_GUIDE,
  ),
): Promise<HarnaisFormations> {
  process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
  process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;
  const mailer = createMockFormationMailer();
  const scores = createMockScoresRepo();

  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])],
    controllers: CONTROLEURS_FORMATIONS,
    providers: [
      ...fournisseursFormations(
        {
          sessions: creerSessionsRepo(),
          participants: creerParticipantsRepo(),
          answers: creerAnswersRepo(),
          incidents: createMockIncidentsRepo(),
          mastery: createMockMasteryRepo(),
          scores,
          freeResponses: createMockFreeResponsesRepo(),
          annotations: createMockTeacherAnnotationsRepo(),
          groups: createMockFormationGroupsRepo(),
          escape: createMockEscapeRepo(),
          pulses: createMockPulsesRepo(),
          rappels: createMockRappelsServisRepo(),
          mailer,
        },
        catalogueHttp,
      ),
      { provide: APP_GUARD, useClass: IdentiteDeTestGuard },
      { provide: APP_GUARD, useClass: ThrottlerGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
  const port = await ecouterEnBoucleLocale(app);
  return { app, mailer, scores, port };
}

describe('Session de formation (e2e http socket)', () => {
  let app: INestApplication;
  let mailer: HarnaisFormations['mailer'];
  let scores: HarnaisFormations['scores'];
  let port: number;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${API_PREFIX}/formations${chemin}`;

  const demanderOuverture = (formateur: string, corps: object) =>
    request(serveur())
      .post(route('/sessions'))
      .set('x-test-identite', `${formateur}:teacher`)
      .send(corps);

  const ouvrirSession = async (
    formateur: string,
  ): Promise<{ sessionId: string; code: string }> => {
    const reponse = await demanderOuverture(formateur, {
      courseSlug: COURS_SENTINELLE.slug,
    }).expect(201);
    return reponse.body as { sessionId: string; code: string };
  };

  const demarrerSession = (sessionId: string, formateur: string) =>
    request(serveur())
      .post(route(`/sessions/${sessionId}/start`))
      .set('x-test-identite', `${formateur}:teacher`)
      .expect(204);

  const servirLaSentinelle = (sessionId: string, formateur: string) =>
    request(serveur())
      .patch(route(`/sessions/${sessionId}/control`))
      .set('x-test-identite', `${formateur}:teacher`)
      .send({ ecran: RANG_DE_LA_SENTINELLE })
      .expect(204);

  const rejoindre = (code: string, studentKey: string) =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send(inscription(studentKey));

  beforeAll(async () => {
    ({ app, mailer, scores, port } = await creerHarnais());
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  describe('flux simultanes d une seance ouverte', () => {
    const ouvrirFluxEtudiant = (sessionId: string, jeton: string) =>
      abonnerAuFlux(port, route(`/sessions/${sessionId}/stream`), {
        [EN_TETE_JETON]: jeton,
      });

    it('ferme le plus ancien flux du participant a l ouverture de son troisieme et garde au formateur sa place', async () => {
      const { sessionId, code } = await ouvrirSession(FORMATEUR_A);
      const inscrit = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111120',
      ).expect(201);
      const { jeton } = inscrit.body as { jeton: string };

      const siens = [
        await ouvrirFluxEtudiant(sessionId, jeton),
        await ouvrirFluxEtudiant(sessionId, jeton),
        await ouvrirFluxEtudiant(sessionId, jeton),
      ];
      const formateur = await abonnerAuFlux(
        port,
        route(`/sessions/${sessionId}/presenter-stream`),
        { 'x-test-identite': `${FORMATEUR_A}:teacher` },
      );
      await attendreQue(() => siens[0].ferme, DELAI_FERMETURE_FLUX_MS);
      const fermes = siens.map((flux) => flux.ferme);
      [...siens, formateur].forEach((flux) => flux.fermer());

      expect({
        statuts: [...siens, formateur].map((flux) => flux.statut),
        fermes,
      }).toEqual({
        statuts: [200, 200, 200, 200],
        fermes: [true, false, false],
      });
    });

    it('ne prend aucune place pour un flux formateur abandonne pendant la lecture de la seance', async () => {
      const { sessionId } = await ouvrirSession(FORMATEUR_A);
      const sessions = app.get<ISessionsRepository>(SESSIONS_REPOSITORY);
      const cache = app.get<SessionStateCacheService>(SESSION_STATE_CACHE);
      const lireSession = sessions.findById;
      let lectureCommencee = false;
      let lectureTerminee = false;
      let reprendreLaLecture = (): void => undefined;
      const lecture = jest
        .spyOn(sessions, 'findById')
        .mockImplementation(async (id) => {
          if (id === sessionId && !lectureCommencee) {
            lectureCommencee = true;
            await new Promise<void>((resoudre) => {
              reprendreLaLecture = resoudre;
            });
          }
          const resultat = await lireSession(id);
          lectureTerminee = true;
          return resultat;
        });
      const passages = jest.spyOn(cache, 'read');
      const chemin = route(`/sessions/${sessionId}/presenter-stream`);
      const abandonVuParLeServeur = fermetureCoteServeur(app, chemin);

      const requete = requeteNode({
        host: ADRESSE_BOUCLE_LOCALE,
        port,
        path: chemin,
        headers: { 'x-test-identite': `${FORMATEUR_A}:teacher` },
      });
      requete.on('error', () => undefined);
      requete.end();
      await attendreQue(() => lectureCommencee, DELAI_FERMETURE_FLUX_MS);
      passages.mockClear();
      requete.destroy();
      await abandonVuParLeServeur;
      reprendreLaLecture();
      await attendreQue(() => lectureTerminee, DELAI_FERMETURE_FLUX_MS);
      await new Promise<void>((resoudre) => setImmediate(resoudre));

      const passagesApresAbandon = passages.mock.calls.filter(
        ([id]) => id === sessionId,
      ).length;
      lecture.mockRestore();
      passages.mockRestore();

      expect({ lectureCommencee, passagesApresAbandon }).toEqual({
        lectureCommencee: true,
        passagesApresAbandon: 0,
      });
    });
  });

  describe('contrat OpenAPI des lectures de la seance', () => {
    it('documente exactement la forme rendue du sujet, du deroule et des resultats', async () => {
      const { sessionId, code } = await ouvrirSession(FORMATEUR_A);
      const inscrit = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111121',
      ).expect(201);
      const { jeton } = inscrit.body as { jeton: string };
      await demarrerSession(sessionId, FORMATEUR_A);
      await servirLaSentinelle(sessionId, FORMATEUR_A);
      await request(serveur())
        .post(route(`/sessions/${sessionId}/answers`))
        .set(EN_TETE_JETON, jeton)
        .send({
          questionId: TEMOIN.question,
          valeur: TEMOIN.piege,
          dureeMs: 1000,
        })
        .expect(201);
      const lireEnFormateur = (suffixe: string) =>
        request(serveur())
          .get(route(`/sessions/${sessionId}/${suffixe}`))
          .set('x-test-identite', `${FORMATEUR_A}:teacher`)
          .expect(200);

      const sujet = await request(serveur())
        .get(route(`/sessions/${sessionId}/sujet`))
        .set(EN_TETE_JETON, jeton)
        .expect(200);
      const deroule = await lireEnFormateur('deroule');
      const resultats = await lireEnFormateur('results');
      const exportBilan = await lireEnFormateur('report');
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('formations').build(),
      );

      expect([
        ...ecartsAuSchemaDeReponse(document, '/{id}/sujet', sujet.body),
        ...ecartsAuSchemaDeReponse(document, '/{id}/deroule', deroule.body),
        ...ecartsAuSchemaDeReponse(document, '/{id}/results', resultats.body),
        ...ecartsAuSchemaDeReponse(document, '/{id}/report', exportBilan.body),
      ]).toEqual([]);
      expect(exportBilan.headers['content-disposition']).toContain(
        'bilan-seance.json',
      );
    });

    it('documente le guide formateur que le deroule rend avec chaque ecran', async () => {
      const ouverture = await demanderOuverture(FORMATEUR_A, {
        courseSlug: COURS_GUIDE.slug,
      }).expect(201);
      const { sessionId } = ouverture.body as { sessionId: string };

      const deroule = await request(serveur())
        .get(route(`/sessions/${sessionId}/deroule`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .expect(200);
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('formations').build(),
      );

      expect((deroule.body as DerouleCours).ecrans[0].guide).toEqual(
        COURS_GUIDE.ecrans[0].guide,
      );
      expect(
        ecartsAuSchemaDeReponse(document, '/{id}/deroule', deroule.body),
      ).toEqual([]);
    });
  });

  describe('ouverture d une seance par le slug du cours', () => {
    it('refuse un cours absent du catalogue', async () => {
      const reponse = await demanderOuverture(FORMATEUR_A, {
        courseSlug: 'inconnu',
      });

      expect(reponse.status).toBe(404);
      expect((reponse.body as { detail: string }).detail).toBe(
        'Cours introuvable: inconnu',
      );
    });

    it('rend un conflit explicite, et non une erreur serveur, pour un cours qui ne produit pas assez de tirages', async () => {
      const reponse = await demanderOuverture(FORMATEUR_A, {
        courseSlug: COURS_SANS_TIRAGE.slug,
      });

      expect(reponse.status).toBe(409);
      expect((reponse.body as { detail: string }).detail).toContain(
        'ne produit pas 61 tirages non ambigus',
      );
    });

    it('refuse un bareme envoye par le client, meme pour un cours connu', async () => {
      const reponse = await demanderOuverture(FORMATEUR_A, {
        courseSlug: COURS_SENTINELLE.slug,
        bareme: {
          version: 1,
          graineReference: 7,
          questions: [],
          tirages: [{ seed: 7, solutions: {} }],
        },
      });

      expect(reponse.status).toBe(400);
      expect((reponse.body as { message: string[] }).message).toContain(
        'property bareme should not exist',
      );
    });
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

    it('ne renvoie a l etudiant ni le bareme ni la graine de son tirage', async () => {
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
        'sessionId',
      ]);
      expect(reponse.body).not.toHaveProperty('seed');
      expect(reponse.body).toMatchObject({
        sessionId,
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
      await demarrerSession(sessionId, FORMATEUR_A);
      await servirLaSentinelle(sessionId, FORMATEUR_A);
    });

    it('refuse une reponse avant que le formateur ait demarre la seance', async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      const inscrit = await rejoindre(
        session.code,
        '11111111-1111-4111-8111-111111111118',
      ).expect(201);

      const reponse = await request(serveur())
        .post(route(`/sessions/${session.sessionId}/answers`))
        .set('x-participant-token', (inscrit.body as { jeton: string }).jeton)
        .send({
          questionId: TEMOIN.question,
          valeur: TEMOIN.solution,
          dureeMs: 1000,
        });

      expect(reponse.status).toBe(409);
      expect(reponse.body).toMatchObject({ code: 'SEANCE_NON_DEMARREE' });
      expect((reponse.body as { detail: string }).detail).toContain(
        'pas encore commencé',
      );
    });

    it('distingue par son code la seconde reponse a une meme question', async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      const inscrit = await rejoindre(
        session.code,
        '11111111-1111-4111-8111-111111111122',
      ).expect(201);
      const { jeton: jetonDuSecond } = inscrit.body as { jeton: string };
      await demarrerSession(session.sessionId, FORMATEUR_A);
      await servirLaSentinelle(session.sessionId, FORMATEUR_A);
      const envoyer = () =>
        request(serveur())
          .post(route(`/sessions/${session.sessionId}/answers`))
          .set(EN_TETE_JETON, jetonDuSecond)
          .send({
            questionId: TEMOIN.question,
            valeur: TEMOIN.solution,
            dureeMs: 1000,
          });
      await envoyer().expect(201);

      const seconde = await envoyer();

      expect(seconde.status).toBe(409);
      expect(seconde.body).toMatchObject({ code: 'REPONSE_DEJA_ENREGISTREE' });
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
        libelleConfusion: libelleDeConfusion(TEMOIN.misconception),
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
        .send({ ecran: 1 });

      expect(reponse.status).toBe(403);
    });

    it('refuse a un autre formateur de piloter, de clore et de lire', async () => {
      const entete = `${FORMATEUR_B}:teacher`;

      const pilotage = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', entete)
        .send({ ecran: 1 });
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

    it('refuse un ecran hors du cours pour le formateur proprietaire', async () => {
      const reponse = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .send({ ecran: 99 });

      expect(reponse.status).toBe(400);

      const constat = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111119',
      ).expect(201);
      expect(constat.body).toMatchObject({ ecranCourant: 4 });
    });

    it('refuse un pilotage vide', async () => {
      const reponse = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .send({});

      expect(reponse.status).toBe(400);
    });

    it('ne bascule ni l ecran ni le rythme quand le rythme libre arrive sans intervalle', async () => {
      const reponse = await request(serveur())
        .patch(route(`/sessions/${sessionId}/control`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .send({ ecran: 7, mode: 'libre' });

      expect(reponse.status).toBe(400);

      const constat = await rejoindre(
        code,
        '11111111-1111-4111-8111-111111111116',
      ).expect(201);
      expect(constat.body).toMatchObject({
        ecranCourant: 4,
        modeRythme: 'pilote',
      });
    });
  });

  describe('deroule du presentateur', () => {
    let sessionId: string;

    beforeAll(async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      sessionId = session.sessionId;
    });

    it('sert le deroule annote au formateur proprietaire', async () => {
      const reponse = await request(serveur())
        .get(route(`/sessions/${sessionId}/deroule`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`);

      expect(reponse.status).toBe(200);
      expect((reponse.body as { id: string }).id).toBe(COURS_SENTINELLE.slug);
    });

    it('refuse le deroule a un autre formateur', async () => {
      const reponse = await request(serveur())
        .get(route(`/sessions/${sessionId}/deroule`))
        .set('x-test-identite', `${FORMATEUR_B}:teacher`);

      expect(reponse.status).toBe(403);
    });

    it('refuse le deroule a un role autre que formateur', async () => {
      const reponse = await request(serveur())
        .get(route(`/sessions/${sessionId}/deroule`))
        .set('x-test-identite', `${FORMATEUR_A}:student`);

      expect(reponse.status).toBe(403);
    });
  });

  describe('cloture et flux temps reel', () => {
    let sessionId: string;
    let jeton: string;

    beforeAll(async () => {
      const session = await ouvrirSession(FORMATEUR_A);
      sessionId = session.sessionId;
      const inscrit = await rejoindre(
        session.code,
        '11111111-1111-4111-8111-111111111117',
      ).expect(201);
      jeton = (inscrit.body as { jeton: string }).jeton;
      mailer.sendSyntheseFormateur.mockClear();
      scores.saveIndividuals.mockClear();
      scores.saveSession.mockClear();
    });

    it('ne persiste aucun score a la lecture des resultats ni du bilan', async () => {
      for (const lecture of ['results', 'report']) {
        await request(serveur())
          .get(route(`/sessions/${sessionId}/${lecture}`))
          .set('x-test-identite', `${FORMATEUR_A}:teacher`)
          .expect(200);
      }

      expect(scores.saveIndividuals).not.toHaveBeenCalled();
      expect(scores.saveSession).not.toHaveBeenCalled();
    });

    it('cloture et adresse la synthese a la boite configuree, jamais au teacherId', async () => {
      await request(serveur())
        .post(route(`/sessions/${sessionId}/close`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .expect(204);

      expect(scores.saveIndividuals).toHaveBeenCalledWith([
        expect.objectContaining({ sessionId, note: 0, completion: 0 }),
      ]);
      expect(scores.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId, tauxParticipation: 0 }),
      );
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
        .set('x-participant-token', jeton)
        .expect(200);

      expect(reponse.headers['content-type']).toContain('text/event-stream');
      expect(reponse.text).toContain('event: fin');
      CORRIGE_EN_CLAIR.forEach((temoin) => {
        expect(reponse.text).not.toContain(temoin);
      });
    });

    it('retourne un code metier quand un participant repond apres la cloture', async () => {
      const reponse = await request(serveur())
        .post(route(`/sessions/${sessionId}/answers`))
        .set('x-participant-token', jeton)
        .send({
          questionId: TEMOIN.question,
          valeur: TEMOIN.solution,
          dureeMs: 1000,
        });

      expect(reponse.status).toBe(409);
      expect(reponse.body).toMatchObject({ code: 'SEANCE_TERMINEE' });
    });

    it('n ouvre pas le flux a qui connait le sessionId sans etre inscrit', async () => {
      const sansJeton = await request(serveur()).get(
        route(`/sessions/${sessionId}/stream`),
      );
      const jetonDAilleurs = await request(serveur())
        .get(route(`/sessions/${sessionId}/stream`))
        .set('x-participant-token', `${randomUUID()}.empreinte-forgee`);

      expect([sansJeton.status, jetonDAilleurs.status]).toEqual([401, 401]);
    });

    it('sert le flux presentateur au formateur proprietaire et a lui seul', async () => {
      const proprietaire = await request(serveur())
        .get(route(`/sessions/${sessionId}/presenter-stream`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`);
      const intrus = await request(serveur())
        .get(route(`/sessions/${sessionId}/presenter-stream`))
        .set('x-test-identite', `${FORMATEUR_B}:teacher`);

      expect(proprietaire.status).toBe(200);
      expect(proprietaire.headers['content-type']).toContain(
        'text/event-stream',
      );
      expect(intrus.status).toBe(403);
      CORRIGE_EN_CLAIR.forEach((temoin) => {
        expect(proprietaire.text).not.toContain(temoin);
      });
    });

    it('pousse les resultats agreges au seul flux du formateur', async () => {
      const presentateur = await request(serveur())
        .get(route(`/sessions/${sessionId}/presenter-stream`))
        .set('x-test-identite', `${FORMATEUR_A}:teacher`)
        .expect(200);
      const etudiant = await request(serveur())
        .get(route(`/sessions/${sessionId}/stream`))
        .set('x-participant-token', jeton)
        .expect(200);

      expect(presentateur.text).toContain('event: resultats');
      expect(etudiant.text).not.toContain('event: resultats');
    });
  });
});

describe('Une salle informatique derriere une seule adresse publique', () => {
  let app: INestApplication;
  let codeDeLaSeance = '';
  const codesOuverts: string[] = [];

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${API_PREFIX}/formations${chemin}`;

  const ouvrirSeanceDeClasse = async (): Promise<string> => {
    const reponse = await request(serveur())
      .post(route('/sessions'))
      .set('x-test-identite', `${FORMATEUR_A}:teacher`)
      .send({ courseSlug: COURS_DE_CLASSE.slug })
      .expect(201);
    const { code } = reponse.body as { code: string };
    codesOuverts.push(code);
    return code;
  };

  const rejoindre = (code: string, index: number) =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send(inscription(cleEtudiant(index)));

  beforeAll(async () => {
    ({ app } = await creerHarnais());
    codeDeLaSeance = await ouvrirSeanceDeClasse();
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it('laisse les trente postes de la salle rejoindre la meme seance', async () => {
    const statuts: number[] = [];
    let restant = '';

    for (let poste = 0; poste < TAILLE_CLASSE; poste += 1) {
      const reponse = await rejoindre(codeDeLaSeance, poste);
      statuts.push(reponse.status);
      restant = String(reponse.headers['x-ratelimit-remaining']);
    }

    expect(statuts).toEqual(Array.from({ length: TAILLE_CLASSE }, () => 201));
    expect(restant).toBe(String(120 - TAILLE_CLASSE));
  });

  it('ouvre un compteur par seance et non par adresse', async () => {
    const autreCode = await ouvrirSeanceDeClasse();

    const reponse = await rejoindre(autreCode, 500).expect(201);

    expect(reponse.headers['x-ratelimit-remaining']).toBe('119');
  });

  it('arrete le balayage des codes inconnus venu de cette meme adresse', async () => {
    const inconnus = Array.from({ length: 40 }, (_, index) =>
      String(5000 + index),
    )
      .filter((code) => !codesOuverts.includes(code))
      .slice(0, 30);
    const statuts: number[] = [];

    for (const [rang, code] of inconnus.entries()) {
      const reponse = await rejoindre(code, 1000 + rang);
      statuts.push(reponse.status);
    }

    expect(statuts[0]).toBe(404);
    expect(statuts.filter((statut) => statut === 404).length).toBeLessThan(
      statuts.length,
    );
    expect(statuts[statuts.length - 1]).toBe(429);
  });
});

describe('sujet du participant (lecture par jeton)', () => {
  let app: INestApplication;
  let remplacerCatalogue: (nouveau: ICatalogueCours) => void;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${API_PREFIX}/formations${chemin}`;

  const ouvrirSession = async (): Promise<{
    sessionId: string;
    code: string;
  }> => {
    const reponse = await request(serveur())
      .post(route('/sessions'))
      .set('x-test-identite', `${FORMATEUR_A}:teacher`)
      .send({ courseSlug: COURS_SENTINELLE.slug })
      .expect(201);
    return reponse.body as { sessionId: string; code: string };
  };

  const rejoindreEtObtenirJeton = async (
    code: string,
    studentKey: string,
  ): Promise<string> => {
    const reponse = await request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send(inscription(studentKey))
      .expect(201);
    return (reponse.body as { jeton: string }).jeton;
  };

  beforeAll(async () => {
    const mutable = creerCatalogueMutable(
      creerCatalogueDeTest(COURS_SENTINELLE, COURS_DE_CLASSE),
    );
    remplacerCatalogue = mutable.remplacer;
    ({ app } = await creerHarnais(mutable.catalogue));
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it('refuse de lire le sujet sans jeton de participant', async () => {
    const { sessionId } = await ouvrirSession();

    const reponse = await request(serveur()).get(
      route(`/sessions/${sessionId}/sujet`),
    );

    expect(reponse.status).toBe(401);
  });

  it('refuse le sujet d une seance au jeton emis pour une autre seance', async () => {
    const seanceA = await ouvrirSession();
    const seanceB = await ouvrirSession();
    const jetonDeA = await rejoindreEtObtenirJeton(
      seanceA.code,
      '33333333-3333-4333-8333-333333333335',
    );

    const reponse = await request(serveur())
      .get(route(`/sessions/${seanceB.sessionId}/sujet`))
      .set('x-participant-token', jetonDeA);

    expect(reponse.status).toBe(401);
    expect(reponse.text).not.toContain(COURS_SENTINELLE.titre);
  });

  it('sert le sujet du tirage du participant sans jamais livrer le corrige', async () => {
    const { sessionId, code } = await ouvrirSession();
    const jeton = await rejoindreEtObtenirJeton(
      code,
      '33333333-3333-4333-8333-333333333331',
    );

    const reponse = await request(serveur())
      .get(route(`/sessions/${sessionId}/sujet`))
      .set('x-participant-token', jeton)
      .expect(200);

    expect((reponse.body as { id: string }).id).toBe(COURS_SENTINELLE.slug);
    [
      String(TEMOIN.solution),
      String(TEMOIN.piege),
      TEMOIN.misconception,
    ].forEach((temoin) => {
      expect(reponse.text).not.toContain(temoin);
    });
  });

  it('ne livre pas le contenu des ecrans que le formateur n a pas encore reveles', async () => {
    const { sessionId, code } = await ouvrirSession();
    const jeton = await rejoindreEtObtenirJeton(
      code,
      '33333333-3333-4333-8333-333333333336',
    );

    const reponse = await request(serveur())
      .get(route(`/sessions/${sessionId}/sujet`))
      .set('x-participant-token', jeton)
      .expect(200);
    const ecrans = reponse.body as {
      ecrans: readonly { type: string; donnees: Record<string, unknown> }[];
    };

    expect(ecrans.ecrans[0].type).not.toBe('ecran-verrouille');
    expect(
      ecrans.ecrans
        .slice(1)
        .every(
          (ecran) =>
            ecran.type === 'ecran-verrouille' &&
            Object.keys(ecran.donnees).length === 0,
        ),
    ).toBe(true);
  });

  it('sert a chaque participant le sujet de son propre tirage', async () => {
    const { sessionId, code } = await ouvrirSession();
    const jetonA = await rejoindreEtObtenirJeton(
      code,
      '33333333-3333-4333-8333-333333333332',
    );
    const jetonB = await rejoindreEtObtenirJeton(
      code,
      '33333333-3333-4333-8333-333333333333',
    );
    await request(serveur())
      .post(route(`/sessions/${sessionId}/start`))
      .set('x-test-identite', `${FORMATEUR_A}:teacher`)
      .expect(204);
    await request(serveur())
      .patch(route(`/sessions/${sessionId}/control`))
      .set('x-test-identite', `${FORMATEUR_A}:teacher`)
      .send({ ecran: 4 })
      .expect(204);

    const sujetA = await request(serveur())
      .get(route(`/sessions/${sessionId}/sujet`))
      .set('x-participant-token', jetonA)
      .expect(200);
    const sujetB = await request(serveur())
      .get(route(`/sessions/${sessionId}/sujet`))
      .set('x-participant-token', jetonB)
      .expect(200);

    expect(sujetA.text).not.toEqual(sujetB.text);
  });

  it('refuse de servir un sujet quand le cours a change depuis l ouverture de la seance', async () => {
    const { sessionId, code } = await ouvrirSession();
    const jeton = await rejoindreEtObtenirJeton(
      code,
      '33333333-3333-4333-8333-333333333334',
    );

    remplacerCatalogue(
      creerCatalogueDeTest(
        construireCoursSentinelle(TEMOIN.solution + 1),
        COURS_DE_CLASSE,
      ),
    );

    const reponse = await request(serveur())
      .get(route(`/sessions/${sessionId}/sujet`))
      .set('x-participant-token', jeton);

    expect(reponse.status).toBe(409);
    expect((reponse.body as { detail: string }).detail).toContain(
      'nouvelle séance',
    );
  });
});
