import {
  request as requeteNode,
  type ClientRequest,
  type IncomingMessage,
} from 'node:http';
import {
  connect,
  createServer,
  type AddressInfo,
  type Server,
  type Socket,
} from 'node:net';
import { Logger } from '@nestjs/common';
import type { Response, Test } from 'supertest';
import { MESSAGE_DEPENDANCE_INJOIGNABLE } from '../src/common/interfaces/filters/dependency-outage';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import type { RapportSession } from '../src/modules/formations/domain/IFormationMailer.port';
import {
  buildCoursDeClasse,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import type { ContexteFormations } from './helpers/formations-db';
import {
  ADRESSE_BOUCLE_LOCALE,
  clientFormations,
  monterBancFormations,
  type BancFormations,
  type ClientFormations,
} from './helpers/formations-harness';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const NB_QUESTIONS_DU_COURS = 12;
const COURS_DE_CLASSE = buildCoursDeClasse(NB_QUESTIONS_DU_COURS);
const FORMATEUR = 'd4444444-4444-4444-8444-444444444444';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'resilience-formateur@example.test';
const EN_TETE_JETON = 'x-participant-token';
const PANNE_SMTP = 'smtp injoignable';
const NUIT_ENTIERE = '14 hours';
const ECRAN_APRES_COUPURE = 8;
const PAS_SONDAGE_MS = 25;
const ATTENTE_MAX_MS = 10_000;
const DELAI_TEST_MS = 120_000;
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;
const CONFLIT = 409;
const INDISPONIBLE = 503;

interface Inscrit {
  participantId: string;
  sessionId: string;
  seed: number;
  jeton: string;
}

interface Seance {
  sessionId: string;
  code: string;
}

interface Relais {
  port: number;
  couper(): Promise<void>;
  retablir(): Promise<void>;
  fermer(): Promise<void>;
}

interface EvenementFlux {
  type: string;
  donnees: Record<string, unknown>;
}

interface FluxEcoute {
  evenements: EvenementFlux[];
  fermer(): void;
}

function ecouter(serveur: Server, port: number): Promise<number> {
  return new Promise((resoudre) => {
    serveur.listen(port, '127.0.0.1', () =>
      resoudre((serveur.address() as AddressInfo).port),
    );
  });
}

function arreterServeur(serveur: Server): Promise<void> {
  return new Promise((resoudre) => {
    serveur.close(() => resoudre());
  });
}

function jumeler(entrant: Socket, sortant: Socket, sockets: Set<Socket>): void {
  for (const socket of [entrant, sortant]) {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => socket.destroy());
  }
  entrant.pipe(sortant);
  sortant.pipe(entrant);
}

async function ouvrirRelais(hote: string, cible: number): Promise<Relais> {
  const sockets = new Set<Socket>();
  const serveur = createServer((entrant) => {
    jumeler(entrant, connect({ host: hote, port: cible }), sockets);
  });
  const port = await ecouter(serveur, 0);
  const detruireSockets = (): void => {
    for (const socket of [...sockets]) {
      socket.destroy();
    }
  };
  return {
    port,
    async couper(): Promise<void> {
      const fermeture = arreterServeur(serveur);
      detruireSockets();
      await fermeture;
    },
    async retablir(): Promise<void> {
      await ecouter(serveur, port);
    },
    async fermer(): Promise<void> {
      const fermeture = arreterServeur(serveur);
      detruireSockets();
      await fermeture;
    },
  };
}

function analyserTrame(trame: string): EvenementFlux | null {
  const lignes = trame.split('\n');
  const type = lignes.find((ligne) => ligne.startsWith('event: '))?.slice(7);
  const donnees = lignes.find((ligne) => ligne.startsWith('data: '))?.slice(6);
  if (type === undefined || donnees === undefined) {
    return null;
  }
  return { type, donnees: JSON.parse(donnees) as Record<string, unknown> };
}

function collecter(reponse: IncomingMessage, flux: FluxEcoute): void {
  let tampon = '';
  reponse.setEncoding('utf8');
  reponse.on('data', (morceau: string) => {
    tampon += morceau;
    const trames = tampon.split('\n\n');
    tampon = trames.pop() ?? '';
    for (const trame of trames) {
      const evenement = analyserTrame(trame);
      if (evenement) {
        flux.evenements.push(evenement);
      }
    }
  });
}

function abonner(
  port: number,
  chemin: string,
  jeton: string,
): Promise<FluxEcoute> {
  return new Promise((resoudre, rejeter) => {
    const requete: ClientRequest = requeteNode(
      {
        host: ADRESSE_BOUCLE_LOCALE,
        port,
        path: chemin,
        headers: { [EN_TETE_JETON]: jeton },
      },
      (reponse) => {
        const flux: FluxEcoute = {
          evenements: [],
          fermer: () => requete.destroy(),
        };
        collecter(reponse, flux);
        resoudre(flux);
      },
    );
    requete.on('error', rejeter);
    requete.end();
  });
}

function patienter(delaiMs: number): Promise<void> {
  return new Promise((resoudre) => setTimeout(resoudre, delaiMs));
}

async function attendre<T>(sonde: () => T | undefined): Promise<T> {
  const limite = Date.now() + ATTENTE_MAX_MS;
  while (Date.now() < limite) {
    const valeur = sonde();
    if (valeur !== undefined) {
      return valeur;
    }
    await patienter(PAS_SONDAGE_MS);
  }
  throw new Error('Rien a observer avant la fin du delai');
}

function premierEtat(flux: FluxEcoute): Promise<EvenementFlux> {
  return attendre(() =>
    flux.evenements.find((evenement) => evenement.type === 'etat'),
  );
}

function identifiantQuestion(question: number): string {
  return questionsDuCours(COURS_DE_CLASSE)[question].id;
}

const MESSAGE_DOUBLON = `Votre réponse à la question ${identifiantQuestion(0)} est déjà enregistrée : passez à la suivante.`;

function cleEtudiant(index: number): string {
  return `66666666-6666-4666-8666-${String(index).padStart(12, '0')}`;
}

function detailDe(reponse: Response): unknown {
  return (reponse.body as { detail?: unknown }).detail;
}

function questionsDuRapport(rapport: RapportSession): string[] {
  return rapport.participants
    .flatMap((participant) =>
      participant.reponses.map((reponse) => reponse.questionId),
    )
    .sort((gauche, droite) => gauche.localeCompare(droite));
}

describeDb('Formations face aux pannes du cours (db integration)', () => {
  silenceNestLogger(['log', 'error']);

  let banc: BancFormations;
  let contexte: ContexteFormations;
  let client: ClientFormations;
  let relais: Relais;
  const journal: string[] = [];

  const commander = (chemin: string): Test => client.formateur('post', chemin);

  const repondre = (sessionId: string, jeton: string, question: number): Test =>
    client.participant(`/sessions/${sessionId}/answers`, jeton).send({
      questionId: identifiantQuestion(question),
      valeur: 1,
      dureeMs: 12000,
    });

  const lireResultats = (sessionId: string): Test =>
    client.formateur('get', `/sessions/${sessionId}/results`);

  const piloter = (sessionId: string, ecran: number): Test =>
    client.formateur('patch', `/sessions/${sessionId}/control`).send({ ecran });

  const inscrire = async (code: string, index: number): Promise<Inscrit> => {
    const reponse = await client
      .anonyme(`/sessions/${code}/join`)
      .send({
        studentKey: cleEtudiant(index),
        prenom: `Prenom-${index}`,
        nom: `Nom-${index}`,
        email: `resilience-${index}@example.test`,
      })
      .expect(CREE);
    return reponse.body as Inscrit;
  };

  const demarrerSeance = async (): Promise<{
    seance: Seance;
    etudiant: Inscrit;
  }> => {
    const ouverture = await commander('/sessions')
      .send({ courseSlug: COURS_DE_CLASSE.slug })
      .expect(CREE);
    const seance = ouverture.body as Seance;
    const etudiant = await inscrire(seance.code, 0);
    await commander(`/sessions/${seance.sessionId}/start`).expect(SANS_CONTENU);
    return { seance, etudiant };
  };

  const syntheseEnvoyee = (): RapportSession =>
    banc.mailer.sendSyntheseFormateur.mock.calls[0][1];

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;
    const portBase = Number(process.env.DB_PORT ?? 5432);
    relais = await ouvrirRelais(process.env.DB_HOST ?? '127.0.0.1', portBase);
    process.env.DB_PORT = String(relais.port);
    banc = await monterBancFormations(creerCatalogueDeTest(COURS_DE_CLASSE));
    process.env.DB_PORT = String(portBase);
    contexte = banc.contexte;
    client = clientFormations(banc.app, FORMATEUR);
    jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation((message: unknown) => {
        journal.push(String(message));
      });
  });

  afterAll(async () => {
    await banc.fermer();
    await relais.fermer();
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
  });

  beforeEach(async () => {
    await contexte.nettoyer();
    journal.length = 0;
    jest.clearAllMocks();
    banc.mailer.sendSyntheseFormateur.mockResolvedValue(undefined);
    banc.mailer.sendCopieEtudiant.mockResolvedValue(undefined);
  });

  it(
    'dit quoi faire pendant la panne de base puis repart sans redemarrage',
    async () => {
      const { seance, etudiant } = await demarrerSeance();

      await relais.couper();
      const envoiCoupe = await repondre(seance.sessionId, etudiant.jeton, 0);
      const lectureCoupee = await lireResultats(seance.sessionId);
      await relais.retablir();

      expect([
        { statut: envoiCoupe.status, detail: detailDe(envoiCoupe) },
        { statut: lectureCoupee.status, detail: detailDe(lectureCoupee) },
      ]).toEqual([
        { statut: INDISPONIBLE, detail: MESSAGE_DEPENDANCE_INJOIGNABLE },
        { statut: INDISPONIBLE, detail: MESSAGE_DEPENDANCE_INJOIGNABLE },
      ]);

      const envoiRetabli = await repondre(seance.sessionId, etudiant.jeton, 0);
      const lectureRetablie = await lireResultats(seance.sessionId);

      expect(envoiRetabli.status).toBe(CREE);
      expect(lectureRetablie.status).toBe(OK);
      expect(
        questionsDuRapport(lectureRetablie.body as RapportSession),
      ).toEqual([identifiantQuestion(0)]);
    },
    DELAI_TEST_MS,
  );

  it(
    'cloture la seance et garde les resultats lisibles malgre un courriel en panne',
    async () => {
      const { seance, etudiant } = await demarrerSeance();
      await repondre(seance.sessionId, etudiant.jeton, 0).expect(CREE);
      banc.mailer.sendSyntheseFormateur.mockRejectedValue(
        new Error(PANNE_SMTP),
      );
      banc.mailer.sendCopieEtudiant.mockRejectedValue(new Error(PANNE_SMTP));

      const cloture = await commander(`/sessions/${seance.sessionId}/close`);
      const lecture = await lireResultats(seance.sessionId);
      const echecs = await attendre(() => {
        const lignes = journal.filter((ligne) => ligne.includes(PANNE_SMTP));
        return lignes.length >= 2 ? lignes : undefined;
      });

      expect(cloture.status).toBe(SANS_CONTENU);
      expect(lecture.status).toBe(OK);
      expect(questionsDuRapport(lecture.body as RapportSession)).toEqual([
        identifiantQuestion(0),
      ]);
      expect(echecs.filter((ligne) => ligne.includes(SYNTHESE_A))).toHaveLength(
        1,
      );
      expect(
        echecs.filter((ligne) => ligne.includes('resilience-0@example.test')),
      ).toHaveLength(1);
      const session = await contexte.sessions.findById(seance.sessionId);
      expect(session?.etat).toBe('terminee');
    },
    DELAI_TEST_MS,
  );

  it(
    'n enregistre qu une reponse quand un etudiant revenu du reseau la rejoue trois fois',
    async () => {
      const { seance, etudiant } = await demarrerSeance();

      const rejeux: Response[] = [];
      for (let essai = 0; essai < 3; essai += 1) {
        rejeux.push(await repondre(seance.sessionId, etudiant.jeton, 0));
      }
      const suite = await repondre(seance.sessionId, etudiant.jeton, 1);

      expect(rejeux.map((reponse) => reponse.status)).toEqual([
        CREE,
        CONFLIT,
        CONFLIT,
      ]);
      expect(rejeux.slice(1).map((reponse) => detailDe(reponse))).toEqual([
        MESSAGE_DOUBLON,
        MESSAGE_DOUBLON,
      ]);
      expect(suite.status).toBe(CREE);
      const enBase = await contexte.answers.listBySession(seance.sessionId);
      expect(
        enBase
          .map((reponse) => reponse.questionId)
          .sort((a, b) => a.localeCompare(b)),
      ).toEqual([identifiantQuestion(0), identifiantQuestion(1)]);
    },
    DELAI_TEST_MS,
  );

  it(
    'rend l ecran courant a l etudiant dont le flux a ete coupe',
    async () => {
      const { seance, etudiant } = await demarrerSeance();
      const chemin = client.chemin(`/sessions/${seance.sessionId}/stream`);

      const avant = await abonner(banc.port, chemin, etudiant.jeton);
      const premier = await premierEtat(avant);
      avant.fermer();

      await piloter(seance.sessionId, ECRAN_APRES_COUPURE).expect(SANS_CONTENU);

      const apres = await abonner(banc.port, chemin, etudiant.jeton);
      const repris = await premierEtat(apres);
      apres.fermer();

      expect(premier.donnees.ecranCourant).toBe(0);
      expect({
        ecranCourant: repris.donnees.ecranCourant,
        etat: repris.donnees.etat,
      }).toEqual({ ecranCourant: ECRAN_APRES_COUPURE, etat: 'en_cours' });
    },
    DELAI_TEST_MS,
  );

  it(
    'lit sans incoherence une seance restee ouverte toute la nuit',
    async () => {
      const { seance, etudiant } = await demarrerSeance();
      await repondre(seance.sessionId, etudiant.jeton, 0).expect(CREE);
      await contexte.dataSource.query(
        `UPDATE formation_sessions SET ouverte_le = now() - interval '${NUIT_ENTIERE}', maj_le = now() - interval '${NUIT_ENTIERE}' WHERE id = $1`,
        [seance.sessionId],
      );

      const lecture = await lireResultats(seance.sessionId);
      const lendemain = await repondre(seance.sessionId, etudiant.jeton, 1);
      const avantCloture = await contexte.sessions.findById(seance.sessionId);
      const cloture = await commander(`/sessions/${seance.sessionId}/close`);
      const apresCloture = await contexte.sessions.findById(seance.sessionId);

      expect(lecture.status).toBe(OK);
      expect(lendemain.status).toBe(CREE);
      expect({
        etat: avantCloture?.etat,
        fermeeLe: avantCloture?.fermeeLe,
      }).toEqual({ etat: 'en_cours', fermeeLe: null });
      expect(cloture.status).toBe(SANS_CONTENU);
      expect(apresCloture?.etat).toBe('terminee');
      expect(
        (apresCloture?.fermeeLe?.getTime() ?? 0) >
          (apresCloture?.ouverteLe.getTime() ?? 0),
      ).toBe(true);
      expect(questionsDuRapport(syntheseEnvoyee())).toEqual([
        identifiantQuestion(0),
        identifiantQuestion(1),
      ]);
    },
    DELAI_TEST_MS,
  );

  it(
    'garde dans la synthese la reponse acceptee pendant la cloture',
    async () => {
      const { seance, etudiant } = await demarrerSeance();
      let liberer = (): void => undefined;
      let signaler = (): void => undefined;
      const barriere = new Promise<void>((resoudre) => {
        liberer = resoudre;
      });
      const clotureEnCours = new Promise<void>((resoudre) => {
        signaler = resoudre;
      });
      const reel = contexte.sessions.update.bind(contexte.sessions);
      const espion = jest
        .spyOn(contexte.sessions, 'update')
        .mockImplementation(async (id, entree) => {
          signaler();
          await barriere;
          return reel(id, entree);
        });

      const cloture = commander(`/sessions/${seance.sessionId}/close`).then(
        (reponse) => reponse,
      );
      await clotureEnCours;
      const envoi = await repondre(seance.sessionId, etudiant.jeton, 0);
      liberer();
      const fin = await cloture;
      espion.mockRestore();

      expect(envoi.status).toBe(CREE);
      expect(fin.status).toBe(SANS_CONTENU);
      const enBase = await contexte.answers.listBySession(seance.sessionId);
      expect(enBase.map((reponse) => reponse.questionId)).toEqual([
        identifiantQuestion(0),
      ]);
      expect(questionsDuRapport(syntheseEnvoyee())).toEqual([
        identifiantQuestion(0),
      ]);
    },
    DELAI_TEST_MS,
  );
});
