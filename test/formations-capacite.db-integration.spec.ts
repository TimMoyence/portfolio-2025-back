import type { Response, Test } from 'supertest';
import {
  buildCoursDeClasse,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  AUTRE_FORMATEUR_DE_TEST,
  CODE_HTTP,
  installerBancDeSeance,
} from './helpers/formations-banc-seance';

const COURS = buildCoursDeClasse(4);
const CATALOGUE = creerCatalogueDeTest(COURS);
const AUTRE_FORMATEUR = AUTRE_FORMATEUR_DE_TEST;
const CAPACITE = 2;
const { CREE, OK, SANS_CONTENU, NON_AUTORISE, INTERDIT, INTROUVABLE, CONFLIT } =
  CODE_HTTP;

interface ReponseOuverture {
  sessionId: string;
  code: string;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
}

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb('Capacite et eviction (B28, db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: CATALOGUE,
    slug: COURS.slug,
  });
  const contexte = () => banc.contexte();
  const commePro = banc.formateur;

  const inscrire = (code: string, cleEtudiant: string): Test =>
    banc.anonyme('post', `/sessions/${code}/join`).send({
      studentKey: cleEtudiant,
      prenom: 'Theo',
      nom: 'Martin',
      email: `${cleEtudiant}@example.test`,
    });

  const ouvrirSeance = async (capacite?: number): Promise<ReponseOuverture> => {
    const ouverture = await commePro('post', '/sessions')
      .send({ courseSlug: COURS.slug, ...(capacite ? { capacite } : {}) })
      .expect(CREE);
    const seance = ouverture.body as ReponseOuverture;
    await commePro('post', `/sessions/${seance.sessionId}/start`).expect(
      SANS_CONTENU,
    );
    return seance;
  };

  const cle = (rang: number): string =>
    `99999999-9999-4999-8999-${String(rang).padStart(12, '0')}`;

  it('refuse en 409 SEANCE_COMPLETE au-dela de la capacite demandee', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    for (let rang = 0; rang < CAPACITE; rang += 1) {
      await inscrire(seance.code, cle(rang)).expect(CREE);
    }

    const refus = await inscrire(seance.code, cle(CAPACITE));

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('SEANCE_COMPLETE');
  });

  it('applique la capacite par defaut de quarante quand elle n est pas demandee', async () => {
    const seance = await ouvrirSeance();

    const enregistree = await contexte().sessions.findById(seance.sessionId);

    expect(enregistree?.capacite).toBe(40);
  });

  it('libere la place et la graine du participant evince, et conserve ses reponses', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    await inscrire(seance.code, cle(1)).expect(CREE);
    await banc
      .avecJeton('post', `/sessions/${seance.sessionId}/answers`, premier.jeton)
      .send({
        questionId: COURS.ecrans[0].question!.id,
        valeur: 1,
        dureeMs: 1000,
      });

    const graineLiberee = await contexte().graineDe(premier.participantId);

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const remplacant = (await inscrire(seance.code, cle(2)).expect(CREE))
      .body as ReponseInscription;

    expect(await contexte().graineDe(remplacant.participantId)).toBe(
      graineLiberee,
    );
    const reponses = await contexte().answers.listBySession(seance.sessionId);
    expect(
      reponses.filter(
        (reponse) => reponse.participantId === premier.participantId,
      ),
    ).toHaveLength(1);
  });

  it('revoque l acces du participant evince', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const refus = await banc.avecJeton(
      'get',
      `/sessions/${seance.sessionId}/sujet`,
      premier.jeton,
    );

    expect(refus.status).toBe(INTROUVABLE);
  });

  it('marque evince dans la liste du formateur, pour qu il reste readmissible', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;

    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const liste = await commePro(
      'get',
      `/sessions/${seance.sessionId}/participants`,
    ).expect(OK);

    expect(
      (liste.body as { participants: { id: string; evince: boolean }[] })
        .participants,
    ).toEqual([
      expect.objectContaining({ id: premier.participantId, evince: true }),
    ]);
  });

  it('refuse l eviction a un autre formateur et a un anonyme', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    const chemin = `/sessions/${seance.sessionId}/participants/${premier.participantId}`;

    const parUnAutre = await commePro(
      'delete',
      chemin,
      `${AUTRE_FORMATEUR}:teacher`,
    );
    const sansIdentite = await banc.anonyme('delete', chemin);

    expect(parUnAutre.status).toBe(INTERDIT);
    expect(sansIdentite.status).toBe(NON_AUTORISE);
  });

  it('signale un participant deja evince', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    const chemin = `/sessions/${seance.sessionId}/participants/${premier.participantId}`;
    await commePro('delete', chemin).expect(SANS_CONTENU);

    const refus = await commePro('delete', chemin);

    expect(refus.status).toBe(INTROUVABLE);
  });

  it('readmet l evince : il retrouve sa place, sa graine, son jeton et ses reponses', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    await banc
      .avecJeton('post', `/sessions/${seance.sessionId}/answers`, premier.jeton)
      .send({
        questionId: COURS.ecrans[0].question!.id,
        valeur: 1,
        dureeMs: 1000,
      });
    const graine = await contexte().graineDe(premier.participantId);
    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);

    await commePro(
      'post',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}/readmission`,
    ).expect(SANS_CONTENU);

    const sujet = await banc.avecJeton(
      'get',
      `/sessions/${seance.sessionId}/sujet`,
      premier.jeton,
    );
    expect(sujet.status).toBe(OK);
    const liste = await commePro(
      'get',
      `/sessions/${seance.sessionId}/participants`,
    ).expect(OK);
    expect(
      (liste.body as { participants: { id: string; evince: boolean }[] })
        .participants,
    ).toEqual([
      expect.objectContaining({ id: premier.participantId, evince: false }),
    ]);
    expect(await contexte().graineDe(premier.participantId)).toBe(graine);
    const reponses = await contexte().answers.listBySession(seance.sessionId);
    expect(
      reponses.filter(
        (reponse) => reponse.participantId === premier.participantId,
      ),
    ).toHaveLength(1);
  });

  it('refuse en 409 SEANCE_COMPLETE la readmission quand la place a ete reprise', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    await inscrire(seance.code, cle(1)).expect(CREE);
    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    await inscrire(seance.code, cle(2)).expect(CREE);

    const refus = await commePro(
      'post',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}/readmission`,
    );

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('SEANCE_COMPLETE');
  });

  it('refuse la readmission d un participant qui n a jamais ete evince', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;

    const refus = await commePro(
      'post',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}/readmission`,
    );

    expect(refus.status).toBe(INTROUVABLE);
  });

  it('refuse la readmission a un autre formateur et a un anonyme', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = (await inscrire(seance.code, cle(0)).expect(CREE))
      .body as ReponseInscription;
    await commePro(
      'delete',
      `/sessions/${seance.sessionId}/participants/${premier.participantId}`,
    ).expect(SANS_CONTENU);
    const chemin = `/sessions/${seance.sessionId}/participants/${premier.participantId}/readmission`;

    const parUnAutre = await commePro(
      'post',
      chemin,
      `${AUTRE_FORMATEUR}:teacher`,
    );
    const sansIdentite = await banc.anonyme('post', chemin);

    expect(parUnAutre.status).toBe(INTERDIT);
    expect(sansIdentite.status).toBe(NON_AUTORISE);
  });
});
