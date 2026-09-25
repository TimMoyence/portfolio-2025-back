import type { Response, Test } from 'supertest';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import type { RapportSession } from '../src/modules/formations/domain/IFormationMailer.port';
import { SessionCode } from '../src/modules/formations/domain/SessionCode';
import {
  buildCoursDeClasse,
  creerCatalogueDeTest,
  reponseDeClasse,
} from './factories/cours.factory';
import { buildBareme } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  AUTRE_FORMATEUR_DE_TEST,
  CODE_HTTP,
  FORMATEUR_DE_TEST,
  installerBancDeSeance,
  statutsEnEchec,
  type SeanceOuverteDeTest,
} from './helpers/formations-banc-seance';
import { patienter } from './helpers/formations-harness';

const TAILLE_CLASSE = 30;
const NB_QUESTIONS = 2;
const NB_QUESTIONS_DU_COURS = 12;
const COURS_DE_CLASSE = buildCoursDeClasse(NB_QUESTIONS_DU_COURS);
const COURS = COURS_DE_CLASSE.slug;
const FORMATEUR = FORMATEUR_DE_TEST;
const AUTRE_FORMATEUR = AUTRE_FORMATEUR_DE_TEST;
const CODE_DOUBLON = '4271';
const CODE_DE_REPLI = '5382';
const MESSAGE_CLOTURE =
  'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.';
const ECRAN_PROPRIETAIRE_PREMIER = 4;
const ECRAN_PROPRIETAIRE_SECOND = 6;
const ECRAN_INTRUS_PREMIER = 9;
const ECRAN_INTRUS_SECOND = 11;
const MAX_SONDAGES = 200;
const PAS_SONDAGE_MS = 25;
const { OK, CREE, SANS_CONTENU, INTERDIT, CONFLIT } = CODE_HTTP;

interface ReponseInscription {
  participantId: string;
  sessionId: string;
  jeton: string;
}

function identifiantQuestion(question: number): string {
  return questionsDuCours(COURS_DE_CLASSE)[question].id;
}

function detailDe(reponse: Response): unknown {
  return (reponse.body as { detail?: unknown }).detail;
}

function trier(valeurs: readonly string[]): string[] {
  return [...valeurs].sort((gauche, droite) => gauche.localeCompare(droite));
}

describeDb('Formations sous requetes simultanees (db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: creerCatalogueDeTest(COURS_DE_CLASSE),
    slug: COURS,
  });
  const contexte = () => banc.contexte();

  const ouvrir = (): Test =>
    banc.formateur('post', '/sessions').send({ courseSlug: COURS });

  const inscrire = (code: string, index: number): Test =>
    banc.anonyme('post', `/sessions/${code}/join`).send({
      prenom: `Prenom-${index}`,
      nom: `Nom-${index}`,
      email: `etudiant-${index}@example.test`,
    });

  const repondre = (sessionId: string, jeton: string, question: number): Test =>
    banc
      .avecJeton('post', `/sessions/${sessionId}/answers`, jeton)
      .send(reponseDeClasse(COURS_DE_CLASSE, question));

  const piloter = (sessionId: string, teacherId: string, ecran: number): Test =>
    banc.piloter(sessionId, { ecran }, `${teacherId}:teacher`);

  const ouvrirSeance = (): Promise<SeanceOuverteDeTest> => banc.ouvrir();

  const premierInscrit = async (code: string): Promise<ReponseInscription> => {
    const reponse = await inscrire(code, 0).expect(CREE);
    return reponse.body as ReponseInscription;
  };

  const demarrer = async (sessionId: string): Promise<void> => {
    await banc
      .formateur('post', `/sessions/${sessionId}/start`)
      .expect(SANS_CONTENU);
  };

  const seanceDemarreeAvecUnInscrit = async (): Promise<{
    sessionId: string;
    etudiant: ReponseInscription;
  }> => {
    const { sessionId, code } = await ouvrirSeance();
    const etudiant = await premierInscrit(code);
    await demarrer(sessionId);
    return { sessionId, etudiant };
  };

  const ecranDe = async (sessionId: string): Promise<number | undefined> =>
    (await contexte().sessions.findById(sessionId))?.ecranCourant;

  const codesEnBase = async (): Promise<string[]> => {
    const lignes: Array<{ code: string }> = await contexte().dataSource.query(
      `SELECT code FROM formation_sessions`,
    );
    return lignes.map((ligne) => ligne.code);
  };

  const requetesBloquees = async (debut: string): Promise<number> => {
    const lignes: Array<{ total: string }> = await contexte().dataSource.query(
      `SELECT count(*)::text AS total FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE $1`,
      [`${debut}%`],
    );
    return Number(lignes[0].total);
  };

  const attendreRequeteBloquee = async (
    debut: string,
    abandonner: () => boolean = () => false,
  ): Promise<number> => {
    for (let sondage = 0; sondage < MAX_SONDAGES; sondage += 1) {
      const total = await requetesBloquees(debut);
      if (total > 0) {
        return total;
      }
      if (abandonner()) {
        return 0;
      }
      await patienter(PAS_SONDAGE_MS);
    }
    return 0;
  };

  const empreinteDeRepriseDe = async (
    participantId: string,
  ): Promise<string | null> => {
    const lignes: Array<{ empreinte: string | null }> =
      await contexte().dataSource.query(
        `SELECT "empreinte_de_reprise" AS "empreinte" FROM "formation_participants" WHERE "id" = $1`,
        [participantId],
      );
    return lignes[0].empreinte;
  };

  it('attribue trente graines distinctes a trente inscriptions simultanees', async () => {
    const { sessionId, code } = await ouvrirSeance();

    const inscriptions = await Promise.all(
      Array.from({ length: TAILLE_CLASSE }, (_, index) =>
        inscrire(code, index),
      ),
    );

    expect(statutsEnEchec(inscriptions, CREE)).toEqual([]);
    const graines = await Promise.all(
      inscriptions.map((reponse) =>
        contexte().graineDe((reponse.body as ReponseInscription).participantId),
      ),
    );
    expect(new Set(graines).size).toBe(TAILLE_CLASSE);

    const enBase = await contexte().participants.listBySession(sessionId);
    expect(enBase).toHaveLength(TAILLE_CLASSE);
    expect(new Set(enBase.map((participant) => participant.seed)).size).toBe(
      TAILLE_CLASSE,
    );
  }, 120_000);

  it('n enregistre qu une des deux reponses simultanees au meme enonce', async () => {
    const { sessionId, etudiant } = await seanceDemarreeAvecUnInscrit();

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
      contexte().answers.listBySession(sessionId),
    ).resolves.toHaveLength(1);
  }, 60_000);

  it('retire un autre code quand deux ouvertures simultanees tirent le meme', async () => {
    const tirage = jest
      .spyOn(SessionCode, 'generate')
      .mockReturnValueOnce(CODE_DOUBLON)
      .mockReturnValue(CODE_DE_REPLI);
    const concurrente = contexte().dataSource.createQueryRunner();
    await concurrente.connect();
    await concurrente.startTransaction();
    await concurrente.query(
      `INSERT INTO "formation_sessions" ("course_slug", "teacher_id", "code", "bareme") VALUES ($1, $2, $3, $4)`,
      [COURS, AUTRE_FORMATEUR, CODE_DOUBLON, JSON.stringify(buildBareme())],
    );

    const ouverture = ouvrir().then((reponse) => reponse);
    const bloquees = await attendreRequeteBloquee(
      'INSERT INTO "formation_sessions"',
    );
    await concurrente.commitTransaction();
    await concurrente.release();
    const reponse = await ouverture;
    tirage.mockRestore();

    expect(bloquees).toBe(1);
    expect(reponse.status).toBe(CREE);
    expect((reponse.body as SeanceOuverteDeTest).code).toBe(CODE_DE_REPLI);
    expect(trier(await codesEnBase())).toEqual(
      trier([CODE_DOUBLON, CODE_DE_REPLI]),
    );
  }, 60_000);

  it('S1 · ne laisse pas une reprise en cours annuler la liberation du poste', async () => {
    const { sessionId, code } = await ouvrirSeance();
    const { participantId } = await premierInscrit(code);
    const reprise = contexte().dataSource.createQueryRunner();
    await reprise.connect();
    await reprise.startTransaction();
    await reprise.query(
      `SELECT "id" FROM "formation_sessions" WHERE "id" = $1 FOR UPDATE`,
      [sessionId],
    );

    let liberee = false;
    const liberation = contexte()
      .participants.libererPoste(sessionId, participantId)
      .then((resultat) => {
        liberee = true;
        return resultat;
      });
    const bloquees = await attendreRequeteBloquee(
      'SELECT "id" FROM "formation_sessions"',
      () => liberee,
    );
    await reprise.query(
      `UPDATE "formation_participants" SET "empreinte_de_reprise" = $1 WHERE "id" = $2`,
      ['empreinte-ecrite-par-la-reprise', participantId],
    );
    await reprise.commitTransaction();
    await reprise.release();

    await expect(liberation).resolves.toBe(true);
    await expect(empreinteDeRepriseDe(participantId)).resolves.toBeNull();
    expect(
      (await contexte().participants.findById(participantId))
        ?.generationDeJeton,
    ).toBe(1);
    expect(bloquees).toBe(1);
  }, 60_000);

  it('ne perd ni ne double aucune reponse arrivee pendant la cloture', async () => {
    const { sessionId, etudiant } = await seanceDemarreeAvecUnInscrit();
    await piloter(sessionId, FORMATEUR, NB_QUESTIONS - 1).expect(SANS_CONTENU);

    const [cloture, ...envois] = await Promise.all([
      banc.formateur('post', `/sessions/${sessionId}/close`),
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

    const enBase = await contexte().answers.listBySession(sessionId);
    expect(trier(enBase.map((reponse) => reponse.questionId))).toEqual(
      trier(acceptees),
    );

    const tardive = await repondre(sessionId, etudiant.jeton, NB_QUESTIONS - 1);
    expect({ statut: tardive.status, detail: detailDe(tardive) }).toEqual({
      statut: CONFLIT,
      detail: MESSAGE_CLOTURE,
    });

    const synthese = await banc
      .formateur('get', `/sessions/${sessionId}/results`)
      .expect(OK);
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
