import {
  creerCatalogueAVersions,
  tireurSequentiel,
} from '../../../../../test/factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { B2_COURS } from '../../../../migrations/data/b2-v3.cours';
import { lireCoursStocke } from '../../domain/cours/CoursStocke';
import { ouvrirTirages } from '../../domain/cours/OuvertureTirages';
import { LireCoursPublicUseCase } from '../LireCoursPublic.useCase';
import { LireSujetUseCase } from '../LireSujet.useCase';
import { OpenSessionUseCase } from '../OpenSession.useCase';

const COURS = lireCoursStocke(B2_COURS);
const CATALOGUE = creerCatalogueAVersions({ [COURS.slug]: { 3: COURS } });
const BAREME = ouvrirTirages(COURS, tireurSequentiel(1), 3);
const ECRAN_COURANT = 4;

function seance(): {
  readonly sut: LireSujetUseCase;
  readonly graine: number;
} {
  const graine = BAREME.tirages[0].seed;
  const session = buildSessionRecord({
    courseSlug: COURS.slug,
    courseVersion: 3,
    bareme: BAREME,
    ecranCourant: ECRAN_COURANT,
  });
  const participant = buildParticipantRecord({
    sessionId: session.id,
    seed: graine,
  });
  const sessions = createMockSessionsRepo();
  const participants = createMockParticipantsRepo();
  sessions.findById.mockResolvedValue(session);
  participants.findById.mockResolvedValue(participant);
  return {
    sut: new LireSujetUseCase(sessions, participants, CATALOGUE),
    graine,
  };
}

describe('B2-01 V3 — comportement des cas d’usage servis par les contrôleurs', () => {
  it('sert la page publique du cours avec ses 13 écrans en clair (GET catalogue/:slug)', async () => {
    const sut = new LireCoursPublicUseCase(CATALOGUE);

    const cours = await sut.execute(COURS.slug);

    expect(cours.id).toBe(COURS.slug);
    expect(cours.duree).toBe(210);
    expect(cours.ecrans).toHaveLength(52);
    expect(
      cours.ecrans.filter((ecran) => ecran.type === 'ecran-verrouille'),
    ).toHaveLength(39);
    expect(cours.ecrans.every((ecran) => (ecran.titre ?? '').length > 0)).toBe(
      true,
    );
  });

  it('ouvre une séance sur la V3 avec un barème v2 complet (POST sessions)', async () => {
    const sessions = createMockSessionsRepo();
    const sut = new OpenSessionUseCase(sessions, CATALOGUE);

    await sut.execute({ courseSlug: COURS.slug, teacherId: 'teacher-uuid' });

    const [depot] = sessions.create.mock.calls[0];
    if (depot.bareme.version !== 2) {
      throw new Error('une séance V3 ouvre un barème v2');
    }
    expect(depot.courseVersion).toBe(3);
    expect(depot.bareme.questions).toHaveLength(48);
    expect(depot.bareme.tirages).toHaveLength(60);
    expect(Object.keys(depot.bareme.corriges)).toEqual([
      'b2-01-a1-anatomie',
      'b2-01-a2-comparable',
      'b2-01-a4-feuille-canaux',
      'b2-01-a4-indice-toile',
      'b2-01-a5-controle',
      'b2-01-a6-e1-mix',
      'b2-01-a6-e2-points',
      'b2-01-a6-e3-rouleau',
      'b2-01-a6-e4-tva',
    ]);
  });

  it('sert au participant les écrans déjà joués et verrouille les suivants (GET sessions/:id/sujet)', async () => {
    const { sut } = seance();

    const sujet = await sut.execute({
      sessionId: 'session-uuid',
      participantId: 'participant-uuid',
    });
    const verrouilles = sujet.ecrans.filter(
      (ecran) => ecran.type === 'ecran-verrouille',
    );

    expect(sujet.ecrans).toHaveLength(52);
    expect(verrouilles).toHaveLength(52 - (ECRAN_COURANT + 1));
    expect(sujet.ecrans.slice(0, ECRAN_COURANT + 1).map((e) => e.type)).toEqual(
      COURS.ecrans.slice(0, ECRAN_COURANT + 1).map((e) => e.brique),
    );
  });

  it('ne livre au participant ni solution, ni corrigé, ni note du formateur', async () => {
    const { sut } = seance();

    const servi = JSON.stringify(
      await sut.execute({
        sessionId: 'session-uuid',
        participantId: 'participant-uuid',
      }),
    );

    expect(servi).not.toContain('Observé :');
    expect(servi).not.toContain('corrige');
    expect(servi).not.toContain('45,5');
  });
});
