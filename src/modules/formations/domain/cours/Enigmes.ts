import { matchesSolution } from '../GradingCore';
import type { Cours, Ecran, QuestionProduction } from '../contrats/cours';
import type { ProgressionEnigme } from '../contrats/resultats';
import type { ConfusionId } from './banque/confusions';
import type { CorrigeEnigme } from './Corrige';
import { lireNombreSaisi } from './SaisieNumerique';

const TENTATIVES_MAX_PAR_ENIGME = 10;

export interface EcranDEnigmes {
  readonly ecran: Extract<Ecran, { readonly brique: 'fp-escape' }>;
  readonly rang: number;
  readonly tentativesMax: number;
}

export interface EnigmeVisee {
  readonly question: QuestionProduction;
  readonly corrige: CorrigeEnigme;
  readonly rangEnigme: number;
}

export interface ProgressionDEnigme {
  readonly enigmeId: string;
  readonly tentatives: number;
  readonly resolue: boolean;
}

export interface VerdictDEnigme {
  readonly correcte: boolean;
  readonly valeurNormalisee: number | null;
  readonly confusion: ConfusionId | null;
}

export function ecranDEnigmes(
  cours: Cours,
  parcoursId: string,
): EcranDEnigmes | null {
  for (const [rang, ecran] of cours.ecrans.entries()) {
    if (
      ecran.brique === 'fp-escape' &&
      ecran.proprietes.parcours.id === parcoursId
    ) {
      return {
        ecran,
        rang,
        tentativesMax: Math.min(
          ecran.proprietes.parcours.tentativesMax,
          TENTATIVES_MAX_PAR_ENIGME,
        ),
      };
    }
  }
  return null;
}

export function enigmeVisee(
  cible: EcranDEnigmes,
  enigmeId: string,
): EnigmeVisee | null {
  const rangEnigme = cible.ecran.proprietes.parcours.enigmes.findIndex(
    (enigme) => enigme.id === enigmeId,
  );
  const question = cible.ecran.enigmes.find(
    (candidate) => candidate.id === enigmeId,
  );
  if (rangEnigme < 0 || question === undefined) {
    return null;
  }
  if (question.corrige.type !== 'enigme') {
    return null;
  }
  return { question, corrige: question.corrige, rangEnigme };
}

export function enigmeOuverte(
  cible: EcranDEnigmes,
  progression: readonly ProgressionDEnigme[],
  rangEnigme: number,
): boolean {
  if (rangEnigme === 0) {
    return true;
  }
  const precedente = cible.ecran.proprietes.parcours.enigmes[rangEnigme - 1];
  const etat = progression.find((entree) => entree.enigmeId === precedente.id);
  if (etat === undefined) {
    return false;
  }
  return etat.resolue || etat.tentatives >= cible.tentativesMax;
}

function texteNormalise(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function corrigerEnigme(
  corrige: CorrigeEnigme,
  saisie: string,
): VerdictDEnigme {
  if (corrige.solution.type === 'texte') {
    const attendu = corrige.solution.acceptees.map(texteNormalise);
    return {
      correcte: attendu.includes(texteNormalise(saisie)),
      valeurNormalisee: null,
      confusion: null,
    };
  }
  const valeur = lireNombreSaisi(saisie);
  if (valeur === null) {
    return { correcte: false, valeurNormalisee: null, confusion: null };
  }
  const tolerance = corrige.solution.tolerance;
  if (matchesSolution(valeur, corrige.solution.valeur, tolerance)) {
    return { correcte: true, valeurNormalisee: valeur, confusion: null };
  }
  const piege = corrige.pieges.find((candidat) =>
    matchesSolution(valeur, candidat.valeur, tolerance),
  );
  return {
    correcte: false,
    valeurNormalisee: valeur,
    confusion: piege?.confusion ?? null,
  };
}

interface CumulDEnigme {
  ouvertes: number;
  resolues: number;
  tentatives: number;
  epuisees: number;
}

export function agregerEnigmes(
  progressions: readonly {
    readonly parcoursId: string;
    readonly enigmeId: string;
    readonly tentatives: number;
    readonly resolueLe: Date | null;
  }[],
  plafond: number = TENTATIVES_MAX_PAR_ENIGME,
): readonly ProgressionEnigme[] {
  const cumuls = new Map<string, CumulDEnigme>();
  for (const ligne of progressions) {
    const cle = `${ligne.parcoursId}|${ligne.enigmeId}`;
    const cumul = cumuls.get(cle) ?? {
      ouvertes: 0,
      resolues: 0,
      tentatives: 0,
      epuisees: 0,
    };
    cumuls.set(cle, {
      ouvertes: cumul.ouvertes + 1,
      resolues: cumul.resolues + (ligne.resolueLe === null ? 0 : 1),
      tentatives: cumul.tentatives + ligne.tentatives,
      epuisees:
        cumul.epuisees +
        (ligne.resolueLe === null && ligne.tentatives >= plafond ? 1 : 0),
    });
  }
  return [...cumuls.entries()].map(([cle, cumul]) => {
    const [parcoursId, enigmeId] = cle.split('|');
    return {
      parcoursId,
      enigmeId,
      ouvertes: cumul.ouvertes,
      resolues: cumul.resolues,
      tentativesMoyennes: cumul.tentatives / cumul.ouvertes,
      epuisees: cumul.epuisees,
    };
  });
}
