import {
  EcranNonServiError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../../src/modules/formations/domain/errors/FormationErrors';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../factories/formation.factory';

type EffetInterdit = (...args: never[]) => unknown;

export interface ContexteDeGardeParticipant {
  readonly participants: ReturnType<typeof createMockParticipantsRepo>;
  readonly executer: () => Promise<unknown>;
  readonly effetsInterdits?: () => ReadonlyArray<EffetInterdit>;
}

export interface ContexteDeGardeSeance {
  readonly sessions: ReturnType<typeof createMockSessionsRepo>;
  readonly courseSlug: string;
  readonly executer: () => Promise<unknown>;
  readonly effetsInterdits?: () => ReadonlyArray<EffetInterdit>;
}

function attendreSansEffet(effets?: () => ReadonlyArray<EffetInterdit>) {
  for (const effet of effets?.() ?? []) {
    expect(effet).not.toHaveBeenCalled();
  }
}

export function verifierGardesDeParticipant(
  contexte: () => ContexteDeGardeParticipant,
): void {
  it.each([
    ['rattache a une autre seance', { sessionId: 'autre-session' }],
    ['evince', { evinceLe: new Date('2026-09-20T09:00:00.000Z') }],
  ])('T10 · refuse un participant %s, sans rien ecrire', async (_cas, etat) => {
    const { participants, executer, effetsInterdits } = contexte();
    participants.findById.mockResolvedValue(buildParticipantRecord(etat));

    await expect(executer()).rejects.toThrow(ParticipantNotFoundError);
    attendreSansEffet(effetsInterdits);
  });
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

    await expect(executerPar('autre-teacher-uuid')).rejects.toThrow(
      SessionNotOwnedError,
    );
    attendreSansEffet(effetsInterdits);
  });

  it('signale une seance introuvable', async () => {
    const { sessions, executerPar, effetsInterdits } = contexte();
    sessions.findById.mockResolvedValue(null);

    await expect(executerPar('teacher-uuid')).rejects.toThrow(
      SessionNotFoundError,
    );
    attendreSansEffet(effetsInterdits);
  });
}

export function verifierGardesDeSeance(
  contexte: () => ContexteDeGardeSeance,
): void {
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

    await expect(executer()).rejects.toThrow(erreur);
    attendreSansEffet(effetsInterdits);
  });
}
