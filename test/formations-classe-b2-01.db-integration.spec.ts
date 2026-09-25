import request from 'supertest';
import type { Response, Test } from 'supertest';
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
import { statutsEnEchec } from './helpers/formations-banc-seance';
import { VERSION_PUBLIEE_SUR_BASE_NEUVE } from './helpers/formations-db';
import {
  clientFormations,
  EN_TETE_IDENTITE,
  installerBancFormationsVierge,
  serveurHttpDe,
  type BancFormations,
  type ClientFormations,
} from './helpers/formations-harness';
import {
  estProduction,
  productionJuste,
  reponseDEnigme,
} from './helpers/reponses-b2-01';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const SLUG = 'b2-01-traitement-information-chiffree';
const VERSION_COURS = VERSION_PUBLIEE_SUR_BASE_NEUVE;
const TAILLE_CLASSE = 35;
const ADMIN = 'c3333333-3333-4333-8333-333333333333';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'classe-formateur@example.test';
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

describeDb('Classe de trente sur le B2-01 (db integration)', () => {
  silenceNestLogger();

  let banc: BancFormations;
  let client: ClientFormations;
  let cours: Cours;
  let sessionId: string;
  let etudiants: Etudiant[] = [];

  const serveur = () => serveurHttpDe(banc.app);

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

  const parChaquePoste = async (
    methode: 'get' | 'post' | 'put',
    cheminDeSeance: string,
    attendu: number,
    corps?: (etudiant: Etudiant) => object,
  ): Promise<Response[]> => {
    const envois = await Promise.all(
      etudiants.map((etudiant) => {
        const envoi = participant(
          methode,
          `/sessions/${sessionId}${cheminDeSeance}`,
          etudiant.jeton,
        );
        return corps === undefined ? envoi : envoi.send(corps(etudiant));
      }),
    );
    expect(statutsEnEchec(envois, attendu)).toEqual([]);
    return envois;
  };

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
      await parChaquePoste(
        'post',
        `/escape/${parcoursId}/tentatives`,
        CREE,
        () => ({
          enigmeId: enigme.id,
          reponse: reponseDEnigme(enigme),
          dureeMs: DUREE_REPONSE_MS,
        }),
      );
    }
  };

  const jouerJalon = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-pulse') {
      return;
    }
    await parChaquePoste(
      'put',
      `/pulses/${ecran.proprietes.sondage.id}`,
      SANS_CONTENU,
      (etudiant) => ({ etat: etudiant.index % 3 === 0 ? 'perdu' : 'clair' }),
    );
  };

  const jouerDefi = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-challenge') {
      return;
    }
    const defiId = ecran.proprietes.probleme.id;
    await parChaquePoste(
      'post',
      `/defis/${defiId}/tentative`,
      CREE,
      (etudiant) => ({
        texte: `Strategie de l etudiant ${etudiant.index}.`,
        dureeMs: DUREE_REPONSE_MS,
      }),
    );
    await piloter({
      pilotage: { screenId: ecran.id, revele: true },
    }).expect(SANS_CONTENU);
    await parChaquePoste('get', `/defis/${defiId}/strategies`, OK);
  };

  const jouerRappels = async (ecran: Ecran): Promise<void> => {
    if (ecran.brique !== 'fp-spaced') {
      return;
    }
    const lectures = await parChaquePoste('get', '/rappels', OK);
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
    await parChaquePoste('post', '/free-responses', CREE, (etudiant) => ({
      screenId: ecran.id,
      activityId: activites[0],
      response: `Note libre de l etudiant ${etudiant.index}.`,
      dureeMs: DUREE_REPONSE_MS,
    }));
  };

  installerBancFormationsVierge(
    { secret: SECRET, syntheseA: SYNTHESE_A },
    async (monte) => {
      banc = monte;
      client = clientFormations(banc.app, ADMIN);
      const lu = await banc.contexte.catalogue.trouver(SLUG, VERSION_COURS);
      if (lu === null) {
        throw new Error(`Le cours ${SLUG} manque a la base migree`);
      }
      cours = lu;
    },
  );

  afterAll(() => {
    process.stdout.write(`\nMesures classe B2-01\n${mesures.join('\n')}\n`);
  });

  it(
    'ouvre le B2-01 publie pour trente etudiants et sert le sujet dans le budget (AC-34)',
    async () => {
      const ouverture = await request(serveur())
        .post(client.chemin('/sessions'))
        .set(EN_TETE_IDENTITE, `${ADMIN}:admin:teacher`)
        .send({
          courseSlug: SLUG,
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
              prenom: `Prenom-${index}`,
              nom: `Nom-${index}`,
              email: `classe-${index}@example.test`,
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
        'taille du sujet B2-01 servi',
        `${(octets / 1024).toFixed(1)} Ko (budget ${TAILLE_MAX_SUJET_OCTETS / 1024} Ko)`,
      );
      expect(p95).toBeLessThan(BUDGET_SUJET_P95_MS);
      expect(octets).toBeLessThanOrEqual(TAILLE_MAX_SUJET_OCTETS);
    },
    DELAI_TEST_MS,
  );

  it(
    'joue chaque ecran du B2-01 avec trente etudiants simultanes',
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
