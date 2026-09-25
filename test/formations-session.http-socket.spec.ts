/* eslint-disable @typescript-eslint/unbound-method */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { request as requeteNode } from 'node:http';
import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import { bornerLesCorpsDeRequete } from '../src/common/interfaces/http/corps-de-requete';
import type {
  Cours,
  Ecran,
} from '../src/modules/formations/domain/contrats/cours';
import { libelleDeConfusion } from '../src/modules/formations/domain/cours/banque/confusions';
import { questionNumerique } from '../src/modules/formations/domain/cours/Cours';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import type { DerouleCours } from '../src/modules/formations/domain/cours/DeroulePresentateur';
import type { ICatalogueCours } from '../src/modules/formations/domain/cours/ICatalogueCours.port';
import {
  ReponseIntrouvableError,
  RevisionDeSeanceObsoleteError,
  ParticipantEvinceError,
  PlaceDejaPriseError,
  SeanceCompleteError,
  SeedPoolExhaustedError,
} from '../src/modules/formations/domain/errors/FormationErrors';
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
import { MAX_INCIDENTS_PAR_ENVOI } from '../src/modules/formations/domain/IncidentType';
import { COURS_B2_01 } from '../src/modules/formations/infrastructure/contenus/b2-01.cours';
import { LIMITE_SUJET_PAR_PARTICIPANT } from '../src/modules/formations/interfaces/formations-throttling';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursDeClasse,
  buildCoursDeTest,
  buildCoursSansTirageValide,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { buildCoursStocke } from './factories/cours-stocke.factory';
import {
  createMockDepotsFormations,
  etatDeSeance,
} from './factories/formation.factory';
import {
  abonnerAuFlux,
  attendreQue,
  compilerModuleFormations,
  fermetureCoteServeur,
  routeFormations,
  serveurHttpDe,
} from './helpers/formations-harness';
import {
  EN_TETE_IDENTITE,
  signerLesIdentitesDeTest,
} from './helpers/identite-reelle';
import {
  documentOpenApiFormations,
  ecartsAuSchemaDeReponse,
} from './helpers/schema-openapi';
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

const BAREME_EN_CLAIR = [
  String(TEMOIN.solution),
  String(TEMOIN.piege),
  TEMOIN.misconception,
];
const CORRIGE_EN_CLAIR = [...BAREME_EN_CLAIR, TEMOIN.concept];

function attendreSansCorrige(texte: string, temoins = CORRIGE_EN_CLAIR) {
  temoins.forEach((temoin) => {
    expect(texte).not.toContain(temoin);
  });
}

const TAILLE_CLASSE = 30;
const DELAI_FERMETURE_FLUX_MS = 2000;

function cleEtudiant(index: number): string {
  return `poste-${String(index).padStart(4, '0')}`;
}

function inscription(identifiant: string) {
  return {
    prenom: 'Theo',
    nom: 'Martin',
    email: `${identifiant}@example.com`,
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
        session === undefined ? null : etatDeSeance(session),
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
    update: (id, input, revisionAttendue) => {
      const courante = sessions.get(id);
      if (!courante) {
        throw new Error(`Session absente du depot de test: ${id}`);
      }
      if (
        revisionAttendue !== undefined &&
        revisionAttendue !== courante.revision
      ) {
        return Promise.reject(new RevisionDeSeanceObsoleteError(id));
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
  const modifierDansLaSession = (
    sessionId: string,
    participantId: string,
    evince: boolean,
    modification: (cible: ParticipantRecord) => Partial<ParticipantRecord>,
  ): Promise<boolean> => {
    const cible = participants.get(participantId);
    if (
      cible?.sessionId !== sessionId ||
      (cible.evinceLe !== null) !== evince
    ) {
      return Promise.resolve(false);
    }
    participants.set(participantId, { ...cible, ...modification(cible) });
    return Promise.resolve(true);
  };
  const empreintes = new Map<string, string | null>();
  return {
    inscrire: ({
      capacite,
      choisirGraine,
      empreinteDeReprise,
      repriseAutorisee,
      ...identite
    }) => {
      const inscrits = deLaSession(identite.sessionId);
      const existant = inscrits.find(
        (participant) => participant.studentKey === identite.studentKey,
      );
      if (existant !== undefined) {
        if (!repriseAutorisee(empreintes.get(existant.id) ?? null)) {
          return Promise.reject(new PlaceDejaPriseError());
        }
        empreintes.set(existant.id, empreinteDeReprise);
        return Promise.resolve({ participant: existant, nouveau: false });
      }
      if (
        evincesDeLaSession(identite.sessionId).some(
          (evince) => evince.studentKey === identite.studentKey,
        )
      ) {
        return Promise.reject(new ParticipantEvinceError());
      }
      if (inscrits.length >= capacite) {
        return Promise.reject(new SeanceCompleteError(capacite));
      }
      const seed = choisirGraine(inscrits.map((inscrit) => inscrit.seed));
      if (seed === null) {
        return Promise.reject(new SeedPoolExhaustedError());
      }
      const participant: ParticipantRecord = {
        ...identite,
        seed,
        id: randomUUID(),
        rejointLe: new Date(),
        dernierPing: new Date(),
        evinceLe: null,
        generationDeJeton: 0,
      };
      participants.set(participant.id, participant);
      empreintes.set(participant.id, empreinteDeReprise);
      return Promise.resolve({ participant, nouveau: true });
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
    touch: () => Promise.resolve(),
    evincer: (sessionId, participantId) =>
      modifierDansLaSession(sessionId, participantId, false, () => ({
        evinceLe: new Date(),
      })),
    readmettre: (sessionId, participantId, capacite) => {
      if (deLaSession(sessionId).length >= capacite) {
        return Promise.reject(new SeanceCompleteError(capacite));
      }
      return modifierDansLaSession(sessionId, participantId, true, () => ({
        evinceLe: null,
      }));
    },
    libererPoste: (sessionId, participantId) =>
      modifierDansLaSession(sessionId, participantId, false, (cible) => {
        empreintes.set(participantId, null);
        return { generationDeJeton: cible.generationDeJeton + 1 };
      }),
  };
}

function creerAnswersRepo(): IAnswersRepository {
  const reponses: AnswerRecord[] = [];
  const soumissions = new Map<string, number>();
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
    remplacer: (input, soumissionsMax) => {
      const rang = reponses.findIndex(
        (reponse) =>
          reponse.participantId === input.participantId &&
          reponse.questionId === input.questionId,
      );
      if (rang < 0) {
        return Promise.reject(new ReponseIntrouvableError(input.questionId));
      }
      const cle = `${input.participantId}:${input.questionId}`;
      const dejaSoumises = soumissions.get(cle) ?? 1;
      if (dejaSoumises >= soumissionsMax) {
        return Promise.resolve(false);
      }
      soumissions.set(cle, dejaSoumises + 1);
      reponses[rang] = {
        ...reponses[rang],
        ...input,
        score: input.score ?? null,
        details: input.details ?? null,
      };
      return Promise.resolve(true);
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

interface HarnaisFormations {
  app: INestApplication;
  mailer: ReturnType<typeof createMockDepotsFormations>['mailer'];
  scores: ReturnType<typeof createMockDepotsFormations>['scores'];
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
  const depots = {
    ...createMockDepotsFormations(),
    sessions: creerSessionsRepo(),
    participants: creerParticipantsRepo(),
    answers: creerAnswersRepo(),
  };
  const { mailer, scores } = depots;

  const moduleRef = await compilerModuleFormations(depots, catalogueHttp);

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  bornerLesCorpsDeRequete(app);
  signerLesIdentitesDeTest(app);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS));
  const port = await ecouterEnBoucleLocale(app);
  return { app, mailer, scores, port };
}

interface SeanceOuverte {
  sessionId: string;
  code: string;
}

interface PosteInscrit {
  jeton: string;
  participantId: string;
  secretDeReprise: string;
}

function clientFormations(application: () => INestApplication) {
  const appel = () => request(serveurHttpDe(application()));
  const get = (chemin: string) => appel().get(routeFormations(chemin));
  const post = (chemin: string) => appel().post(routeFormations(chemin));
  const patch = (chemin: string) => appel().patch(routeFormations(chemin));
  const identite = (formateur: string, role = 'teacher') =>
    `${formateur}:${role}`;
  const client = {
    get,
    post,
    patch,
    delete: (chemin: string) => appel().delete(routeFormations(chemin)),
    enFormateur: (chemin: string, formateur = FORMATEUR_A, role?: string) =>
      get(chemin).set(EN_TETE_IDENTITE, identite(formateur, role)),
    lireEnFormateur: (sessionId: string, lecture: string, formateur?: string) =>
      client.enFormateur(`/sessions/${sessionId}/${lecture}`, formateur),
    postEnFormateur: (chemin: string, formateur = FORMATEUR_A, role?: string) =>
      post(chemin).set(EN_TETE_IDENTITE, identite(formateur, role)),
    piloter: (
      sessionId: string,
      corps: object,
      formateur = FORMATEUR_A,
      role?: string,
    ) =>
      patch(`/sessions/${sessionId}/control`)
        .set(EN_TETE_IDENTITE, identite(formateur, role))
        .send(corps),
    demarrer: (sessionId: string, formateur = FORMATEUR_A) =>
      client.postEnFormateur(`/sessions/${sessionId}/start`, formateur),
    ouvrir: (corps: object, formateur = FORMATEUR_A) =>
      client.postEnFormateur('/sessions', formateur).send(corps),
    ouvrirSession: async (
      courseSlug = COURS_SENTINELLE.slug,
      formateur = FORMATEUR_A,
    ): Promise<SeanceOuverte> =>
      (await client.ouvrir({ courseSlug }, formateur).expect(201))
        .body as SeanceOuverte,
    rejoindre: (code: string, studentKey: string) =>
      post(`/sessions/${code}/join`).send(inscription(studentKey)),
    inscrire: async (code: string, studentKey: string): Promise<PosteInscrit> =>
      (await client.rejoindre(code, studentKey).expect(201))
        .body as PosteInscrit,
    parJeton: (chemin: string, jeton: string) =>
      get(chemin).set(EN_TETE_JETON, jeton),
    sujet: (sessionId: string, jeton: string) =>
      client.parJeton(`/sessions/${sessionId}/sujet`, jeton),
    flux: (sessionId: string, jeton: string) =>
      client.parJeton(`/sessions/${sessionId}/stream`, jeton),
    repondre: (
      sessionId: string,
      jeton: string,
      valeur: unknown,
      dureeMs = 1000,
    ) =>
      post(`/sessions/${sessionId}/answers`)
        .set(EN_TETE_JETON, jeton)
        .send({ questionId: TEMOIN.question, valeur, dureeMs }),
  };
  return client;
}

describe('Session de formation (e2e http socket)', () => {
  let app: INestApplication;
  let mailer: HarnaisFormations['mailer'];
  let scores: HarnaisFormations['scores'];
  let port: number;

  const http = clientFormations(() => app);
  const route = routeFormations;

  const servirLaSentinelle = async (sessionId: string) => {
    await http.demarrer(sessionId).expect(204);
    await http.piloter(sessionId, { ecran: RANG_DE_LA_SENTINELLE }).expect(204);
  };

  const seanceSurLaSentinelle = async (
    studentKey: string,
  ): Promise<SeanceOuverte & PosteInscrit> => {
    const seance = await http.ouvrirSession();
    const poste = await http.inscrire(seance.code, studentKey);
    await servirLaSentinelle(seance.sessionId);
    return { ...seance, ...poste };
  };

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
      const { sessionId, code } = await http.ouvrirSession();
      const { jeton } = await http.inscrire(
        code,
        '11111111-1111-4111-8111-111111111120',
      );

      const siens = [
        await ouvrirFluxEtudiant(sessionId, jeton),
        await ouvrirFluxEtudiant(sessionId, jeton),
        await ouvrirFluxEtudiant(sessionId, jeton),
      ];
      const formateur = await abonnerAuFlux(
        port,
        route(`/sessions/${sessionId}/presenter-stream`),
        { [EN_TETE_IDENTITE]: `${FORMATEUR_A}:teacher` },
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
      const { sessionId } = await http.ouvrirSession();
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
        headers: { [EN_TETE_IDENTITE]: `${FORMATEUR_A}:teacher` },
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
      const { sessionId, jeton } = await seanceSurLaSentinelle(
        '11111111-1111-4111-8111-111111111121',
      );
      await http.repondre(sessionId, jeton, TEMOIN.piege).expect(201);
      const lireEnFormateur = (lecture: string) =>
        http.lireEnFormateur(sessionId, lecture).expect(200);

      const sujet = await http.sujet(sessionId, jeton).expect(200);
      const deroule = await lireEnFormateur('deroule');
      const resultats = await lireEnFormateur('results');
      const exportBilan = await lireEnFormateur('report');
      const document = documentOpenApiFormations(app);

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
      const { sessionId } = await http.ouvrirSession(COURS_GUIDE.slug);

      const deroule = await http
        .lireEnFormateur(sessionId, 'deroule')
        .expect(200);
      const document = documentOpenApiFormations(app);

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
      const reponse = await http.ouvrir({ courseSlug: 'inconnu' });

      expect(reponse.status).toBe(404);
      expect((reponse.body as { detail: string }).detail).toBe(
        'Cours introuvable: inconnu',
      );
    });

    it('rend un conflit explicite, et non une erreur serveur, pour un cours qui ne produit pas assez de tirages', async () => {
      const reponse = await http.ouvrir({ courseSlug: COURS_SANS_TIRAGE.slug });

      expect(reponse.status).toBe(409);
      expect((reponse.body as { detail: string }).detail).toContain(
        'ne produit pas 61 tirages non ambigus',
      );
    });

    it('refuse un bareme envoye par le client, meme pour un cours connu', async () => {
      const reponse = await http.ouvrir({
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
    it.each([
      ['avec un code invalide', '42a1', 400],
      ['un code inconnu', '9999', 404],
    ])('refuse de rejoindre %s', async (_cas, code, statut) => {
      const reponse = await http.rejoindre(
        code,
        '11111111-1111-4111-8111-111111111111',
      );

      expect(reponse.status).toBe(statut);
    });

    it('ne renvoie a l etudiant ni le bareme ni la graine de son tirage', async () => {
      const { code, sessionId } = await http.ouvrirSession();

      const reponse = await http
        .rejoindre(code, '11111111-1111-4111-8111-111111111113')
        .expect(201);

      const cles = Object.keys(reponse.body as object).sort((a, b) =>
        a.localeCompare(b),
      );

      expect(cles).toEqual([
        'ecranCourant',
        'jeton',
        'modeRythme',
        'participantId',
        'secretDeReprise',
        'sessionId',
      ]);
      expect(reponse.body).not.toHaveProperty('seed');
      expect(reponse.body).toMatchObject({
        sessionId,
        ecranCourant: 0,
        modeRythme: 'pilote',
      });
      attendreSansCorrige(reponse.text);
    });
  });

  describe('S1 · S2 · pentest de la reprise de place', () => {
    const ETUDIANTE = 'alice.durand';

    const rejoindreDepuis = (code: string, secretDeReprise?: string) =>
      http
        .post(`/sessions/${code}/join`)
        .send({ ...inscription(ETUDIANTE), secretDeReprise });

    const seanceAvecUnPoste = async (): Promise<
      SeanceOuverte & PosteInscrit
    > => {
      const seance = await http.ouvrirSession();
      const poste = await rejoindreDepuis(seance.code).expect(201);
      return { ...seance, ...(poste.body as PosteInscrit) };
    };

    const agirSurLeParticipant = (
      { sessionId, participantId }: SeanceOuverte & PosteInscrit,
      action: 'liberation' | 'eviction',
      formateur = FORMATEUR_A,
    ) => {
      const chemin = `/sessions/${sessionId}/participants/${participantId}`;
      const requete =
        action === 'eviction'
          ? http.delete(chemin)
          : http.post(`${chemin}/liberation`);
      return requete.set(EN_TETE_IDENTITE, `${formateur}:teacher`);
    };

    it.each([
      ['ne presente que le courriel d un inscrit', undefined],
      ['presente un secret de reprise forge', 'A'.repeat(43)],
    ])(
      'refuse en 409 PLACE_DEJA_PRISE le poste qui %s, sans lui remettre de jeton',
      async (_cas, secret) => {
        const { code } = await seanceAvecUnPoste();

        const usurpation = await rejoindreDepuis(code, secret).expect(409);

        expect(usurpation.body).toMatchObject({ code: 'PLACE_DEJA_PRISE' });
        expect(usurpation.body).not.toHaveProperty('jeton');
        expect(usurpation.body).not.toHaveProperty('secretDeReprise');
      },
    );

    it('rend sa place au poste qui presente son secret, et renouvelle le secret a chaque reprise', async () => {
      const { code, participantId, secretDeReprise } =
        await seanceAvecUnPoste();

      const reprise = await rejoindreDepuis(code, secretDeReprise).expect(201);

      expect(reprise.body).toMatchObject({ participantId });
      expect((reprise.body as PosteInscrit).secretDeReprise).not.toBe(
        secretDeReprise,
      );
      await rejoindreDepuis(code, secretDeReprise).expect(409);
    });

    it('laisse le formateur liberer le poste : la place revient au poste suivant, avec son secret', async () => {
      const seance = await seanceAvecUnPoste();

      await agirSurLeParticipant(seance, 'liberation').expect(204);
      const nouveauPoste = await rejoindreDepuis(seance.code).expect(201);

      expect(nouveauPoste.body).toMatchObject({
        participantId: seance.participantId,
      });
      await rejoindreDepuis(seance.code).expect(409);
    });

    it('revoque a la liberation le jeton du poste qui tenait la place', async () => {
      const seance = await seanceAvecUnPoste();
      await http.demarrer(seance.sessionId).expect(204);

      await agirSurLeParticipant(seance, 'liberation').expect(204);
      const titulaire = await rejoindreDepuis(seance.code).expect(201);

      const refus = await http.sujet(seance.sessionId, seance.jeton);
      const acces = await http.sujet(
        seance.sessionId,
        (titulaire.body as PosteInscrit).jeton,
      );

      expect(refus.status).toBe(401);
      expect(acces.status).toBe(200);
    });

    it('refuse la liberation d un poste a un autre formateur', async () => {
      const seance = await seanceAvecUnPoste();

      await agirSurLeParticipant(seance, 'liberation', FORMATEUR_B).expect(403);
      const place = await rejoindreDepuis(seance.code).expect(409);

      expect(place.body).toMatchObject({ code: 'PLACE_DEJA_PRISE' });
    });

    it('refuse en 400 un participant qui n est pas un uuid, avec le message de ParseUUIDPipe', async () => {
      const seance = await seanceAvecUnPoste();

      const refus = await agirSurLeParticipant(
        { ...seance, participantId: 'pas-un-uuid' },
        'eviction',
      ).expect(400);

      expect(refus.body).toMatchObject({
        message: 'Validation failed (uuid is expected)',
      });
    });

    it('laisse passer au cas d usage un uuid bien forme hors version RFC', async () => {
      const seance = await seanceAvecUnPoste();

      const absent = await agirSurLeParticipant(
        { ...seance, participantId: '11111111-1111-1111-1111-111111111111' },
        'eviction',
      ).expect(404);

      expect(absent.body).not.toMatchObject({
        message: 'Validation failed (uuid is expected)',
      });
    });

    it('refuse en 403 PARTICIPANT_EVINCE l evince qui revient sous le meme courriel', async () => {
      const seance = await seanceAvecUnPoste();

      await agirSurLeParticipant(seance, 'eviction').expect(204);
      const retour = await rejoindreDepuis(
        seance.code,
        seance.secretDeReprise,
      ).expect(403);

      expect(retour.body).toMatchObject({ code: 'PARTICIPANT_EVINCE' });
      expect(retour.body).not.toHaveProperty('jeton');
    });
  });

  describe('soumission d une reponse', () => {
    let sessionId: string;
    let jeton: string;

    beforeAll(async () => {
      ({ sessionId, jeton } = await seanceSurLaSentinelle(
        '11111111-1111-4111-8111-111111111114',
      ));
    });

    it('refuse une reponse avant que le formateur ait demarre la seance', async () => {
      const session = await http.ouvrirSession();
      const poste = await http.inscrire(
        session.code,
        '11111111-1111-4111-8111-111111111118',
      );

      const reponse = await http.repondre(
        session.sessionId,
        poste.jeton,
        TEMOIN.solution,
      );

      expect(reponse.status).toBe(409);
      expect(reponse.body).toMatchObject({ code: 'SEANCE_NON_DEMARREE' });
      expect((reponse.body as { detail: string }).detail).toContain(
        'pas encore commencé',
      );
    });

    it('distingue par son code la seconde reponse a une meme question', async () => {
      const seance = await seanceSurLaSentinelle(
        '11111111-1111-4111-8111-111111111122',
      );
      const envoyer = () =>
        http.repondre(seance.sessionId, seance.jeton, TEMOIN.solution);
      await envoyer().expect(201);

      const seconde = await envoyer();

      expect(seconde.status).toBe(409);
      expect(seconde.body).toMatchObject({ code: 'REPONSE_DEJA_ENREGISTREE' });
    });

    it('refuse une reponse sans jeton de participant', async () => {
      const reponse = await http
        .post(`/sessions/${sessionId}/answers`)
        .send({ questionId: TEMOIN.question, valeur: 1, dureeMs: 1000 });

      expect(reponse.status).toBe(401);
    });

    it('refuse un jeton emis pour une autre session', async () => {
      const autre = await http.ouvrirSession();

      const reponse = await http.repondre(autre.sessionId, jeton, 1);

      expect(reponse.status).toBe(401);
    });

    it('ne renvoie pas la solution avec le verdict de correction', async () => {
      const reponse = await http
        .repondre(sessionId, jeton, TEMOIN.piege, 42000)
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

    const constaterEnRejoignant = (studentKey: string) =>
      http.inscrire(code, studentKey);

    beforeAll(async () => {
      ({ sessionId, code } = await http.ouvrirSession());
    });

    it('refuse a un utilisateur sans role formateur', async () => {
      const reponse = await http.piloter(
        sessionId,
        { ecran: 1 },
        FORMATEUR_B,
        'student',
      );

      expect(reponse.status).toBe(403);
    });

    it('refuse a un autre formateur de piloter, de clore et de lire', async () => {
      const pilotage = await http.piloter(sessionId, { ecran: 1 }, FORMATEUR_B);
      const demarrage = await http.demarrer(sessionId, FORMATEUR_B);
      const cloture = await http.postEnFormateur(
        `/sessions/${sessionId}/close`,
        FORMATEUR_B,
      );
      const lecture = await http.lireEnFormateur(
        sessionId,
        'results',
        FORMATEUR_B,
      );

      expect([
        pilotage.status,
        demarrage.status,
        cloture.status,
        lecture.status,
      ]).toEqual([403, 403, 403, 403]);
    });

    it('laisse la session intacte apres les tentatives du second formateur', async () => {
      const constat = await constaterEnRejoignant(
        '11111111-1111-4111-8111-111111111115',
      );

      expect(constat).toMatchObject({ sessionId, ecranCourant: 0 });
    });

    it('accepte le pilotage du formateur proprietaire', async () => {
      await http.piloter(sessionId, { ecran: 4 }).expect(204);

      const constat = await constaterEnRejoignant(
        '11111111-1111-4111-8111-111111111116',
      );
      expect(constat).toMatchObject({ ecranCourant: 4 });
    });

    it('refuse un ecran hors du cours pour le formateur proprietaire', async () => {
      const reponse = await http.piloter(sessionId, { ecran: 99 });

      expect(reponse.status).toBe(400);

      const constat = await constaterEnRejoignant(
        '11111111-1111-4111-8111-111111111119',
      );
      expect(constat).toMatchObject({ ecranCourant: 4 });
    });

    it('refuse un pilotage vide', async () => {
      const reponse = await http.piloter(sessionId, {});

      expect(reponse.status).toBe(400);
    });

    it('ne bascule ni l ecran ni le rythme quand le rythme libre arrive sans intervalle', async () => {
      const reponse = await http.piloter(sessionId, {
        ecran: 7,
        mode: 'libre',
      });

      expect(reponse.status).toBe(400);

      const constat = await constaterEnRejoignant(
        '11111111-1111-4111-8111-11111111111a',
      );
      expect(constat).toMatchObject({
        ecranCourant: 4,
        modeRythme: 'pilote',
      });
    });
  });

  describe('deroule du presentateur', () => {
    let sessionId: string;

    beforeAll(async () => {
      ({ sessionId } = await http.ouvrirSession());
    });

    it('sert le deroule annote au formateur proprietaire', async () => {
      const reponse = await http.lireEnFormateur(sessionId, 'deroule');

      expect(reponse.status).toBe(200);
      expect((reponse.body as { id: string }).id).toBe(COURS_SENTINELLE.slug);
    });

    it.each([
      ['a un autre formateur', FORMATEUR_B, 'teacher'],
      ['a un role autre que formateur', FORMATEUR_A, 'student'],
    ])('refuse le deroule %s', async (_cas, formateur, role) => {
      const reponse = await http.enFormateur(
        `/sessions/${sessionId}/deroule`,
        formateur,
        role,
      );

      expect(reponse.status).toBe(403);
    });

    it.each(['annotations', 'free-responses'])(
      'laisse le pupitre relire %s toutes les deux secondes et a chaque ecran du B2-01 servi dans la minute',
      async (lecture) => {
        const relecturesPeriodiques = 30;
        const statuts: number[] = [];

        for (
          let appel = 0;
          appel < relecturesPeriodiques + COURS_B2_01.ecrans.length;
          appel += 1
        ) {
          statuts.push((await http.lireEnFormateur(sessionId, lecture)).status);
        }

        expect(statuts.filter((statut) => statut !== 200)).toEqual([]);
      },
    );
  });

  describe('T5 · T7 · pentest du volume des ecritures etudiantes', () => {
    let sessionId: string;
    let jetonDuBavard: string;
    let jetonDuVoisin: string;

    const ecrire = (chemin: string, jetonDuPoste: string, corps: object) =>
      http
        .post(`/sessions/${sessionId}/${chemin}`)
        .set(EN_TETE_JETON, jetonDuPoste)
        .send(corps);

    const reponseLibre = (response: string) =>
      ecrire('free-responses', jetonDuVoisin, {
        screenId: 'E-NUM',
        activityId: 'activite',
        response,
        dureeMs: 1000,
      });

    beforeAll(async () => {
      const session = await http.ouvrirSession();
      sessionId = session.sessionId;
      [{ jeton: jetonDuBavard }, { jeton: jetonDuVoisin }] = await Promise.all(
        [
          '11111111-1111-4111-8111-111111111141',
          '11111111-1111-4111-8111-111111111142',
        ].map((cle) => http.inscrire(session.code, cle)),
      );
      await servirLaSentinelle(sessionId);
    });

    it.each([
      [
        'une reponse de plus de 200 caracteres',
        'answers',
        {
          questionId: TEMOIN.question,
          valeur: 'x'.repeat(201),
          dureeMs: 1000,
        },
      ],
      [
        'une reponse libre de plus de 10 000 caracteres',
        'free-responses',
        {
          screenId: 'E-NUM',
          activityId: 'activite',
          response: 'x'.repeat(10_001),
          dureeMs: 1000,
        },
      ],
      [
        `un lot de plus de ${MAX_INCIDENTS_PAR_ENVOI} incidents`,
        'incidents',
        {
          incidents: Array.from(
            { length: MAX_INCIDENTS_PAR_ENVOI + 1 },
            () => ({
              type: 'tab_hidden',
              horodatage: new Date().toISOString(),
            }),
          ),
        },
      ],
    ])('T5 · refuse en 400 %s', async (_cas, chemin, corps) => {
      const reponse = await ecrire(chemin, jetonDuVoisin, corps);

      expect(reponse.status).toBe(400);
    });

    it('T5 · laisse la validation, et non l analyseur, juger un corps sous la limite de production', async () => {
      const reponse = await reponseLibre('x'.repeat(500_000));

      expect(reponse.status).toBe(400);
    });

    it('T5 · refuse en 413 un corps au-dela de la limite de production, avant tout traitement', async () => {
      const reponse = await reponseLibre('x'.repeat(700_000));

      expect(reponse.status).toBe(413);
    });

    it('T7 · rend 429 au poste qui depasse sa limite sans penaliser son voisin de la meme adresse', async () => {
      const lireLeSujet = (jetonDuPoste: string) =>
        http.sujet(sessionId, jetonDuPoste);
      const statutsDuBavard: number[] = [];
      for (let appel = 0; appel <= LIMITE_SUJET_PAR_PARTICIPANT; appel += 1) {
        statutsDuBavard.push((await lireLeSujet(jetonDuBavard)).status);
      }

      const voisin = await lireLeSujet(jetonDuVoisin);

      expect(statutsDuBavard.at(-1)).toBe(429);
      expect(statutsDuBavard.slice(0, -1)).not.toContain(429);
      expect(voisin.status).toBe(statutsDuBavard[0]);
    });
  });

  describe('cloture et flux temps reel', () => {
    let sessionId: string;
    let jeton: string;

    beforeAll(async () => {
      const session = await http.ouvrirSession();
      sessionId = session.sessionId;
      ({ jeton } = await http.inscrire(
        session.code,
        '11111111-1111-4111-8111-111111111117',
      ));
      mailer.sendSyntheseFormateur.mockClear();
      scores.saveIndividuals.mockClear();
      scores.saveSession.mockClear();
    });

    it('ne persiste aucun score a la lecture des resultats ni du bilan', async () => {
      for (const lecture of ['results', 'report']) {
        await http.lireEnFormateur(sessionId, lecture).expect(200);
      }

      expect(scores.saveIndividuals).not.toHaveBeenCalled();
      expect(scores.saveSession).not.toHaveBeenCalled();
    });

    it('cloture et adresse la synthese a la boite configuree, jamais au teacherId', async () => {
      await http.postEnFormateur(`/sessions/${sessionId}/close`).expect(204);

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
      const reponse = await http.flux(sessionId, jeton).expect(200);

      expect(reponse.headers['content-type']).toContain('text/event-stream');
      expect(reponse.text).toContain('event: fin');
      attendreSansCorrige(reponse.text);
    });

    it('retourne un code metier quand un participant repond apres la cloture', async () => {
      const reponse = await http.repondre(sessionId, jeton, TEMOIN.solution);

      expect(reponse.status).toBe(409);
      expect(reponse.body).toMatchObject({ code: 'SEANCE_TERMINEE' });
    });

    it('n ouvre pas le flux a qui connait le sessionId sans etre inscrit', async () => {
      const sansJeton = await http.get(`/sessions/${sessionId}/stream`);
      const jetonDAilleurs = await http.flux(
        sessionId,
        `${randomUUID()}.empreinte-forgee`,
      );

      expect([sansJeton.status, jetonDAilleurs.status]).toEqual([401, 401]);
    });

    it('T3 · refuse le flux de la seance au jeton authentique d une autre seance', async () => {
      const autre = await http.ouvrirSession();
      const { jeton: jetonAuthentique } = await http.inscrire(
        autre.code,
        '11111111-1111-4111-8111-111111111131',
      );

      const reponse = await http.flux(sessionId, jetonAuthentique);

      expect(reponse.status).toBe(401);
      expect(reponse.headers['content-type']).not.toContain(
        'text/event-stream',
      );
    });

    it('T3 · refuse le flux a un jeton dont un seul caractere de la signature est altere', async () => {
      const dernier = jeton.at(-1);
      const altere = `${jeton.slice(0, -1)}${dernier === 'a' ? 'b' : 'a'}`;

      const reponse = await http.flux(sessionId, altere);

      expect(reponse.status).toBe(401);
    });

    it('sert le flux presentateur au formateur proprietaire et a lui seul', async () => {
      const proprietaire = await http.lireEnFormateur(
        sessionId,
        'presenter-stream',
      );
      const intrus = await http.lireEnFormateur(
        sessionId,
        'presenter-stream',
        FORMATEUR_B,
      );

      expect(proprietaire.status).toBe(200);
      expect(proprietaire.headers['content-type']).toContain(
        'text/event-stream',
      );
      expect(intrus.status).toBe(403);
      attendreSansCorrige(proprietaire.text);
    });

    it('pousse les resultats agreges au seul flux du formateur', async () => {
      const presentateur = await http
        .lireEnFormateur(sessionId, 'presenter-stream')
        .expect(200);
      const etudiant = await http.flux(sessionId, jeton).expect(200);

      expect(presentateur.text).toContain('event: resultats');
      expect(etudiant.text).not.toContain('event: resultats');
    });
  });
});

describe('Une salle informatique derriere une seule adresse publique', () => {
  let app: INestApplication;
  let codeDeLaSeance = '';
  const codesOuverts: string[] = [];

  const http = clientFormations(() => app);

  const ouvrirSeanceDeClasse = async (): Promise<string> => {
    const { code } = await http.ouvrirSession(COURS_DE_CLASSE.slug);
    codesOuverts.push(code);
    return code;
  };

  const rejoindre = (code: string, index: number) =>
    http.rejoindre(code, cleEtudiant(index));

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

  const http = clientFormations(() => app);

  const seanceAvecUnInscrit = async (
    studentKey: string,
  ): Promise<SeanceOuverte & PosteInscrit> => {
    const seance = await http.ouvrirSession();
    return { ...seance, ...(await http.inscrire(seance.code, studentKey)) };
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
    const { sessionId } = await http.ouvrirSession();

    const reponse = await http.get(`/sessions/${sessionId}/sujet`);

    expect(reponse.status).toBe(401);
  });

  it('refuse le sujet d une seance au jeton emis pour une autre seance', async () => {
    const seanceA = await seanceAvecUnInscrit(
      '33333333-3333-4333-8333-333333333335',
    );
    const seanceB = await http.ouvrirSession();

    const reponse = await http.sujet(seanceB.sessionId, seanceA.jeton);

    expect(reponse.status).toBe(401);
    expect(reponse.text).not.toContain(COURS_SENTINELLE.titre);
  });

  it('sert le sujet du tirage du participant sans jamais livrer le corrige', async () => {
    const { sessionId, jeton } = await seanceAvecUnInscrit(
      '33333333-3333-4333-8333-333333333331',
    );

    const reponse = await http.sujet(sessionId, jeton).expect(200);

    expect((reponse.body as { id: string }).id).toBe(COURS_SENTINELLE.slug);
    attendreSansCorrige(reponse.text, BAREME_EN_CLAIR);
  });

  it('laisse un poste relire son sujet a l arrivee et a la revelation de chaque ecran du B2-01 servi en une minute', async () => {
    const { sessionId, jeton } = await seanceAvecUnInscrit(
      '33333333-3333-4333-8333-333333333337',
    );
    const relecturesParEcran = 2;
    const statuts: number[] = [];

    for (
      let lecture = 0;
      lecture < COURS_B2_01.ecrans.length * relecturesParEcran;
      lecture += 1
    ) {
      statuts.push((await http.sujet(sessionId, jeton)).status);
    }

    expect(statuts.filter((statut) => statut !== 200)).toEqual([]);
  });

  it('ne livre pas le contenu des ecrans que le formateur n a pas encore reveles', async () => {
    const { sessionId, jeton } = await seanceAvecUnInscrit(
      '33333333-3333-4333-8333-333333333336',
    );

    const reponse = await http.sujet(sessionId, jeton).expect(200);
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
    const {
      sessionId,
      code,
      jeton: jetonA,
    } = await seanceAvecUnInscrit('33333333-3333-4333-8333-333333333332');
    const { jeton: jetonB } = await http.inscrire(
      code,
      '33333333-3333-4333-8333-333333333333',
    );
    await http.demarrer(sessionId).expect(204);
    await http.piloter(sessionId, { ecran: 4 }).expect(204);

    const sujetA = await http.sujet(sessionId, jetonA).expect(200);
    const sujetB = await http.sujet(sessionId, jetonB).expect(200);

    expect(sujetA.text).not.toEqual(sujetB.text);
  });

  it('refuse de servir un sujet quand le cours a change depuis l ouverture de la seance', async () => {
    const { sessionId, jeton } = await seanceAvecUnInscrit(
      '33333333-3333-4333-8333-333333333334',
    );

    remplacerCatalogue(
      creerCatalogueDeTest(
        construireCoursSentinelle(TEMOIN.solution + 1),
        COURS_DE_CLASSE,
      ),
    );

    const reponse = await http.sujet(sessionId, jeton);

    expect(reponse.status).toBe(409);
    expect((reponse.body as { detail: string }).detail).toContain(
      'nouvelle séance',
    );
  });
});
