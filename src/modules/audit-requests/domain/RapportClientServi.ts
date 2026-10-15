import type { AuditLocale } from './audit-locale.util';
import type { ClientReportSynthesis } from './AuditReportTiers';
import {
  libelleDuStatut,
  statutDuScore,
  type StatutScore,
} from './StatutScore';

interface StatutServi {
  readonly status: StatutScore;
  readonly statusLabel: string;
}

type ScoreDeMoteur =
  ClientReportSynthesis['googleVsAiMatrix']['googleVisibility'];

type ScoreDeMoteurServi = ScoreDeMoteur & StatutServi;

export interface RapportClientServi extends Omit<
  ClientReportSynthesis,
  'googleVsAiMatrix' | 'pillarScorecard'
> {
  readonly googleVsAiMatrix: {
    readonly googleVisibility: ScoreDeMoteurServi;
    readonly aiVisibility: ScoreDeMoteurServi;
  };
  readonly pillarScorecard: ReadonlyArray<
    ClientReportSynthesis['pillarScorecard'][number] & StatutServi
  >;
}

function statutServi(
  score: number,
  cible: number | undefined,
  locale: AuditLocale,
): StatutServi {
  const status = statutDuScore(score, cible);
  return { status, statusLabel: libelleDuStatut(status, locale) };
}

function scoreDeMoteurServi(
  { score, summary }: ScoreDeMoteur,
  locale: AuditLocale,
): ScoreDeMoteurServi {
  return { score, summary, ...statutServi(score, undefined, locale) };
}

export function rapportClientServi(
  rapport: ClientReportSynthesis,
  locale: AuditLocale,
): RapportClientServi {
  return {
    ...rapport,
    googleVsAiMatrix: {
      googleVisibility: scoreDeMoteurServi(
        rapport.googleVsAiMatrix.googleVisibility,
        locale,
      ),
      aiVisibility: scoreDeMoteurServi(
        rapport.googleVsAiMatrix.aiVisibility,
        locale,
      ),
    },
    pillarScorecard: rapport.pillarScorecard.map(
      ({ pillar, score, target }) => ({
        pillar,
        score,
        target,
        ...statutServi(score, target, locale),
      }),
    ),
  };
}
