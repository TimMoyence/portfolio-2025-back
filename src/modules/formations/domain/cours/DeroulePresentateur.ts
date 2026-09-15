import type { ConfusionId } from './banque/confusions';
import { libelleDeConfusion } from './banque/confusions';
import type { Cours, Ecran } from './Cours';
import { questionsDe } from './Cours';
import type { CoursPublic, EcranPublic } from './CoursPublic';
import type { CorrigeTire } from './Tirage';
import { tirer } from './Tirage';

export const SEUIL_PAR_DEFAUT = 0.7;

export interface CorrigePresentateur {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly confusions: readonly {
    readonly id: string;
    readonly libelle: string;
  }[];
}

export interface EcranDeroule extends EcranPublic {
  readonly notes: string;
  readonly seuil: number | null;
  readonly corriges: readonly CorrigePresentateur[];
}

export interface DerouleCours extends Omit<CoursPublic, 'ecrans'> {
  readonly ecrans: readonly EcranDeroule[];
  readonly remediations: Readonly<Record<string, string>>;
}

export function deroulePresentateur(
  cours: Cours,
  graineReference: number,
): DerouleCours {
  const tirage = tirer(cours, graineReference);
  return {
    ...tirage.sujet,
    ecrans: tirage.sujet.ecrans.map((ecranPublic, index) =>
      versEcranDeroule(ecranPublic, cours.ecrans[index], tirage.corriges),
    ),
    remediations: remediationsDe(cours),
  };
}

function versEcranDeroule(
  ecranPublic: EcranPublic,
  ecran: Ecran,
  corriges: Readonly<Record<string, CorrigeTire>>,
): EcranDeroule {
  return {
    ...ecranPublic,
    notes: ecran.notes,
    seuil: seuilDe(ecran),
    corriges: corrigesDe(ecran, corriges),
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
  corriges: Readonly<Record<string, CorrigeTire>>,
): readonly CorrigePresentateur[] {
  return questionsDe(ecran).map((question) => {
    const corrige = corriges[question.id];
    return {
      questionId: question.id,
      bonneReponse: corrige.bonneReponse,
      confusions: corrige.confusions.map((id) => confusionPresentateur(id)),
    };
  });
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
