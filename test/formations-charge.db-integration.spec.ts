import { performance } from 'node:perf_hooks';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import type { ResultatsDeSeance } from '../src/modules/formations/application/GetSessionResults.useCase';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import type { AnswerValue } from '../src/modules/formations/domain/GradingCore';
import type { IFormationMailer } from '../src/modules/formations/domain/IFormationMailer.port';
import type { ResultatsSeance } from '../src/modules/formations/domain/ResultatsSeance';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  abonnerAuFlux,
  coursPublie,
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  patienter,
  routeFormations,
  serveurHttpDe,
  type FluxEcoute,
} from './helpers/formations-harness';
import {
  ecouterEnBoucleLocale,
  fermerApplication,
} from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const TAILLE_CLASSE = 30;
const COURS = coursPublie('b2-01-traitement-information-chiffree');
const QUESTIONS = questionsDuCours(COURS);
const [PREMIERE_QUESTION] = QUESTIONS;
const FORMATEUR = 'c3333333-3333-4333-8333-333333333333';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'charge-formateur@example.test';
const EN_TETE_JETON = 'x-participant-token';
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;

const BUDGET_RATTACHEMENT_MS = 5_000;
const BUDGET_REPONSES_MS = 3_000;
const BUDGET_CLOTURE_MS = 10_000;
const BUDGET_LECTURE_MS = 2_000;
const BUDGET_CROISSANCE_MEMOIRE = 0.2;
const DUREE_FLUX_MS = 120_000;
const STABILISATION_FLUX_MS = 5_000;
const DELAI_TEST_COURT_MS = 180_000;
const DELAI_TEST_LONG_MS = 300_000;
const POUR_CENT = 100;
const MS_PAR_SECONDE = 1000;
const DUREE_REPONSE_MS = 12_000;
const ATTENTE_RESULTATS_MS = 15_000;
const PAS_SONDAGE_MS = 50;

interface Inscrit {
  participantId: string;
  sessionId: string;
  jeton: string;
}

interface Classe {
  sessionId: string;
  inscrits: Inscrit[];
}

const mesures: string[] = [];

function decimales(valeur: number): string {
  return valeur.toFixed(2).replace('.', ',');
}

function secondes(ms: number): string {
  return `${decimales(ms / MS_PAR_SECONDE)} s`;
}

function pourcentage(ratio: number): string {
  return `${decimales(ratio * POUR_CENT)} %`;
}

function dansLeBudget(budget: string): string {
  return `dans le budget de ${budget}`;
}

function exigerDuree(
  libelle: string,
  observeMs: number,
  budgetMs: number,
): void {
  const budget = secondes(budgetMs);
  mesures.push(`${libelle} : ${secondes(observeMs)} (budget ${budget})`);
  expect(
    observeMs <= budgetMs
      ? dansLeBudget(budget)
      : `${secondes(observeMs)} pour un budget de ${budget}`,
  ).toBe(dansLeBudget(budget));
}

function exigerCroissance(
  libelle: string,
  observe: number,
  plafond: number,
): void {
  const budget = pourcentage(plafond);
  mesures.push(`${libelle} : ${pourcentage(observe)} (budget ${budget})`);
  expect(
    observe <= plafond
      ? dansLeBudget(budget)
      : `${pourcentage(observe)} pour un budget de ${budget}`,
  ).toBe(dansLeBudget(budget));
}

async function chronometrer<T>(action: () => Promise<T>): Promise<[T, number]> {
  const depart = performance.now();
  const valeur = await action();
  return [valeur, performance.now() - depart];
}

function memoireStabilisee(): number {
  const collecter = (globalThis as { gc?: () => void }).gc;
  collecter?.();
  collecter?.();
  return process.memoryUsage().heapUsed;
}

function identiteDe(index: number): Record<string, string> {
  return {
    prenom: `Prenom-${index}`,
    nom: `Nom-${index}`,
    email: `charge-${index}@example.test`,
  };
}

function totalPousse(flux: FluxEcoute, questionId: string): number {
  const derniers = flux.evenements
    .filter((evenement) => evenement.type === 'resultats')
    .map((evenement) => evenement.donnees as unknown as ResultatsSeance)
    .at(-1);
  return (
    derniers?.questions.find((question) => question.questionId === questionId)
      ?.total ?? 0
  );
}

async function attendreTotalPousse(
  flux: FluxEcoute,
  questionId: string,
  attendu: number,
): Promise<number> {
  const limite = Date.now() + ATTENTE_RESULTATS_MS;
  while (totalPousse(flux, questionId) !== attendu && Date.now() < limite) {
    await patienter(PAS_SONDAGE_MS);
  }
  return totalPousse(flux, questionId);
}

function statutsEnEchec(
  reponses: readonly Response[],
  attendu: number,
): number[] {
  return reponses
    .map((reponse) => reponse.status)
    .filter((statut) => statut !== attendu);
}

describeDb('Formations sous charge de classe (db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let mailer: jest.Mocked<IFormationMailer>;
  let port: number;

  const serveur = () => serveurHttpDe(app);

  const route = routeFormations;

  const rejoindre = (code: string, index: number): Test =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send(identiteDe(index));

  const repondreJuste = (
    sessionId: string,
    inscrit: Inscrit,
    valeur: AnswerValue,
  ): Test =>
    request(serveur())
      .post(route(`/sessions/${sessionId}/answers`))
      .set(EN_TETE_JETON, inscrit.jeton)
      .send({
        questionId: PREMIERE_QUESTION.id,
        valeur,
        dureeMs: DUREE_REPONSE_MS,
      });

  const commander = (chemin: string): Test =>
    request(serveur())
      .post(route(chemin))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`);

  const ouvrirSeance = (): Test =>
    commander('/sessions').send({ courseSlug: COURS.slug });

  const solutionsDe = async (inscrit: Inscrit) =>
    tirer(COURS, await contexte.graineDe(inscrit.participantId)).solutions;

  const preparerClasse = async (): Promise<Classe> => {
    const ouverture = await ouvrirSeance().expect(CREE);
    const { sessionId, code } = ouverture.body as {
      sessionId: string;
      code: string;
    };
    const inscrits: Inscrit[] = [];
    for (let index = 0; index < TAILLE_CLASSE; index += 1) {
      const inscription = await rejoindre(code, index).expect(CREE);
      inscrits.push(inscription.body as Inscrit);
    }
    await commander(`/sessions/${sessionId}/start`).expect(SANS_CONTENU);
    return { sessionId, inscrits };
  };

  const semerReponses = async (classe: Classe): Promise<void> => {
    for (const inscrit of classe.inscrits) {
      const seed = await contexte.graineDe(inscrit.participantId);
      const { solutions } = tirer(COURS, seed);
      await Promise.all(
        QUESTIONS.map((question, rang) =>
          contexte.answers.create({
            sessionId: classe.sessionId,
            participantId: inscrit.participantId,
            questionId: question.id,
            concept: question.concept,
            valeur: solutions[question.id].valeur,
            seed,
            correcte: true,
            misconception: null,
            dureeMs: DUREE_REPONSE_MS + rang,
          }),
        ),
      );
    }
    await expect(
      contexte.answers.listBySession(classe.sessionId),
    ).resolves.toHaveLength(TAILLE_CLASSE * QUESTIONS.length);
  };

  const ouvrirFlux = (sessionId: string, jeton: string): Promise<FluxEcoute> =>
    abonnerAuFlux(port, route(`/sessions/${sessionId}/stream`), {
      [EN_TETE_JETON]: jeton,
    });

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;
    contexte = await ouvrirContexteFormations();
    mailer = createMockFormationMailer();
    app = await monterApplicationFormations({
      ...contexte,
      mailer,
    });
    port = await ecouterEnBoucleLocale(app);
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
    process.stdout.write(`\nMesures de charge\n${mesures.join('\n')}\n`);
  });

  beforeEach(async () => {
    await contexte.nettoyer();
    jest.clearAllMocks();
  });

  it(
    'rattache trente etudiants simultanes dans le temps d une dictee de code',
    async () => {
      const ouverture = await ouvrirSeance().expect(CREE);
      const { sessionId, code } = ouverture.body as {
        sessionId: string;
        code: string;
      };

      const [inscriptions, duree] = await chronometrer(() =>
        Promise.all(
          Array.from({ length: TAILLE_CLASSE }, (_, index) =>
            rejoindre(code, index),
          ),
        ),
      );

      expect(statutsEnEchec(inscriptions, CREE)).toEqual([]);
      const inscrits = await contexte.participants.listBySession(sessionId);
      expect(new Set(inscrits.map((inscrit) => inscrit.seed)).size).toBe(
        TAILLE_CLASSE,
      );
      exigerDuree(
        'rattachement de trente etudiants',
        duree,
        BUDGET_RATTACHEMENT_MS,
      );
    },
    DELAI_TEST_COURT_MS,
  );

  it(
    'encaisse trente reponses simultanees au meme enonce, flux du formateur ouvert',
    async () => {
      const classe = await preparerClasse();
      const valeurs = await Promise.all(
        classe.inscrits.map(
          async (inscrit) =>
            (await solutionsDe(inscrit))[PREMIERE_QUESTION.id].valeur,
        ),
      );
      const presentateur = await abonnerAuFlux(
        port,
        route(`/sessions/${classe.sessionId}/presenter-stream`),
        { [EN_TETE_IDENTITE]: `${FORMATEUR}:teacher` },
      );
      await attendreTotalPousse(presentateur, PREMIERE_QUESTION.id, 0);

      const [envois, duree] = await chronometrer(() =>
        Promise.all(
          classe.inscrits.map((inscrit, rang) =>
            repondreJuste(classe.sessionId, inscrit, valeurs[rang]),
          ),
        ),
      );
      const pousses = await attendreTotalPousse(
        presentateur,
        PREMIERE_QUESTION.id,
        TAILLE_CLASSE,
      );
      presentateur.fermer();

      expect(statutsEnEchec(envois, CREE)).toEqual([]);
      await expect(
        contexte.answers.listBySession(classe.sessionId),
      ).resolves.toHaveLength(TAILLE_CLASSE);
      expect({
        statut: presentateur.statut,
        totalPousse: pousses,
      }).toEqual({ statut: OK, totalPousse: TAILLE_CLASSE });
      exigerDuree(
        'trente reponses au meme enonce, flux formateur ouvert',
        duree,
        BUDGET_REPONSES_MS,
      );
    },
    DELAI_TEST_COURT_MS,
  );

  it(
    'cloture une seance de trente etudiants ayant repondu a toutes les questions du cours',
    async () => {
      const classe = await preparerClasse();
      await semerReponses(classe);

      const [cloture, duree] = await chronometrer(() =>
        commander(`/sessions/${classe.sessionId}/close`),
      );

      expect(cloture.status).toBe(SANS_CONTENU);
      expect(mailer.sendSyntheseFormateur.mock.calls).toHaveLength(1);
      expect(mailer.sendCopieEtudiant.mock.calls).toHaveLength(TAILLE_CLASSE);
      exigerDuree(
        `cloture de ${TAILLE_CLASSE * QUESTIONS.length} reponses`,
        duree,
        BUDGET_CLOTURE_MS,
      );
    },
    DELAI_TEST_LONG_MS,
  );

  it(
    'rend les resultats d une seance de trente etudiants',
    async () => {
      const classe = await preparerClasse();
      await semerReponses(classe);

      const [lecture, duree] = await chronometrer(() =>
        request(serveur())
          .get(route(`/sessions/${classe.sessionId}/results`))
          .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`),
      );

      const corps = lecture.body as ResultatsDeSeance;
      expect(lecture.status).toBe(OK);
      expect(corps.participants).toHaveLength(TAILLE_CLASSE);
      expect(corps.resultats.questions).toHaveLength(QUESTIONS.length);
      exigerDuree('lecture des resultats', duree, BUDGET_LECTURE_MS);
    },
    DELAI_TEST_LONG_MS,
  );

  it(
    'tient trente abonnements au flux deux minutes sans gonfler la memoire',
    async () => {
      const classe = await preparerClasse();

      const abonnements = await Promise.all(
        classe.inscrits.map((inscrit) =>
          ouvrirFlux(classe.sessionId, inscrit.jeton),
        ),
      );
      expect(
        abonnements
          .map((abonnement) => abonnement.statut)
          .filter((statut) => statut !== OK),
      ).toEqual([]);

      await patienter(STABILISATION_FLUX_MS);
      const depart = memoireStabilisee();
      await patienter(DUREE_FLUX_MS);
      const arrivee = memoireStabilisee();
      const coupes = abonnements.filter((abonnement) => abonnement.ferme);
      for (const abonnement of abonnements) {
        abonnement.fermer();
      }

      expect(coupes).toEqual([]);
      exigerCroissance(
        'trente flux tenus deux minutes',
        (arrivee - depart) / depart,
        BUDGET_CROISSANCE_MEMOIRE,
      );
    },
    DELAI_TEST_LONG_MS,
  );
});
