import type { Test } from 'supertest';
import {
  buildCoursDeClasse,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  AUTRE_FORMATEUR_DE_TEST,
  attendreRefus,
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

interface LigneDeParticipant {
  id: string;
  evince: boolean;
}

describeDb('Capacite et eviction (B28, db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: CATALOGUE,
    slug: COURS.slug,
  });
  const contexte = () => banc.contexte();
  const commePro = banc.formateur;

  const cle = (rang: number): string =>
    `99999999-9999-4999-8999-${String(rang).padStart(12, '0')}`;

  const inscrire = (seance: ReponseOuverture, rang: number): Test =>
    banc.anonyme('post', `/sessions/${seance.code}/join`).send({
      prenom: 'Theo',
      nom: 'Martin',
      email: `${cle(rang)}@example.test`,
    });

  const inscrit = async (
    seance: ReponseOuverture,
    rang: number,
  ): Promise<ReponseInscription> =>
    (await inscrire(seance, rang).expect(CREE)).body as ReponseInscription;

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

  const cheminDu = (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ): string =>
    `/sessions/${seance.sessionId}/participants/${participant.participantId}`;

  const evincer = (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ): Test => commePro('delete', cheminDu(seance, participant));

  const readmettre = (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ): Test => commePro('post', `${cheminDu(seance, participant)}/readmission`);

  const repondre = (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ) =>
    banc
      .avecJeton(
        'post',
        `/sessions/${seance.sessionId}/answers`,
        participant.jeton,
      )
      .send({
        questionId: COURS.ecrans[0].question!.id,
        valeur: 1,
        dureeMs: 1000,
      });

  const lireLeSujet = (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ): Test =>
    banc.avecJeton(
      'get',
      `/sessions/${seance.sessionId}/sujet`,
      participant.jeton,
    );

  const listeDu = async (
    seance: ReponseOuverture,
  ): Promise<LigneDeParticipant[]> =>
    (
      (
        await commePro(
          'get',
          `/sessions/${seance.sessionId}/participants`,
        ).expect(OK)
      ).body as { participants: LigneDeParticipant[] }
    ).participants;

  const reponsesConserveesDe = async (
    seance: ReponseOuverture,
    participant: ReponseInscription,
  ): Promise<number> =>
    (await contexte().answers.listBySession(seance.sessionId)).filter(
      (reponse) => reponse.participantId === participant.participantId,
    ).length;

  const attendreRefusDesTiers = async (
    methode: 'post' | 'delete',
    chemin: string,
  ): Promise<void> => {
    const parUnAutre = await commePro(
      methode,
      chemin,
      `${AUTRE_FORMATEUR}:teacher`,
    );
    const sansIdentite = await banc.anonyme(methode, chemin);

    expect(parUnAutre.status).toBe(INTERDIT);
    expect(sansIdentite.status).toBe(NON_AUTORISE);
  };

  const seanceAvecUnInscrit = async (evince = false) => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = await inscrit(seance, 0);
    if (evince) {
      await evincer(seance, premier).expect(SANS_CONTENU);
    }
    return { seance, premier };
  };

  it('refuse en 409 SEANCE_COMPLETE au-dela de la capacite demandee', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    for (let rang = 0; rang < CAPACITE; rang += 1) {
      await inscrit(seance, rang);
    }

    attendreRefus(await inscrire(seance, CAPACITE), CONFLIT, 'SEANCE_COMPLETE');
  });

  it('applique la capacite par defaut de quarante quand elle n est pas demandee', async () => {
    const seance = await ouvrirSeance();

    const enregistree = await contexte().sessions.findById(seance.sessionId);

    expect(enregistree?.capacite).toBe(40);
  });

  it('libere la place et la graine du participant evince, et conserve ses reponses', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = await inscrit(seance, 0);
    await inscrit(seance, 1);
    await repondre(seance, premier);
    const graineLiberee = await contexte().graineDe(premier.participantId);

    await evincer(seance, premier).expect(SANS_CONTENU);
    const remplacant = await inscrit(seance, 2);

    expect(await contexte().graineDe(remplacant.participantId)).toBe(
      graineLiberee,
    );
    expect(await reponsesConserveesDe(seance, premier)).toBe(1);
  });

  it('S2 · refuse a l evince de revenir par une nouvelle inscription sous le meme courriel', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    await evincer(seance, await inscrit(seance, 0)).expect(SANS_CONTENU);

    attendreRefus(await inscrire(seance, 0), INTERDIT, 'PARTICIPANT_EVINCE');
    await expect(
      contexte().participants.countBySession(seance.sessionId),
    ).resolves.toBe(0);
  });

  it('S2 · readmet sans erreur serveur quand la graine de l evince a ete reprise : 409 GRAINE_REPRISE', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = await inscrit(seance, 0);
    const second = await inscrit(seance, 1);
    await evincer(seance, premier).expect(SANS_CONTENU);
    await inscrit(seance, 2);
    await evincer(seance, second).expect(SANS_CONTENU);

    attendreRefus(await readmettre(seance, premier), CONFLIT, 'GRAINE_REPRISE');
  });

  it('T2 · refuse d evincer, de readmettre ou de liberer sous sa propre seance le participant d une autre seance', async () => {
    const seanceDuFormateur = await ouvrirSeance(CAPACITE);
    const autreSeance = await ouvrirSeance(CAPACITE);
    const etranger = await inscrit(autreSeance, 0);
    const chemin = cheminDu(seanceDuFormateur, etranger);

    await commePro('delete', chemin).expect(INTROUVABLE);
    await commePro('post', `${chemin}/liberation`).expect(INTROUVABLE);
    await evincer(autreSeance, etranger).expect(SANS_CONTENU);
    await readmettre(seanceDuFormateur, etranger).expect(INTROUVABLE);

    expect(await listeDu(autreSeance)).toEqual([
      expect.objectContaining({ id: etranger.participantId, evince: true }),
    ]);
  });

  it('revoque l acces du participant evince', async () => {
    const { seance, premier } = await seanceAvecUnInscrit(true);

    expect((await lireLeSujet(seance, premier)).status).toBe(INTROUVABLE);
  });

  it('marque evince dans la liste du formateur, pour qu il reste readmissible', async () => {
    const { seance, premier } = await seanceAvecUnInscrit(true);

    expect(await listeDu(seance)).toEqual([
      expect.objectContaining({ id: premier.participantId, evince: true }),
    ]);
  });

  it('refuse l eviction a un autre formateur et a un anonyme', async () => {
    const { seance, premier } = await seanceAvecUnInscrit();

    await attendreRefusDesTiers('delete', cheminDu(seance, premier));
  });

  it('signale un participant deja evince', async () => {
    const { seance, premier } = await seanceAvecUnInscrit(true);

    expect((await evincer(seance, premier)).status).toBe(INTROUVABLE);
  });

  it('readmet l evince : il retrouve sa place, sa graine, son jeton et ses reponses', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = await inscrit(seance, 0);
    await repondre(seance, premier);
    const graine = await contexte().graineDe(premier.participantId);
    await evincer(seance, premier).expect(SANS_CONTENU);

    await readmettre(seance, premier).expect(SANS_CONTENU);

    expect((await lireLeSujet(seance, premier)).status).toBe(OK);
    expect(await listeDu(seance)).toEqual([
      expect.objectContaining({ id: premier.participantId, evince: false }),
    ]);
    expect(await contexte().graineDe(premier.participantId)).toBe(graine);
    expect(await reponsesConserveesDe(seance, premier)).toBe(1);
  });

  it('refuse en 409 SEANCE_COMPLETE la readmission quand la place a ete reprise', async () => {
    const seance = await ouvrirSeance(CAPACITE);
    const premier = await inscrit(seance, 0);
    await inscrit(seance, 1);
    await evincer(seance, premier).expect(SANS_CONTENU);
    await inscrit(seance, 2);

    attendreRefus(
      await readmettre(seance, premier),
      CONFLIT,
      'SEANCE_COMPLETE',
    );
  });

  it('refuse la readmission d un participant qui n a jamais ete evince', async () => {
    const { seance, premier } = await seanceAvecUnInscrit();

    expect((await readmettre(seance, premier)).status).toBe(INTROUVABLE);
  });

  it('refuse la readmission a un autre formateur et a un anonyme', async () => {
    const { seance, premier } = await seanceAvecUnInscrit(true);

    await attendreRefusDesTiers(
      'post',
      `${cheminDu(seance, premier)}/readmission`,
    );
  });
});
