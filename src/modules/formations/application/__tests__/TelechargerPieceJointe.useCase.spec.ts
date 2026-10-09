/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildSeanceDuCours,
  creerCatalogueDeTest,
  creerParticipationEnSeance,
} from '../../../../../test/factories/cours.factory';
import {
  buildCoursAPiecesJointes,
  buildPieceJointeReservee,
} from '../../../../../test/factories/ecrans-stockes.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
  buildParticipantRecord,
  createMockClasseursDeCours,
  createMockParticipantsRepo,
  createMockSessionsRepo,
  OCTETS_DU_CLASSEUR,
} from '../../../../../test/factories/formation.factory';
import { verifierIntrouvables } from '../../../../../test/helpers/gardes-de-seance';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import {
  EcranNonServiError,
  PieceJointeIntrouvableError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import type { SessionRecord } from '../../domain/ISessions.repository';
import { LectureDeSeance } from '../LectureDeSeance';
import { LireSujetUseCase } from '../LireSujet.useCase';
import { TelechargerPieceJointeUseCase } from '../TelechargerPieceJointe.useCase';

const SEED = 4242;
const RESERVEE = buildPieceJointeReservee();
const COURS = lireCoursStocke(buildCoursAPiecesJointes(RESERVEE));
const [CITATION, VOTE, RECIT] = COURS.ecrans.map((ecran) => ecran.id);
const SESSION = buildSeanceDuCours(COURS, SEED);
const PARTICIPANT = buildParticipantRecord({
  sessionId: SESSION.id,
  seed: SEED,
});
const PROPRIETAIRE = buildActeurFormation({ id: SESSION.teacherId });
const XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('TelechargerPieceJointeUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let classeurs: ReturnType<typeof createMockClasseursDeCours>;
  let sut: TelechargerPieceJointeUseCase;

  const enSeance = (session: Partial<SessionRecord>): void => {
    sessions.findById.mockResolvedValue({ ...SESSION, ...session });
  };
  const pourLeParticipant = (ecranId: string) =>
    sut.pourLeParticipant(
      { sessionId: SESSION.id, participantId: PARTICIPANT.id },
      ecranId,
    );

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    participants = createMockParticipantsRepo();
    classeurs = createMockClasseursDeCours();
    sessions.findById.mockResolvedValue(SESSION);
    participants.findById.mockResolvedValue(PARTICIPANT);
    const catalogue = creerCatalogueDeTest(COURS);
    const participation = creerParticipationEnSeance({
      sessions,
      participants,
      catalogue,
    });
    sut = new TelechargerPieceJointeUseCase(
      new LireSujetUseCase(participation),
      participation,
      new LectureDeSeance(sessions, catalogue),
      classeurs,
    );
  });

  describe('au poste du participant', () => {
    it('sert le classeur réservé d un écran projeté, sous son nom sans empreinte', async () => {
      await expect(pourLeParticipant(VOTE)).resolves.toEqual({
        nom: 'B3-01_reprise_acte_2.xlsx',
        type: XLSX,
        contenu: OCTETS_DU_CLASSEUR,
      });
      expect(classeurs.lire).toHaveBeenCalledWith(RESERVEE.classeur);
    });

    it('refuse le classeur d un écran que le formateur n a pas encore projeté', async () => {
      enSeance({ ecranCourant: 0 });

      await expect(pourLeParticipant(VOTE)).rejects.toThrow(EcranNonServiError);
      expect(classeurs.lire).not.toHaveBeenCalled();
    });

    it('sert le classeur une fois la séance close', async () => {
      enSeance({ ecranCourant: 0, etat: 'terminee' });

      await expect(pourLeParticipant(VOTE)).resolves.toMatchObject({
        nom: 'B3-01_reprise_acte_2.xlsx',
      });
    });

    it.each([
      ['dont la pièce jointe est publique, servie par le front', () => RECIT],
      ['sans pièce jointe', () => CITATION],
      ['inconnu du cours', () => 'B2-01-A9-99-INCONNU'],
    ])('refuse un écran %s', async (_cas, ecranId) => {
      await expect(pourLeParticipant(ecranId())).rejects.toThrow(
        PieceJointeIntrouvableError,
      );
      expect(classeurs.lire).not.toHaveBeenCalled();
    });

    verifierIntrouvables(() => ({
      sessions,
      participants,
      executer: () => pourLeParticipant(VOTE),
      effetsInterdits: () => [classeurs.lire],
    }));
  });

  describe('au pupitre du formateur', () => {
    it('sert au propriétaire le classeur réservé, même avant sa projection', async () => {
      enSeance({ ecranCourant: 0 });

      await expect(
        sut.pourLeFormateur(SESSION.id, PROPRIETAIRE, VOTE),
      ).resolves.toEqual({
        nom: 'B3-01_reprise_acte_2.xlsx',
        type: XLSX,
        contenu: OCTETS_DU_CLASSEUR,
      });
    });

    it('sert le classeur à un administrateur', async () => {
      await expect(
        sut.pourLeFormateur(SESSION.id, buildAdministrateur(), VOTE),
      ).resolves.toMatchObject({ nom: 'B3-01_reprise_acte_2.xlsx' });
    });

    it('refuse le classeur à un formateur qui n est pas le propriétaire', async () => {
      await expect(
        sut.pourLeFormateur(
          SESSION.id,
          buildActeurFormation({ id: 'autre-teacher-uuid' }),
          VOTE,
        ),
      ).rejects.toThrow(SessionNotOwnedError);
      expect(classeurs.lire).not.toHaveBeenCalled();
    });

    it('refuse une pièce jointe publique, que le front sert lui-même', async () => {
      await expect(
        sut.pourLeFormateur(SESSION.id, PROPRIETAIRE, RECIT),
      ).rejects.toThrow(PieceJointeIntrouvableError);
    });
  });
});
