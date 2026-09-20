import request from 'supertest';
import type { Test } from 'supertest';
import type {
  Cours,
  Ecran,
  Question,
  QuestionProduction,
} from '../src/modules/formations/domain/contrats/cours';
import { activitesLibres } from '../src/modules/formations/domain/cours/EcranServi';
import { questionsDe } from '../src/modules/formations/domain/cours/Cours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import type { TirageDuCours } from '../src/modules/formations/domain/cours/Tirage';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import { describeDb } from './helpers/db-integration-datasource';
import { installerEnvFormations } from './helpers/env-formations';
import { DELAI_OUVERTURE_CONTEXTE_MS } from './helpers/formations-db';
import {
  clientFormations,
  EN_TETE_IDENTITE,
  monterBancFormations,
  type BancFormations,
  type ClientFormations,
} from './helpers/formations-harness';
import {
  estProduction,
  productionJuste,
  reponseDEnigme,
} from './helpers/reponses-v3';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const SLUG = 'b2-01-traitement-information-chiffree';
const VERSION_V3 = 3;
const TAILLE_CLASSE = 35;
const ADMIN = 'c3333333-3333-4333-8333-333333333333';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'v3-formateur@example.test';
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;
const DUREE_REPONSE_MS = 30_000;
const DELAI_TEST_MS = 900_000;
const BUDGET_SUJET_P95_MS = 1_000;
const BUDGET_PRODUCTIONS_MS = 3_000;
const TAILLE_MAX_SUJET_OCTETS = 150 * 1024;
const CENTILE_95 = 0.95;

interface Inscription {
  participantId: string;
  jeton: string;
}

interface Etudiant extends Inscription {
  readonly index: number;
  readonly tirage: TirageDuCours;
}

const mesures: string[] = [];

function mesurer(libelle: string, observe: string): void {
  mesures.push(`${libelle} : ${observe}`);
}

async function chronometrer<T>(action: () => Promise<T>): Promise<[T, number]> {
  const debut = performance.now();
  const resultat = await action();
  return [resultat, performance.now() - debut];
}

function centile(durees: readonly number[], fraction: number): number {
  const triees = [...durees].sort((gauche, droite) => gauche - droite);
  const rang = Math.min(
    triees.length - 1,
    Math.ceil(fraction * triees.length) - 1,
  );
  return triees[Math.max(0, rang)];
}

function cleEtudiant(index: number): string {
  return `c0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

describeDb('Classe de trente sur le B2-01 V3 (db integration)', () => {
  silenceNestLogger();

  let banc: BancFormations;
  let client: ClientFormations;
  let cours: Cours;
  let sessionId: string;
  let etudiants: Etudiant[] = [];

  const serveur = (): Parameters<typeof request>[0] =>
    banc.app.getHttpServer() as Parameters<typeof request>[0];

  const participant = (
    methode: 'get' | 'post' | 'put',
    chemin: string,
    jeton: string,
  ): Test =>
    request(serveur())
      [methode](client.chemin(chemin))
      .set(EN_TETE_JETON, jeton);

  const piloter = (corps: Record<string, unknown>): Test =>
    client.formateur('patch', `/sessions/${sessionId}/control`).send(corps);

  const lireSujet = (etudiant: Etudiant): Test =>
    participant('get', `/sessions/${sessionId}/sujet`, etudiant.jeton);

  const repondre = (etudiant: Etudiant, question: Question): Test =>
    participant('post', `/sessions/${sessionId}/answers`, etudiant.jeton).send({
      questionId: question.id,
      valeur: etudiant.tirage.solutions[question.id].valeur,
      dureeMs: DUREE_REPONSE_MS,
    });

  const produire = (etudiant: Etudiant, question: QuestionProduction): Test =>
    participant(
      'post',
      `/sessions/${sessionId}/productions`,
      etudiant.jeton,
    ).send({
      questionId: question.id,
      valeur: productionJuste(question),
      dureeMs: DUREE_REPONSE_MS,
    });

  const jouerQuestionsFermees = async (ecran: Ecran): Promise<void> => {
    const fermees = questionsDe(ecran).filter(
      (question) => question.type === 'numeric' || question.type === 'vote',
    );
    if (fermees.length === 0 || ecran.brique === 'fp-spaced') {
      return;
    }
    for (const [rang, question] of fermees.entries()) {
      if (rang > 0 && ecran.brique === 'fp-vote') {
        await piloter({
          pilotage: { screenId: ecran.id, phase: 'revote' },
        }).expect(SANS_CONTENU);
      }
      const envois = await Promise.all(
        etudiants.map((etudiant) => repondre(etudiant, question)),
      );
      expect(
        envois
          .filter((envoi) => envoi.status !== CREE)
          .map((envoi) => ({
            statut: envoi.status,
            corps: envoi.body as unknown,
          })),
      ).toEqual([]);
    }
  };

  const jouerProductions = async (ecran: Ecran): Promise<void> => {
    const productions = questionsDe(ecran).filter(estProduction);
    for (const question of productions) {
      const [envois, duree] = await chronometrer(() =>
        Promise.all(etudiants.map((etudiant) => produire(etudiant, question))),
      );
      expect(envois.filter((envoi) => envoi.status !== CREE)).toEqual([]);
      mesurer(
        `${TAILLE_CLASSE} productions simultanees (${question.id})`,
        `${duree.toFixed(0)} ms (budget ${BUDGET_PRODUCTIONS_MS} ms)`,
      );
      expect(duree).toBeLessThan(BUDGET_PRODUCTIONS_MS);
    }
  };

  const jouerEnigmes = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-escape') {
      return;
    }
    const parcoursId = ecran.proprietes.parcours.id;
    for (const enigme of ecran.enigmes) {
      const envois = await Promise.all(
        etudiants.map((etudiant) =>
          participant(
            'post',
            `/sessions/${sessionId}/escape/${parcoursId}/tentatives`,
            etudiant.jeton,
          ).send({
            enigmeId: enigme.id,
            reponse: reponseDEnigme(enigme),
            dureeMs: DUREE_REPONSE_MS,
          }),
        ),
      );
      expect(envois.filter((envoi) => envoi.status !== CREE)).toEqual([]);
    }
  };

  const jouerJalon = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-pulse') {
      return;
    }
    const sondageId = ecran.proprietes.sondage.id;
    const envois = await Promise.all(
      etudiants.map((etudiant) =>
        participant(
          'put',
          `/sessions/${sessionId}/pulses/${sondageId}`,
          etudiant.jeton,
        ).send({ etat: etudiant.index % 3 === 0 ? 'perdu' : 'clair' }),
      ),
    );
    expect(envois.filter((envoi) => envoi.status !== SANS_CONTENU)).toEqual([]);
  };

  const jouerDefi = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-challenge') {
      return;
    }
    const defiId = ecran.proprietes.probleme.id;
    const envois = await Promise.all(
      etudiants.map((etudiant) =>
        participant(
          'post',
          `/sessions/${sessionId}/defis/${defiId}/tentative`,
          etudiant.jeton,
        ).send({
          texte: `Strategie de l etudiant ${etudiant.index}.`,
          dureeMs: DUREE_REPONSE_MS,
        }),
      ),
    );
    expect(envois.filter((envoi) => envoi.status !== CREE)).toEqual([]);
    await piloter({
      pilotage: { screenId: ecran.id, revele: true },
    }).expect(SANS_CONTENU);
    const strategies = await Promise.all(
      etudiants.map((etudiant) =>
        participant(
          'get',
          `/sessions/${sessionId}/defis/${defiId}/strategies`,
          etudiant.jeton,
        ),
      ),
    );
    expect(strategies.filter((lecture) => lecture.status !== OK)).toEqual([]);
  };

  const jouerRappels = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-spaced') {
      return;
    }
    const lectures = await Promise.all(
      etudiants.map((etudiant) =>
        participant('get', `/sessions/${sessionId}/rappels`, etudiant.jeton),
      ),
    );
    expect(lectures.filter((lecture) => lecture.status !== OK)).toEqual([]);
    expect(
      lectures.every(
        (lecture) =>
          (lecture.body as { questions: unknown[] }).questions.length > 0,
      ),
    ).toBe(true);
  };

  const jouerActiviteLibre = async (ecran: Ecran): Promise<void> => {
    const activites = activitesLibres(cours).get(ecran.id) ?? [];
    if (activites.length === 0) {
      return;
    }
    const premiere = activites[0];
    const envois = await Promise.all(
      etudiants.map((etudiant) =>
        participant(
          'post',
          `/sessions/${sessionId}/free-responses`,
          etudiant.jeton,
        ).send({
          screenId: ecran.id,
          activityId: premiere,
          response: `Note libre de l etudiant ${etudiant.index}.`,
          dureeMs: DUREE_REPONSE_MS,
        }),
      ),
    );
    expect(envois.filter((envoi) => envoi.status !== CREE)).toEqual([]);
  };

  installerEnvFormations({ secret: SECRET, syntheseA: SYNTHESE_A });

  beforeAll(async () => {
    banc = await monterBancFormations();
    await banc.contexte.nettoyer();
    client = clientFormations(banc.app, ADMIN);
    const lu = await banc.contexte.catalogue.trouver(SLUG, VERSION_V3);
    if (lu === null) {
      throw new Error(
        `La version ${VERSION_V3} de ${SLUG} manque a la base migree`,
      );
    }
    cours = lu;
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => {
    await banc.fermer();
    process.stdout.write(`\nMesures V3\n${mesures.join('\n')}\n`);
  });

  it(
    'ouvre la V3 migree pour trente etudiants et sert le sujet dans le budget (AC-34)',
    async () => {
      const ouverture = await request(serveur())
        .post(client.chemin('/sessions'))
        .set(EN_TETE_IDENTITE, `${ADMIN}:admin:teacher`)
        .send({
          courseSlug: SLUG,
          version: VERSION_V3,
          capacite: TAILLE_CLASSE,
        })
        .expect(CREE);
      const { sessionId: ouverte, code } = ouverture.body as {
        sessionId: string;
        code: string;
      };
      sessionId = ouverte;

      const inscriptions = await Promise.all(
        Array.from({ length: TAILLE_CLASSE }, (_, index) =>
          request(serveur())
            .post(client.chemin(`/sessions/${code}/join`))
            .send({
              studentKey: cleEtudiant(index),
              prenom: `Prenom-${index}`,
              nom: `Nom-${index}`,
              email: `v3-${index}@example.test`,
            }),
        ),
      );
      expect(inscriptions.filter((envoi) => envoi.status !== CREE)).toEqual([]);
      etudiants = await Promise.all(
        inscriptions.map(async (envoi, index) => {
          const inscrit = envoi.body as Inscription;
          const graine = await banc.contexte.graineDe(inscrit.participantId);
          return { ...inscrit, index, tirage: tirer(cours, graine) };
        }),
      );
      await client
        .formateur('post', `/sessions/${sessionId}/start`)
        .expect(SANS_CONTENU);

      const lectures = await Promise.all(
        etudiants.map((etudiant) =>
          chronometrer(() => lireSujet(etudiant).expect(OK)),
        ),
      );

      const durees = lectures.map(([, duree]) => duree);
      const p95 = centile(durees, CENTILE_95);
      mesurer(
        `${TAILLE_CLASSE} lectures simultanees du sujet`,
        `p95 ${p95.toFixed(0)} ms (budget ${BUDGET_SUJET_P95_MS} ms)`,
      );
      const octets = Buffer.byteLength(
        JSON.stringify(lectures[0][0].body),
        'utf8',
      );
      mesurer(
        'taille du sujet V3 servi',
        `${(octets / 1024).toFixed(1)} Ko (budget ${TAILLE_MAX_SUJET_OCTETS / 1024} Ko)`,
      );
      expect(p95).toBeLessThan(BUDGET_SUJET_P95_MS);
      expect(octets).toBeLessThanOrEqual(TAILLE_MAX_SUJET_OCTETS);
    },
    DELAI_TEST_MS,
  );

  it(
    'joue chaque ecran de la V3 avec trente etudiants simultanes',
    async () => {
      for (const [rang, ecran] of cours.ecrans.entries()) {
        await piloter({ ecran: rang }).expect(SANS_CONTENU);
        await jouerQuestionsFermees(ecran);
        await jouerProductions(ecran);
        await jouerEnigmes(ecran);
        await jouerJalon(ecran);
        await jouerDefi(ecran);
        await jouerRappels(ecran);
        await jouerActiviteLibre(ecran);
      }

      const reponses = await banc.contexte.answers.listBySession(sessionId);
      mesurer(
        'reponses enregistrees pour la classe',
        `${reponses.length} sur ${cours.ecrans.length} ecrans joues`,
      );
      const parType = new Set(
        reponses.map((reponse) =>
          typeof reponse.valeur === 'object' ? 'production' : 'fermee',
        ),
      );
      expect(reponses.length).toBeGreaterThan(TAILLE_CLASSE);
      expect(parType.has('fermee')).toBe(true);
      expect(parType.has('production')).toBe(true);

      const premier = etudiants[0];
      const jalons = await banc.contexte.pulses.compterParSondage(sessionId);
      const enigmes =
        await banc.contexte.escape.listerProgressionDeSeance(sessionId);
      const libres = await banc.contexte.freeResponses.listerDuParticipant(
        sessionId,
        premier.participantId,
      );
      const rappels = await banc.contexte.rappels.lister(premier.participantId);
      expect(Object.keys(jalons).length).toBeGreaterThan(0);
      expect(enigmes.length).toBeGreaterThan(0);
      expect(libres.length).toBeGreaterThan(0);
      expect(rappels.length).toBeGreaterThan(0);
    },
    DELAI_TEST_MS,
  );

  it(
    'clot la seance de trente etudiants et rend un rapport complet',
    async () => {
      const cloture = await client.formateur(
        'post',
        `/sessions/${sessionId}/close`,
      );
      expect(cloture.status).toBe(SANS_CONTENU);

      const resultats = await client
        .formateur('get', `/sessions/${sessionId}/results`)
        .expect(OK);
      const corps = resultats.body as {
        participants: unknown[];
        resultats: { questions: unknown[] };
      };
      expect(corps.participants).toHaveLength(TAILLE_CLASSE);
      expect(corps.resultats.questions.length).toBeGreaterThan(0);
    },
    DELAI_TEST_MS,
  );
});
