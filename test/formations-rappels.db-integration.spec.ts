import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
import { B2_COURS_V3 } from '../src/migrations/data/b2-v3.cours';
import { lireCoursStocke } from '../src/modules/formations/domain/cours/CoursStocke';
import type { SpacedQuestionPublique } from '../src/modules/formations/domain/contrats/donnees-publiques';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import { creerCatalogueAVersions } from './factories/cours.factory';
import { createMockFormationMailer } from './factories/formation.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  DELAI_OUVERTURE_CONTEXTE_MS,
  ouvrirContexteFormations,
  type ContexteFormations,
} from './helpers/formations-db';
import {
  EN_TETE_IDENTITE,
  monterApplicationFormations,
  PREFIXE_API,
} from './helpers/formations-harness';
import { fermerApplication } from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const COURS = lireCoursStocke(B2_COURS_V3);
const CATALOGUE = creerCatalogueAVersions({ [COURS.slug]: { 3: COURS } });
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const AUTRE_FORMATEUR = 'b2222222-2222-4222-8222-222222222222';
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const SECRET = 'secret-de-test-formations-assez-long-1234';
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;
const NON_AUTORISE = 401;
const INTERDIT = 403;
const CONFLIT = 409;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
}

interface Seance {
  sessionId: string;
  code: string;
  jeton: string;
  participantId: string;
}

describeDb('Rappels espaces (B9, db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let secretInitial: string | undefined;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const commePro = (
    methode: 'post' | 'patch' | 'get',
    chemin: string,
    identite = `${FORMATEUR}:teacher`,
  ): Test =>
    request(serveur())[methode](route(chemin)).set(EN_TETE_IDENTITE, identite);

  const lireRappels = (seance: Seance, jeton = seance.jeton): Test =>
    request(serveur())
      .get(route(`/sessions/${seance.sessionId}/rappels`))
      .set(EN_TETE_JETON, jeton);

  const ouvrirSeance = async (cle: string): Promise<Seance> => {
    const ouverture = await commePro('post', '/sessions')
      .send({ courseSlug: COURS.slug })
      .expect(CREE);
    const { sessionId, code } = ouverture.body as ReponseOuverture;
    await commePro('post', `/sessions/${sessionId}/start`).expect(SANS_CONTENU);
    await commePro('patch', `/sessions/${sessionId}/control`)
      .send({ ecran: DERNIER_ECRAN })
      .expect(SANS_CONTENU);
    const inscription = await request(serveur())
      .post(route(`/sessions/${code}/join`))
      .send({
        studentKey: cle,
        prenom: 'Theo',
        nom: 'Martin',
        email: `${cle}@example.test`,
      })
      .expect(CREE);
    const { jeton, participantId } = inscription.body as ReponseInscription;
    return { sessionId, code, jeton, participantId };
  };

  beforeAll(async () => {
    secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    contexte = await ouvrirContexteFormations();
    app = await monterApplicationFormations(
      { ...contexte, mailer: createMockFormationMailer() },
      CATALOGUE,
    );
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterEach(async () => {
    await contexte.nettoyer();
  });

  afterAll(async () => {
    await fermerApplication(app);
    await contexte.fermer();
    process.env.FORMATION_REVIEW_TOKEN_SECRET = secretInitial;
  });

  it('sert trois a quatre rappels sans jamais livrer la bonne reponse', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000001');

    const reponse = await lireRappels(seance).expect(OK);

    const { questions } = reponse.body as {
      questions: SpacedQuestionPublique[];
    };
    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(questions.length).toBeLessThanOrEqual(4);
    const brut = JSON.stringify(reponse.body);
    expect(brut).not.toContain('confusion');
    expect(brut).not.toContain('bonne');
  });

  it('fige la liste servie et la rend identique au rechargement', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000002');

    const premier = await lireRappels(seance).expect(OK);
    const second = await lireRappels(seance).expect(OK);

    const idsDe = (corps: unknown): string[] =>
      (corps as { questions: SpacedQuestionPublique[] }).questions.map(
        (question) => question.questionId,
      );
    expect(idsDe(second.body)).toEqual(idsDe(premier.body));
    const servis = await contexte.rappels.lister(seance.participantId);
    expect(servis.map((servi) => servi.questionId)).toEqual(
      idsDe(premier.body),
    );
  });

  it('sert des listes propres a chaque participant', async () => {
    const premier = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000003');
    const inscription = await request(serveur())
      .post(route(`/sessions/${premier.code}/join`))
      .send({
        studentKey: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000004',
        prenom: 'Lea',
        nom: 'Durand',
        email: 'lea@example.test',
      })
      .expect(CREE);
    const second = inscription.body as ReponseInscription;
    await lireRappels(premier).expect(OK);

    await lireRappels({ ...premier, jeton: second.jeton }).expect(OK);

    const servisPremier = await contexte.rappels.lister(premier.participantId);
    const servisSecond = await contexte.rappels.lister(second.participantId);
    expect(servisPremier.length).toBeGreaterThan(0);
    expect(servisSecond.length).toBeGreaterThan(0);
  });

  it('refuse les rappels avant que le formateur ait projete l ecran', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000005');
    await commePro('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: 0 })
      .expect(SANS_CONTENU);

    const refus = await lireRappels(seance);

    expect(refus.status).toBe(CONFLIT);
    expect((refus.body as { code?: string }).code).toBe('ECRAN_NON_SERVI');
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000006');
    const autre = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000007');

    const refus = await lireRappels(seance, autre.jeton);

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('sert la carte de maitrise au formateur proprietaire et a l administrateur', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000008');

    const parProprietaire = await commePro(
      'get',
      `/sessions/${seance.sessionId}/rappels/synthese`,
    ).expect(OK);
    const parAdmin = await commePro(
      'get',
      `/sessions/${seance.sessionId}/rappels/synthese`,
      'f6666666-6666-4666-8666-666666666666:admin',
    ).expect(OK);

    const concepts = (parProprietaire.body as { concepts: unknown[] }).concepts;
    expect(concepts.length).toBeGreaterThan(0);
    expect(parAdmin.body).toEqual(parProprietaire.body);
  });

  it('refuse la carte de maitrise a un autre formateur et a un anonyme', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000009');
    const chemin = `/sessions/${seance.sessionId}/rappels/synthese`;

    const parUnAutre = await commePro(
      'get',
      chemin,
      `${AUTRE_FORMATEUR}:teacher`,
    );
    const anonyme = await request(serveur()).get(route(chemin));

    expect(parUnAutre.status).toBe(INTERDIT);
    expect(anonyme.status).toBe(NON_AUTORISE);
  });

  it('efface les rappels servis quand la seance est supprimee', async () => {
    const seance = await ouvrirSeance('aaaaaaaa-aaaa-4aaa-8aaa-000000000010');
    await lireRappels(seance).expect(OK);

    await contexte.dataSource.query(
      'DELETE FROM formation_sessions WHERE id = $1',
      [seance.sessionId],
    );

    await expect(
      contexte.rappels.lister(seance.participantId),
    ).resolves.toEqual([]);
  });
});
