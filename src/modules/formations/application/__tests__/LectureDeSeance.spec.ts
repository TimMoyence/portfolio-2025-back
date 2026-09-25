import {
  buildCoursDeTest,
  creerCatalogueDeTest,
} from '../../../../../test/factories/cours.factory';
import { createMockSessionsRepo } from '../../../../../test/factories/formation.factory';
import { verifierLectureDeSeanceEtCours } from '../../../../../test/helpers/gardes-de-seance';
import { SessionNotOwnedError } from '../../domain/errors/FormationErrors';
import { LectureDeSeance } from '../LectureDeSeance';

describe('LectureDeSeance', () => {
  const COURS = buildCoursDeTest();
  const FORMATEUR = { id: 'teacher-uuid', roles: ['teacher'] };
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let sut: LectureDeSeance;

  beforeEach(() => {
    sessions = createMockSessionsRepo({ courseSlug: COURS.slug });
    sut = new LectureDeSeance(sessions, creerCatalogueDeTest(COURS));
  });

  verifierLectureDeSeanceEtCours(
    'rend la séance lisible par son formateur et le cours joué',
    () => ({
      sessions,
      courseSlug: COURS.slug,
      lire: () => sut.coursLisiblePar('session-uuid', FORMATEUR),
    }),
  );

  it('refuse la séance à un formateur qui n en est pas propriétaire', async () => {
    await expect(
      sut.coursLisiblePar('session-uuid', {
        id: 'autre-teacher-uuid',
        roles: ['teacher'],
      }),
    ).rejects.toBeInstanceOf(SessionNotOwnedError);
  });
});
