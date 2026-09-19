import type { Tolerance } from '../GradingCore';
import type { Tirage } from './Aleatoire';
import type { ConceptId } from './banque/concepts';
import type { ConfusionId } from './banque/confusions';
import type { RegleStructure } from './StructureCours';

export type AuMoinsUn<T> = readonly [T, ...T[]];

export type BriqueExposition =
  | 'fp-quote'
  | 'fp-story'
  | 'fp-pro'
  | 'fp-worked'
  | 'fp-concept4'
  | 'fp-plot'
  | 'fp-challenge'
  | 'fp-cardsort';

const BRIQUES_QUESTION = [
  'fp-numeric',
  'fp-vote',
  'fp-recall',
  'fp-exit',
] as const;
export type BriqueQuestion = (typeof BRIQUES_QUESTION)[number];

export type Modalite = 'solo' | 'binome' | 'groupe' | 'classe';
export type RegimeVerrou = 'ouvert' | 'focus' | 'examen';

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
}

export interface QuestionVote extends QuestionCommune {
  readonly type: 'vote';
  readonly generer: (tirage: Tirage) => QuestionVoteTiree;
}

export type Question = QuestionNumerique | QuestionVote;

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

interface ProprietesParBrique {
  readonly 'fp-quote': {
    readonly texte: string;
    readonly auteur: string | null;
    readonly source: string | null;
  };
  readonly 'fp-story': {
    readonly titre: string;
    readonly paragraphes: AuMoinsUn<string>;
    readonly visuel?: {
      readonly src: string;
      readonly alt: string;
      readonly legende?: string;
    };
    readonly video?: {
      readonly src: string;
      readonly type: 'video/webm' | 'video/mp4';
      readonly titre: string;
      readonly poster?: string;
      readonly transcript: string;
      readonly source: string;
      readonly licence: string;
    };
  };
  readonly 'fp-pro': {
    readonly metier: string;
    readonly situation: string;
    readonly geste: string;
    readonly consequence: string | null;
  };
  readonly 'fp-worked': {
    readonly enonce: string;
    readonly etapes: AuMoinsUn<{
      readonly id: string;
      readonly intitule: string;
      readonly raisonnement: string;
      readonly invite: string;
    }>;
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
  readonly 'fp-challenge': {
    readonly id: string;
    readonly enonce: string;
    readonly invite: string;
    readonly strategies: AuMoinsUn<{
      readonly id: string;
      readonly libelle: string;
    }>;
  };
  readonly 'fp-cardsort': {
    readonly id: string;
    readonly intitule: string;
    readonly cartes: AuMoinsUn<{
      readonly id: string;
      readonly libelle: string;
    }>;
    readonly categories: AuMoinsUn<{
      readonly id: string;
      readonly libelle: string;
    }>;
  };
}

interface EcranCommun {
  readonly id: string;
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly notes: string;
  readonly modalite?: Modalite;
  readonly question?: Question;
  readonly guide?: GuideFormateur;
}

export interface GuideFormateur {
  readonly aDire?: string;
  readonly question?: string;
  readonly reponse?: string;
  readonly calcul?: string;
  readonly relance?: string;
  readonly transition?: string;
}

type EcranExposition = {
  [B in BriqueExposition]: EcranCommun & {
    readonly brique: B;
    readonly proprietes: ProprietesParBrique[B];
  };
}[BriqueExposition];

export type EcranQuestion =
  | (EcranCommun & {
      readonly brique: 'fp-numeric';
      readonly question: QuestionNumerique;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-vote' | 'fp-recall';
      readonly question: QuestionVote;
      readonly seuil?: number;
    })
  | (EcranCommun & {
      readonly brique: 'fp-exit';
      readonly question: QuestionVote;
      readonly invite: string;
    });

export interface EcranQuestionnaire extends EcranCommun {
  readonly brique: 'questionnaire';
  readonly regime: RegimeVerrou;
  readonly questions: AuMoinsUn<Question>;
}

export type Ecran = EcranExposition | EcranQuestion | EcranQuestionnaire;

export interface Derogation {
  readonly regle: RegleStructure;
  readonly ecran?: string;
  readonly raison: string;
}

export interface Cours {
  readonly slug: string;
  readonly titre: string;
  readonly niveau: string;
  readonly dureeMinutes: number;
  readonly concepts: AuMoinsUn<ConceptId>;
  readonly ecrans: AuMoinsUn<Ecran>;
  readonly remediations: Readonly<Partial<Record<ConfusionId, string>>>;
  readonly derogations: readonly Derogation[];
}

export function estInteractif(ecran: Ecran): boolean {
  return (
    ecran.brique === 'questionnaire' ||
    ecran.brique === 'fp-challenge' ||
    ecran.brique === 'fp-cardsort' ||
    (BRIQUES_QUESTION as readonly string[]).includes(ecran.brique) ||
    ecran.question !== undefined
  );
}

export function questionsDe(ecran: Ecran): readonly Question[] {
  if (ecran.brique === 'questionnaire') {
    return ecran.questions;
  }
  if (ecran.question !== undefined) {
    return [ecran.question];
  }
  return [];
}

export function questionsDuCours(cours: Cours): readonly Question[] {
  return cours.ecrans.flatMap((ecran) => questionsDe(ecran));
}
