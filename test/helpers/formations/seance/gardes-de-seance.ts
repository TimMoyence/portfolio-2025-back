import {
  CoursInconnuError,
  EcranNonServiError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../../../src/modules/formations/domain/errors/FormationErrors';
import {
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../factories/formations/formation.factory';

type EffetInterdit = (...args: never[]) => unknown;

export interface ContexteDeGardeSeance {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly courseSlug: string;
  readonly executer: () => Promise<unknown>;
  readonly effetsInterdits?: () => ReadonlyArray<EffetInterdit>;
}

type ErreurAttendue = new (...args: never[]) => Error;

async function refuserSansEffet(
  execution: Promise<unknown>,
  erreur: ErreurAttendue,
  effets?: () => ReadonlyArray<EffetInterdit>,
): Promise<void> {
  await expect(execution).rejects.toThrow(erreur);
  for (const effet of effets?.() ?? []) {
    expect(effet).not.toHaveBeenCalled();
  }
}

export interface ContexteDeGardeFormateur {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly executerPar: (teacherId: string) => Promise<unknown>;
  readonly effetsInterdits?: () => ReadonlyArray<EffetInterdit>;
}

export function verifierGardesDuFormateur(
  contexte: () => ContexteDeGardeFormateur,
): void {
  it('refuse un formateur qui n est pas proprietaire de la seance', async () => {
    const { executerPar, effetsInterdits } = contexte();

    await refuserSansEffet(
      executerPar('autre-teacher-uuid'),
      SessionNotOwnedError,
      effetsInterdits,
    );
  });

  verifierSeanceIntrouvable(() => {
    const { sessions, executerPar, effetsInterdits } = contexte();
    return {
      sessions,
      executer: () => executerPar('teacher-uuid'),
      effetsInterdits,
    };
  });
}

export interface ContexteDeSeanceIntrouvable {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly executer: () => Promise<unknown>;
  readonly effetsInterdits?: () => ReadonlyArray<EffetInterdit>;
}

export interface ContexteDActionSurParticipant extends ContexteDeGardeFormateur {
  readonly cache?: ContexteDActivite['cache'];
  readonly action: EffetInterdit & {
    mockResolvedValue(valeur: boolean): unknown;
  };
}

export function verifierActionSurParticipant(
  titreDuRefus: string,
  contexte: () => ContexteDActionSurParticipant,
): void {
  verifierGardesDuFormateur(() => ({
    ...contexte(),
    effetsInterdits: () => [contexte().action],
  }));

  it(titreDuRefus, async () => {
    const { action, executerPar, cache } = contexte();
    action.mockResolvedValue(false);

    await refuserSansEffet(
      executerPar('teacher-uuid'),
      ParticipantNotFoundError,
      () => (cache ? [cache.signalerActivite] : []),
    );
  });
}

function verifierIntrouvable<C extends ContexteDeSeanceIntrouvable>(
  titre: string,
  erreur: ErreurAttendue,
  rendreIntrouvable: (contexte: C) => unknown,
  contexte: () => C,
): void {
  it(titre, async () => {
    const courant = contexte();
    rendreIntrouvable(courant);

    await refuserSansEffet(courant.executer(), erreur, courant.effetsInterdits);
  });
}

export function verifierSeanceIntrouvable(
  contexte: () => ContexteDeSeanceIntrouvable,
): void {
  verifierIntrouvable(
    'signale une seance introuvable',
    SessionNotFoundError,
    ({ sessions }) => sessions.findById.mockResolvedValue(null),
    contexte,
  );
}

export interface ContexteDIntrouvables extends ContexteDeSeanceIntrouvable {
  readonly participants: ReturnType<typeof createMockParticipantsRepo>;
}

export function verifierIntrouvables(
  contexte: () => ContexteDIntrouvables,
): void {
  verifierSeanceIntrouvable(contexte);
  verifierIntrouvable(
    'signale un participant introuvable',
    ParticipantNotFoundError,
    ({ participants }) => participants.findById.mockResolvedValue(null),
    contexte,
  );
}

export interface ContexteDActivite {
  readonly cache: { signalerActivite: EffetInterdit };
  readonly executer: () => Promise<unknown>;
}

export function verifierSignalementDActivite(
  contexte: () => ContexteDActivite,
  titre = 'signale l activite de la seance',
): void {
  it(titre, async () => {
    const { cache, executer } = contexte();

    await executer();

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });
}

export interface ContexteDeLecture {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly courseSlug: string;
  readonly lire: () => Promise<{
    session: { id: string };
    cours: { slug: string };
  }>;
}

export function verifierLectureDeSeanceEtCours(
  titre: string,
  contexte: () => ContexteDeLecture,
): void {
  it(titre, async () => {
    const { courseSlug, lire } = contexte();

    const lue = await lire();

    expect(lue.session.id).toBe('session-uuid');
    expect(lue.cours.slug).toBe(courseSlug);
  });

  it.each([
    ['inconnue', null, SessionNotFoundError],
    [
      'dont le cours a disparu du catalogue',
      buildSessionRecord({ courseSlug: 'cours-absent' }),
      CoursInconnuError,
    ],
  ])('refuse une séance %s', async (_cas, seance, erreur) => {
    const { sessions, lire } = contexte();
    sessions.findById.mockResolvedValue(seance);

    await expect(lire()).rejects.toBeInstanceOf(erreur);
  });
}

export interface ContexteDeParticipation
  extends ContexteDeGardeSeance, ContexteDActivite {}

export function verifierContratDeParticipation(
  contexte: () => ContexteDeParticipation,
): void {
  verifierGardesDeSeance(contexte);
  verifierSignalementDActivite(contexte);
}

export function verifierGardesDeSeance(
  contexte: () => ContexteDeGardeSeance,
): void {
  verifierSeanceIntrouvable(contexte);

  it.each([
    ['visant un ecran non projete', { ecranCourant: 0 }, EcranNonServiError],
    [
      'sur une seance terminee',
      { etat: 'terminee' as const },
      SessionClosedError,
    ],
  ])('refuse une action %s', async (_cas, etat, erreur) => {
    const { sessions, courseSlug, executer, effetsInterdits } = contexte();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug, ...etat }),
    );

    await refuserSansEffet(executer(), erreur, effetsInterdits);
  });
}
