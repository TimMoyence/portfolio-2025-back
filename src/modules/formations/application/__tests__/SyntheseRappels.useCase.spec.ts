import { buildCoursB2_01 } from '../../../../../test/factories/cours-b2-01.factory';
import { creerCatalogueAVersions } from '../../../../../test/factories/cours.factory';
import {
  buildActeurFormation,
  buildAdministrateur,
  buildMasteryRecord,
  buildParticipantRecord,
  createMockMasteryRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { SessionNotOwnedError } from '../../domain/errors/FormationErrors';
import { LectureDeSeance } from '../LectureDeSeance';
import { SyntheseRappelsUseCase } from '../SyntheseRappels.useCase';

const COURS = buildCoursB2_01();

describe('SyntheseRappelsUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let mastery: ReturnType<typeof createMockMasteryRepo>;
  let sut: SyntheseRappelsUseCase;

  beforeEach(() => {
    sessions = createMockSessionsRepo({
      courseSlug: COURS.slug,
      courseVersion: 3,
    });
    participants = createMockParticipantsRepo();
    mastery = createMockMasteryRepo();
    sut = new SyntheseRappelsUseCase(
      new LectureDeSeance(
        sessions,
        creerCatalogueAVersions({ [COURS.slug]: { 3: COURS } }),
      ),
      participants,
      mastery,
    );
  });

  it('rend un concept par concept de la banque, sans doublon', async () => {
    const { concepts } = await sut.execute(
      'session-uuid',
      buildActeurFormation(),
    );

    expect(concepts.length).toBeGreaterThan(0);
    expect(new Set(concepts.map((entree) => entree.concept)).size).toBe(
      concepts.length,
    );
  });

  it('compte les boites de chaque participant et les non vus', async () => {
    participants.listBySession.mockResolvedValue([
      buildParticipantRecord({ id: 'p1', studentKey: 'cle-1' }),
      buildParticipantRecord({ id: 'p2', studentKey: 'cle-2' }),
      buildParticipantRecord({ id: 'p3', studentKey: 'cle-3' }),
    ]);
    mastery.findByStudentKey.mockImplementation((cle: string) =>
      Promise.resolve(
        cle === 'cle-3'
          ? []
          : [
              buildMasteryRecord({
                studentKey: cle,
                concept: 'taux-evolution',
                boite: cle === 'cle-1' ? 1 : 3,
              }),
            ],
      ),
    );

    const { concepts } = await sut.execute(
      'session-uuid',
      buildActeurFormation(),
    );

    const taux = concepts.find((entree) => entree.concept === 'taux-evolution');
    expect(taux).toEqual({
      concept: 'taux-evolution',
      libelle: 'taux-evolution',
      boite1: 1,
      boite2: 0,
      boite3: 1,
      nonVus: 1,
    });
  });

  it('ouvre la lecture a l administrateur', async () => {
    await expect(
      sut.execute('session-uuid', buildAdministrateur()),
    ).resolves.toBeDefined();
  });

  it('refuse un formateur qui n est pas proprietaire de la seance', async () => {
    await expect(
      sut.execute(
        'session-uuid',
        buildActeurFormation({ id: 'autre-teacher-uuid' }),
      ),
    ).rejects.toThrow(SessionNotOwnedError);
  });
});
