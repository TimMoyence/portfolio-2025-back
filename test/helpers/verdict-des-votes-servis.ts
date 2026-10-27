import type { PilotageEcran } from '../../src/modules/formations/domain/contrats/pilotage';
import type { SessionState } from '../../src/modules/formations/domain/SessionState';
import {
  casDesVotes,
  VOTES_JUMELES,
  VOTES_SIMPLES,
  type VoteDUnCoursServi,
} from '../factories/votes-des-cours-servis.factory';

interface MomentDUnVoteJumele {
  readonly pilotage?: PilotageEcran;
  readonly etat?: SessionState;
  readonly verdictServi: boolean;
}

const MOMENTS_D_UN_VOTE_JUMELE: Readonly<Record<string, MomentDUnVoteJumele>> =
  {
    avantToutePhase: { verdictServi: false },
    question1: { pilotage: { phase: 'question-1' }, verdictServi: false },
    question2: { pilotage: { phase: 'question-2' }, verdictServi: false },
    question2Projetee: {
      pilotage: { phase: 'question-2', resultatsProjetes: true },
      verdictServi: false,
    },
    revele: {
      pilotage: { phase: 'question-2', revele: true },
      verdictServi: true,
    },
    ecranRevele: { pilotage: { revele: true }, verdictServi: true },
    seanceTerminee: { etat: 'terminee', verdictServi: true },
  };

type LectureDuVerdict = (
  vote: VoteDUnCoursServi,
  pilotage?: PilotageEcran,
  etat?: SessionState,
) => unknown;

async function verdictsLusAuxMoments(
  lire: LectureDuVerdict,
  vote: VoteDUnCoursServi,
): Promise<Readonly<Record<string, unknown>>> {
  const lus: Record<string, unknown> = {};
  for (const [moment, { pilotage, etat }] of Object.entries(
    MOMENTS_D_UN_VOTE_JUMELE,
  )) {
    lus[moment] = await lire(vote, pilotage, etat);
  }
  return lus;
}

function verdictsAttendusAuxMoments(
  retenu: unknown,
  servi: unknown,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(MOMENTS_D_UN_VOTE_JUMELE).map(
      ([moment, { verdictServi }]) => [moment, verdictServi ? servi : retenu],
    ),
  );
}

export function decrireLeVerdictDesVotesServis(
  lire: LectureDuVerdict,
  { retenu, servi }: { readonly retenu: unknown; readonly servi: unknown },
): void {
  it.each(casDesVotes(VOTES_JUMELES))(
    '%s : retient verdict et confusion jusqu à la révélation de son écran',
    async (_id, vote) => {
      expect(await verdictsLusAuxMoments(lire, vote)).toEqual(
        verdictsAttendusAuxMoments(retenu, servi),
      );
    },
  );

  it.each(casDesVotes(VOTES_SIMPLES))(
    '%s : sert verdict et confusion d un vote simple dès la réponse',
    async (_id, vote) => {
      expect(await lire(vote)).toEqual(servi);
    },
  );
}
