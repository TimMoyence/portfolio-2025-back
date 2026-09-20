import {
  buildCoursAuTirageEnErreur,
  buildCoursDeTest,
  tireurSequentiel,
} from '../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildBareme,
  buildIncidentInput,
  buildParticipantRecord,
  buildSessionRecord,
} from '../../../../test/factories/formation.factory';
import { libelleDeConfusion } from './cours/banque/confusions';
import { ouvrirTirages } from './cours/OuvertureTirages';
import { tirer } from './cours/Tirage';
import { NE_SAIT_PAS } from './GradingCore';
import type { IncidentRecord } from './IIncidents.repository';
import { buildRapportSession } from './SessionReport';
import type { SessionReportInput } from './SessionReport';

function buildIncidentRecord(
  overrides: Partial<IncidentRecord> = {},
): IncidentRecord {
  return { id: 'incident-uuid', ...buildIncidentInput(), ...overrides };
}

function rapportDe(overrides: Partial<SessionReportInput> = {}) {
  return buildRapportSession({
    session: buildSessionRecord(),
    cours: null,
    participants: [],
    answers: [],
    incidents: [],
    avertir: () => undefined,
    ...overrides,
  });
}

describe('buildRapportSession', () => {
  it('compte une reponse fausse dans la completion, pas seulement une reponse juste', () => {
    const rapport = rapportDe({
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [buildAnswerRecord({ participantId: 'p1', correcte: false })],
    });

    expect(rapport.participants[0].completion).toBe(1);
  });

  it('compte je ne sais pas comme une reponse et une question sans reponse pour zero', () => {
    const rapport = rapportDe({
      session: buildSessionRecord({
        bareme: buildBareme({
          questions: ['Q-1', 'Q-2', 'Q-3', 'Q-4'].map((id) => ({
            id,
            type: 'numeric',
            concept: 'capitalisation',
            noteCompte: true,
          })),
        }),
      }),
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [
        buildAnswerRecord({ participantId: 'p1', questionId: 'Q-1' }),
        buildAnswerRecord({
          participantId: 'p1',
          questionId: 'Q-2',
          valeur: NE_SAIT_PAS,
          correcte: false,
        }),
      ],
    });

    expect(rapport.participants[0].completion).toBe(0.5);
  });

  it('exclut les questions non notees du denominateur de completion', () => {
    const session = buildSessionRecord({
      bareme: {
        version: 1,
        graineReference: 9_999_999,
        questions: [
          {
            id: 'Q-1',
            type: 'numeric',
            concept: 'capitalisation',
            noteCompte: true,
          },
          {
            id: 'Q-2',
            type: 'numeric',
            concept: 'actualisation',
            noteCompte: false,
          },
        ],
        tirages: [],
      },
    });

    const rapport = rapportDe({
      session,
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [buildAnswerRecord({ participantId: 'p1', questionId: 'Q-1' })],
    });

    expect(rapport.participants[0].completion).toBe(1);
  });

  it('reprend la date de fermeture de la session quand elle existe', () => {
    const fermeeLe = new Date('2026-09-11T10:00:00.000Z');
    const rapport = rapportDe({ session: buildSessionRecord({ fermeeLe }) });

    expect(rapport.fermeeLe).toBe(fermeeLe);
  });

  it('substitue la date courante quand la session n est pas encore fermee', () => {
    const rapport = rapportDe({
      session: buildSessionRecord({ fermeeLe: null }),
    });

    expect(rapport.fermeeLe).toBeInstanceOf(Date);
  });

  it('signale un concept sous 70 pourcent de reussite comme fragile', () => {
    const rapport = rapportDe({
      answers: [
        buildAnswerRecord({ concept: 'interet-simple', correcte: false }),
        buildAnswerRecord({ concept: 'interet-simple', correcte: false }),
        buildAnswerRecord({ concept: 'interet-simple', correcte: true }),
      ],
    });

    expect(rapport.conceptsFragiles).toContain('interet-simple');
  });

  it('n inclut pas un concept dont la reussite atteint 70 pourcent ou plus', () => {
    const rapport = rapportDe({
      answers: [
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: true }),
        buildAnswerRecord({ concept: 'actualisation', correcte: false }),
      ],
    });

    expect(rapport.conceptsFragiles).not.toContain('actualisation');
  });

  it('compte les incidents par participant', () => {
    const rapport = rapportDe({
      participants: [
        buildParticipantRecord({ id: 'p1' }),
        buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
      ],
      incidents: [
        buildIncidentRecord({ participantId: 'p1' }),
        buildIncidentRecord({ participantId: 'p1' }),
        buildIncidentRecord({ participantId: 'p2' }),
      ],
    });

    const p1 = rapport.participants.find(
      (participant) => participant.email === 'theo.martin@example.com',
    );
    expect(p1?.incidents).toBe(2);
  });

  it('classe les participants sous le seuil via computeCohortScore', () => {
    const rapport = rapportDe({
      participants: [
        buildParticipantRecord({ id: 'p1' }),
        buildParticipantRecord({ id: 'p2', email: 'b@example.com' }),
      ],
      answers: [buildAnswerRecord({ participantId: 'p1' })],
    });

    const p1 = rapport.participants[0];
    const p2 = rapport.participants[1];
    expect(p1.completion).toBe(1);
    expect(p2.completion).toBe(0);
    expect(p2.sousSeuil).toBe(true);
  });

  it('range les reponses d un etudiant dans l ordre des questions du bareme, quel que soit leur ordre d ecriture', () => {
    const session = buildSessionRecord({
      bareme: buildBareme({
        questions: ['Q-1', 'Q-2', 'Q-3'].map((id) => ({
          id,
          type: 'numeric' as const,
          concept: 'capitalisation',
          noteCompte: true,
        })),
      }),
    });
    const ecrite = (id: string, questionId: string) =>
      buildAnswerRecord({ id, participantId: 'p1', questionId });

    const rapport = rapportDe({
      session,
      participants: [buildParticipantRecord({ id: 'p1' })],
      answers: [
        ecrite('a1', 'Q-HORS-B'),
        ecrite('a2', 'Q-3'),
        ecrite('a3', 'Q-1'),
        ecrite('a4', 'Q-HORS-A'),
        ecrite('a5', 'Q-2'),
      ],
    });

    expect(
      rapport.participants[0].reponses.map((reponse) => reponse.questionId),
    ).toEqual(['Q-1', 'Q-2', 'Q-3', 'Q-HORS-B', 'Q-HORS-A']);
  });

  describe('lecture des reponses d un etudiant', () => {
    const CONFUSION = 'hausse-baisse-symetriques';
    const cours = buildCoursDeTest();
    const bareme = ouvrirTirages(cours, tireurSequentiel());
    const graine = bareme.tirages[0].seed;
    const tirage = tirer(cours, graine);
    const rappel = tirage.solutions['Q-TEST-RAPPEL'];
    const vote = tirage.solutions['Q-TEST-VOTE'];
    const optionPiegee = String(
      vote.pieges.find((piege) => piege.misconception === CONFUSION)?.valeur,
    );
    const optionJuste = String(rappel.valeur);
    const participant = buildParticipantRecord({ id: 'p1', seed: graine });

    const reponsesLues = (overrides: Partial<SessionReportInput> = {}) =>
      rapportDe({
        session: buildSessionRecord({ courseSlug: cours.slug, bareme }),
        cours,
        participants: [participant],
        answers: [
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-RAPPEL',
            valeur: optionJuste,
            seed: graine,
          }),
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-VOTE',
            valeur: optionPiegee,
            seed: graine,
            correcte: false,
            misconception: CONFUSION,
          }),
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-NUM',
            valeur: 412.5,
            seed: graine,
          }),
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-NUM-2',
            valeur: NE_SAIT_PAS,
            seed: graine,
            correcte: false,
          }),
        ],
        ...overrides,
      }).participants[0].reponses.map((reponse) => ({
        questionId: reponse.questionId,
        reponse: reponse.reponse,
        libelleConfusion: reponse.libelleConfusion,
      }));

    it('lit un vote par le libelle de l option du tirage de l etudiant et la confusion par son libelle', () => {
      expect(reponsesLues()).toEqual(
        expect.arrayContaining([
          {
            questionId: 'Q-TEST-RAPPEL',
            reponse: 'plus bas qu’au départ',
            libelleConfusion: null,
          },
          {
            questionId: 'Q-TEST-VOTE',
            reponse: 'revenu au prix de départ',
            libelleConfusion: libelleDeConfusion(CONFUSION),
          },
        ]),
      );
    });

    it('lit une valeur numerique telle quelle et je ne sais pas en toutes lettres', () => {
      expect(reponsesLues()).toEqual(
        expect.arrayContaining([
          {
            questionId: 'Q-TEST-NUM',
            reponse: '412.5',
            libelleConfusion: null,
          },
          {
            questionId: 'Q-TEST-NUM-2',
            reponse: 'Je ne sais pas',
            libelleConfusion: null,
          },
        ]),
      );
    });

    it('lit une production par la part de ses attendus justes', () => {
      const [lue] = rapportDe({
        participants: [buildParticipantRecord({ id: 'p1' })],
        answers: [
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-FEUILLE',
            valeur: { type: 'feuille', cellules: { D2: '=(C2-B2)/B2' } },
            score: 0.5,
            details: [
              { cle: 'D2', juste: true, confusion: null },
              { cle: 'D3', juste: false, confusion: 'base-arrivee' },
            ],
          }),
        ],
      }).participants[0].reponses;

      expect(lue.reponse).toBe('Feuille : 1/2 cellules justes');
      expect(lue.valeur).toBe('feuille');
    });

    it('lit une production declaree « je ne sais pas » sans compter d attendu', () => {
      const [lue] = rapportDe({
        participants: [buildParticipantRecord({ id: 'p1' })],
        answers: [
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'Q-TEST-CLASSEMENT',
            valeur: { type: 'classement', neSaitPas: true },
            score: 0,
            details: [],
          }),
        ],
      }).participants[0].reponses;

      expect(lue.reponse).toBe('Classement : je ne sais pas');
    });

    it('ne lit jamais une propriete heritee comme libelle d option', () => {
      const [lue] = rapportDe({
        session: buildSessionRecord({ courseSlug: cours.slug, bareme }),
        cours,
        participants: [participant],
        answers: [
          buildAnswerRecord({
            participantId: 'p1',
            questionId: 'constructor',
            valeur: 'name',
            seed: graine,
          }),
        ],
      }).participants[0].reponses;

      expect(lue.reponse).toBe('name');
    });

    it('garde l identifiant de l option quand le cours n est plus au catalogue', () => {
      expect(reponsesLues({ cours: null })).toEqual(
        expect.arrayContaining([
          {
            questionId: 'Q-TEST-VOTE',
            reponse: optionPiegee,
            libelleConfusion: libelleDeConfusion(CONFUSION),
          },
        ]),
      );
    });

    it('garde le rapport et l identifiant de l option, sur un seul avertissement sans graine ni donnee personnelle, quand le tirage du cours echoue', () => {
      const avertir = jest.fn();
      const graineTemoin = 1_357_913;
      const temoin = buildParticipantRecord({
        id: 'participant-temoin-uuid',
        seed: graineTemoin,
        prenom: 'Ines',
        nom: 'Lefebvre',
        email: 'ines.lefebvre@example.com',
      });

      const rapport = rapportDe({
        session: buildSessionRecord({ courseSlug: cours.slug, bareme }),
        cours: buildCoursAuTirageEnErreur(),
        participants: [participant, temoin],
        answers: [
          buildAnswerRecord({
            participantId: temoin.id,
            questionId: 'Q-TEST-VOTE',
            valeur: optionPiegee,
            seed: graineTemoin,
            correcte: false,
            misconception: CONFUSION,
          }),
        ],
        avertir,
      });

      expect(rapport.participants[1].reponses[0].reponse).toBe(optionPiegee);
      expect(avertir).toHaveBeenCalledTimes(1);
      const [message] = avertir.mock.calls[0] as [string];
      expect(message).toContain('RangeError');
      [
        String(graineTemoin),
        temoin.id,
        temoin.prenom,
        temoin.nom,
        temoin.email,
      ].forEach((donnee) => expect(message).not.toContain(donnee));
    });

    it('garde l identifiant de l option quand le cours a change depuis l ouverture', () => {
      const derive = {
        ...bareme,
        tirages: [
          {
            seed: graine,
            solutions: {
              ...tirage.solutions,
              'Q-TEST-VOTE': { ...vote, valeur: 'o9' },
            },
          },
        ],
      };

      expect(
        reponsesLues({
          session: buildSessionRecord({
            courseSlug: cours.slug,
            bareme: derive,
          }),
        }),
      ).toEqual(
        expect.arrayContaining([
          {
            questionId: 'Q-TEST-RAPPEL',
            reponse: optionJuste,
            libelleConfusion: null,
          },
        ]),
      );
    });
  });
});
