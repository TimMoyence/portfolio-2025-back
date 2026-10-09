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
  buildClasseurTelecharge,
  buildParticipantRecord,
  createMockClasseursDeCours,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  verifierGardesDeParticipant,
  verifierIntrouvables,
} from '../../../../../test/helpers/gardes-de-seance';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import {
  EcranNonServiError,
  PieceJointeIntrouvableError,
  PieceJointeRetenueError,
  SessionNotOwnedError,
} from '../../domain/errors/FormationErrors';
import type { SessionRecord } from '../../domain/ISessions.repository';
import { LectureDeSeance } from '../LectureDeSeance';
import { TelechargerPieceJointeUseCase } from '../TelechargerPieceJointe.useCase';

const SEED = 4242;
const COURS = lireCoursStocke(buildCoursAPiecesJointes());
const [REPRIS, VOTE, RECIT] = COURS.ecrans.map((ecran) => ecran.id);
const RESERVEE = buildPieceJointeReservee({ reprend: [REPRIS] });
const SESSION = buildSeanceDuCours(COURS, SEED, {
  pilotageEcrans: { [REPRIS]: { revele: true } },
});
const PARTICIPANT = buildParticipantRecord({
  sessionId: SESSION.id,
  seed: SEED,
});
const PROPRIETAIRE = buildActeurFormation({ id: SESSION.teacherId });
const CLASSEUR = buildClasseurTelecharge();

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
      participation,
      new LectureDeSeance(sessions, catalogue),
      classeurs,
    );
  });

  describe('au poste du participant', () => {
    it('sert le classeur réservé d un écran projeté dont les écrans repris sont révélés', async () => {
      await expect(pourLeParticipant(VOTE)).resolves.toEqual(CLASSEUR);
      expect(classeurs.lire).toHaveBeenCalledWith(RESERVEE.classeur);
    });

    it('refuse le classeur d un écran que le formateur n a pas encore projeté', async () => {
      enSeance({ ecranCourant: 0 });

      await expect(pourLeParticipant(VOTE)).rejects.toThrow(EcranNonServiError);
      expect(classeurs.lire).not.toHaveBeenCalled();
    });

    it.each([
      ['en rythme piloté', {}],
      [
        'en rythme libre, l écran de la reprise ouvert',
        {
          modeRythme: 'libre' as const,
          intervalleLibre: { premier: 0, dernier: 2 },
        },
      ],
    ])(
      'refuse le classeur tant qu un écran dont il porte les réponses n est pas révélé, %s',
      async (_cas, rythme) => {
        enSeance({ ...rythme, pilotageEcrans: {} });

        await expect(pourLeParticipant(VOTE)).rejects.toThrow(
          PieceJointeRetenueError,
        );
        expect(classeurs.lire).not.toHaveBeenCalled();
      },
    );

    it('sert le classeur une fois la séance close, sans révélation', async () => {
      enSeance({ ecranCourant: 0, etat: 'terminee', pilotageEcrans: {} });

      await expect(pourLeParticipant(VOTE)).resolves.toEqual(CLASSEUR);
    });

    it.each([
      ['dont la pièce jointe est publique, servie par le front', () => RECIT],
      ['sans pièce jointe', () => REPRIS],
      ['inconnu du cours', () => 'B2-01-A9-99-INCONNU'],
    ])('refuse un écran %s', async (_cas, ecranId) => {
      await expect(pourLeParticipant(ecranId())).rejects.toThrow(
        PieceJointeIntrouvableError,
      );
      expect(classeurs.lire).not.toHaveBeenCalled();
    });

    it('ne lit la séance qu une fois par téléchargement', async () => {
      await pourLeParticipant(VOTE);

      expect(sessions.findById).toHaveBeenCalledTimes(1);
      expect(participants.findById).toHaveBeenCalledTimes(1);
    });

    verifierIntrouvables(() => ({
      sessions,
      participants,
      executer: () => pourLeParticipant(VOTE),
      effetsInterdits: () => [classeurs.lire],
    }));

    verifierGardesDeParticipant(() => ({
      participants,
      executer: () => pourLeParticipant(VOTE),
      effetsInterdits: () => [classeurs.lire],
    }));
  });

  describe('au pupitre du formateur', () => {
    it('sert au propriétaire le classeur réservé, avant sa projection et sa révélation', async () => {
      enSeance({ ecranCourant: 0, pilotageEcrans: {} });

      await expect(
        sut.pourLeFormateur(SESSION.id, PROPRIETAIRE, VOTE),
      ).resolves.toEqual(CLASSEUR);
    });

    it('sert le classeur à un administrateur', async () => {
      await expect(
        sut.pourLeFormateur(SESSION.id, buildAdministrateur(), VOTE),
      ).resolves.toEqual(CLASSEUR);
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
