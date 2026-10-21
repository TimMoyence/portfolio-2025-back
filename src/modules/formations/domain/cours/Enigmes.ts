import { lireNombreSaisiAvecUnite } from './Formule';
import { sansDiacritiques } from '../../../../common/domain/texte/sans-diacritiques';
import { gradeAnswer } from '../AnswerGrading';
import type { Cours, Ecran, QuestionProduction } from '../contrats/cours';
import type { EtatDesEnigmes, EtatEnigme } from '../contrats/pilotage';
import type { ProgressionEnigme } from '../contrats/resultats';
import type { ConfusionId } from './banque/confusions';
import type { CorrigeEnigme } from './Corrige';
import { piegesDuCorrige } from './Corrige';

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

export function progressionDesLignes(
  lignes: readonly {
    readonly enigmeId: string;
    readonly tentatives: number;
    readonly resolueLe: Date | null;
  }[],
): ProgressionDEnigme[] {
  return lignes.map((ligne) => ({
    enigmeId: ligne.enigmeId,
    tentatives: ligne.tentatives,
    resolue: ligne.resolueLe !== null,
  }));
}

function etatDeLEnigme(
  cible: EcranDEnigmes,
  progression: readonly ProgressionDEnigme[],
  rang: number,
  suivie: ProgressionDEnigme | undefined,
  restantes: number,
): EtatEnigme {
  if (suivie?.resolue === true) {
    return 'resolue';
  }
  if (restantes === 0) {
    return 'epuisee';
  }
  return enigmeOuverte(cible, progression, rang) ? 'ouverte' : 'verrouillee';
}

export function etatDesEnigmes(
  cible: EcranDEnigmes,
  progression: readonly ProgressionDEnigme[],
): EtatDesEnigmes {
  const enigmes = cible.ecran.proprietes.parcours.enigmes;
  const etats = enigmes.map(({ id }, rang) => {
    const suivie = progression.find(({ enigmeId }) => enigmeId === id);
    const restantes = tentativesRestantes(cible, suivie?.tentatives ?? 0);
    return [
      id,
      {
        etat: etatDeLEnigme(cible, progression, rang, suivie, restantes),
        tentativesRestantes: restantes,
      },
    ] as const;
  });
  const ouverte = etats.find(([, { etat }]) => etat === 'ouverte');
  return {
    etats: Object.fromEntries(etats),
    enigmeOuverte: ouverte?.[0] ?? null,
    acheve: enigmes.length > 0 && ouverte === undefined,
  };
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
  const verdict = gradeAnswer(
    valeur,
    {
      valeur: corrige.solution.valeur,
      pieges: piegesDuCorrige(corrige.pieges),
    },
    corrige.solution.tolerance,
  );
  return {
    correcte: verdict.correcte,
    valeurNormalisee: valeur,
    confusion: verdict.misconception,
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
