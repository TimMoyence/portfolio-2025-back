import type { INestApplication } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import request from 'supertest';
import type { Response } from 'supertest';
import type { Bareme } from '../src/modules/formations/domain/Bareme';
import type { AnswerRecord } from '../src/modules/formations/domain/IAnswers.repository';
import type { RapportSession } from '../src/modules/formations/domain/IFormationMailer.port';
import { FormationMailerService } from '../src/modules/formations/infrastructure/FormationMailer.service';
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

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const createTransportMock = createTransport as jest.MockedFunction<
  typeof createTransport
>;

const TAILLE_CLASSE = 30;
const NB_QUESTIONS = 12;
const CONCEPTS = ['capitalisation', 'actualisation', 'annuites'] as const;
const COURS = 'b1-09-interets-composes';
const FORMATEUR = 'a1111111-1111-4111-8111-111111111111';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'synthese-formateur@example.test';
const TOLERANCE_RELATIVE = 0.005;
const EN_TETE_JETON = 'x-participant-token';
const PERIODE_PIEGE_ETUDIANT = 5;
const PERIODE_PIEGE_QUESTION = 4;
const RESTE_PIEGE_QUESTION = 1;
const NOTE_ATTENDUE = 20;

interface CourrielEnvoye {
  to?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; content?: string }>;
}

interface ReponseInscription {
  participantId: string;
  seed: number;
  jeton: string;
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
}

function identifiantQuestion(question: number): string {
  return `Q-PARCOURS-${String(question).padStart(2, '0')}`;
}

function conceptDe(question: number): string {
  return CONCEPTS[question % CONCEPTS.length];
}

function misconceptionDe(question: number): string {
  return `confusion-${String(question).padStart(2, '0')}`;
}

function seedDe(etudiant: number): number {
  return 2000 + etudiant;
}

function solutionDe(etudiant: number, question: number): number {
  return 500000 + etudiant * 1000 + question * 10 + 0.42;
}

function piegeDe(etudiant: number, question: number): number {
  return 900000 + etudiant * 1000 + question * 10 + 0.77;
}

function reponseJusteDe(etudiant: number, question: number): number {
  return 500000 + etudiant * 1000 + question * 10 + 1 + 0.42;
}

function estPiege(etudiant: number, question: number): boolean {
  return (
    etudiant % PERIODE_PIEGE_ETUDIANT === 0 &&
    question % PERIODE_PIEGE_QUESTION === RESTE_PIEGE_QUESTION
  );
}

function dureeDe(question: number): number {
  return 12000 + question * 100;
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
        seed: seedDe(etudiant.index),
        correcte: !piege,
        misconception: piege ? misconceptionDe(question) : null,
        valeur: piege
          ? piegeDe(etudiant.index, question)
          : reponseJusteDe(etudiant.index, question),
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
      [...maitrise]
        .sort((gauche, droite) => gauche.concept.localeCompare(droite.concept))
        .map((entree) => ({
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
      reponses: ligne.reponses.length,
      incidents: ligne.incidents,
    }).toEqual({
      nom: etudiant.nom,
      email: etudiant.email,
      completion: 1,
      note: NOTE_ATTENDUE,
      sousSeuil: false,
      reponses: NB_QUESTIONS,
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
  expect(csv.split('\r\n')).toHaveLength(TAILLE_CLASSE * NB_QUESTIONS + 1);
  for (const etudiant of etudiants) {
    expect(corps).toContain(etudiant.nom);
    expect(csv).toContain(etudiant.email);
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
  { concept: 'actualisation', boite: 3, succes: 4, echecs: 0 },
  { concept: 'annuites', boite: 3, succes: 4, echecs: 0 },
  { concept: 'capitalisation', boite: 3, succes: 4, echecs: 0 },
];

const MAITRISE_ETUDIANT_PIEGE = [
  { concept: 'actualisation', boite: 3, succes: 3, echecs: 1 },
  { concept: 'annuites', boite: 3, succes: 3, echecs: 1 },
  { concept: 'capitalisation', boite: 1, succes: 3, echecs: 1 },
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

function construireBareme(): Bareme {
  return {
    version: 1,
    questions: Array.from({ length: NB_QUESTIONS }, (_, question) => ({
      id: identifiantQuestion(question),
      type: 'numeric' as const,
      concept: conceptDe(question),
      tolerance: { type: 'relative' as const, valeur: TOLERANCE_RELATIVE },
      noteCompte: true,
    })),
    tirages: Array.from({ length: TAILLE_CLASSE }, (_, etudiant) => ({
      seed: seedDe(etudiant),
      solutions: Object.fromEntries(
        Array.from({ length: NB_QUESTIONS }, (_, question) => [
          identifiantQuestion(question),
          {
            valeur: solutionDe(etudiant, question),
            pieges: [
              {
                valeur: piegeDe(etudiant, question),
                misconception: misconceptionDe(question),
              },
            ],
          },
        ]),
      ),
    })),
  };
}

const TOUTES_LES_SOLUTIONS: readonly string[] = Array.from(
  { length: TAILLE_CLASSE },
  (_, etudiant) =>
    Array.from({ length: NB_QUESTIONS }, (_, question) =>
      String(solutionDe(etudiant, question)),
    ),
).flat();

const NB_REQUETES_ATTENDUES =
  1 +
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
      app = await monterApplicationFormations({
        sessions: contexte.sessions,
        participants: contexte.participants,
        answers: contexte.answers,
        incidents: contexte.incidents,
        mastery: contexte.mastery,
        mailer: new FormationMailerService(),
      });
    });

    afterAll(async () => {
      await app.close();
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
          .send({ courseSlug: COURS, bareme: construireBareme() })
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
        etudiants.push({
          index,
          studentKey: cleEtudiant(index),
          prenom: prenomDe(index),
          nom: nomDe(index),
          email: emailDe(index),
          participantId: corps.participantId,
          jeton: corps.jeton,
          seed: corps.seed,
        });
      }

      expect(new Set(etudiants.map((etudiant) => etudiant.seed)).size).toBe(
        TAILLE_CLASSE,
      );

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
                valeur: piege
                  ? piegeDe(etudiant.index, question)
                  : reponseJusteDe(etudiant.index, question),
                dureeMs: dureeDe(question),
              })
              .expect(201),
          );
          expect(verdict.body).toEqual({
            correcte: !piege,
            misconception: piege ? misconceptionDe(question) : null,
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

      expect(corpsHttp).toHaveLength(NB_REQUETES_ATTENDUES);
      const tout = corpsHttp.join('\n');
      for (const solution of TOUTES_LES_SOLUTIONS) {
        expect(tout).not.toContain(solution);
      }
    }, 600_000);
  },
);
