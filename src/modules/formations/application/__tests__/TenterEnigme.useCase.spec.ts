/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildCoursAvecEnigmes,
  creerCatalogueDeTest,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  TENTATIVES_MAX_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  verifierGardesDeParticipant,
  verifierGardesDeSeance,
} from '../../../../../test/helpers/gardes-de-seance';
import {
  buildSessionRecord,
  createMockAnswersRepo,
  createMockEscapeRepo,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  EnigmeDejaResolueError,
  EnigmeInconnueError,
  EnigmeVerrouilleeError,
  PhaseFermeeError,
  TentativesEpuiseesError,
} from '../../domain/errors/FormationErrors';
import { TenterEnigmeUseCase } from '../TenterEnigme.useCase';

const COURS = buildCoursAvecEnigmes();
const DERNIER_ECRAN = COURS.ecrans.length - 1;

describe('TenterEnigmeUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let escape: ReturnType<typeof createMockEscapeRepo>;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let sut: TenterEnigmeUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    parcoursId: PARCOURS_DE_TEST,
    enigmeId: ENIGMES_DE_TEST[0],
    reponse: '23,4',
    dureeMs: 42000,
  };

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: DERNIER_ECRAN,
      }),
    );
    participants = createMockParticipantsRepo();
    escape = createMockEscapeRepo();
    answers = createMockAnswersRepo();
    mastery = createMockMasteryRepo();
    cache = createMockSessionStateCache();
    sut = new TenterEnigmeUseCase(
      sessions,
      participants,
      escape,
      answers,
      mastery,
      cache,
      creerCatalogueDeTest(COURS),
    );
  });

  it('rend le fragment quand la reponse est juste', async () => {
    const verdict = await sut.execute(commande);

    expect(verdict).toEqual({
      correcte: true,
      fragment: 'F0',
      tentativesRestantes: TENTATIVES_MAX_DE_TEST - 1,
    });
    expect(escape.marquerResolue).toHaveBeenCalledWith(
      'participant-uuid',
      ENIGMES_DE_TEST[0],
    );
  });

  it('ne rend jamais le fragment quand la reponse est fausse', async () => {
    const verdict = await sut.execute({ ...commande, reponse: '26,666667' });

    expect(verdict.correcte).toBe(false);
    expect(verdict.fragment).toBeNull();
    expect(escape.marquerResolue).not.toHaveBeenCalled();
  });

  it('consomme une tentative par saisie nouvelle', async () => {
    escape.incrementerTentative.mockResolvedValue(3);

    const verdict = await sut.execute({ ...commande, reponse: '10' });

    expect(escape.incrementerTentative).toHaveBeenCalledWith(
      expect.objectContaining({ plafond: TENTATIVES_MAX_DE_TEST }),
    );
    expect(verdict.tentativesRestantes).toBe(TENTATIVES_MAX_DE_TEST - 3);
  });

  it('ne consomme rien pour une saisie deja tentee', async () => {
    escape.tentativeDejaFaite.mockResolvedValue(true);
    escape.listerProgression.mockResolvedValue([
      {
        participantId: 'participant-uuid',
        parcoursId: PARCOURS_DE_TEST,
        enigmeId: ENIGMES_DE_TEST[0],
        tentatives: 4,
        resolueLe: null,
      },
    ]);

    const verdict = await sut.execute({ ...commande, reponse: '10' });

    expect(escape.incrementerTentative).not.toHaveBeenCalled();
    expect(verdict.tentativesRestantes).toBe(TENTATIVES_MAX_DE_TEST - 4);
  });

  it('refuse quand le plafond de tentatives est atteint', async () => {
    escape.incrementerTentative.mockResolvedValue(null);

    await expect(sut.execute({ ...commande, reponse: '10' })).rejects.toThrow(
      TentativesEpuiseesError,
    );
  });

  it('refuse une enigme dont la precedente n est ni resolue ni epuisee', async () => {
    await expect(
      sut.execute({ ...commande, enigmeId: ENIGMES_DE_TEST[1] }),
    ).rejects.toThrow(EnigmeVerrouilleeError);
    expect(escape.incrementerTentative).not.toHaveBeenCalled();
  });

  it('ouvre l enigme suivante des que la precedente est resolue', async () => {
    escape.listerProgression.mockResolvedValue([
      {
        participantId: 'participant-uuid',
        parcoursId: PARCOURS_DE_TEST,
        enigmeId: ENIGMES_DE_TEST[0],
        tentatives: 2,
        resolueLe: new Date('2026-09-11T09:00:00.000Z'),
      },
    ]);

    const verdict = await sut.execute({
      ...commande,
      enigmeId: ENIGMES_DE_TEST[1],
      reponse: '24,4',
    });

    expect(verdict.correcte).toBe(true);
    expect(verdict.fragment).toBe('F1');
  });

  it('refuse une enigme deja resolue', async () => {
    escape.listerProgression.mockResolvedValue([
      {
        participantId: 'participant-uuid',
        parcoursId: PARCOURS_DE_TEST,
        enigmeId: ENIGMES_DE_TEST[0],
        tentatives: 1,
        resolueLe: new Date('2026-09-11T09:00:00.000Z'),
      },
    ]);

    await expect(sut.execute(commande)).rejects.toThrow(EnigmeDejaResolueError);
  });

  it('refuse une enigme absente du parcours', async () => {
    await expect(
      sut.execute({ ...commande, enigmeId: 'E9-INVENTEE' }),
    ).rejects.toThrow(EnigmeInconnueError);
  });

  it('refuse un parcours absent du cours', async () => {
    await expect(
      sut.execute({ ...commande, parcoursId: 'P-INCONNU' }),
    ).rejects.toThrow(EnigmeInconnueError);
  });

  verifierGardesDeSeance(() => ({
    sessions,
    courseSlug: COURS.slug,
    executer: () => sut.execute(commande),
    effetsInterdits: () => [escape.incrementerTentative],
  }));

  describe('SEC-4 · coffre dont la correction est servie', () => {
    const COFFRE = COURS.ecrans.find((ecran) => ecran.brique === 'fp-escape');

    it.each([
      ['revele', { revele: true }],
      ['etaye', { etayage: 1 }],
    ])(
      'refuse toute tentative une fois le coffre %s, sans rien noter',
      async (_etat, pilotage) => {
        sessions.findById.mockResolvedValue(
          buildSessionRecord({
            courseSlug: COURS.slug,
            ecranCourant: DERNIER_ECRAN,
            pilotageEcrans: { [COFFRE?.id ?? '']: pilotage },
          }),
        );

        await expect(sut.execute(commande)).rejects.toThrow(PhaseFermeeError);
        expect(escape.incrementerTentative).not.toHaveBeenCalled();
        expect(answers.create).not.toHaveBeenCalled();
        expect(mastery.enregistrerTentative).not.toHaveBeenCalled();
      },
    );
  });

  verifierGardesDeParticipant(() => ({
    participants,
    executer: () => sut.execute(commande),
    effetsInterdits: () => [escape.incrementerTentative, escape.journaliser],
  }));

  it('journalise chaque tentative avec sa valeur normalisee', async () => {
    await sut.execute({ ...commande, reponse: '23 ,4' });

    expect(escape.journaliser).toHaveBeenCalledWith(
      expect.objectContaining({
        enigmeId: ENIGMES_DE_TEST[0],
        valeurNormalisee: 23.4,
        saisie: '23 ,4',
        correcte: true,
      }),
    );
  });

  it('enregistre la premiere tentative comme reponse notee au Leitner', async () => {
    await sut.execute(commande);

    expect(answers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: ENIGMES_DE_TEST[0],
        concept: 'evolutions-successives',
        correcte: true,
      }),
    );
    expect(mastery.enregistrerTentative).toHaveBeenCalled();
  });

  it('ne double jamais la reponse de la premiere tentative', async () => {
    answers.existsFor.mockResolvedValue(true);

    await sut.execute({ ...commande, reponse: '10' });

    expect(answers.create).not.toHaveBeenCalled();
    expect(mastery.enregistrerTentative).not.toHaveBeenCalled();
  });

  it('signale l activite de la seance', async () => {
    await sut.execute(commande);

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });
});
