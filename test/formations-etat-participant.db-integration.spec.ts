import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Test } from 'supertest';
import type { EtatParticipant } from '../src/modules/formations/domain/contrats/pilotage';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  buildCoursAvecProductions,
  buildEcranDeJalon,
  buildEcranDEnigmes,
  creerCatalogueDeTest,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
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

const SOCLE = buildCoursAvecProductions({ slug: 'cours-moi-integration' });
const COURS = {
  ...SOCLE,
  ecrans: [
    ...SOCLE.ecrans,
    buildEcranDEnigmes(),
    buildEcranDeJalon(),
  ] as typeof SOCLE.ecrans,
};
const CATALOGUE = creerCatalogueDeTest(COURS);
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const SECRET = 'secret-de-test-formations-assez-long-1234';
const CREE = 201;
const OK = 200;
const SANS_CONTENU = 204;
const NON_AUTORISE = 401;

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

describeDb('Etat du participant (B23, db integration)', () => {
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

  const monEtat = (seance: Seance, jeton = seance.jeton): Test =>
    request(serveur())
      .get(route(`/sessions/${seance.sessionId}/moi`))
      .set(EN_TETE_JETON, jeton);

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

  it('rend un etat vide au participant qui vient de rejoindre', async () => {
    const seance = await ouvrirSeance('88888888-8888-4888-8888-000000000001');

    const reponse = await monEtat(seance).expect(OK);

    expect(reponse.body as EtatParticipant).toEqual({
      sessionId: seance.sessionId,
      participantId: seance.participantId,
      revision: expect.any(Number),
      reponses: [],
      reponsesLibres: [],
      jalons: [],
      enigmes: [],
      defis: [],
      rappels: { questionIds: [] },
    });
  });

  it('restitue la production corrigee, le jalon et l enigme resolue', async () => {
    const seance = await ouvrirSeance('88888888-8888-4888-8888-000000000002');
    await request(serveur())
      .post(route(`/sessions/${seance.sessionId}/productions`))
      .set(EN_TETE_JETON, seance.jeton)
      .send({
        questionId: 'Q-TEST-FEUILLE',
        valeur: {
          type: 'feuille',
          cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
        },
        dureeMs: 1000,
      })
      .expect(CREE);
    await request(serveur())
      .put(route(`/sessions/${seance.sessionId}/pulses/${SONDAGE_DE_TEST}`))
      .set(EN_TETE_JETON, seance.jeton)
      .send({ etat: 'clair' })
      .expect(SANS_CONTENU);
    await request(serveur())
      .post(
        route(
          `/sessions/${seance.sessionId}/escape/${PARCOURS_DE_TEST}/tentatives`,
        ),
      )
      .set(EN_TETE_JETON, seance.jeton)
      .send({ enigmeId: ENIGMES_DE_TEST[0], reponse: '23,4', dureeMs: 1000 })
      .expect(CREE);

    const etat = (await monEtat(seance).expect(OK)).body as EtatParticipant;

    expect(etat.reponses.map((reponse) => reponse.questionId)).toContain(
      'Q-TEST-FEUILLE',
    );
    expect(etat.jalons).toEqual([
      { sondageId: SONDAGE_DE_TEST, etat: 'clair' },
    ]);
    expect(etat.enigmes[0].resolues).toEqual([
      { enigmeId: ENIGMES_DE_TEST[0], fragment: 'F0' },
    ]);
  });

  it('ne laisse jamais voir l etat d un autre participant', async () => {
    const premier = await ouvrirSeance('88888888-8888-4888-8888-000000000003');
    const second = await inscrire(
      premier.sessionId,
      premier.code,
      '88888888-8888-4888-8888-000000000004',
    );
    await request(serveur())
      .put(route(`/sessions/${premier.sessionId}/pulses/${SONDAGE_DE_TEST}`))
      .set(EN_TETE_JETON, premier.jeton)
      .send({ etat: 'perdu' })
      .expect(SANS_CONTENU);

    const etat = (await monEtat(second).expect(OK)).body as EtatParticipant;

    expect(etat.participantId).toBe(second.participantId);
    expect(etat.jalons).toEqual([]);
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('88888888-8888-4888-8888-000000000005');
    const autre = await ouvrirSeance('88888888-8888-4888-8888-000000000006');

    const refus = await monEtat(seance, autre.jeton);

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse une requete sans jeton de participant', async () => {
    const seance = await ouvrirSeance('88888888-8888-4888-8888-000000000007');

    const refus = await request(serveur()).get(
      route(`/sessions/${seance.sessionId}/moi`),
    );

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('suit la revision de la seance apres un pilotage', async () => {
    const seance = await ouvrirSeance('88888888-8888-4888-8888-000000000008');
    const avant = (await monEtat(seance).expect(OK)).body as EtatParticipant;

    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: DERNIER_ECRAN - 1 })
      .expect(SANS_CONTENU);
    const apres = (await monEtat(seance).expect(OK)).body as EtatParticipant;

    expect(apres.revision).toBeGreaterThan(avant.revision);
  });
});
