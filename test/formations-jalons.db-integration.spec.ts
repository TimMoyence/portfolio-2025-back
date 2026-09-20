import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response, Test } from 'supertest';
import { cleDeJalon } from '../src/modules/formations/domain/cours/CleDeJalon';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursAvecJalon,
  creerCatalogueDeTest,
  SONDAGE_DE_TEST,
} from './factories/cours.factory';
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

const COURS = buildCoursAvecJalon({ slug: 'cours-jalons-integration' });
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const SECRET = 'secret-de-test-formations-assez-long-1234';
const CREE = 201;
const SANS_CONTENU = 204;
const MAUVAISE_REQUETE = 400;
const NON_AUTORISE = 401;
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

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb('Jalons de confiance anonymises (B8, db integration)', () => {
  silenceNestLogger(['log', 'warn', 'error']);

  let contexte: ContexteFormations;
  let app: INestApplication;
  let secretInitial: string | undefined;
  let secretJalonInitial: string | undefined;

  const serveur = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  const route = (chemin: string): string =>
    `/${PREFIXE_API}/formations${chemin}`;

  const formateur = (methode: 'post' | 'patch', chemin: string): Test =>
    request(serveur())
      [methode](route(chemin))
      .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`);

  const declarer = (
    seance: Seance,
    etat: string,
    sondageId = SONDAGE_DE_TEST,
  ): Test =>
    request(serveur())
      .put(route(`/sessions/${seance.sessionId}/pulses/${sondageId}`))
      .set(EN_TETE_JETON, seance.jeton)
      .send({ etat });

  const inscrire = async (
    sessionId: string,
    code: string,
    cle: string,
  ): Promise<Seance> => {
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

  const ouvrirSeance = async (cle: string): Promise<Seance> => {
    const ouverture = await formateur('post', '/sessions')
      .send({ courseSlug: COURS.slug })
      .expect(CREE);
    const { sessionId, code } = ouverture.body as ReponseOuverture;
    await formateur('post', `/sessions/${sessionId}/start`).expect(
      SANS_CONTENU,
    );
    await formateur('patch', `/sessions/${sessionId}/control`)
      .send({ ecran: DERNIER_ECRAN })
      .expect(SANS_CONTENU);
    return inscrire(sessionId, code, cle);
  };

  beforeAll(async () => {
    secretInitial = process.env.FORMATION_REVIEW_TOKEN_SECRET;
    secretJalonInitial = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    process.env.FORMATIONS_PULSE_SECRET = SECRET;
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
    process.env.FORMATIONS_PULSE_SECRET = secretJalonInitial;
  });

  it('enregistre le jalon sous la cle HMAC, sans identifiant de participant en base', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000001');

    await declarer(seance, 'ca-va').expect(SANS_CONTENU);

    const lignes: { cle_participant: string; etat: string }[] =
      await contexte.dataSource.query(
        'SELECT cle_participant, etat FROM formation_pulses WHERE session_id = $1',
        [seance.sessionId],
      );
    expect(lignes).toEqual([
      {
        cle_participant: cleDeJalon(seance.sessionId, seance.participantId),
        etat: 'ca-va',
      },
    ]);
    expect(lignes[0].cle_participant).not.toContain(seance.participantId);
  });

  it('garde le dernier etat declare par participant et par sondage', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000002');

    await declarer(seance, 'perdu').expect(SANS_CONTENU);
    await declarer(seance, 'clair').expect(SANS_CONTENU);

    const comptes = await contexte.pulses.compterParSondage(seance.sessionId);
    expect(comptes[SONDAGE_DE_TEST]).toEqual({
      perdu: 0,
      'ca-va': 0,
      clair: 1,
      total: 1,
    });
  });

  it('agrege les etats de toute la classe par sondage', async () => {
    const premier = await ouvrirSeance('66666666-6666-4666-8666-000000000003');
    const second = await inscrire(
      premier.sessionId,
      premier.code,
      '66666666-6666-4666-8666-000000000004',
    );

    await declarer(premier, 'perdu').expect(SANS_CONTENU);
    await declarer(second, 'clair').expect(SANS_CONTENU);

    const comptes = await contexte.pulses.compterParSondage(premier.sessionId);
    expect(comptes[SONDAGE_DE_TEST]).toEqual({
      perdu: 1,
      'ca-va': 0,
      clair: 1,
      total: 2,
    });
  });

  it('ne rend jamais l etat individuel d un autre participant', async () => {
    const premier = await ouvrirSeance('66666666-6666-4666-8666-000000000005');
    const second = await inscrire(
      premier.sessionId,
      premier.code,
      '66666666-6666-4666-8666-000000000006',
    );
    await declarer(second, 'perdu').expect(SANS_CONTENU);

    const lus = await contexte.pulses.listerDuParticipant(
      premier.sessionId,
      cleDeJalon(premier.sessionId, premier.participantId),
    );

    expect(lus).toEqual([]);
  });

  it('refuse un etat hors des trois valeurs admises', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000007');

    const refus = await declarer(seance, 'euphorique');

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });

  it('refuse un sondage absent du cours', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000008');

    const refus = await declarer(seance, 'ca-va', 'jalon-invente');

    expect(refus.status).toBe(MAUVAISE_REQUETE);
  });

  it('refuse un jalon visant un ecran non projete', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000009');
    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: 0 })
      .expect(SANS_CONTENU);

    const refus = await declarer(seance, 'ca-va');

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('ECRAN_NON_SERVI');
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000010');
    const autre = await ouvrirSeance('66666666-6666-4666-8666-000000000011');

    const refus = await declarer({ ...seance, jeton: autre.jeton }, 'ca-va');

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('efface les jalons quand la seance est supprimee', async () => {
    const seance = await ouvrirSeance('66666666-6666-4666-8666-000000000012');
    await declarer(seance, 'clair').expect(SANS_CONTENU);

    await contexte.dataSource.query(
      'DELETE FROM formation_sessions WHERE id = $1',
      [seance.sessionId],
    );

    const comptes = await contexte.pulses.compterParSondage(seance.sessionId);
    expect(comptes).toEqual({});
  });
});
