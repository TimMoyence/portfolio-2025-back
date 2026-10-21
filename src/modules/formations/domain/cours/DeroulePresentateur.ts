import type {
  Cours,
  Ecran,
  Question,
  TableBuildPlanStocke,
} from '../contrats/cours';
import type {
  CorrigeEcranPresentateur,
  DerouleCours,
  EcranDeroule,
} from '../contrats/deroule';
import type { EcranPublic, TirageDuCours } from '../contrats/tirage';
import type { ConfusionId } from './banque/confusions';
import { libelleDeConfusion } from './banque/confusions';
import type { CorrigeEnigme } from './Corrige';
import { questionsDe } from './Cours';
import { seuilDe } from './EcranServi';
import { affichageDeLAttendu } from './FeuilleEvaluee';
import { tableauDuCorrige } from './TableauEvalue';
import { tirerEnDetail } from './Tirage';

export type { DerouleCours, EcranDeroule } from '../contrats/deroule';

export interface CorrigePresentateur {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly confusions: readonly {
    readonly id: string;
    readonly libelle: string;
  }[];
}

type QuestionDuDeroule = EcranDeroule['questions'][number];

interface Projection {
  readonly tirage: TirageDuCours;
  readonly enonces: Readonly<Record<string, string>>;
}

export function deroulePresentateur(
  cours: Cours,
  graineReference: number,
): DerouleCours {
  const projection = tirerEnDetail(cours, graineReference);
  return {
    ...projection.tirage.sujet,
    ecrans: projection.tirage.sujet.ecrans.map((ecranPublic, index) =>
      versEcranDeroule(ecranPublic, cours.ecrans[index], projection),
    ),
  };
}

function versEcranDeroule(
  ecranPublic: EcranPublic,
  ecran: Ecran,
  projection: Projection,
): EcranDeroule {
  const corrigeEcran = corrigeDeLEcran(ecran);
  return {
    ...ecranPublic,
    notes: ecran.notes,
    diffusion: ecran.diffusion,
    seuil: seuilDe(ecran),
    corriges: corrigesDe(ecran, projection.tirage),
    questions: questionsDe(ecran).map((question) =>
      questionDuDeroule(question, ecran, projection),
    ),
    corrigeEcran,
    reflexion: reflexionDe(corrigeEcran),
    explications: ecran.correctionSurPlace?.explications,
  };
}

function corrigesDe(
  ecran: Ecran,
  tirage: TirageDuCours,
): readonly CorrigePresentateur[] {
  return questionsDe(ecran)
    .filter(
      (question) => question.type === 'vote' || question.type === 'numeric',
    )
    .map((question) => {
      const corrige = tirage.corriges[question.id];
      return {
        questionId: question.id,
        bonneReponse: corrige.bonneReponse,
        confusions: [...new Set(corrige.confusions)].map((id) =>
          confusionPresentateur(id),
        ),
      };
    });
}

function enonceDeProduction(ecran: Ecran, question: Question): string {
  switch (ecran.brique) {
    case 'fp-cardsort':
    case 'fp-sheet':
    case 'fp-table-build':
      return ecran.proprietes.plan.intitule;
    case 'fp-escape': {
      const enigme = ecran.proprietes.parcours.enigmes.find(
        (candidate) => candidate.id === question.id,
      );
      if (enigme !== undefined) {
        return enigme.enonce;
      }
      break;
    }
    default:
      break;
  }
  throw new RangeError(
    `La production ${question.id} n'a pas d'énoncé sur l'écran ${ecran.id}`,
  );
}

function questionDuDeroule(
  question: Question,
  ecran: Ecran,
  { tirage, enonces }: Projection,
): QuestionDuDeroule {
  if (question.type !== 'vote' && question.type !== 'numeric') {
    return {
      id: question.id,
      enonce: enonceDeProduction(ecran, question),
      options: null,
    };
  }
  return {
    id: question.id,
    enonce: enonces[question.id],
    options:
      question.type === 'vote'
        ? Object.entries(tirage.libellesOptions[question.id]).map(
            ([id, libelle]) => ({ id, libelle }),
          )
        : null,
  };
}

function solutionLisible(corrige: CorrigeEnigme): string {
  return corrige.solution.type === 'nombre'
    ? corrige.solution.formePubliee
    : corrige.solution.acceptees[0];
}

export function reflexionDe(
  corrige: CorrigeEcranPresentateur | null,
): EcranDeroule['reflexion'] {
  return corrige?.type === 'reflexion'
    ? { attendu: corrige.attendu, suite: corrige.suite }
    : null;
}

export function corrigeDeLEcran(ecran: Ecran): CorrigeEcranPresentateur | null {
  switch (ecran.brique) {
    case 'fp-cardsort':
    case 'fp-sheet':
      return corrigeDeProduction(ecran.production.corrige, null);
    case 'fp-table-build':
      return corrigeDeProduction(
        ecran.production.corrige,
        ecran.proprietes.plan,
      );
    case 'fp-escape': {
      const corriges = ecran.enigmes.flatMap((enigme) =>
        enigme.corrige.type === 'enigme' ? [enigme.corrige] : [],
      );
      return {
        type: 'enigmes',
        enigmes: corriges.map((corrige) => ({
          enigmeId: corrige.enigmeId,
          solution: solutionLisible(corrige),
          fragment: corrige.fragment,
        })),
        codeFinal: corriges.map((corrige) => corrige.fragment).join(''),
      };
    }
    case 'fp-challenge':
      return { type: 'defi', strategies: ecran.defi.strategies };
    case 'fp-vote':
      return ecran.revelation === undefined
        ? null
        : {
            type: 'revelation',
            titre: ecran.revelation.titre,
            lignes: ecran.revelation.lignes,
          };
    case 'fp-story': {
      const correction = ecran.proprietes.correction;
      return correction === undefined || !('expected' in correction)
        ? null
        : {
            type: 'reflexion',
            attendu: correction.expected,
            suite: correction.nextAction,
          };
    }
    default:
      return null;
  }
}

function corrigeDeProduction(
  corrige: Extract<
    Ecran,
    { readonly brique: 'fp-sheet' }
  >['production']['corrige'],
  planDuTableau: TableBuildPlanStocke | null,
): CorrigeEcranPresentateur | null {
  switch (corrige.type) {
    case 'feuille':
      return {
        type: 'feuille',
        attendus: corrige.attendus.map((attendu) => ({
          reference: attendu.reference,
          formuleReference: attendu.formuleReference,
          valeur: attendu.valeur,
          affichage: affichageDeLAttendu(attendu.valeur),
          tolerance: attendu.tolerance,
          forme: attendu.forme,
        })),
      };
    case 'tableau':
      if (planDuTableau === null) {
        return null;
      }
      return {
        type: 'tableau',
        attendus: corrige.attendus.map(({ rang, cle, valeur }) => ({
          rang,
          cle,
          valeur,
        })),
        tableauCorrige: tableauDuCorrige(planDuTableau, corrige.attendus),
        tolerance: corrige.tolerance,
      };
    case 'classement':
      return {
        type: 'classement',
        attendus: corrige.attendus.map(
          ({ carteId, categorieId, justification }) => ({
            carteId,
            categorieId,
            justification,
          }),
        ),
      };
    case 'enigme':
      return null;
    default:
      return corrige satisfies never;
  }
}

function confusionPresentateur(id: ConfusionId): {
  readonly id: string;
  readonly libelle: string;
} {
  return { id, libelle: libelleDeConfusion(id) ?? id };
}

export function remediationsDe(cours: Cours): Readonly<Record<string, string>> {
  const entrees = Object.entries(cours.remediations).filter(
    (entree): entree is [string, string] => entree[1] !== undefined,
  );
  return Object.fromEntries(entrees);
}
