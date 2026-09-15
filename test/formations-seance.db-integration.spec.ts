import type { INestApplication } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import request from 'supertest';
import type { Response } from 'supertest';
import type { Bareme } from '../src/modules/formations/domain/Bareme';
import { libelleDeConfusion } from '../src/modules/formations/domain/cours/banque/confusions';
import { questionsDuCours } from '../src/modules/formations/domain/cours/Cours';
import { NOMBRE_TIRAGES_DISTRIBUES } from '../src/modules/formations/domain/cours/OuvertureTirages';
import { tirer } from '../src/modules/formations/domain/cours/Tirage';
import type { Solution } from '../src/modules/formations/domain/GradingCore';
import type { AnswerRecord } from '../src/modules/formations/domain/IAnswers.repository';
import type { RapportSession } from '../src/modules/formations/domain/IFormationMailer.port';
import { FormationMailerService } from '../src/modules/formations/infrastructure/FormationMailer.service';
import {
  buildCoursDeClasse,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { setSmtpEnv } from './factories/mailer.factory';
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
import {
  ecouterEnBoucleLocale,
  fermerApplication,
} from './helpers/nest-test-app';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const createTransportMock = createTransport as jest.MockedFunction<
  typeof createTransport
>;

const TAILLE_CLASSE = 30;
const NB_QUESTIONS = 12;
const COURS_DE_CLASSE = buildCoursDeClasse(NB_QUESTIONS);
const QUESTIONS_NOTEES = questionsDuCours(COURS_DE_CLASSE).filter(
  (question) => question.noteCompte,
);
const CONFUSION_PIEGE = 'raisonnement-additif';
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'synthese-formateur@example.test';
const EN_TETE_JETON = 'x-participant-token';
const PERIODE_PIEGE_ETUDIANT = 5;
const PERIODE_PIEGE_QUESTION = 4;
const RESTE_PIEGE_QUESTION = 3;
const NOTE_ATTENDUE = 20;
const ECART_DANS_LA_TOLERANCE = 0.5;
const TIRAGES_DU_CORRIGE = NOMBRE_TIRAGES_DISTRIBUES + 1;

interface CourrielEnvoye {
  to?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; content?: string }>;
}

interface ReponseInscription {
  participantId: string;
  jeton: string;
}

interface ValeursTirees {
  juste: number;
  piege: number;
}

interface Etudiant {
  index: number;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  participantId: string;
  jeton: string;
  seed: number;
  valeurs: readonly ValeursTirees[];
}

function identifiantQuestion(question: number): string {
  return QUESTIONS_NOTEES[question].id;
}

function conceptDe(question: number): string {
  return QUESTIONS_NOTEES[question].concept;
}

function valeursTirees(seed: number): ValeursTirees[] {
  const { solutions } = tirer(COURS_DE_CLASSE, seed);
  return QUESTIONS_NOTEES.map(({ id }) => {
    const solution: Solution | undefined = solutions[id];
    const juste = solution?.valeur;
    const piege = solution?.pieges.at(0)?.valeur;
    if (typeof juste !== 'number' || typeof piege !== 'number') {
      throw new Error(`Tirage ${seed} sans valeur numerique pour ${id}`);
    }
    return { juste: juste + ECART_DANS_LA_TOLERANCE, piege };
  });
}

function estPiege(etudiant: number, question: number): boolean {
  return (
    etudiant % PERIODE_PIEGE_ETUDIANT === 0 &&
    question % PERIODE_PIEGE_QUESTION === RESTE_PIEGE_QUESTION
  );
}

function valeurEnvoyee(etudiant: Etudiant, question: number): number {
  const valeurs = etudiant.valeurs[question];
  return estPiege(etudiant.index, question) ? valeurs.piege : valeurs.juste;
}

function dureeDe(question: number): number {
  return 12000 + question * 100;
}

function solutionsNumeriques(
  solutions: Readonly<Record<string, Solution>>,
): string[] {
  return Object.values(solutions)
    .map((solution) => solution.valeur)
    .filter((valeur): valeur is number => typeof valeur === 'number')
    .map(String);
}

function corrigeComplet(bareme: Bareme): string[] {
  return [
    ...solutionsNumeriques(
      tirer(COURS_DE_CLASSE, bareme.graineReference).solutions,
    ),
    ...bareme.tirages.flatMap((tirage) =>
      solutionsNumeriques(tirage.solutions),
    ),
  ];
}

function verifierReponsesCorrigees(
  etudiants: readonly Etudiant[],
  reponsesEnBase: readonly AnswerRecord[],
): void {
  const attendues = etudiants.flatMap((etudiant) =>
    Array.from({ length: NB_QUESTIONS }, (_, question) => {
      const piege = estPiege(etudiant.index, question);
      return {
        cle: `${etudiant.participantId}:${identifiantQuestion(question)}`,
        concept: conceptDe(question),
        seed: etudiant.seed,
        correcte: !piege,
        misconception: piege ? CONFUSION_PIEGE : null,
        valeur: valeurEnvoyee(etudiant, question),
        dureeMs: dureeDe(question),
      };
    }),
  );
  const observees = reponsesEnBase.map((reponse) => ({
    cle: `${reponse.participantId}:${reponse.questionId}`,
    concept: reponse.concept,
    seed: reponse.seed,
    correcte: reponse.correcte,
    misconception: reponse.misconception,
    valeur: reponse.valeur,
    dureeMs: reponse.dureeMs,
  }));
  expect(trierParCle(observees)).toEqual(trierParCle(attendues));
  expect(reponsesEnBase.filter((reponse) => !reponse.correcte)).toHaveLength(
    (TAILLE_CLASSE / PERIODE_PIEGE_ETUDIANT) *
      (NB_QUESTIONS / PERIODE_PIEGE_QUESTION),
  );
}

async function verifierMaitrise(
  contexte: ContexteFormations,
  etudiants: readonly Etudiant[],
): Promise<void> {
  for (const etudiant of etudiants) {
    const maitrise = await contexte.mastery.findByStudentKey(
      etudiant.studentKey,
    );
    expect(
      maitrise.map((entree) => ({
        concept: entree.concept,
        boite: entree.boite,
        succes: entree.succes,
        echecs: entree.echecs,
      })),
    ).toEqual(
      etudiant.index % PERIODE_PIEGE_ETUDIANT === 0
        ? MAITRISE_ETUDIANT_PIEGE
        : MAITRISE_ETUDIANT_SUR,
    );
  }
}

function verifierRapport(
  etudiants: readonly Etudiant[],
  rapport: RapportSession,
): void {
  expect(rapport.participants).toHaveLength(TAILLE_CLASSE);
  expect(rapport.conceptsFragiles).toEqual([]);
  etudiants.forEach((etudiant, rang) => {
    const ligne = rapport.participants[rang];
    expect({
      nom: ligne.nom,
      email: ligne.email,
      completion: ligne.completion,
      note: ligne.note,
      sousSeuil: ligne.sousSeuil,
      reponses: ligne.reponses.map((reponse) => reponse.questionId),
      incidents: ligne.incidents,
    }).toEqual({
      nom: etudiant.nom,
      email: etudiant.email,
      completion: 1,
      note: NOTE_ATTENDUE,
      sousSeuil: false,
      reponses: QUESTIONS_NOTEES.map(({ id }) => id),
      incidents: etudiant.index % PERIODE_PIEGE_ETUDIANT === 0 ? 1 : 0,
    });
  });
}

function verifierSynthese(
  etudiants: readonly Etudiant[],
  courriels: readonly CourrielEnvoye[],
): void {
  const synthese = courriels.filter((courriel) => courriel.to === SYNTHESE_A);
  expect(synthese).toHaveLength(1);
  const corps = `${synthese[0].text ?? ''}${synthese[0].html ?? ''}`;
  const csv = synthese[0].attachments?.[0].content ?? '';
  const emailEtQuestionParLigne = csv
    .split('\r\n')
    .slice(1)
    .map((ligne) => ligne.split(';').slice(2, 4).join(';'));
  expect(emailEtQuestionParLigne).toEqual(
    etudiants.flatMap((etudiant) =>
      QUESTIONS_NOTEES.map(({ id }) => `"${etudiant.email}";"${id}"`),
    ),
  );
  for (const etudiant of etudiants) {
    expect(corps).toContain(etudiant.nom);
  }
}

function verifierCopies(
  etudiants: readonly Etudiant[],
  courriels: readonly CourrielEnvoye[],
): void {
  const copies = courriels.filter((courriel) => courriel.to !== SYNTHESE_A);
  expect(trierAdresses(copies.map((copie) => copie.to ?? ''))).toEqual(
    trierAdresses(etudiants.map((etudiant) => etudiant.email)),
  );
  for (const copie of copies) {
    const corps = JSON.stringify(copie);
    const destinataire = etudiants.find(
      (etudiant) => etudiant.email === copie.to,
    );
    expect(destinataire?.prenom ?? '').not.toBe('');
    expect(corps).toContain(destinataire?.prenom ?? 'aucun destinataire');
    for (const autre of etudiants.filter(
      (etudiant) => etudiant.email !== copie.to,
    )) {
      expect(corps).not.toContain(autre.nom);
      expect(corps).not.toContain(autre.email);
      expect(corps).not.toContain(autre.prenom);
    }
  }
}

function trierAdresses(adresses: readonly string[]): string[] {
  return [...adresses].sort((gauche, droite) => gauche.localeCompare(droite));
}

function trierParCle<T extends { cle: string }>(lignes: readonly T[]): T[] {
  return [...lignes].sort((gauche, droite) =>
    gauche.cle.localeCompare(droite.cle),
  );
}

const MAITRISE_ETUDIANT_SUR = [
  {
    concept: 'coefficient-multiplicateur',
    boite: 3,
    succes: 12,
    echecs: 0,
  },
];

const MAITRISE_ETUDIANT_PIEGE = [
  {
    concept: 'coefficient-multiplicateur',
    boite: 1,
    succes: 9,
    echecs: 3,
  },
];

function cleEtudiant(index: number): string {
  return `33333333-3333-4333-8333-${String(index).padStart(12, '0')}`;
}

function nomDe(index: number): string {
  return `Nom-${String(index).padStart(2, '0')}`;
}

function prenomDe(index: number): string {
  return `Prenom-${String(index).padStart(2, '0')}`;
}

function emailDe(index: number): string {
  return `etudiant-${String(index).padStart(2, '0')}@example.test`;
}

const NB_REQUETES_ATTENDUES =
  1 +
  TAILLE_CLASSE +
  TAILLE_CLASSE +
  1 +
  NB_QUESTIONS +
  TAILLE_CLASSE * NB_QUESTIONS +
  TAILLE_CLASSE / PERIODE_PIEGE_ETUDIANT +
  1 +
  1;

describeDb(
  'Parcours complet d une seance de formation (db integration)',
  () => {
    let contexte: ContexteFormations;
    let app: INestApplication;
    let restaurerSmtp: () => void;
    const courriels: CourrielEnvoye[] = [];
    const corpsHttp: string[] = [];

    const serveur = (): Parameters<typeof request>[0] =>
      app.getHttpServer() as Parameters<typeof request>[0];

    const route = (chemin: string): string =>
      `/${PREFIXE_API}/formations${chemin}`;

    const noter = (reponse: Response): Response => {
      corpsHttp.push(reponse.text);
      return reponse;
    };

    beforeAll(async () => {
      process.env.FORMATION_REVIEW_TOKEN_SECRET = SECRET;
      process.env.FORMATION_TEACHER_NOTIFICATION_TO = SYNTHESE_A;
      restaurerSmtp = setSmtpEnv();
      createTransportMock.mockReturnValue({
        sendMail: (options: CourrielEnvoye) => {
          courriels.push(options);
          return Promise.resolve({ messageId: 'test' });
        },
      } as unknown as ReturnType<typeof createTransport>);

      contexte = await ouvrirContexteFormations();
      await contexte.nettoyer();
      app = await monterApplicationFormations(
        {
          sessions: contexte.sessions,
          participants: contexte.participants,
          answers: contexte.answers,
          incidents: contexte.incidents,
          mastery: contexte.mastery,
          mailer: new FormationMailerService(),
        },
        creerCatalogueDeTest(COURS_DE_CLASSE),
      );
      await ecouterEnBoucleLocale(app);
    });

    afterAll(async () => {
      await fermerApplication(app);
      await contexte.fermer();
      restaurerSmtp();
      delete process.env.FORMATION_REVIEW_TOKEN_SECRET;
      delete process.env.FORMATION_TEACHER_NOTIFICATION_TO;
    });

    it('mene trente etudiants de l ouverture a la cloture sans fuiter le corrige', async () => {
      const ouverture = noter(
        await request(serveur())
          .post(route('/sessions'))
          .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
          .send({ courseSlug: COURS_DE_CLASSE.slug })
          .expect(201),
      );
      const { sessionId, code } = ouverture.body as {
        sessionId: string;
        code: string;
      };

      const etudiants: Etudiant[] = [];
      for (let index = 0; index < TAILLE_CLASSE; index += 1) {
        const inscription = noter(
          await request(serveur())
            .post(route(`/sessions/${code}/join`))
            .send({
              studentKey: cleEtudiant(index),
              prenom: prenomDe(index),
              nom: nomDe(index),
              email: emailDe(index),
            })
            .expect(201),
        );
        const corps = inscription.body as ReponseInscription;
        const graine = await contexte.graineDe(corps.participantId);
        etudiants.push({
          index,
          studentKey: cleEtudiant(index),
          prenom: prenomDe(index),
          nom: nomDe(index),
          email: emailDe(index),
          participantId: corps.participantId,
          jeton: corps.jeton,
          seed: graine,
          valeurs: valeursTirees(graine),
        });
      }

      expect(new Set(etudiants.map((etudiant) => etudiant.seed)).size).toBe(
        TAILLE_CLASSE,
      );

      for (const etudiant of etudiants) {
        const sujet = noter(
          await request(serveur())
            .get(route(`/sessions/${sessionId}/sujet`))
            .set(EN_TETE_JETON, etudiant.jeton)
            .expect(200),
        );
        const sujetAttendu = tirer(COURS_DE_CLASSE, etudiant.seed).sujet;
        expect(sujet.body).toEqual({
          ...sujetAttendu,
          ecrans: sujetAttendu.ecrans.map((ecran, index) =>
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
      }

      noter(
        await request(serveur())
          .post(route(`/sessions/${sessionId}/start`))
          .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
          .expect(204),
      );

      for (let question = 0; question < NB_QUESTIONS; question += 1) {
        for (const etudiant of etudiants) {
          const piege = estPiege(etudiant.index, question);
          const verdict = noter(
            await request(serveur())
              .post(route(`/sessions/${sessionId}/answers`))
              .set(EN_TETE_JETON, etudiant.jeton)
              .send({
                questionId: identifiantQuestion(question),
                valeur: valeurEnvoyee(etudiant, question),
                dureeMs: dureeDe(question),
              })
              .expect(201),
          );
          expect(verdict.body).toEqual({
            correcte: !piege,
            misconception: piege ? CONFUSION_PIEGE : null,
            libelleConfusion: piege
              ? libelleDeConfusion(CONFUSION_PIEGE)
              : null,
          });
        }
        noter(
          await request(serveur())
            .patch(route(`/sessions/${sessionId}/control`))
            .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
            .send({ ecran: question + 1 })
            .expect(204),
        );
      }

      const distraits = etudiants.filter(
        (etudiant) => etudiant.index % PERIODE_PIEGE_ETUDIANT === 0,
      );
      for (const etudiant of distraits) {
        noter(
          await request(serveur())
            .post(route(`/sessions/${sessionId}/incidents`))
            .set(EN_TETE_JETON, etudiant.jeton)
            .send({
              incidents: [
                {
                  type: 'tab_hidden',
                  horodatage: new Date(
                    '2026-09-12T09:30:00.000Z',
                  ).toISOString(),
                },
              ],
            })
            .expect(204),
        );
      }

      const lecture = noter(
        await request(serveur())
          .get(route(`/sessions/${sessionId}/results`))
          .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
          .expect(200),
      );
      const rapport = lecture.body as RapportSession;

      noter(
        await request(serveur())
          .post(route(`/sessions/${sessionId}/close`))
          .set(EN_TETE_IDENTITE, `${FORMATEUR}:teacher`)
          .expect(204),
      );

      const participantsEnBase =
        await contexte.participants.listBySession(sessionId);
      expect(participantsEnBase).toHaveLength(TAILLE_CLASSE);
      expect(
        new Set(participantsEnBase.map((participant) => participant.seed)).size,
      ).toBe(TAILLE_CLASSE);

      const reponsesEnBase = await contexte.answers.listBySession(sessionId);
      expect(reponsesEnBase).toHaveLength(TAILLE_CLASSE * NB_QUESTIONS);

      verifierReponsesCorrigees(etudiants, reponsesEnBase);

      const seance = await contexte.sessions.findById(sessionId);
      expect(seance?.etat).toBe('terminee');
      expect(seance?.ecranCourant).toBe(NB_QUESTIONS);

      await verifierMaitrise(contexte, etudiants);
      verifierRapport(etudiants, rapport);
      verifierSynthese(etudiants, courriels);
      verifierCopies(etudiants, courriels);

      const corrige = seance ? corrigeComplet(seance.bareme) : [];
      expect(corrige).toHaveLength(TIRAGES_DU_CORRIGE * NB_QUESTIONS);
      expect(corpsHttp).toHaveLength(NB_REQUETES_ATTENDUES);
      const tout = corpsHttp.join('\n');
      for (const solution of corrige) {
        expect(tout).not.toContain(solution);
      }
    }, 600_000);
  },
);
