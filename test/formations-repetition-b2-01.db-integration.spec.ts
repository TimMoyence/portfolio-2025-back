import request from 'supertest';
import type { ResultatsDeSeance } from '../src/modules/formations/application/GetSessionResults.useCase';
import { libelleDeConfusion } from '../src/modules/formations/domain/cours/banque/confusions';
import {
  estInteractif,
  questionsDe,
  questionsDuCours,
} from '../src/modules/formations/domain/cours/Cours';
import type { Question } from '../src/modules/formations/domain/cours/Cours';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import type { TirageDuCours } from '../src/modules/formations/domain/cours/Tirage';
import { NE_SAIT_PAS } from '../src/modules/formations/domain/GradingCore';
import type {
  AnswerValue,
  Solution,
  Tolerance,
} from '../src/modules/formations/domain/GradingCore';
import type {
  ConfusionComptee,
  ResultatQuestion,
  ResultatsSeance,
} from '../src/modules/formations/domain/ResultatsSeance';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import { clesDuCorrigeDans } from './helpers/cles-du-corrige';
import { describeDb } from './helpers/db-integration-datasource';
import { DELAI_OUVERTURE_CONTEXTE_MS } from './helpers/formations-db';
import {
  abonnerAuFlux,
  clientFormations,
  coursPublie,
  EN_TETE_IDENTITE,
  monterBancFormations,
  patienter,
  type BancFormations,
  type ClientFormations,
  type FluxEcoute,
} from './helpers/formations-harness';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const SLUG = 'b2-01-traitement-information-chiffree';
const TAILLE_CLASSE = 30;
const PERIODE_PIEGE = 5;
const FORMATEUR = 'b7777777-7777-4777-8777-777777777777';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'repetition-formateur@example.test';
const DUREE_REPONSE_MS = 45_000;
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;
const REQUETE_INVALIDE = 400;
const ATTENTE_FLUX_MS = 15_000;
const PAS_SONDAGE_MS = 50;
const DELAI_TEST_MS = 600_000;
const DEMI = 2;
const FRACTION_DANS_L_ARRONDI = 0.4;

interface Inscription {
  participantId: string;
  jeton: string;
}

interface Etudiant extends Inscription {
  index: number;
  tirage: TirageDuCours;
}

interface ReponseEnvoyee {
  questionId: string;
  valeur: AnswerValue;
  confusion: string | null;
}

const COURS = coursPublie(SLUG);

function dansLaTolerance(valeur: number, tolerance: Tolerance): number {
  switch (tolerance.type) {
    case 'absolue':
      return valeur + tolerance.valeur / DEMI;
    case 'relative':
      return valeur * (1 + tolerance.valeur / DEMI);
    case 'decimales': {
      const facteur = 10 ** tolerance.valeur;
      return (Math.round(valeur * facteur) + FRACTION_DANS_L_ARRONDI) / facteur;
    }
  }
}

function bonneValeur(question: Question, solution: Solution): AnswerValue {
  return question.type === 'numeric' && typeof solution.valeur === 'number'
    ? dansLaTolerance(solution.valeur, question.tolerance)
    : solution.valeur;
}

function reponseDe(etudiant: Etudiant, question: Question): ReponseEnvoyee {
  const solution = etudiant.tirage.solutions[question.id];
  const piege =
    etudiant.index % PERIODE_PIEGE === 0 ? solution.pieges.at(0) : undefined;
  return piege === undefined
    ? {
        questionId: question.id,
        valeur: bonneValeur(question, solution),
        confusion: null,
      }
    : {
        questionId: question.id,
        valeur: piege.valeur,
        confusion: piege.misconception,
      };
}

function verdictAttendu(reponse: ReponseEnvoyee): Record<string, unknown> {
  return {
    correcte: reponse.confusion === null,
    misconception: reponse.confusion,
    libelleConfusion:
      reponse.confusion === null ? null : libelleDeConfusion(reponse.confusion),
  };
}

function parIdentifiant(
  gauche: ConfusionComptee,
  droite: ConfusionComptee,
): number {
  return gauche.id.localeCompare(droite.id);
}

function confusionsComptees(
  reponses: readonly ReponseEnvoyee[],
): ConfusionComptee[] {
  const nombres = new Map<string, number>();
  for (const { confusion } of reponses) {
    if (confusion !== null) {
      nombres.set(confusion, (nombres.get(confusion) ?? 0) + 1);
    }
  }
  return [...nombres.entries()]
    .map(([id, nombre]) => ({
      id,
      libelle: libelleDeConfusion(id) ?? id,
      nombre,
    }))
    .sort(parIdentifiant);
}

function resultatAttendu(
  questionId: string,
  envoyees: readonly ReponseEnvoyee[],
): ResultatQuestion {
  const reponses = envoyees.filter(
    (reponse) => reponse.questionId === questionId,
  );
  return {
    questionId,
    total: reponses.length,
    correctes: reponses.filter((reponse) => reponse.confusion === null).length,
    neSaitPas: reponses.filter((reponse) => reponse.valeur === NE_SAIT_PAS)
      .length,
    confusions: confusionsComptees(reponses),
  };
}

function resultatObserve(resultat: ResultatQuestion): ResultatQuestion {
  return {
    ...resultat,
    confusions: [...resultat.confusions].sort(parIdentifiant),
  };
}

function totauxParQuestion(
  resultats: ResultatsSeance | undefined,
): { questionId: string; total: number }[] {
  return (resultats?.questions ?? []).map(({ questionId, total }) => ({
    questionId,
    total,
  }));
}

function resultatsPousses(flux: FluxEcoute): ResultatsSeance[] {
  return flux.evenements
    .filter((evenement) => evenement.type === 'resultats')
    .map((evenement) => evenement.donnees as unknown as ResultatsSeance);
}

async function derniersResultatsDuFlux(
  flux: FluxEcoute,
  attendus: readonly { questionId: string; total: number }[],
): Promise<ResultatsSeance | undefined> {
  const limite = Date.now() + ATTENTE_FLUX_MS;
  const empreinte = JSON.stringify(attendus);
  while (
    JSON.stringify(totauxParQuestion(resultatsPousses(flux).at(-1))) !==
      empreinte &&
    Date.now() < limite
  ) {
    await patienter(PAS_SONDAGE_MS);
  }
  return resultatsPousses(flux).at(-1);
}

function cleEtudiant(index: number): string {
  return `88888888-8888-4888-8888-${String(index).padStart(12, '0')}`;
}

describeDb('Repetition a blanc de B2-01 (db integration)', () => {
  silenceNestLogger();

  let banc: BancFormations;
  let client: ClientFormations;

  const serveur = (): Parameters<typeof request>[0] =>
    banc.app.getHttpServer() as Parameters<typeof request>[0];

  const inscrire = async (code: string, index: number): Promise<Etudiant> => {
    const reponse = await client
      .anonyme(`/sessions/${code}/join`)
      .send({
        studentKey: cleEtudiant(index),
        prenom: `Prenom-${index}`,
        nom: `Nom-${index}`,
        email: `repetition-${index}@example.test`,
      })
      .expect(CREE);
    const inscription = reponse.body as Inscription;
    const graine = await banc.contexte.graineDe(inscription.participantId);
    return { ...inscription, index, tirage: tirer(COURS, graine) };
  };

  const lireLeSujet = async (
    sessionId: string,
    etudiant: Etudiant,
  ): Promise<void> => {
    const reponse = await request(serveur())
      .get(client.chemin(`/sessions/${sessionId}/sujet`))
      .set(EN_TETE_JETON, etudiant.jeton);
    expect({
      etudiant: etudiant.index,
      statut: reponse.status,
      clesDuCorrige: clesDuCorrigeDans(reponse.body),
    }).toEqual({ etudiant: etudiant.index, statut: OK, clesDuCorrige: [] });
    expect(reponse.body).toEqual({
      ...etudiant.tirage.sujet,
      ecrans: etudiant.tirage.sujet.ecrans.map((ecran, index) =>
        index === 0
          ? ecran
          : {
              ...ecran,
              type: 'ecran-verrouille',
              interactif: false,
              donnees: {},
            },
      ),
    });
  };

  const piloter = (sessionId: string, ecran: number) =>
    client.formateur('patch', `/sessions/${sessionId}/control`).send({ ecran });

  const repondre = async (
    sessionId: string,
    etudiant: Etudiant,
    question: Question,
  ): Promise<ReponseEnvoyee> => {
    const envoi = reponseDe(etudiant, question);
    const verdict = await client
      .participant(`/sessions/${sessionId}/answers`, etudiant.jeton)
      .send({
        questionId: envoi.questionId,
        valeur: envoi.valeur,
        dureeMs: DUREE_REPONSE_MS,
      });
    expect({
      questionId: envoi.questionId,
      etudiant: etudiant.index,
      statut: verdict.status,
      verdict: verdict.body as unknown,
    }).toEqual({
      questionId: envoi.questionId,
      etudiant: etudiant.index,
      statut: CREE,
      verdict: verdictAttendu(envoi),
    });
    return envoi;
  };

  const jouerLesEcrans = async (
    sessionId: string,
    etudiants: readonly Etudiant[],
  ): Promise<ReponseEnvoyee[]> => {
    const envoyees: ReponseEnvoyee[] = [];
    for (const [rang, ecran] of COURS.ecrans.entries()) {
      await piloter(sessionId, rang).expect(SANS_CONTENU);
      const questions = estInteractif(ecran) ? questionsDe(ecran) : [];
      for (const question of questions) {
        for (const etudiant of etudiants) {
          envoyees.push(await repondre(sessionId, etudiant, question));
        }
      }
    }
    return envoyees;
  };

  beforeAll(async () => {
    process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
    process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;
    banc = await monterBancFormations();
    await banc.contexte.nettoyer();
    client = clientFormations(banc.app, FORMATEUR);
  }, DELAI_OUVERTURE_CONTEXTE_MS);

  afterAll(async () => {
    await banc.fermer();
    delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
    delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
  });

  it(
    'joue une seance de cours B2 de l ouverture a la cloture sur le vrai catalogue',
    async () => {
      const ouverture = await client
        .formateur('post', '/sessions')
        .send({ courseSlug: SLUG })
        .expect(CREE);
      const { sessionId, code } = ouverture.body as {
        sessionId: string;
        code: string;
      };

      const etudiants: Etudiant[] = [];
      for (let index = 0; index < TAILLE_CLASSE; index += 1) {
        etudiants.push(await inscrire(code, index));
      }
      for (const etudiant of etudiants) {
        await lireLeSujet(sessionId, etudiant);
      }

      await client
        .formateur('post', `/sessions/${sessionId}/start`)
        .expect(SANS_CONTENU);
      const flux = await abonnerAuFlux(
        banc.port,
        client.chemin(`/sessions/${sessionId}/presenter-stream`),
        { [EN_TETE_IDENTITE]: `${FORMATEUR}:teacher` },
      );

      const envoyees = await jouerLesEcrans(sessionId, etudiants);
      const dernierEcran = COURS.ecrans.length - 1;
      await piloter(sessionId, COURS.ecrans.length).expect(REQUETE_INVALIDE);
      const seance = await banc.contexte.sessions.findById(sessionId);
      expect(seance?.ecranCourant).toBe(dernierEcran);

      const attendus = questionsDuCours(COURS).map((question) =>
        resultatAttendu(question.id, envoyees),
      );
      const totauxAttendus = totauxParQuestion({
        participants: TAILLE_CLASSE,
        questions: attendus,
      });
      const pousses = await derniersResultatsDuFlux(flux, totauxAttendus);
      expect(flux.statut).toBe(OK);
      expect(resultatsPousses(flux).length).toBeGreaterThan(0);
      expect({
        participants: pousses?.participants,
        totaux: totauxParQuestion(pousses),
        reponses: totauxParQuestion(pousses).reduce(
          (somme, { total }) => somme + total,
          0,
        ),
      }).toEqual({
        participants: TAILLE_CLASSE,
        totaux: totauxAttendus,
        reponses: envoyees.length,
      });

      const lecture = await client
        .formateur('get', `/sessions/${sessionId}/results`)
        .expect(OK);
      const { resultats } = lecture.body as ResultatsDeSeance;
      expect(resultats.participants).toBe(TAILLE_CLASSE);
      expect(resultats.questions.map(resultatObserve)).toEqual(attendus);
      expect(
        resultats.questions.filter(({ total }) => total !== TAILLE_CLASSE),
      ).toEqual([]);

      await client
        .formateur('post', `/sessions/${sessionId}/close`)
        .expect(SANS_CONTENU);
      flux.fermer();
    },
    DELAI_TEST_MS,
  );
});
