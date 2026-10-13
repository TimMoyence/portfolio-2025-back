import { lireNombreSaisiAvecUnite } from 'portfolio-2025-partage/formule';
import { sansDiacritiques } from '../../../../common/domain/texte/sans-diacritiques';
import { matchesSolution } from '../GradingCore';
import type { Cours, Ecran, QuestionProduction } from '../contrats/cours';
import type { ProgressionEnigme } from '../contrats/resultats';
import type { ConfusionId } from './banque/confusions';
import type { CorrigeEnigme } from './Corrige';

export const TENTATIVES_MAX_PAR_ENIGME = 10;

interface PlafondDeTentatives {
  readonly tentativesMax: number;
}

const PLAFOND_COMMUN: PlafondDeTentatives = {
  tentativesMax: TENTATIVES_MAX_PAR_ENIGME,
};

export interface EcranDEnigmes extends PlafondDeTentatives {
  readonly ecran: Extract<Ecran, { readonly brique: 'fp-escape' }>;
  readonly rang: number;
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

export function tentativesRestantes(
  plafond: PlafondDeTentatives,
  tentatives: number,
): number {
  return Math.max(0, plafond.tentativesMax - tentatives);
}

function epuisee(plafond: PlafondDeTentatives, tentatives: number): boolean {
  return tentativesRestantes(plafond, tentatives) === 0;
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
  return etat.resolue || epuisee(cible, etat.tentatives);
}

function texteNormalise(valeur: string): string {
  return sansDiacritiques(valeur).trim().toLowerCase();
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
  const valeur = lireNombreSaisiAvecUnite(saisie);
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
  cours: Cours | null,
): readonly ProgressionEnigme[] {
  const plafondDe = (parcoursId: string): PlafondDeTentatives =>
    (cours === null ? null : ecranDEnigmes(cours, parcoursId)) ??
    PLAFOND_COMMUN;
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
        (ligne.resolueLe === null &&
        epuisee(plafondDe(ligne.parcoursId), ligne.tentatives)
          ? 1
          : 0),
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
