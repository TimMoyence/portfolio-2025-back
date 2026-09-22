import { z } from 'zod';
import {
  DIFFUSIONS,
  type Cours,
  type Diffusion,
  type Ecran,
  type MediaCatalogue,
  type QuestionProduction,
} from '../contrats/cours';
import type { ConfusionId } from './banque/confusions';
import { confusionsDuCorrige } from './CorrigeStocke';
import {
  questionsDe,
  questionVote,
  type AuMoinsUn,
  type Modalite,
  type QuestionVote,
} from './Cours';
import {
  PROPRIETES_STOCKEES,
  type ProductionStockee,
  type QuizNote,
} from './ProprietesStockees';
import { questionDeNumerique, questionDeVote } from './QuestionStockee';
import { auMoinsUn, concepts, confusion, media, texte } from './SchemasCommuns';

const LONGUEUR_MAX_IDENTIFIANT_D_ECRAN = 120;
const LONGUEUR_MAX_TITRE = 120;
const PREMIERE_VERSION_TITREE = 3;
const SLUG_B2_01 = 'b2-01-traitement-information-chiffree';
const DIFFUSION_HISTORIQUE: Diffusion = 'catalogue';

export class ContenuDeCoursInvalideError extends Error {
  constructor(slug: string, version: number, detail: string) {
    super(`Contenu du cours ${slug} v${version} invalide en base :\n${detail}`);
    this.name = 'ContenuDeCoursInvalideError';
  }
}

export interface EcranDeCoursBrut {
  readonly screenId: string;
  readonly brique: string;
  readonly titre?: string | null;
  readonly diffusion?: string;
  readonly dureeMinutes: number;
  readonly concepts: readonly string[];
  readonly notes: string;
  readonly proprietes: Readonly<Record<string, unknown>>;
}

export interface ContenuDeCoursBrut {
  readonly slug: string;
  readonly version: number;
  readonly titre: string;
  readonly niveau: string;
  readonly dureeMinutes: number;
  readonly concepts: readonly string[];
  readonly remediations?: Readonly<Record<string, unknown>>;
  readonly medias?: readonly unknown[];
  readonly ecrans: readonly EcranDeCoursBrut[];
}

type BriqueStockee = keyof typeof PROPRIETES_STOCKEES;

const duree = z.number().int().positive();

function schemaDEcran<B extends BriqueStockee>(brique: B) {
  return z
    .object({
      screenId: texte.max(LONGUEUR_MAX_IDENTIFIANT_D_ECRAN),
      brique: z.literal(brique),
      titre: texte.max(LONGUEUR_MAX_TITRE).nullable().optional(),
      diffusion: z.enum(DIFFUSIONS).optional(),
      dureeMinutes: duree,
      concepts,
      notes: z.string(),
      proprietes: PROPRIETES_STOCKEES[brique],
    })
    .strict();
}

const ecranStocke = z
  .discriminatedUnion('brique', [
    schemaDEcran('fp-quote'),
    schemaDEcran('fp-story'),
    schemaDEcran('fp-pro'),
    schemaDEcran('fp-worked'),
    schemaDEcran('fp-concept4'),
    schemaDEcran('fp-plot'),
    schemaDEcran('fp-pulse'),
    schemaDEcran('fp-challenge'),
    schemaDEcran('fp-cardsort'),
    schemaDEcran('fp-sheet'),
    schemaDEcran('fp-table-build'),
    schemaDEcran('fp-escape'),
    schemaDEcran('fp-spaced'),
    schemaDEcran('fp-numeric'),
    schemaDEcran('fp-vote'),
    schemaDEcran('fp-recall'),
    schemaDEcran('fp-exit'),
    schemaDEcran('questionnaire'),
  ])
  .superRefine((ecran, contexte) => {
    if (ecran.brique !== 'fp-story') {
      return;
    }
    const presentation = ecran.proprietes.presentation;
    if (
      presentation !== undefined &&
      presentation.screenId !== ecran.screenId
    ) {
      contexte.addIssue({
        code: 'custom',
        path: ['proprietes', 'presentation', 'screenId'],
        message: `présentation rattachée à ${presentation.screenId} et non à ${ecran.screenId}`,
      });
    }
  });

type EcranStocke = z.output<typeof ecranStocke>;

const mediaCatalogue = z
  .object({
    id: texte,
    chemins: auMoinsUn(media),
    pageSource: z.url({ protocol: /^https$/ }).nullable(),
    auteur: texte,
    date: texte,
    licence: texte,
    attribution: texte,
  })
  .strict() satisfies z.ZodType<MediaCatalogue>;

function estGraphiqueSansDescription(ecran: EcranStocke): boolean {
  if (ecran.brique !== 'fp-story') {
    return false;
  }
  const presentation = ecran.proprietes.presentation;
  return (
    presentation?.version === 2 &&
    presentation.renderer === 'chart' &&
    presentation.props.description === undefined
  );
}

function controlerChampsDeLaV3(
  ecrans: readonly EcranStocke[],
  contexte: z.RefinementCtx,
): void {
  ecrans.forEach((ecran, rang) => {
    const signaler = (chemin: readonly string[], message: string): void => {
      contexte.addIssue({
        code: 'custom',
        path: ['ecrans', rang, ...chemin],
        message,
      });
    };
    if (ecran.titre === undefined || ecran.titre === null) {
      signaler(['titre'], 'titre public obligatoire à partir de la version 3');
    }
    if (ecran.diffusion === undefined) {
      signaler(
        ['diffusion'],
        'diffusion explicite obligatoire à partir de la version 3',
      );
    }
    if (estGraphiqueSansDescription(ecran)) {
      signaler(
        ['proprietes', 'presentation', 'props', 'description'],
        'description textuelle obligatoire pour un graphique à partir de la version 3',
      );
    }
  });
}

function contratPublicActif(
  slug: string,
  version: number,
  ecrans: readonly EcranStocke[],
): boolean {
  return (
    version >= PREMIERE_VERSION_TITREE ||
    (slug === SLUG_B2_01 &&
      version === 1 &&
      ecrans.some(
        (ecran) =>
          (ecran.titre !== undefined && ecran.titre !== null) ||
          ecran.diffusion === 'seance',
      ))
  );
}

function doublonsDe(valeurs: readonly string[]): readonly string[] {
  return [
    ...new Set(
      valeurs.filter((valeur, rang) => valeurs.indexOf(valeur) !== rang),
    ),
  ];
}

export const coursStocke = z
  .object({
    slug: texte,
    version: duree,
    titre: texte,
    niveau: texte,
    dureeMinutes: duree,
    concepts,
    remediations: z.partialRecord(confusion, texte).optional(),
    medias: z.array(mediaCatalogue).optional(),
    ecrans: auMoinsUn(ecranStocke),
  })
  .strict()
  .superRefine((cours, contexte) => {
    if (contratPublicActif(cours.slug, cours.version, cours.ecrans)) {
      controlerChampsDeLaV3(cours.ecrans, contexte);
    }
    const doublons = doublonsDe(cours.ecrans.map((ecran) => ecran.screenId));
    if (doublons.length > 0) {
      contexte.addIssue({
        code: 'custom',
        path: ['ecrans'],
        message: `écrans en double : ${doublons.join(', ')}`,
      });
    }
  });

function mapperAuMoinsUn<T, U>(
  liste: AuMoinsUn<T>,
  transformer: (element: T, rang: number) => U,
): AuMoinsUn<U> {
  const [premier, ...suite] = liste;
  return [
    transformer(premier, 0),
    ...suite.map((element, rang) => transformer(element, rang + 1)),
  ];
}

function questionDuQuiz(quiz: QuizNote): QuestionVote {
  const rangsDesPieges = quiz.options
    .map((_, rangOption) => rangOption)
    .filter((rangOption) => rangOption !== quiz.correctIndex);
  return questionVote({
    id: quiz.id,
    concept: quiz.concept,
    noteCompte: quiz.noteCompte,
    donnees: () => undefined,
    enonce: () => quiz.question,
    bonne: () => quiz.optionIds[quiz.correctIndex],
    bonneLibelle: () => quiz.options[quiz.correctIndex],
    pieges: mapperAuMoinsUn(quiz.confusions, (confusionDuPiege, rangPiege) => ({
      confusion: confusionDuPiege,
      libelle: () => quiz.options[rangsDesPieges[rangPiege]],
      optionId: () => quiz.optionIds[rangsDesPieges[rangPiege]],
    })),
  });
}

function versProduction(stockee: ProductionStockee): QuestionProduction {
  const [premiere, ...suite] = confusionsDuCorrige(stockee.corrige);
  const confusions: AuMoinsUn<ConfusionId> = [premiere, ...suite];
  return {
    id: stockee.id,
    type: stockee.type,
    concept: stockee.concept,
    noteCompte: stockee.noteCompte,
    confusions,
    corrige: stockee.corrige,
  };
}

interface SocleDEcran {
  readonly id: string;
  readonly titre: string | null;
  readonly diffusion: Diffusion;
  readonly dureeMinutes: number;
  readonly concepts: Ecran['concepts'];
  readonly notes: string;
  readonly modalite?: Modalite;
  readonly guide?: GuideFormateur;
}

type GuideFormateur = NonNullable<Ecran['guide']>;

interface Communes {
  readonly guide?: GuideFormateur;
  readonly modalite?: Modalite;
}

const CLES_COMMUNES: readonly string[] = ['guide', 'modalite'];

type BriqueDExposition =
  | 'fp-quote'
  | 'fp-pro'
  | 'fp-concept4'
  | 'fp-plot'
  | 'fp-worked'
  | 'fp-pulse';

type BriqueDeProductionUnique = 'fp-cardsort' | 'fp-sheet' | 'fp-table-build';

function socleDe(
  ecran: EcranStocke,
  contratPublic: boolean,
  { modalite, guide }: Communes,
): SocleDEcran {
  return {
    id: ecran.screenId,
    titre: contratPublic ? (ecran.titre ?? null) : null,
    diffusion: contratPublic
      ? (ecran.diffusion ?? DIFFUSION_HISTORIQUE)
      : DIFFUSION_HISTORIQUE,
    dureeMinutes: ecran.dureeMinutes,
    concepts: ecran.concepts,
    notes: ecran.notes,
    ...(modalite === undefined ? {} : { modalite }),
    ...(guide === undefined ? {} : { guide }),
  };
}

function versExposition(
  ecran: Extract<EcranStocke, { readonly brique: BriqueDExposition }>,
  socle: SocleDEcran,
): Ecran {
  const proprietes = Object.fromEntries(
    Object.entries(ecran.proprietes).filter(
      ([cle]) => !CLES_COMMUNES.includes(cle),
    ),
  );
  return { ...socle, brique: ecran.brique, proprietes } as Ecran;
}

function versProductionUnique(
  ecran: Extract<EcranStocke, { readonly brique: BriqueDeProductionUnique }>,
  socle: SocleDEcran,
): Ecran {
  return {
    ...socle,
    brique: ecran.brique,
    proprietes: { plan: ecran.proprietes.plan },
    production: versProduction(ecran.proprietes.questions[0]),
  } as Ecran;
}

function seuilDe(seuil: number | undefined): { readonly seuil?: number } {
  return seuil === undefined ? {} : { seuil };
}

function versEcranDeRecit(
  ecran: Extract<EcranStocke, { readonly brique: 'fp-story' }>,
  contratPublic: boolean,
): Ecran {
  const { modalite, ...proprietes } = ecran.proprietes;
  const { interaction, guide } = proprietes;
  return {
    ...socleDe(ecran, contratPublic, { modalite }),
    brique: ecran.brique,
    proprietes,
    question:
      interaction === undefined ? undefined : questionDuQuiz(interaction),
    guide,
  };
}

function versEcranDeVote(
  ecran: Extract<EcranStocke, { readonly brique: 'fp-vote' }>,
  socle: SocleDEcran,
): Ecran {
  const [principale, jumelle] = ecran.proprietes.questions;
  const revelation = ecran.proprietes.corrige;
  return {
    ...socle,
    brique: ecran.brique,
    question: questionDeVote(principale),
    ...(jumelle === undefined
      ? {}
      : { questionJumelle: questionDeVote(jumelle) }),
    ...(revelation === undefined ? {} : { revelation }),
    ...seuilDe(ecran.proprietes.seuil),
  };
}

function versEcranDeQuestionnaire(
  ecran: Extract<EcranStocke, { readonly brique: 'questionnaire' }>,
  socle: SocleDEcran,
): Ecran {
  return {
    ...socle,
    brique: ecran.brique,
    intitule: ecran.proprietes.intitule,
    consigne: ecran.proprietes.consigne,
    regime: ecran.proprietes.regime,
    ordre: ecran.proprietes.ordre,
    questions: mapperAuMoinsUn(ecran.proprietes.questions, (question) =>
      question.type === 'vote'
        ? questionDeVote(question)
        : questionDeNumerique(question),
    ),
  };
}

function versEcranDeRappel(
  ecran: Extract<EcranStocke, { readonly brique: 'fp-spaced' }>,
  socle: SocleDEcran,
): Ecran {
  return {
    ...socle,
    brique: ecran.brique,
    proprietes: { rappel: ecran.proprietes.rappel },
    banque: mapperAuMoinsUn(ecran.proprietes.banque.questions, questionDeVote),
    obligatoires: ecran.proprietes.banque.obligatoires,
  };
}

function versEcran(ecran: EcranStocke, contratPublic: boolean): Ecran {
  if (ecran.brique === 'fp-story') {
    return versEcranDeRecit(ecran, contratPublic);
  }
  const socle = socleDe(ecran, contratPublic, ecran.proprietes);
  switch (ecran.brique) {
    case 'fp-quote':
    case 'fp-pro':
    case 'fp-concept4':
    case 'fp-plot':
    case 'fp-worked':
    case 'fp-pulse':
      return versExposition(ecran, socle);
    case 'fp-challenge':
      return {
        ...socle,
        brique: ecran.brique,
        proprietes: { probleme: ecran.proprietes.probleme },
        defi: ecran.proprietes.corrige,
      };
    case 'fp-cardsort':
    case 'fp-sheet':
    case 'fp-table-build':
      return versProductionUnique(ecran, socle);
    case 'fp-escape':
      return {
        ...socle,
        brique: ecran.brique,
        proprietes: { parcours: ecran.proprietes.parcours },
        enigmes: mapperAuMoinsUn(ecran.proprietes.questions, versProduction),
      };
    case 'fp-spaced':
      return versEcranDeRappel(ecran, socle);
    case 'fp-numeric':
      return {
        ...socle,
        brique: ecran.brique,
        question: questionDeNumerique(ecran.proprietes.questions[0]),
        ...seuilDe(ecran.proprietes.seuil),
      };
    case 'fp-vote':
      return versEcranDeVote(ecran, socle);
    case 'fp-recall':
      return {
        ...socle,
        brique: ecran.brique,
        question: questionDeVote(ecran.proprietes.questions[0]),
        delaiMs: ecran.proprietes.delaiMs,
        ...seuilDe(ecran.proprietes.seuil),
      };
    case 'fp-exit':
      return {
        ...socle,
        brique: ecran.brique,
        question: questionDeVote(ecran.proprietes.questions[0]),
        invite: ecran.proprietes.invite,
      };
    case 'questionnaire':
      return versEcranDeQuestionnaire(ecran, socle);
    default:
      return ecran satisfies never;
  }
}

export function lireCoursStocke(brut: ContenuDeCoursBrut): Cours {
  const lecture = coursStocke.safeParse(brut);
  if (!lecture.success) {
    throw new ContenuDeCoursInvalideError(
      brut.slug,
      brut.version,
      z.prettifyError(lecture.error),
    );
  }
  const stocke = lecture.data;
  const contratPublic = contratPublicActif(
    stocke.slug,
    stocke.version,
    stocke.ecrans,
  );
  const cours: Cours = {
    slug: stocke.slug,
    titre: stocke.titre,
    niveau: stocke.niveau,
    dureeMinutes: stocke.dureeMinutes,
    concepts: stocke.concepts,
    ecrans: mapperAuMoinsUn(stocke.ecrans, (ecran) =>
      versEcran(ecran, contratPublic),
    ),
    remediations: stocke.remediations ?? {},
    medias: stocke.medias ?? [],
  };
  const doublons = doublonsDe(
    cours.ecrans.flatMap((ecran) =>
      questionsDe(ecran).map((question) => question.id),
    ),
  );
  if (doublons.length > 0) {
    throw new ContenuDeCoursInvalideError(
      brut.slug,
      brut.version,
      `questions en double : ${doublons.join(', ')}`,
    );
  }
  return cours;
}
