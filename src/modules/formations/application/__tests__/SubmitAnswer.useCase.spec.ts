/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursDuBaremeV1,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import {
  buildBaremeV2,
  buildParticipantRecord,
  buildSessionRecord,
  buildVoteBareme,
} from '../../../../../test/factories/formation.factory';
import {
  creerDependancesDEnregistrement,
  monterEnregistrement,
  verifierContratDEnregistrement,
  type DependancesDEnregistrement,
} from '../../../../../test/helpers/enregistrement-de-reponse';
import { libelleDeConfusion } from '../../domain/cours/banque/confusions';
import { NE_SAIT_PAS } from '../../domain/GradingCore';
import {
  AnswerAlreadySubmittedError,
  EcranNonServiError,
  ParticipantNotFoundError,
  PhaseFermeeError,
  SessionNotStartedError,
} from '../../domain/errors/FormationErrors';
import type { SubmitAnswerCommand } from '../dto/SubmitAnswer.command';
import { SubmitAnswerUseCase } from '../SubmitAnswer.useCase';

const EN_RYTHME_LIBRE = {
  modeRythme: 'libre',
  intervalleLibre: null,
} as const;

describe('SubmitAnswerUseCase', () => {
  let deps: DependancesDEnregistrement;
  let sut: SubmitAnswerUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    questionId: 'Q-CAP-03',
    valeur: 1338.23,
    dureeMs: 42000,
  };

  beforeEach(() => {
    deps = creerDependancesDEnregistrement(buildSessionRecord(EN_RYTHME_LIBRE));
    sut = monterEnregistrement(
      SubmitAnswerUseCase,
      deps,
      creerCatalogueDeTest(buildCoursDuBaremeV1()),
    );
  });

  const soumettre = () => sut.execute(commande);

  verifierContratDEnregistrement(() => ({
    dependances: deps,
    courseSlug: buildCoursDuBaremeV1().slug,
    executer: soumettre,
  }));

  const repondreA = (
    questionId: string,
    valeur: SubmitAnswerCommand['valeur'],
  ) => sut.execute({ ...commande, questionId, valeur });

  const soumettreEnDouble = async () => {
    deps.answers.existsFor.mockResolvedValue(true);
    await expect(soumettre()).rejects.toThrow(AnswerAlreadySubmittedError);
  };

  const sessionDeVote = (pieges?: Parameters<typeof buildVoteBareme>[0]) => {
    deps.sessions.findById.mockResolvedValue(
      buildSessionRecord({
        ...EN_RYTHME_LIBRE,
        bareme: buildVoteBareme(pieges),
      }),
    );
  };

  it('ne signale aucune activite quand la reponse est refusee', async () => {
    await soumettreEnDouble();
    expect(deps.cache.signalerActivite).not.toHaveBeenCalled();
  });

  it('accepte une reponse juste', async () => {
    const result = await soumettre();
    expect(result).toEqual({
      correcte: true,
      misconception: null,
      libelleConfusion: null,
    });
  });

  it('identifie la misconception d une reponse fausse et son libelle', async () => {
    const result = await sut.execute({ ...commande, valeur: 1300 });
    expect(result).toEqual({
      correcte: false,
      misconception: 'interet-simple',
      libelleConfusion: 'interet-simple',
    });
  });

  it('applique la tolerance relative du bareme', async () => {
    const result = await sut.execute({ ...commande, valeur: 1340 });
    expect(result.correcte).toBe(true);
  });

  it('corrige selon le seed du participant', async () => {
    deps.participants.findById.mockResolvedValue(
      buildParticipantRecord({ seed: 1002 }),
    );
    const result = await sut.execute({ ...commande, valeur: 1500 });
    expect(result.correcte).toBe(true);
  });

  it('refuse une seconde soumission sur la meme question', async () => {
    await soumettreEnDouble();
  });

  it('refuse une question absente du bareme', async () => {
    await expect(
      sut.execute({ ...commande, questionId: 'Q-INCONNU' }),
    ).rejects.toThrow(DomainValidationError);
  });

  it('refuse sans rendre la graine un participant dont le tirage manque au bareme', async () => {
    const graineAbsente = 7_654_321;
    deps.participants.findById.mockResolvedValue(
      buildParticipantRecord({ seed: graineAbsente }),
    );

    const refus = await sut
      .execute(commande)
      .catch((erreur: unknown) => erreur);

    expect(refus).toBeInstanceOf(DomainValidationError);
    expect((refus as DomainValidationError).message).not.toContain(
      String(graineAbsente),
    );
    expect(deps.answers.create).not.toHaveBeenCalled();
  });

  it('refuse une soumission sur une session que le formateur n a pas demarree', async () => {
    deps.sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await expect(soumettre()).rejects.toThrow(SessionNotStartedError);
    expect(deps.answers.create).not.toHaveBeenCalled();
    expect(deps.mastery.enregistrerTentative).not.toHaveBeenCalled();
  });

  it('dit a l etudiant que la seance n a pas commence plutot que de refuser sans raison', async () => {
    deps.sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'attente' }),
    );
    await expect(soumettre()).rejects.toThrow(/pas encore commencé/);
  });

  it('refuse une soumission d un participant introuvable', async () => {
    deps.participants.findById.mockResolvedValue(null);
    await expect(soumettre()).rejects.toThrow(ParticipantNotFoundError);
  });

  it('enregistre une tentative reussie sur le concept de la question', async () => {
    await soumettre();
    expect(deps.mastery.enregistrerTentative).toHaveBeenCalledWith(
      expect.objectContaining({
        studentKey: '11111111-1111-4111-8111-111111111111',
        concept: 'capitalisation',
        reussi: true,
      }),
    );
  });

  it('enregistre une tentative ratee sans relire la maitrise existante', async () => {
    await sut.execute({ ...commande, valeur: 1300 });
    expect(deps.mastery.enregistrerTentative).toHaveBeenCalledWith(
      expect.objectContaining({ concept: 'capitalisation', reussi: false }),
    );
    expect(deps.mastery.findByStudentKey).not.toHaveBeenCalled();
  });

  it('enregistre la duree de reponse', async () => {
    await soumettre();
    expect(deps.answers.create).toHaveBeenCalledWith(
      expect.objectContaining({ dureeMs: 42000 }),
    );
  });

  it('refuse une valeur hors des options connues sur une question de vote', async () => {
    sessionDeVote([{ valeur: 'a', misconception: 'interet-simple' }]);
    await expect(
      sut.execute({ ...commande, valeur: '<img src=x onerror=alert(1)>' }),
    ).rejects.toThrow(DomainValidationError);
    expect(deps.answers.create).not.toHaveBeenCalled();
  });

  it('accepte je ne sais pas sur une question de vote', async () => {
    sessionDeVote();
    const result = await sut.execute({ ...commande, valeur: NE_SAIT_PAS });
    expect(result.correcte).toBe(false);
  });

  it('traduit une misconception connue de la banque par son libelle humain', async () => {
    sessionDeVote([{ valeur: 'a', misconception: 'base-arrivee' }]);
    const result = await sut.execute({ ...commande, valeur: 'a' });
    expect(result.libelleConfusion).toBe(libelleDeConfusion('base-arrivee'));
  });

  describe('sur un barème v2', () => {
    beforeEach(() => {
      deps.sessions.findById.mockResolvedValue(
        buildSessionRecord({ bareme: buildBaremeV2() }),
      );
      deps.participants.findById.mockResolvedValue(
        buildParticipantRecord({ seed: 11 }),
      );
    });

    const PART_MARKETPLACE = 'b2-01-a2-part-marketplace';

    const projeterLEcranDeLaPart = () => {
      deps.sessions.findById.mockResolvedValue(
        buildSessionRecord({ bareme: buildBaremeV2(), ecranCourant: 13 }),
      );
    };

    it('refuse une reponse visant un ecran que le formateur n a pas projete', async () => {
      await expect(repondreA(PART_MARKETPLACE, 45.478261)).rejects.toThrow(
        EcranNonServiError,
      );
      expect(deps.answers.create).not.toHaveBeenCalled();
    });

    it('accepte la reponse une fois l ecran projete', async () => {
      projeterLEcranDeLaPart();

      const result = await repondreA(PART_MARKETPLACE, 45.478261);

      expect(result.correcte).toBe(true);
    });

    it('corrige un vote par son identifiant stable, dans les solutions communes', async () => {
      const result = await repondreA(
        'b2-01-a1-diagnostic',
        'plus-25-pct-ecd953a1',
      );

      expect(result.correcte).toBe(true);
    });

    it('corrige une question numérique par l écart de la graine du participant', async () => {
      projeterLEcranDeLaPart();
      deps.participants.findById.mockResolvedValue(
        buildParticipantRecord({ seed: 12 }),
      );

      const result = await repondreA(PART_MARKETPLACE, 12.5);

      expect(result.correcte).toBe(true);
    });

    it('refuse une production, qui a sa propre route', async () => {
      await expect(repondreA('b2-01-a4-feuille-canaux', 1)).rejects.toThrow(
        DomainValidationError,
      );
      expect(deps.answers.create).not.toHaveBeenCalled();
    });
  });

  describe('phases d un vote à question jumelle', () => {
    const bareme = buildBaremeV2({
      questions: [
        {
          id: 'Q-PRINCIPALE',
          type: 'vote',
          concept: 'evolutions-successives',
          noteCompte: true,
          ecranId: 'E-VOTE',
          rangEcran: 0,
          ouverture: 'principale',
        },
        {
          id: 'Q-JUMELLE',
          type: 'vote',
          concept: 'evolutions-successives',
          noteCompte: true,
          ecranId: 'E-VOTE',
          rangEcran: 0,
          ouverture: 'jumelle',
        },
      ],
      solutionsCommunes: {
        'Q-PRINCIPALE': { valeur: 'a', pieges: [] },
        'Q-JUMELLE': { valeur: 'b', pieges: [] },
      },
      tirages: [{ seed: 1001, ecarts: {} }],
    });

    const seanceEnPhase = (phase?: 'discussion' | 'revote' | 'revele') =>
      buildSessionRecord({
        bareme,
        pilotageEcrans: phase === undefined ? {} : { 'E-VOTE': { phase } },
      });

    it('accepte la principale avant toute phase pilotée', async () => {
      deps.sessions.findById.mockResolvedValue(seanceEnPhase());

      const result = await repondreA('Q-PRINCIPALE', 'a');

      expect(result.correcte).toBe(true);
    });

    it('refuse la jumelle avant le revote', async () => {
      deps.sessions.findById.mockResolvedValue(seanceEnPhase());

      await expect(repondreA('Q-JUMELLE', 'b')).rejects.toThrow(
        PhaseFermeeError,
      );
      expect(deps.answers.create).not.toHaveBeenCalled();
    });

    it('ferme les deux questions pendant la discussion', async () => {
      deps.sessions.findById.mockResolvedValue(seanceEnPhase('discussion'));

      await expect(repondreA('Q-PRINCIPALE', 'a')).rejects.toThrow(
        PhaseFermeeError,
      );
    });

    it('ouvre la jumelle seule au revote', async () => {
      deps.sessions.findById.mockResolvedValue(seanceEnPhase('revote'));

      const result = await repondreA('Q-JUMELLE', 'b');

      expect(result.correcte).toBe(true);
      await expect(repondreA('Q-PRINCIPALE', 'a')).rejects.toThrow(
        PhaseFermeeError,
      );
    });
  });
});
