import { creerCatalogueDeTest } from '../../../../../test/factories/cours.factory';
import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import { COURS_B2_03 } from '../../../../../test/factories/contenus-publies';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
  creerParticipationEnSeance,
  PARTICIPANT_DE_TEST,
} from '../../../../../test/factories/formation.factory';
import {
  ParticipantNotFoundError,
  ProductionInvalideError,
  SessionClosedError,
  SessionNotStartedError,
  TypeDeQuestionError,
} from '../../domain/errors/FormationErrors';
import { EvaluerFeuilleUseCase } from '../EvaluerFeuille.useCase';

const COURS = buildCoursDuContenu(COURS_B2_03);
const PLAN_VISA = 'b2-03-a1-tableur-si-ou';
const VISA = '=SI(OU(C2>=5000;B2<>"France");"Visa";"Non")';

describe('EvaluerFeuilleUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: EvaluerFeuilleUseCase;

  const evaluer = (
    cellules: Record<string, string>,
    planId = PLAN_VISA,
    recopie?: { de: string },
  ) => sut.execute({ ...PARTICIPANT_DE_TEST, planId, cellules, recopie });

  beforeEach(() => {
    const seance = creerParticipationEnSeance(
      COURS.slug,
      creerCatalogueDeTest(COURS),
    );
    ({ sessions, participants } = seance);
    sut = new EvaluerFeuilleUseCase(seance.participation);
  });

  it('rend à l élève la valeur de sa formule, calculée sur les données imposées du B2-03', async () => {
    const feuille = await evaluer({ D2: VISA });

    expect(feuille.saisies).toEqual({ D2: VISA });
    expect(feuille.formules).toEqual(['D2']);
    expect([feuille.affichages.D2, feuille.affichages.A1]).toEqual([
      'Visa',
      'Facture',
    ]);
    expect([feuille.natures.D2, feuille.natures.C2]).toEqual([
      'texte',
      'nombre',
    ]);
  });

  it('recopie la formule vers la cellule du dessous en décalant ses références', async () => {
    const feuille = await evaluer({ D2: VISA }, PLAN_VISA, { de: 'D2' });

    expect(feuille.saisies.D3).toBe(
      '=SI(OU(C3>=5000;B3<>"France");"Visa";"Non")',
    );
  });

  it('refuse en TYPE_DE_QUESTION un plan qui n est pas une feuille du cours de la séance', async () => {
    await expect(
      evaluer({ D2: '=1' }, 'b2-01-a4-feuille-canaux'),
    ).rejects.toBeInstanceOf(TypeDeQuestionError);
  });

  it('refuse en PRODUCTION_INVALIDE une cellule hors de la grille', async () => {
    await expect(evaluer({ Z99: '=1' })).rejects.toBeInstanceOf(
      ProductionInvalideError,
    );
  });

  it.each([
    ['non démarrée', 'attente', SessionNotStartedError],
    ['terminée', 'terminee', SessionClosedError],
  ] as const)('refuse une séance %s', async (_etat, etat, erreur) => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, etat }),
    );

    await expect(evaluer({ D2: VISA })).rejects.toBeInstanceOf(erreur);
  });

  it('refuse un participant évincé', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({ evinceLe: new Date('2026-10-15T10:00:00Z') }),
    );

    await expect(evaluer({ D2: VISA })).rejects.toBeInstanceOf(
      ParticipantNotFoundError,
    );
  });
});
