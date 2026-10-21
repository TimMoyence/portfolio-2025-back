import type {
  BaremeQuestionV2,
  BaremeV2,
} from '../../src/modules/formations/domain/contrats/bareme';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type {
  PilotageEcran,
  PilotageServi,
} from '../../src/modules/formations/domain/contrats/pilotage';
import { ouvrirTirages } from '../../src/modules/formations/domain/cours/OuvertureTirages';
import type { SessionRecord } from '../../src/modules/formations/domain/ISessions.repository';
import { buildCoursDuContenu } from './contenus-de-cours.factory';
import { CONTENUS } from './contenus-publies';
import { tireurSequentiel } from './cours.factory';

export interface VoteDUnCoursServi {
  readonly cours: Cours;
  readonly bareme: BaremeV2;
  readonly question: BaremeQuestionV2;
}

export const COURS_SERVIS_ET_BAREMES: readonly {
  readonly cours: Cours;
  readonly bareme: BaremeV2;
}[] = CONTENUS.map((contenu) => {
  const cours = buildCoursDuContenu(contenu);
  return { cours, bareme: ouvrirTirages(cours, tireurSequentiel(1)) };
});

const VOTES = COURS_SERVIS_ET_BAREMES.flatMap(({ cours, bareme }) =>
  bareme.questions
    .filter((question) => question.type === 'vote')
    .map((question) => ({ cours, bareme, question })),
);

export const VOTES_JUMELES: readonly VoteDUnCoursServi[] = VOTES.filter(
  ({ question }) => question.ouverture !== undefined,
);

export const VOTES_SIMPLES: readonly VoteDUnCoursServi[] = VOTES.filter(
  ({ question }) => question.ouverture === undefined,
);

export const CAS_DES_COURS_SERVIS: readonly (readonly [string, Cours])[] =
  COURS_SERVIS_ET_BAREMES.map(({ cours }) => [cours.slug, cours] as const);

export function casDesVotes(
  votes: readonly VoteDUnCoursServi[],
): readonly (readonly [string, VoteDUnCoursServi])[] {
  return votes.map((vote) => [vote.question.id, vote] as const);
}

export function graineDuVote({ bareme }: VoteDUnCoursServi): number {
  return bareme.tirages[0].seed;
}

export function ecransDesVotesJumeles(cours: Cours): readonly string[] {
  return VOTES_JUMELES.filter(
    (vote) => vote.cours === cours && vote.question.ouverture === 'principale',
  ).map(({ question }) => question.ecranId);
}

export function questionsDuVoteJumele(
  cours: Cours,
  ecranId: string,
): { readonly principale: string; readonly jumelle: string } {
  const ecran = cours.ecrans.find(({ id }) => id === ecranId);
  if (ecran?.brique !== 'fp-vote' || ecran.questionJumelle === undefined) {
    throw new Error(`vote jumelé absent de ${cours.slug} : ${ecranId}`);
  }
  return {
    principale: ecran.question.id,
    jumelle: ecran.questionJumelle.id,
  };
}

export function pilotageDUnCoursServi(cours: Cours): {
  readonly seance: Pick<
    SessionRecord,
    'modeRythme' | 'intervalleLibre' | 'pilotageEcrans'
  >;
  readonly attendu: Readonly<Record<string, PilotageServi>>;
} {
  const jumeles = ecransDesVotesJumeles(cours);
  const sansPhase = jumeles.at(0);
  const enDiscussion = jumeles.at(1);
  const nonPilotes = jumeles.slice(2);
  const autre = cours.ecrans.find(({ id }) => !jumeles.includes(id));
  const auVote = (ecranId: string) => {
    const { principale } = questionsDuVoteJumele(cours, ecranId);
    return { questionAffichee: principale, questionOuverte: principale };
  };
  const pilotageEcrans: Record<string, PilotageEcran> = {};
  const attendu: Record<string, PilotageServi> = Object.fromEntries(
    nonPilotes.map((id) => [id, { phase: 'vote', ...auVote(id) }]),
  );
  if (autre !== undefined) {
    pilotageEcrans[autre.id] = { revele: true };
    attendu[autre.id] = { revele: true, correctionProjetee: true };
  }
  if (sansPhase !== undefined) {
    pilotageEcrans[sansPhase] = { resultatsProjetes: true };
    attendu[sansPhase] = {
      resultatsProjetes: true,
      phase: 'vote',
      ...auVote(sansPhase),
    };
  }
  if (enDiscussion !== undefined) {
    pilotageEcrans[enDiscussion] = { phase: 'discussion' };
    attendu[enDiscussion] = {
      phase: 'discussion',
      questionAffichee: questionsDuVoteJumele(cours, enDiscussion).principale,
      questionOuverte: null,
    };
  }
  return {
    seance: { modeRythme: 'libre', intervalleLibre: null, pilotageEcrans },
    attendu,
  };
}
