import { performance } from 'node:perf_hooks';
import type { Test } from 'supertest';
import type { ResultatsDeSeance } from '../src/modules/formations/domain/contrats/resultats';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import type { AnswerValue } from '../src/modules/formations/domain/GradingCore';
import type { ResultatsSeance } from '../src/modules/formations/domain/ResultatsSeance';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import { creerCatalogueDeTest } from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  FORMATEUR_DE_TEST,
  installerBancDeSeance,
  statutsEnEchec,
} from './helpers/formations-banc-seance';
import {
  abonnerAuFlux,
  coursPublie,
  EN_TETE_IDENTITE,
  patienter,
  type FluxEcoute,
} from './helpers/formations-harness';

const TAILLE_CLASSE = 30;
const COURS = coursPublie('b2-01-traitement-information-chiffree');
const QUESTIONS = questionsDuCours(COURS);
const [PREMIERE_QUESTION] = QUESTIONS;
const SYNTHESE_A = 'charge-formateur@example.test';
const { OK, CREE, SANS_CONTENU } = CODE_HTTP;

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

describeDb('Formations sous charge de classe (db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: creerCatalogueDeTest(COURS),
    slug: COURS.slug,
    environnement: { FORMATION_TEACHER_NOTIFICATION_TO: SYNTHESE_A },
  });
  const contexte = () => banc.contexte();

  const rejoindre = (code: string, index: number): Test =>
    banc.anonyme('post', `/sessions/${code}/join`).send(identiteDe(index));

  const repondreJuste = (
    sessionId: string,
    inscrit: Inscrit,
    valeur: AnswerValue,
  ): Test =>
    banc
      .avecJeton('post', `/sessions/${sessionId}/answers`, inscrit.jeton)
      .send({
        questionId: PREMIERE_QUESTION.id,
        valeur,
        dureeMs: DUREE_REPONSE_MS,
      });

  const commander = (chemin: string): Test => banc.formateur('post', chemin);

  const solutionsDe = async (inscrit: Inscrit) =>
    tirer(COURS, await contexte().graineDe(inscrit.participantId)).solutions;

  const preparerClasse = async (): Promise<Classe> => {
    const { sessionId, code } = await banc.ouvrir();
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
      const seed = await contexte().graineDe(inscrit.participantId);
      const { solutions } = tirer(COURS, seed);
      await Promise.all(
        QUESTIONS.map((question, rang) =>
          contexte().answers.create({
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
      contexte().answers.listBySession(classe.sessionId),
    ).resolves.toHaveLength(TAILLE_CLASSE * QUESTIONS.length);
  };

  const ecouter = (
    sessionId: string,
    flux: string,
    enTete: Record<string, string>,
  ): Promise<FluxEcoute> =>
    abonnerAuFlux(
      banc.port(),
      banc.route(`/sessions/${sessionId}/${flux}`),
      enTete,
    );

  afterAll(() => {
    process.stdout.write(`\nMesures de charge\n${mesures.join('\n')}\n`);
  });

  it(
    'rattache trente etudiants simultanes dans le temps d une dictee de code',
    async () => {
      const { sessionId, code } = await banc.ouvrir();

      const [inscriptions, duree] = await chronometrer(() =>
        Promise.all(
          Array.from({ length: TAILLE_CLASSE }, (_, index) =>
            rejoindre(code, index),
          ),
        ),
      );

      expect(statutsEnEchec(inscriptions, CREE)).toEqual([]);
      const inscrits = await contexte().participants.listBySession(sessionId);
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
      const presentateur = await ecouter(classe.sessionId, 'presenter-stream', {
        [EN_TETE_IDENTITE]: `${FORMATEUR_DE_TEST}:teacher`,
      });
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
        contexte().answers.listBySession(classe.sessionId),
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
      expect(banc.mailer().sendSyntheseFormateur.mock.calls).toHaveLength(1);
      expect(banc.mailer().sendCopieEtudiant.mock.calls).toHaveLength(
        TAILLE_CLASSE,
      );
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
        banc.formateur('get', `/sessions/${classe.sessionId}/results`),
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
          ecouter(classe.sessionId, 'stream', {
            [EN_TETE_JETON]: inscrit.jeton,
          }),
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
