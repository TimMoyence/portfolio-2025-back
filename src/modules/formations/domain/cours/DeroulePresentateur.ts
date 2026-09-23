import type { Cours, Ecran, Question } from '../contrats/cours';
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
import { tirerEnDetail } from './Tirage';

export type { DerouleCours, EcranDeroule } from '../contrats/deroule';

export const SEUIL_PAR_DEFAUT = 0.7;

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
    remediations: remediationsDe(cours),
  };
}

function versEcranDeroule(
  ecranPublic: EcranPublic,
  ecran: Ecran,
  projection: Projection,
): EcranDeroule {
  return {
    ...ecranPublic,
    notes: ecran.notes,
    diffusion: ecran.diffusion,
    seuil: seuilDe(ecran),
    corriges: corrigesDe(ecran, projection.tirage),
    questions: questionsDe(ecran).map((question) =>
      questionDuDeroule(question, ecran, projection),
    ),
    corrigeEcran: corrigeDeLEcran(ecran),
    guide: ecran.guide,
    ...(ecran.renvoi === undefined ? {} : { renvoi: ecran.renvoi }),
  };
}

function seuilDe(ecran: Ecran): number | null {
  if (
    ecran.brique === 'fp-numeric' ||
    ecran.brique === 'fp-vote' ||
    ecran.brique === 'fp-recall'
  ) {
    return ecran.seuil ?? SEUIL_PAR_DEFAUT;
  }
  return null;
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
        confusions: corrige.confusions.map((id) => confusionPresentateur(id)),
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

function corrigeDeLEcran(ecran: Ecran): CorrigeEcranPresentateur | null {
  switch (ecran.brique) {
    case 'fp-cardsort':
    case 'fp-sheet':
    case 'fp-table-build':
      return corrigeDeProduction(ecran.production.corrige);
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
    default:
      return null;
  }
}

function corrigeDeProduction(
  corrige: Extract<
    Ecran,
    { readonly brique: 'fp-sheet' }
  >['production']['corrige'],
): CorrigeEcranPresentateur | null {
  switch (corrige.type) {
    case 'feuille':
      return {
        type: 'feuille',
        attendus: corrige.attendus.map((attendu) => ({
          reference: attendu.reference,
          formuleReference: attendu.formuleReference,
          valeur: attendu.valeur,
          tolerance: attendu.tolerance,
          forme: attendu.forme,
        })),
        seuilReussite: corrige.seuilReussite,
      };
    case 'tableau':
      return {
        type: 'tableau',
        attendus: corrige.attendus.map(({ rang, cle, valeur }) => ({
          rang,
          cle,
          valeur,
        })),
        tolerance: corrige.tolerance,
        seuilReussite: corrige.seuilReussite,
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
        seuilReussite: corrige.seuilReussite,
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

function remediationsDe(cours: Cours): Readonly<Record<string, string>> {
  const entrees = Object.entries(cours.remediations).filter(
    (entree): entree is [string, string] => entree[1] !== undefined,
  );
  return Object.fromEntries(entrees);
}
