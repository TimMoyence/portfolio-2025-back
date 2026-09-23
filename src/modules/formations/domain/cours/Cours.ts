import type { Tolerance } from '../GradingCore';
import type {
  Cours as CoursDuContrat,
  Ecran as EcranDuContrat,
  Question as QuestionDuContrat,
} from '../contrats/cours';
import type { Tirage } from './Aleatoire';
import type { ConceptId } from './banque/concepts';
import type { ConfusionId } from './banque/confusions';
import type { ProprietesRecit } from './ProprietesStockees';

export type AuMoinsUn<T> = readonly [T, ...T[]];

export type Modalite = 'solo' | 'binome' | 'groupe' | 'classe';
export type RegimeVerrou = 'ouvert' | 'focus' | 'examen';

export interface QuestionLibre {
  readonly id: string;
  readonly question: string;
  readonly placeholder?: string;
}

interface PiegeNumerique<D> {
  readonly confusion: ConfusionId;
  readonly valeur: (donnees: D) => number;
}

interface PiegeVote<D> {
  readonly confusion: ConfusionId;
  readonly libelle: (donnees: D) => string;
  readonly optionId?: (donnees: D) => string;
}

interface DefinitionCommune<D> {
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly donnees: (tirage: Tirage) => D;
  readonly enonce: (donnees: D) => string;
}

export interface DefinitionNumerique<D> extends DefinitionCommune<D> {
  readonly unite: string | null;
  readonly solution: (donnees: D) => number;
  readonly tolerance: Tolerance;
  readonly pieges: AuMoinsUn<PiegeNumerique<D>>;
}

export interface DefinitionVote<D> extends DefinitionCommune<D> {
  readonly bonne: (donnees: D) => string;
  readonly bonneLibelle?: (donnees: D) => string;
  readonly pieges: AuMoinsUn<PiegeVote<D>>;
}

interface QuestionNumeriqueTiree {
  readonly type: 'numeric';
  readonly enonce: string;
  readonly unite: string | null;
  readonly solution: number;
  readonly pieges: readonly {
    readonly confusion: ConfusionId;
    readonly valeur: number;
  }[];
}

export interface QuestionVoteTiree {
  readonly type: 'vote';
  readonly enonce: string;
  readonly bonne: string;
  readonly bonneLibelle?: string;
  readonly pieges: readonly {
    readonly confusion: ConfusionId;
    readonly libelle: string;
    readonly optionId?: string;
  }[];
}

interface QuestionCommune {
  readonly id: string;
  readonly concept: ConceptId;
  readonly noteCompte: boolean;
  readonly confusions: AuMoinsUn<ConfusionId>;
}

export interface QuestionNumerique extends QuestionCommune {
  readonly type: 'numeric';
  readonly tolerance: Tolerance;
  readonly generer: (tirage: Tirage) => QuestionNumeriqueTiree;
  readonly formePubliee?: string;
}

export interface QuestionVote extends QuestionCommune {
  readonly type: 'vote';
  readonly generer: (tirage: Tirage) => QuestionVoteTiree;
  readonly segments?: readonly string[];
}

function confusionsDe<P extends { readonly confusion: ConfusionId }>(
  pieges: AuMoinsUn<P>,
): AuMoinsUn<ConfusionId> {
  return pieges.map(
    (piege) => piege.confusion,
  ) as unknown as AuMoinsUn<ConfusionId>;
}

export function questionNumerique<D>(
  definition: DefinitionNumerique<D>,
): QuestionNumerique {
  return {
    id: definition.id,
    type: 'numeric',
    concept: definition.concept,
    noteCompte: definition.noteCompte,
    tolerance: definition.tolerance,
    confusions: confusionsDe(definition.pieges),
    generer: (tirage) => {
      const donnees = definition.donnees(tirage);
      return {
        type: 'numeric',
        enonce: definition.enonce(donnees),
        unite: definition.unite,
        solution: definition.solution(donnees),
        pieges: definition.pieges.map((piege) => ({
          confusion: piege.confusion,
          valeur: piege.valeur(donnees),
        })),
      };
    },
  };
}

export function questionVote<D>(definition: DefinitionVote<D>): QuestionVote {
  return {
    id: definition.id,
    type: 'vote',
    concept: definition.concept,
    noteCompte: definition.noteCompte,
    confusions: confusionsDe(definition.pieges),
    generer: (tirage) => {
      const donnees = definition.donnees(tirage);
      return {
        type: 'vote',
        enonce: definition.enonce(donnees),
        bonne: definition.bonne(donnees),
        bonneLibelle: definition.bonneLibelle?.(donnees),
        pieges: definition.pieges.map((piege) => ({
          confusion: piege.confusion,
          libelle: piege.libelle(donnees),
          optionId: piege.optionId?.(donnees),
        })),
      };
    },
  };
}

interface ParametreCurseur {
  readonly cle: string;
  readonly libelle: string;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly defaut: number;
}

interface ProprietesDesExpositionsHistoriques {
  readonly 'fp-quote': {
    readonly texte: string;
    readonly auteur: string | null;
    readonly source: string | null;
  };
  readonly 'fp-story': ProprietesRecit;
  readonly 'fp-pro': {
    readonly metier: string;
    readonly situation: string;
    readonly geste: string;
    readonly consequence: string | null;
    readonly questionsLibres?: AuMoinsUn<QuestionLibre>;
  };
  readonly 'fp-concept4': {
    readonly parametres: AuMoinsUn<ParametreCurseur>;
    readonly formuleLatexSimplifie: string;
    readonly calcul: string;
    readonly phrase: string;
  };
  readonly 'fp-plot': {
    readonly titre?: string;
    readonly source?: string;
    readonly abscisse: {
      readonly libelle: string;
      readonly min: number;
      readonly max: number;
    };
    readonly ordonnee: string;
    readonly parametres: readonly ParametreCurseur[];
    readonly series: AuMoinsUn<{
      readonly id: string;
      readonly libelle: string;
      readonly trait: 'plein' | 'tirets';
      readonly calcul: string;
    }>;
  };
}

interface GuideFormateur {
  readonly aDire?: string;
  readonly question?: string;
  readonly reponse?: string;
  readonly calcul?: string;
  readonly relance?: string;
  readonly transition?: string;
}

interface SocleHistorique {
  readonly id: string;
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly notes: string;
  readonly modalite?: Modalite;
  readonly question?: QuestionVote;
  readonly guide?: GuideFormateur;
  readonly renvoi?: string;
}

type BriqueDExpositionHistorique = keyof ProprietesDesExpositionsHistoriques;

export type Ecran = {
  [B in BriqueDExpositionHistorique]: SocleHistorique & {
    readonly brique: B;
    readonly proprietes: ProprietesDesExpositionsHistoriques[B];
  };
}[BriqueDExpositionHistorique];

export interface Cours {
  readonly slug: string;
  readonly titre: string;
  readonly niveau: string;
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly ecrans: AuMoinsUn<Ecran>;
  readonly remediations: Readonly<Partial<Record<ConfusionId, string>>>;
}

function recitInteractif(
  ecran: Extract<EcranDuContrat, { readonly brique: 'fp-story' }>,
): boolean {
  const presentation = ecran.proprietes.presentation;
  return (
    ecran.question !== undefined ||
    (presentation?.version === 2 && presentation.renderer === 'reflection')
  );
}

export function estInteractif(ecran: EcranDuContrat): boolean {
  switch (ecran.brique) {
    case 'fp-story':
      return recitInteractif(ecran);
    case 'fp-pro':
      return (
        ecran.question !== undefined ||
        ecran.proprietes.questionsLibres !== undefined
      );
    case 'fp-worked':
      return ecran.proprietes.pilote !== true;
    case 'fp-quote':
    case 'fp-concept4':
    case 'fp-plot':
    case 'fp-pulse':
      return ecran.question !== undefined;
    default:
      return true;
  }
}

export function questionsDe(
  ecran: EcranDuContrat,
): readonly QuestionDuContrat[] {
  switch (ecran.brique) {
    case 'questionnaire':
      return ecran.questions;
    case 'fp-vote':
      return ecran.questionJumelle === undefined
        ? [ecran.question]
        : [ecran.question, ecran.questionJumelle];
    case 'fp-numeric':
    case 'fp-recall':
    case 'fp-exit':
      return [ecran.question];
    case 'fp-cardsort':
    case 'fp-sheet':
    case 'fp-table-build':
      return [ecran.production];
    case 'fp-escape':
      return ecran.enigmes;
    case 'fp-spaced':
      return ecran.banque;
    default:
      return ecran.question === undefined ? [] : [ecran.question];
  }
}

export function questionsDuCours(
  cours: CoursDuContrat,
): readonly QuestionDuContrat[] {
  return cours.ecrans.flatMap((ecran) => questionsDe(ecran));
}
