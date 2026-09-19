import { QueryFailedError } from 'typeorm';
import { ResourceConflictError } from '../src/common/domain/errors/ResourceConflictError';
import { ouvrirTirages } from '../src/modules/formations/domain/cours/OuvertureTirages';
import {
  AnswerAlreadySubmittedError,
  SeedAlreadyAssignedError,
  SessionCodeAlreadyActiveError,
} from '../src/modules/formations/domain/errors/FormationErrors';
import type { ParticipantRecord } from '../src/modules/formations/domain/IParticipants.repository';
import { FormationSessionEntity } from '../src/modules/formations/infrastructure/entities/FormationSession.entity';
import { buildCoursDeClasse } from './factories/cours.factory';
import { buildBareme } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  FORMATION_ENTITIES,
  FORMATION_TABLES,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';

const CLE_ETUDIANT = '11111111-1111-4111-8111-111111111111';
const AUTRE_CLE_ETUDIANT = '22222222-2222-4222-8222-222222222222';
const FORMATEUR = '33333333-3333-4333-8333-333333333333';
const GRAINES_A_REBOURS = [3006, 3005, 3004, 3003, 3002, 3001];
const QUESTIONS_A_REBOURS = [
  'Q-CAP-09',
  'Q-CAP-07',
  'Q-CAP-05',
  'Q-CAP-03',
  'Q-CAP-01',
];
const HORODATAGE_COMMUN = '2026-09-21T08:00:00.000Z';

function cleDeRang(rang: number): string {
  return `77777777-7777-4777-8777-${String(rang).padStart(12, '0')}`;
}

function identifiantsTries(lignes: readonly { id: string }[]): string[] {
  return lignes
    .map((ligne) => ligne.id)
    .sort((gauche, droite) => (gauche < droite ? -1 : 1));
}

interface TypeColonne {
  data_type: string;
}

interface ValeurBrute {
  valeur: string | number;
}

interface ContrainteUnique {
  nom: string;
  colonnes: string[];
}

function trierParNom(
  contraintes: readonly ContrainteUnique[],
): ContrainteUnique[] {
  return [...contraintes].sort((gauche, droite) =>
    gauche.nom.localeCompare(droite.nom),
  );
}

describeDb('Formations repositories (db integration)', () => {
  let contexte: ContexteFormations;

  const ouvrirSeance = (code: string) =>
    contexte.sessions.create({
      courseSlug: 'b1-09-interets-composes',
      courseVersion: 1,
      teacherId: FORMATEUR,
      code,
      bareme: buildBareme(),
    });

  const inscrire = (sessionId: string, studentKey: string, seed: number) =>
    contexte.participants.create({
      sessionId,
      studentKey,
      prenom: 'Theo',
      nom: 'Martin',
      email: 'theo.martin@example.com',
      seed,
    });

  const repondre = (
    sessionId: string,
    participantId: string,
    questionId: string,
    correcte: boolean,
  ) =>
    contexte.answers.create({
      sessionId,
      participantId,
      questionId,
      concept: 'capitalisation',
      valeur: 1338.23,
      seed: 1001,
      correcte,
      misconception: correcte ? null : 'interet-simple',
      dureeMs: 42000,
    });

  const inscrireGrainesARebours = async (
    sessionId: string,
  ): Promise<ParticipantRecord[]> => {
    const inscrits: ParticipantRecord[] = [];
    for (const [rang, seed] of GRAINES_A_REBOURS.entries()) {
      inscrits.push(await inscrire(sessionId, cleDeRang(rang), seed));
    }
    return inscrits;
  };

  const repondreQuestionsARebours = async (
    sessionId: string,
    participantId: string,
  ): Promise<void> => {
    for (const questionId of QUESTIONS_A_REBOURS) {
      await repondre(sessionId, participantId, questionId, true);
    }
  };

  beforeAll(async () => {
    contexte = await ouvrirContexteFormations();
  });

  afterAll(async () => {
    await contexte.fermer();
  });

  beforeEach(async () => {
    await contexte.nettoyer();
  });

  it('rejoue la migration CreateFormations apres un retour arriere', async () => {
    await contexte.rejouerMigration();

    const tables: Array<{ tablename: string }> =
      await contexte.dataSource.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'formation_%'`,
      );

    expect(tables).toHaveLength(FORMATION_TABLES.length);
    expect(tables.map((table) => table.tablename)).toEqual(
      expect.arrayContaining([...FORMATION_TABLES]),
    );
  });

  it('relit a l identique le bareme tire a l ouverture, graine de reference comprise', async () => {
    const cours = buildCoursDeClasse(12);
    const bareme = ouvrirTirages(cours);
    const seance = await contexte.sessions.create({
      courseSlug: cours.slug,
      courseVersion: 1,
      teacherId: FORMATEUR,
      code: '4271',
      bareme,
    });

    const relue = await contexte.sessions.findById(seance.id);

    expect(relue?.bareme).toEqual(bareme);
  });

  it('liste les participants dans leur ordre d arrivee et non dans l ordre de leur graine', async () => {
    const seance = await ouvrirSeance('4271');
    const arrivees = await inscrireGrainesARebours(seance.id);
    await contexte.participants.touch(arrivees[0].id);

    const liste = await contexte.participants.listBySession(seance.id);

    expect(liste.map((participant) => participant.id)).toEqual(
      arrivees.map((participant) => participant.id),
    );
  });

  it('compte les participants d une seance sans compter ceux d une autre', async () => {
    const seance = await ouvrirSeance('4271');
    const autre = await ouvrirSeance('5382');
    await inscrireGrainesARebours(seance.id);
    await inscrire(autre.id, CLE_ETUDIANT, 1001);

    await expect(contexte.participants.countBySession(seance.id)).resolves.toBe(
      GRAINES_A_REBOURS.length,
    );
    await expect(contexte.participants.countBySession(autre.id)).resolves.toBe(
      1,
    );
  });

  it('liste les reponses dans leur ordre d ecriture et non dans l ordre des questions', async () => {
    const seance = await ouvrirSeance('4271');
    const participant = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    await repondreQuestionsARebours(seance.id, participant.id);

    const liste = await contexte.answers.listBySession(seance.id);

    expect(liste.map((reponse) => reponse.questionId)).toEqual(
      QUESTIONS_A_REBOURS,
    );
  });

  it('departage par identifiant les inscriptions et les reponses de meme horodatage', async () => {
    const seance = await ouvrirSeance('4271');
    const [premier] = await inscrireGrainesARebours(seance.id);
    await repondreQuestionsARebours(seance.id, premier.id);
    await contexte.dataSource.query(
      `UPDATE "formation_participants" SET "rejoint_le" = $2 WHERE "session_id" = $1`,
      [seance.id, HORODATAGE_COMMUN],
    );
    await contexte.dataSource.query(
      `UPDATE "formation_answers" SET "soumis_le" = $2 WHERE "session_id" = $1`,
      [seance.id, HORODATAGE_COMMUN],
    );

    const participants = await contexte.participants.listBySession(seance.id);
    const reponses = await contexte.answers.listBySession(seance.id);

    expect(participants.map((participant) => participant.id)).toEqual(
      identifiantsTries(participants),
    );
    expect(reponses.map((reponse) => reponse.id)).toEqual(
      identifiantsTries(reponses),
    );
  });

  it('refuse deux seances actives portant le meme code', async () => {
    await ouvrirSeance('4271');

    await expect(ouvrirSeance('4271')).rejects.toBeInstanceOf(
      SessionCodeAlreadyActiveError,
    );
    await expect(ouvrirSeance('4271')).rejects.not.toBeInstanceOf(
      QueryFailedError,
    );
  });

  it('libere le code une fois la seance terminee', async () => {
    const premiere = await ouvrirSeance('4271');
    await contexte.sessions.update(premiere.id, {
      etat: 'terminee',
      fermeeLe: new Date(),
    });

    const seconde = await ouvrirSeance('4271');

    expect(seconde.id).not.toEqual(premiere.id);
  });

  it('ne rend pas une seance terminee depuis findActiveByCode', async () => {
    const terminee = await ouvrirSeance('4271');
    await contexte.sessions.update(terminee.id, {
      etat: 'terminee',
      fermeeLe: new Date(),
    });
    const ouverte = await ouvrirSeance('5382');

    await expect(
      contexte.sessions.findActiveByCode('4271'),
    ).resolves.toBeNull();
    await expect(contexte.sessions.isCodeTaken('4271')).resolves.toBe(false);
    const active = await contexte.sessions.findActiveByCode('5382');
    expect(active?.id).toEqual(ouverte.id);
  });

  it('traduit un second passage du meme etudiant en conflit et non en erreur brute', async () => {
    const seance = await ouvrirSeance('4271');
    await inscrire(seance.id, CLE_ETUDIANT, 1001);

    const second = inscrire(seance.id, CLE_ETUDIANT, 1002);

    await expect(second).rejects.toBeInstanceOf(ResourceConflictError);
    await expect(second).rejects.toThrow(
      'Ce participant a deja rejoint cette session',
    );
  });

  it('traduit un tirage deja attribue en SeedAlreadyAssignedError', async () => {
    const seance = await ouvrirSeance('4271');
    await inscrire(seance.id, CLE_ETUDIANT, 1001);

    await expect(
      inscrire(seance.id, AUTRE_CLE_ETUDIANT, 1001),
    ).rejects.toBeInstanceOf(SeedAlreadyAssignedError);
  });

  it('rejette deux ecritures concurrentes sur la meme question', async () => {
    const seance = await ouvrirSeance('4271');
    const participant = await inscrire(seance.id, CLE_ETUDIANT, 1001);

    const resultats = await Promise.allSettled([
      repondre(seance.id, participant.id, 'Q-CAP-03', true),
      repondre(seance.id, participant.id, 'Q-CAP-03', false),
    ]);

    const rejets = resultats.filter(
      (resultat) => resultat.status === 'rejected',
    );
    expect(
      resultats.filter((resultat) => resultat.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(rejets).toHaveLength(1);
    expect(rejets[0].reason).toBeInstanceOf(AnswerAlreadySubmittedError);
    await expect(
      contexte.answers.listBySession(seance.id),
    ).resolves.toHaveLength(1);
  });

  it('relit des nombres et non des chaines depuis la base', async () => {
    const seance = await ouvrirSeance('4271');
    const ecrit = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    await repondre(seance.id, ecrit.id, 'Q-CAP-03', true);

    const participant = await contexte.participants.findById(ecrit.id);
    const [reponse] = await contexte.answers.listBySession(seance.id);

    expect(typeof participant?.seed).toBe('number');
    expect(typeof reponse.seed).toBe('number');
    expect(typeof reponse.dureeMs).toBe('number');
    expect(reponse.dureeMs).toEqual(42000);
  });

  it('relit un montant decimal du jsonb en nombre et non en chaine', async () => {
    const seance = await ouvrirSeance('4271');
    const participant = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    await contexte.answers.create({
      sessionId: seance.id,
      participantId: participant.id,
      questionId: 'Q-CAP-04',
      concept: 'capitalisation',
      valeur: 1480.24,
      seed: 1001,
      correcte: true,
      misconception: null,
      dureeMs: 31000,
    });

    const [reponse] = await contexte.answers.listBySession(seance.id);

    expect(typeof reponse.valeur).toBe('number');
    expect(JSON.stringify(reponse.valeur)).toBe('1480.24');
  });

  it('convertit les agregats que postgres rend en chaines', async () => {
    const seance = await ouvrirSeance('4271');
    const premier = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    const second = await inscrire(seance.id, AUTRE_CLE_ETUDIANT, 1002);
    await repondre(seance.id, premier.id, 'Q-CAP-03', true);
    await repondre(seance.id, second.id, 'Q-CAP-03', false);

    const brut: ValeurBrute[] = await contexte.dataSource.query(
      `SELECT COUNT(*) AS valeur FROM "formation_answers" WHERE "session_id" = $1`,
      [seance.id],
    );
    expect(typeof brut[0].valeur).toBe('string');

    const tally = await contexte.answers.tallyBySession(seance.id);
    expect(tally).toHaveLength(1);
    expect(tally[0].total).toBe(2);
    expect(tally[0].correctes).toBe(1);
    expect(tally[0].parMisconception).toEqual({ 'interet-simple': 1 });
  });

  it('conserve l instant exact des horodatages relus', async () => {
    const seance = await ouvrirSeance('4271');
    const participant = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    const horodatage = new Date('2026-09-11T08:12:34.567Z');

    await contexte.incidents.createMany([
      {
        sessionId: seance.id,
        participantId: participant.id,
        type: 'tab_hidden',
        contexte: { onglet: 'calculatrice' },
        horodatage,
      },
    ]);

    const releves = await contexte.incidents.listBySession(seance.id);
    expect(releves).toHaveLength(1);
    expect(releves[0].horodatage).toBeInstanceOf(Date);
    expect(releves[0].horodatage.getTime()).toBe(horodatage.getTime());
    expect(releves[0].contexte).toEqual({ onglet: 'calculatrice' });
  });

  it('stocke les horodatages en timestamptz', async () => {
    const colonnes: TypeColonne[] = await contexte.dataSource.query(
      `SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'formation_incidents' AND column_name = 'horodatage'`,
    );

    expect(colonnes).toEqual([{ data_type: 'timestamp with time zone' }]);
  });

  it('remplace la maitrise existante au lieu de la dupliquer', async () => {
    const derniereVue = new Date('2026-09-11T09:00:00.000Z');
    await contexte.mastery.upsert({
      studentKey: CLE_ETUDIANT,
      concept: 'capitalisation',
      boite: 1,
      derniereVue,
      succes: 1,
      echecs: 0,
    });
    await contexte.mastery.upsert({
      studentKey: CLE_ETUDIANT,
      concept: 'capitalisation',
      boite: 2,
      derniereVue,
      succes: 2,
      echecs: 0,
    });

    const maitrise = await contexte.mastery.findByStudentKey(CLE_ETUDIANT);
    expect(maitrise).toHaveLength(1);
    expect(maitrise[0].boite).toBe(2);
    expect(typeof maitrise[0].succes).toBe('number');
    expect(maitrise[0].derniereVue.getTime()).toBe(derniereVue.getTime());
  });

  it('decrit dans les entites le schema exact que produit la migration', async () => {
    const derive = await contexte.dataSource.driver.createSchemaBuilder().log();

    expect(derive.upQueries.map((requete) => requete.query)).toEqual([]);
  });

  it('declare les verrous d unicite sur les memes colonnes qu en base', async () => {
    const enBase: ContrainteUnique[] = await contexte.dataSource.query(
      `SELECT contrainte.conname AS nom, array_agg(colonne.attname::text ORDER BY colonne.attname) AS colonnes
       FROM pg_constraint contrainte
       JOIN pg_class relation ON relation.oid = contrainte.conrelid
       JOIN pg_namespace espace ON espace.oid = relation.relnamespace
       JOIN unnest(contrainte.conkey) AS cle(attnum) ON true
       JOIN pg_attribute colonne ON colonne.attrelid = relation.oid AND colonne.attnum = cle.attnum
       WHERE contrainte.contype = 'u' AND espace.nspname = 'public' AND relation.relname LIKE 'formation_%'
       GROUP BY contrainte.conname`,
    );
    const declarees: ContrainteUnique[] = FORMATION_ENTITIES.flatMap((entite) =>
      contexte.dataSource.getMetadata(entite).uniques.map((verrou) => ({
        nom: verrou.name,
        colonnes: verrou.columns
          .map((colonne) => colonne.databaseName)
          .sort((gauche, droite) => gauche.localeCompare(droite)),
      })),
    );

    expect(enBase).toHaveLength(5);
    expect(trierParNom(declarees)).toEqual(trierParNom(enBase));
  });

  it('declare les index sur les memes colonnes qu en base', async () => {
    const enBase: ContrainteUnique[] = await contexte.dataSource.query(
      `SELECT classe_index.relname AS nom, array_agg(colonne.attname::text ORDER BY colonne.attname) AS colonnes
       FROM pg_index index_pg
       JOIN pg_class classe_index ON classe_index.oid = index_pg.indexrelid
       JOIN pg_class classe_table ON classe_table.oid = index_pg.indrelid
       JOIN pg_namespace espace ON espace.oid = classe_table.relnamespace
       JOIN unnest(index_pg.indkey) AS cle(attnum) ON true
       JOIN pg_attribute colonne ON colonne.attrelid = classe_table.oid AND colonne.attnum = cle.attnum
       WHERE espace.nspname = 'public' AND classe_table.relname LIKE 'formation_%'
         AND NOT index_pg.indisprimary
         AND NOT EXISTS (SELECT 1 FROM pg_constraint contrainte WHERE contrainte.conindid = index_pg.indexrelid AND contrainte.contype = 'u')
       GROUP BY classe_index.relname`,
    );
    const declarees: ContrainteUnique[] = FORMATION_ENTITIES.flatMap((entite) =>
      contexte.dataSource.getMetadata(entite).indices.map((index) => ({
        nom: index.name,
        colonnes: index.columns
          .map((colonne) => colonne.databaseName)
          .sort((gauche, droite) => gauche.localeCompare(droite)),
      })),
    );

    expect(enBase).toHaveLength(10);
    expect(trierParNom(declarees)).toEqual(trierParNom(enBase));
  });

  it('declare le meme predicat partiel que l index du code actif', async () => {
    const [index] = contexte.dataSource
      .getMetadata(FormationSessionEntity)
      .indices.filter((candidat) => candidat.isUnique);
    const [stocke]: Array<{ predicat: string }> =
      await contexte.dataSource.query(
        `SELECT pg_get_expr(indpred, indrelid) AS predicat FROM pg_index WHERE indexrelid = 'uq_formation_sessions_code_active'::regclass`,
      );

    const etatsCouverts = async (predicat: string): Promise<string[]> => {
      const lignes: Array<{ etat: string }> = await contexte.dataSource.query(
        `SELECT etat FROM (VALUES ('attente'), ('en_cours'), ('terminee')) AS seance(etat) WHERE ${predicat} ORDER BY etat`,
      );
      return lignes.map((ligne) => ligne.etat);
    };

    expect(await etatsCouverts(stocke.predicat)).toEqual([
      'attente',
      'en_cours',
    ]);
    expect(await etatsCouverts(index.where ?? 'false')).toEqual(
      await etatsCouverts(stocke.predicat),
    );
  });

  it('efface participants et reponses avec la seance', async () => {
    const seance = await ouvrirSeance('4271');
    const participant = await inscrire(seance.id, CLE_ETUDIANT, 1001);
    await repondre(seance.id, participant.id, 'Q-CAP-03', true);

    await contexte.dataSource.query(
      `DELETE FROM "formation_sessions" WHERE "id" = $1`,
      [seance.id],
    );

    await expect(
      contexte.participants.listBySession(seance.id),
    ).resolves.toHaveLength(0);
    await expect(
      contexte.answers.listBySession(seance.id),
    ).resolves.toHaveLength(0);
  });
});
