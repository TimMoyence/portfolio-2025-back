import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import type {
  Bareme,
  BaremeQuestion,
  BaremeTirage,
} from '../src/modules/formations/domain/Bareme';
import type { RapportSession } from '../src/modules/formations/domain/IFormationMailer.port';
import { SessionCode } from '../src/modules/formations/domain/SessionCode';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const TAILLE_CLASSE = 30;
const NB_QUESTIONS = 2;
const COURS = 'b1-09-interets-composes';
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const AUTRE_FORMATEUR = 'b2222222-2222-4222-8222-222222222222';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const EN_TETE_JETON = 'x-participant-token';
const CODE_DOUBLON = '4271';
const CODE_DE_REPLI = '5382';
const MESSAGE_CLOTURE =
  'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.';
const ECRAN_PROPRIETAIRE_PREMIER = 4;
const ECRAN_PROPRIETAIRE_SECOND = 6;
const ECRAN_INTRUS_PREMIER = 9;
const ECRAN_INTRUS_SECOND = 11;
const PREMIERE_GRAINE = 6000;
const MAX_SONDAGES = 200;
const PAS_SONDAGE_MS = 25;
const CREE = 201;
const SANS_CONTENU = 204;
const INTERDIT = 403;
const CONFLIT = 409;

interface ReponseInscription {
  participantId: string;
  sessionId: string;
  seed: number;
  jeton: string;
}

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

function identifiantQuestion(question: number): string {
  return `Q-CONC-${String(question).padStart(2, '0')}`;
}

function cleEtudiant(index: number): string {
  return `44444444-4444-4444-8444-${String(index).padStart(12, '0')}`;
}

function valeurJuste(tirage: number, question: number): number {
  return 700000 + tirage * 100 + question;
}

function construireBareme(): Bareme {
  const questions: BaremeQuestion[] = [];
  for (let question = 0; question < NB_QUESTIONS; question += 1) {
    questions.push({
      id: identifiantQuestion(question),
      type: 'numeric',
      concept: 'capitalisation',
      noteCompte: true,
    });
  }
  const tirages: BaremeTirage[] = [];
  for (let rang = 0; rang < TAILLE_CLASSE; rang += 1) {
    const solutions: Record<string, { valeur: number; pieges: [] }> = {};
    questions.forEach((question, index) => {
      solutions[question.id] = { valeur: valeurJuste(rang, index), pieges: [] };
    });
    tirages.push({ seed: PREMIERE_GRAINE + rang, solutions });
  }
  return { version: 1, graineReference: 9_999_999, questions, tirages };
}

function statutsEnEchec(
  reponses: readonly Response[],
  attendu: number,
): number[] {
  return reponses
    .map((reponse) => reponse.status)
    .filter((statut) => statut !== attendu);
}

function detailDe(reponse: Response): unknown {
  return (reponse.body as { detail?: unknown }).detail;
}

function trier(valeurs: readonly string[]): string[] {
  return [...valeurs].sort((gauche, droite) => gauche.localeCompare(droite));
}

describeDb('Formations sous requetes simultanees (db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const ouvrir = (): Test =>
    request(serveur())
      .post(route('/sessions'))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .send({ courseSlug: COURS, bareme: construireBareme() });

  const inscrire = (code: string, index: number): Test =>
    request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send({
        studentKey: cleEtudiant(index),
        prenom: `Prenom-${index}`,
        nom: `Nom-${index}`,
        email: `etudiant-${index}@example.test`,
      });

  const repondre = (sessionId: string, jeton: string, question: number): Test =>
    request(serveur())
      .post(route(`/sessions/${sessionId}/answers`))
      .set(EN_TETE_JETON, jeton)
      .send({
        questionId: identifiantQuestion(question),
        valeur: 1,
        dureeMs: 12000,
      });

  const piloter = (sessionId: string, teacherId: string, ecran: number): Test =>
    request(serveur())
      .patch(route(`/sessions/${sessionId}/control`))
      .set(EN_TETE_IDENTITE, `${teacherId}:teacher`)
      .send({ ecran });

  const fermer = (sessionId: string): Test =>
    request(serveur())
      .post(route(`/sessions/${sessionId}/close`))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`);

  const ouvrirSeance = async (): Promise<ReponseOuverture> => {
    const reponse = await ouvrir().expect(CREE);
    return reponse.body as ReponseOuverture;
  };

  const premierInscrit = async (code: string): Promise<ReponseInscription> => {
    const reponse = await inscrire(code, 0).expect(CREE);
    return reponse.body as ReponseInscription;
  };

  const demarrer = async (sessionId: string): Promise<void> => {
    await request(serveur())
      .post(route(`/sessions/${sessionId}/start`))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .expect(SANS_CONTENU);
  };

  const ecranDe = async (sessionId: string): Promise<number | undefined> =>
    (await contexte.sessions.findById(sessionId))?.ecranCourant;

  const codesEnBase = async (): Promise<string[]> => {
    const lignes: Array<{ code: string }> = await contexte.dataSource.query(
      `SELECT code FROM formation_sessions`,
    );
    return lignes.map((ligne) => ligne.code);
  };

  const insertionsBloquees = async (): Promise<number> => {
    const lignes: Array<{ total: string }> = await contexte.dataSource.query(
      `SELECT count(*)::text AS total FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE 'INSERT INTO "formation_sessions"%'`,
    );
    return Number(lignes[0].total);
  };

  const attendreInsertionBloquee = async (): Promise<number> => {
    for (let sondage = 0; sondage < MAX_SONDAGES; sondage += 1) {
      const total = await insertionsBloquees();
      if (total > 0) {
        return total;
      }
      await new Promise((resoudre) => setTimeout(resoudre, PAS_SONDAGE_MS));
    }
    return 0;
  };

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    contexte = await ouvrirContexteFormations();
    app = await monterApplicationFormations({
      sessions: contexte.sessions,
      participants: contexte.participants,
      answers: contexte.answers,
      incidents: contexte.incidents,
      mastery: contexte.mastery,
      mailer: createMockFormationMailer(),
    });
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
    await contexte.fermer();
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
  });

  beforeEach(async () => {
    await contexte.nettoyer();
  });

  it('attribue trente graines distinctes a trente inscriptions simultanees', async () => {
    const { sessionId, code } = await ouvrirSeance();

    const inscriptions = await Promise.all(
      Array.from({ length: TAILLE_CLASSE }, (_, index) =>
        inscrire(code, index),
      ),
    );

    expect(statutsEnEchec(inscriptions, CREE)).toEqual([]);
    const graines = inscriptions.map(
      (reponse) => (reponse.body as ReponseInscription).seed,
    );
    expect(new Set(graines).size).toBe(TAILLE_CLASSE);

    const enBase = await contexte.participants.listBySession(sessionId);
    expect(enBase).toHaveLength(TAILLE_CLASSE);
    expect(new Set(enBase.map((participant) => participant.seed)).size).toBe(
      TAILLE_CLASSE,
    );
  }, 120_000);

  it('n enregistre qu une des deux reponses simultanees au meme enonce', async () => {
    const { sessionId, code } = await ouvrirSeance();
    const etudiant = await premierInscrit(code);
    await demarrer(sessionId);

    const envois = await Promise.all([
      repondre(sessionId, etudiant.jeton, 0),
      repondre(sessionId, etudiant.jeton, 0),
    ]);

    expect(
      envois
        .map((reponse) => reponse.status)
        .sort((gauche, droite) => gauche - droite),
    ).toEqual([CREE, CONFLIT]);
    await expect(
      contexte.answers.listBySession(sessionId),
    ).resolves.toHaveLength(1);
  }, 60_000);

  it('retire un autre code quand deux ouvertures simultanees tirent le meme', async () => {
    const tirage = jest
      .spyOn(SessionCode, 'generate')
      .mockReturnValueOnce(CODE_DOUBLON)
      .mockReturnValue(CODE_DE_REPLI);
    const concurrente = contexte.dataSource.createQueryRunner();
    await concurrente.connect();
    await concurrente.startTransaction();
    await concurrente.query(
      `INSERT INTO "formation_sessions" ("course_slug", "teacher_id", "code", "bareme") VALUES ($1, $2, $3, $4)`,
      [
        COURS,
        AUTRE_FORMATEUR,
        CODE_DOUBLON,
        JSON.stringify(construireBareme()),
      ],
    );

    const ouverture = ouvrir().then((reponse) => reponse);
    const bloquees = await attendreInsertionBloquee();
    await concurrente.commitTransaction();
    await concurrente.release();
    const reponse = await ouverture;
    tirage.mockRestore();

    expect(bloquees).toBe(1);
    expect(reponse.status).toBe(CREE);
    expect((reponse.body as ReponseOuverture).code).toBe(CODE_DE_REPLI);
    expect(trier(await codesEnBase())).toEqual(
      trier([CODE_DOUBLON, CODE_DE_REPLI]),
    );
  }, 60_000);

  it('ne perd ni ne double aucune reponse arrivee pendant la cloture', async () => {
    const { sessionId, code } = await ouvrirSeance();
    const etudiant = await premierInscrit(code);
    await demarrer(sessionId);

    const [cloture, ...envois] = await Promise.all([
      fermer(sessionId),
      ...Array.from({ length: NB_QUESTIONS }, (_, question) =>
        repondre(sessionId, etudiant.jeton, question),
      ),
    ]);

    expect(cloture.status).toBe(SANS_CONTENU);
    const acceptees = envois
      .map((reponse, question) => ({
        statut: reponse.status,
        question: identifiantQuestion(question),
      }))
      .filter((envoi) => envoi.statut === CREE)
      .map((envoi) => envoi.question);
    const refusees = envois.filter((reponse) => reponse.status !== CREE);
    expect(
      refusees.map((reponse) => ({
        statut: reponse.status,
        detail: detailDe(reponse),
      })),
    ).toEqual(
      refusees.map(() => ({ statut: CONFLIT, detail: MESSAGE_CLOTURE })),
    );

    const enBase = await contexte.answers.listBySession(sessionId);
    expect(trier(enBase.map((reponse) => reponse.questionId))).toEqual(
      trier(acceptees),
    );

    const tardive = await repondre(sessionId, etudiant.jeton, NB_QUESTIONS - 1);
    expect({ statut: tardive.status, detail: detailDe(tardive) }).toEqual({
      statut: CONFLIT,
      detail: MESSAGE_CLOTURE,
    });

    const synthese = await request(serveur())
      .get(route(`/sessions/${sessionId}/results`))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
      .expect(200);
    const rapport = synthese.body as RapportSession;
    expect(
      trier(
        rapport.participants.flatMap((participant) =>
          participant.reponses.map((reponse) => reponse.questionId),
        ),
      ),
    ).toEqual(trier(acceptees));
  }, 60_000);

  it('ne laisse le formateur non proprietaire changer l ecran dans aucun ordre', async () => {
    const { sessionId } = await ouvrirSeance();
    await demarrer(sessionId);

    const premierTour = await Promise.all([
      piloter(sessionId, FORMATEUR, ECRAN_PROPRIETAIRE_PREMIER),
      piloter(sessionId, AUTRE_FORMATEUR, ECRAN_INTRUS_PREMIER),
    ]);
    expect(premierTour.map((reponse) => reponse.status)).toEqual([
      SANS_CONTENU,
      INTERDIT,
    ]);
    await expect(ecranDe(sessionId)).resolves.toBe(ECRAN_PROPRIETAIRE_PREMIER);

    const secondTour = await Promise.all([
      piloter(sessionId, AUTRE_FORMATEUR, ECRAN_INTRUS_SECOND),
      piloter(sessionId, FORMATEUR, ECRAN_PROPRIETAIRE_SECOND),
    ]);
    expect(secondTour.map((reponse) => reponse.status)).toEqual([
      INTERDIT,
      SANS_CONTENU,
    ]);
    await expect(ecranDe(sessionId)).resolves.toBe(ECRAN_PROPRIETAIRE_SECOND);
  }, 60_000);
});
