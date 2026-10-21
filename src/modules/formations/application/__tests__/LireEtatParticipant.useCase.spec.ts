/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecDefi,
  buildCoursDeTest,
  buildEtatsDesEnigmesDeTest,
  buildProgressionEnigme,
  creerCatalogueDeTest,
  creerParticipationEnSeance,
  DEFI_DE_TEST,
  ENIGMES_DE_TEST,
  PARCOURS_AVANT_TOUTE_TENTATIVE,
  PARCOURS_DE_TEST,
  TENTATIVES_MAX_DE_TEST,
  buildEcranDEnigmes,
} from '../../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildFreeResponseRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockEscapeRepo,
  createMockFreeResponsesRepo,
  createMockParticipantsRepo,
  createMockPulsesRepo,
  createMockRappelsServisRepo,
  createMockSessionsRepo,
  detailsDeFeuilleAMoitieJuste,
  PARTICIPANT_DE_TEST,
} from '../../../../../test/factories/formation.factory';
import {
  CAS_DES_COURS_SERVIS,
  type VoteDUnCoursServi,
} from '../../../../../test/factories/votes-des-cours-servis.factory';
import { decrireLeVerdictDesVotesServis } from '../../../../../test/helpers/verdict-des-votes-servis';
import { installerSecretDeJalons } from '../../../../../test/helpers/env-formations';
import { verifierSeanceIntrouvable } from '../../../../../test/helpers/gardes-de-seance';
import type { Cours } from '../../domain/contrats/cours';
import type { PilotageEcran } from '../../domain/contrats/pilotage';
import { libelleLisible } from '../../domain/cours/banque/confusions';
import { cleDeJalon } from '../../domain/cours/CleDeJalon';
import type { SessionState } from '../../domain/SessionState';
import { TENTATIVES_MAX_PAR_ENIGME } from '../../domain/cours/Enigmes';
import { LireEtatParticipantUseCase } from '../LireEtatParticipant.useCase';

const SOCLE = buildCoursAvecDefi();
const COURS = {
  ...SOCLE,
  ecrans: [...SOCLE.ecrans, buildEcranDEnigmes()] as typeof SOCLE.ecrans,
};

describe('LireEtatParticipantUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let freeResponses: ReturnType<typeof createMockFreeResponsesRepo>;
  let pulses: ReturnType<typeof createMockPulsesRepo>;
  let escape: ReturnType<typeof createMockEscapeRepo>;
  let rappels: ReturnType<typeof createMockRappelsServisRepo>;
  let sut: LireEtatParticipantUseCase;

  installerSecretDeJalons();

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        revision: 7,
        ecranCourant: COURS.ecrans.length - 1,
      }),
    );
    participants = createMockParticipantsRepo();
    answers = createMockAnswersRepo();
    freeResponses = createMockFreeResponsesRepo();
    pulses = createMockPulsesRepo();
    escape = createMockEscapeRepo();
    rappels = createMockRappelsServisRepo();
    sut = monter(COURS);
  });

  const monter = (cours: Cours): LireEtatParticipantUseCase =>
    new LireEtatParticipantUseCase(
      creerParticipationEnSeance({
        sessions,
        participants,
        catalogue: creerCatalogueDeTest(cours),
      }),
      answers,
      freeResponses,
      pulses,
      escape,
      rappels,
    );

  const enigmesServies = async (
    progression: ReturnType<typeof buildProgressionEnigme>[],
  ) => {
    escape.listerProgressionDuParticipant.mockResolvedValue(progression);
    return (await sut.execute(PARTICIPANT_DE_TEST)).enigmes;
  };

  it('rend la revision courante de la seance pour la reprise', async () => {
    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.revision).toBe(7);
    expect(etat.sessionId).toBe('session-uuid');
    expect(etat.participantId).toBe('participant-uuid');
  });

  it('ne lit que les donnees du participant porte par le jeton', async () => {
    await sut.execute(PARTICIPANT_DE_TEST);

    expect(answers.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      'participant-uuid',
    );
    expect(freeResponses.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      'participant-uuid',
    );
    expect(pulses.listerDuParticipant).toHaveBeenCalledWith(
      'session-uuid',
      cleDeJalon('session-uuid', 'participant-uuid'),
    );
    expect(escape.listerProgressionDuParticipant).toHaveBeenCalledWith(
      'participant-uuid',
    );
  });

  it('restitue les verdicts deja obtenus, detail compris', async () => {
    answers.listerDuParticipant.mockResolvedValue([
      buildAnswerRecord({
        questionId: 'Q-TEST-FEUILLE',
        valeur: { type: 'feuille', cellules: { D2: '=(C2-B2)/B2' } },
        correcte: false,
        misconception: 'base-arrivee',
        score: 0.5,
        details: detailsDeFeuilleAMoitieJuste(),
      }),
    ]);

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.reponses[0].score).toBe(0.5);
    expect(etat.reponses[0].details).toEqual([
      { cle: 'D2', juste: false, libelleConfusion: expect.any(String) },
      { cle: 'D3', juste: true, libelleConfusion: null },
    ]);
    expect(etat.reponses[0].libelleConfusion).not.toBeNull();
  });

  it('separe les tentatives de defi des autres reponses libres', async () => {
    freeResponses.listerDuParticipant.mockResolvedValue([
      buildFreeResponseRecord({
        activityId: DEFI_DE_TEST,
        response: 'Seconde idée.',
        premiereReponse: 'Première idée.',
      }),
      buildFreeResponseRecord({
        activityId: 'E-REM:etape-1',
        response: 'Je reprends la base.',
      }),
    ]);

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.defis).toEqual([
      { defiId: DEFI_DE_TEST, premiereTentative: 'Première idée.' },
    ]);
    expect(etat.reponsesLibres).toEqual([
      { activityId: 'E-REM:etape-1', response: 'Je reprends la base.' },
    ]);
  });

  it('rend le fragment des seules enigmes resolues et le reste des tentatives', async () => {
    const enigmes = await enigmesServies([
      buildProgressionEnigme({ tentatives: 2 }),
      buildProgressionEnigme({
        enigmeId: ENIGMES_DE_TEST[1],
        tentatives: 3,
        resolueLe: null,
      }),
    ]);

    expect(enigmes).toEqual([
      {
        parcoursId: PARCOURS_DE_TEST,
        resolues: [{ enigmeId: ENIGMES_DE_TEST[0], fragment: 'F0' }],
        tentativesRestantes: {
          [ENIGMES_DE_TEST[1]]: TENTATIVES_MAX_DE_TEST - 3,
        },
        etats: buildEtatsDesEnigmesDeTest([
          ['resolue', 2],
          ['ouverte', 3],
          ['verrouillee', 0],
        ]),
        enigmeOuverte: ENIGMES_DE_TEST[1],
        acheve: false,
      },
    ]);
  });

  it('B-70 · sert l état de chaque parcours du cours avant toute tentative', async () => {
    expect(await enigmesServies([])).toEqual([PARCOURS_AVANT_TOUTE_TENTATIVE]);
  });

  it.each([
    [3, 2],
    [25, TENTATIVES_MAX_PAR_ENIGME - 1],
  ])(
    'compte les tentatives restantes sur le plafond du parcours (%i autorisees), comme la tentative',
    async (tentativesMax, restantes) => {
      escape.listerProgressionDuParticipant.mockResolvedValue([
        buildProgressionEnigme({ tentatives: 1, resolueLe: null }),
      ]);
      const etat = await monter({
        ...SOCLE,
        ecrans: [
          ...SOCLE.ecrans,
          buildEcranDEnigmes(tentativesMax),
        ] as typeof SOCLE.ecrans,
      }).execute(PARTICIPANT_DE_TEST);

      expect(etat.enigmes[0].tentativesRestantes).toEqual({
        [ENIGMES_DE_TEST[0]]: restantes,
      });
    },
  );

  it.each(
    CAS_DES_COURS_SERVIS.flatMap(([slug, cours]) =>
      cours.ecrans.flatMap((ecran, rang) =>
        ecran.brique === 'fp-escape'
          ? [
              [
                slug,
                ecran.proprietes.parcours.id,
                ecran.proprietes.parcours.enigmes[0].id,
                rang,
                cours,
              ] as const,
            ]
          : [],
      ),
    ),
  )(
    'D-05 · %s, %s : n ouvre aucune énigme d un coffre avant que son écran soit servi',
    async (_slug, parcoursId, premiere, rang, cours) => {
      const enigmeOuverteA = async (ecranCourant: number) => {
        sessions.findById.mockResolvedValue(
          buildSessionRecord({ courseSlug: cours.slug, ecranCourant }),
        );
        const { enigmes } = await monter(cours).execute(PARTICIPANT_DE_TEST);
        return enigmes.find((parcours) => parcours.parcoursId === parcoursId)
          ?.enigmeOuverte;
      };

      expect([
        await enigmeOuverteA(rang - 1),
        await enigmeOuverteA(rang),
      ]).toEqual([undefined, premiere]);
    },
  );

  it('ne rend pas la progression d un parcours absent du cours de la seance', async () => {
    escape.listerProgressionDuParticipant.mockResolvedValue([
      buildProgressionEnigme({ parcoursId: 'P-RETIRE', resolueLe: null }),
    ]);

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.enigmes.map(({ parcoursId }) => parcoursId)).toEqual([
      PARCOURS_DE_TEST,
    ]);
    expect(etat.enigmes[0]).toMatchObject({
      resolues: [],
      tentativesRestantes: {},
      enigmeOuverte: ENIGMES_DE_TEST[0],
    });
  });

  it('rend les jalons declares par le participant', async () => {
    pulses.listerDuParticipant.mockResolvedValue([
      { sondageId: 'jalon-test-1', etat: 'ca-va' },
    ]);

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.jalons).toEqual([{ sondageId: 'jalon-test-1', etat: 'ca-va' }]);
  });

  it('T10 · ne livre avant revelation ni corrige, ni fragment d une enigme encore ouverte', async () => {
    answers.listerDuParticipant.mockResolvedValue([
      buildAnswerRecord({ questionId: 'Q-TEST-NUM', correcte: false }),
    ]);
    escape.listerProgressionDuParticipant.mockResolvedValue([
      buildProgressionEnigme({ enigmeId: ENIGMES_DE_TEST[1], resolueLe: null }),
    ]);

    const serialise = JSON.stringify(await sut.execute(PARTICIPANT_DE_TEST));

    expect(serialise).not.toMatch(/solution|corrige|fragment|tolerance/);
  });

  verifierSeanceIntrouvable(() => ({
    sessions,
    executer: () => sut.execute(PARTICIPANT_DE_TEST),
  }));

  it('rend la liste figee des rappels deja servis', async () => {
    await rappels.figer({
      sessionId: 'session-uuid',
      participantId: 'participant-uuid',
      questionIds: ['R-COMPENSATION', 'R-MULTIPLE-NEUF'],
    });

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.rappels.questionIds).toEqual([
      'R-COMPENSATION',
      'R-MULTIPLE-NEUF',
    ]);
  });

  it('rend un etat vide quand le participant n a encore rien envoye', async () => {
    sut = monter(buildCoursDeTest({ slug: COURS.slug }));

    const etat = await sut.execute(PARTICIPANT_DE_TEST);

    expect(etat.reponses).toEqual([]);
    expect(etat.reponsesLibres).toEqual([]);
    expect(etat.jalons).toEqual([]);
    expect(etat.enigmes).toEqual([]);
    expect(etat.defis).toEqual([]);
    expect(etat.rappels).toEqual({ questionIds: [] });
  });

  describe('QA-12 · verdict d un vote des cours servis', () => {
    const CONFUSION = 'base-arrivee';
    const RETENU = { correcte: null, libelleConfusion: null };
    const SERVI = {
      correcte: false,
      libelleConfusion: libelleLisible(CONFUSION),
    };

    const verdictLu = async (
      vote: VoteDUnCoursServi,
      pilotage?: PilotageEcran,
      etat: SessionState = 'en_cours',
    ) => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({
          courseSlug: vote.cours.slug,
          bareme: vote.bareme,
          etat,
          pilotageEcrans:
            pilotage === undefined ? {} : { [vote.question.ecranId]: pilotage },
        }),
      );
      answers.listerDuParticipant.mockResolvedValue([
        buildAnswerRecord({
          questionId: vote.question.id,
          correcte: false,
          misconception: CONFUSION,
        }),
      ]);
      const [reponse] = (await monter(vote.cours).execute(PARTICIPANT_DE_TEST))
        .reponses;
      return {
        correcte: reponse.correcte,
        libelleConfusion: reponse.libelleConfusion,
      };
    };

    it('lit une confusion qui a un libellé', () => {
      expect(SERVI.libelleConfusion).not.toBeNull();
    });

    decrireLeVerdictDesVotesServis(verdictLu, { retenu: RETENU, servi: SERVI });
  });
});
