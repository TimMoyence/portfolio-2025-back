import { monterParticipationSurLeDernierEcran } from '../../../../../test/factories/cours.factory';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  COURS_B2_01,
  COURS_B2_03,
  ECRAN_TOILE_B2_01,
  ECRAN_VISA_B2_03,
  FORMULE_VISA_B2_03 as VISA,
  MACHINE_B2_01 as MACHINE,
  PLAN_TOILE_B2_01 as PLAN_TOILE,
  PLAN_VISA_B2_03 as PLAN_VISA,
  PLANS_HORS_FEUILLE_DU_B2_03 as PLANS_HORS_FEUILLE,
  TRI_ANATOMIE_B2_01 as TRI_ANATOMIE,
} from '../../../../../test/factories/contenus-publies';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
  PARTICIPANT_DE_TEST,
} from '../../../../../test/factories/formation.factory';
import type { Cours } from '../../domain/contrats/cours';
import { rangDeLEcran } from '../../domain/cours/EcranServi';
import {
  EcranNonServiError,
  ParticipantNotFoundError,
  ProductionInvalideError,
  SessionClosedError,
  SessionNotStartedError,
  TypeDeQuestionError,
} from '../../domain/errors/FormationErrors';
import { EvaluerFeuilleUseCase } from '../EvaluerFeuille.useCase';
import { EvaluerTableauUseCase } from '../EvaluerTableau.useCase';
import { EvaluerMachineUseCase } from '../EvaluerMachine.useCase';
import type { ParticipationEnSeance } from '../ParticipationEnSeance';

const COURS = buildCoursDuContenu(COURS_B2_03);
const COURS_TOILE = buildCoursDuContenu(COURS_B2_01);

interface Seance {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly participants: ReturnType<typeof createMockParticipantsRepo>;
  readonly participation: ParticipationEnSeance;
}

function seanceDu(cours: Cours): Seance {
  return monterParticipationSurLeDernierEcran(cours);
}

describe('EvaluerFeuilleUseCase', () => {
  let sut: EvaluerFeuilleUseCase;

  const evaluer = (
    cellules: Record<string, string>,
    planId = PLAN_VISA,
    recopie?: { de: string },
  ) => sut.execute({ ...PARTICIPANT_DE_TEST, planId, cellules, recopie });

  beforeEach(() => {
    sut = new EvaluerFeuilleUseCase(seanceDu(COURS).participation);
  });

  it('rend à l élève la valeur de sa formule, calculée sur les données imposées du B2-03', async () => {
    const feuille = await evaluer({ I3: VISA });

    expect(feuille.saisies).toEqual({ I3: VISA });
    expect(feuille.formules).toEqual(['I3']);
    expect([feuille.affichages.I3, feuille.affichages.A1]).toEqual([
      'Visa',
      'Facture',
    ]);
    expect([feuille.natures.I3, feuille.natures.D3]).toEqual([
      'texte',
      'nombre',
    ]);
  });

  it('recopie la formule vers la cellule du dessous en décalant ses références', async () => {
    const feuille = await evaluer({ I3: VISA }, PLAN_VISA, { de: 'I3' });

    expect(feuille.saisies.I4).toBe(
      '=SI(OU(D4>=5000;C4<>"France");"Visa";"Non")',
    );
  });

  it.each(PLANS_HORS_FEUILLE)(
    'refuse en TYPE_DE_QUESTION %s',
    async (_cas, planId) => {
      await expect(evaluer({ I3: '=1' }, planId)).rejects.toBeInstanceOf(
        TypeDeQuestionError,
      );
    },
  );

  it('refuse en PRODUCTION_INVALIDE une cellule hors de la grille', async () => {
    await expect(evaluer({ Z99: '=1' })).rejects.toBeInstanceOf(
      ProductionInvalideError,
    );
  });
});

describe('EvaluerTableauUseCase', () => {
  let sut: EvaluerTableauUseCase;

  const evaluer = (planId: string, saisie: string, cle = 'prix') =>
    sut.execute({
      ...PARTICIPANT_DE_TEST,
      planId,
      saisies: [{ rang: 0, cle, saisie }],
    });

  beforeEach(() => {
    sut = new EvaluerTableauUseCase(seanceDu(COURS_TOILE).participation);
  });

  it('rend à l élève le coefficient déduit du prix qu il a saisi, calculé sur le plan du B2-01', async () => {
    const tableau = await evaluer(PLAN_TOILE, '21,60');

    expect(tableau.lignes[0].valeurs.coef).toEqual({
      valeur: 1.08,
      affichage: '1,0800',
    });
  });

  it.each([
    ['une feuille', 'b2-01-a4-feuille-canaux'],
    ['un tri de cartes', TRI_ANATOMIE],
  ])(
    'refuse en TYPE_DE_QUESTION %s du cours de la séance',
    async (_cas, planId) => {
      await expect(evaluer(planId, '1')).rejects.toBeInstanceOf(
        TypeDeQuestionError,
      );
    },
  );

  it('refuse en PRODUCTION_INVALIDE une saisie dans une colonne déduite', async () => {
    await expect(evaluer(PLAN_TOILE, '1', 'coef')).rejects.toBeInstanceOf(
      ProductionInvalideError,
    );
  });
});

describe('EvaluerMachineUseCase', () => {
  let sut: EvaluerMachineUseCase;

  const evaluer = (ecranId: string, reglages: Record<string, number>) =>
    sut.execute({ ...PARTICIPANT_DE_TEST, ecranId, reglages });

  beforeEach(() => {
    sut = new EvaluerMachineUseCase(seanceDu(COURS_TOILE).participation);
  });

  it('rend à l élève la machine du B2-01 à ses réglages : +50 % puis −50 % donnent 75', async () => {
    const sorties = await evaluer(MACHINE, { tauxUn: 50, tauxDeux: -50 });

    expect(sorties.valeurs).toEqual({ depart: 100, tauxUn: 50, tauxDeux: -50 });
    expect(sorties.resultat.affichage).toBe('75');
  });

  it('refuse en TYPE_DE_QUESTION un écran du cours qui n est pas une machine', async () => {
    await expect(
      evaluer('B2-01-A2-02-ORIGINE-AXE', { origine: 0 }),
    ).rejects.toBeInstanceOf(TypeDeQuestionError);
  });

  it('refuse en PRODUCTION_INVALIDE un réglage hors des bornes du curseur', async () => {
    await expect(evaluer(MACHINE, { tauxUn: 51 })).rejects.toBeInstanceOf(
      ProductionInvalideError,
    );
  });
});

describe.each([
  [
    'la feuille',
    COURS,
    ECRAN_VISA_B2_03,
    (participation: ParticipationEnSeance) =>
      new EvaluerFeuilleUseCase(participation).execute({
        ...PARTICIPANT_DE_TEST,
        planId: PLAN_VISA,
        cellules: { I3: VISA },
      }),
  ],
  [
    'le tableau',
    COURS_TOILE,
    ECRAN_TOILE_B2_01,
    (participation: ParticipationEnSeance) =>
      new EvaluerTableauUseCase(participation).execute({
        ...PARTICIPANT_DE_TEST,
        planId: PLAN_TOILE,
        saisies: [{ rang: 0, cle: 'prix', saisie: '21,6' }],
      }),
  ],
  [
    'la machine',
    COURS_TOILE,
    MACHINE,
    (participation: ParticipationEnSeance) =>
      new EvaluerMachineUseCase(participation).execute({
        ...PARTICIPANT_DE_TEST,
        ecranId: MACHINE,
        reglages: { tauxUn: 50 },
      }),
  ],
] as const)('évaluation de %s en séance', (_nom, cours, ecran, evaluer) => {
  let seance: Seance;

  beforeEach(() => {
    seance = seanceDu(cours);
  });

  it('sert l évaluation dès l écran qui la porte, et la refuse en ECRAN_NON_SERVI à l écran d avant', async () => {
    const rang = rangDeLEcran(cours, ecran);
    const projeter = (ecranCourant: number) =>
      seance.sessions.findById.mockResolvedValue(
        buildSessionRecord({ courseSlug: cours.slug, ecranCourant }),
      );

    projeter(rang - 1);
    await expect(evaluer(seance.participation)).rejects.toThrow(
      new EcranNonServiError(ecran),
    );
    projeter(rang);
    await expect(evaluer(seance.participation)).resolves.toBeDefined();
    expect(rang).toBeGreaterThan(0);
  });

  it.each([
    ['non démarrée', 'attente', SessionNotStartedError],
    ['terminée', 'terminee', SessionClosedError],
  ] as const)('refuse une séance %s', async (_etat, etat, erreur) => {
    seance.sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: cours.slug, etat }),
    );

    await expect(evaluer(seance.participation)).rejects.toBeInstanceOf(erreur);
  });

  it('refuse un participant évincé', async () => {
    seance.participants.findById.mockResolvedValue(
      buildParticipantRecord({ evinceLe: new Date('2026-10-15T10:00:00Z') }),
    );

    await expect(evaluer(seance.participation)).rejects.toBeInstanceOf(
      ParticipantNotFoundError,
    );
  });
});
