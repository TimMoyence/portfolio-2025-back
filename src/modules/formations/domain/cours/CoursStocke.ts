import { z } from 'zod';
import { CONCEPTS } from './banque/concepts';
import { CONFUSIONS, type ConfusionId } from './banque/confusions';
import {
  questionVote,
  type AuMoinsUn,
  type Cours,
  type Ecran,
  type QuestionVote,
} from './Cours';
import { presentationVisuelle } from './VisualPresentation';

export class ContenuDeCoursInvalideError extends Error {
  constructor(slug: string, version: number, detail: string) {
    super(`Contenu du cours ${slug} v${version} invalide en base :\n${detail}`);
    this.name = 'ContenuDeCoursInvalideError';
  }
}

export interface EcranDeCoursBrut {
  readonly screenId: string;
  readonly brique: string;
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
  readonly ecrans: readonly EcranDeCoursBrut[];
}

const IDENTIFIANTS_DE_CONFUSION = Object.keys(CONFUSIONS) as [
  ConfusionId,
  ...ConfusionId[],
];

const texte = z.string().min(1);
const rang = z.number().int().nonnegative();
const duree = z.number().int().positive();
const concept = z.enum(CONCEPTS);
const concepts = z.tuple([concept], concept);
const confusion = z.enum(IDENTIFIANTS_DE_CONFUSION);

const quizNote = z
  .object({
    id: texte,
    type: z.literal('quiz'),
    concept,
    question: texte,
    options: z.array(texte).min(2),
    optionIds: z.array(texte),
    correctIndex: rang,
    confusions: z.tuple([confusion], confusion),
    noteCompte: z.boolean(),
    context: texte.optional(),
    explanation: texte.optional(),
    nextAction: texte.optional(),
  })
  .strict()
  .superRefine((quiz, contexte) => {
    const signaler = (champ: string, message: string): void => {
      contexte.addIssue({ code: 'custom', path: [champ], message });
    };
    if (quiz.optionIds.length !== quiz.options.length) {
      signaler('optionIds', 'un identifiant par option est attendu');
    }
    if (new Set(quiz.optionIds).size !== quiz.optionIds.length) {
      signaler('optionIds', 'deux options portent le même identifiant');
    }
    if (quiz.correctIndex >= quiz.options.length) {
      signaler('correctIndex', 'la bonne réponse désigne une option absente');
    }
    if (quiz.confusions.length !== quiz.options.length - 1) {
      signaler('confusions', 'une confusion par option piège est attendue');
    }
  });

type QuizNote = z.output<typeof quizNote>;

const guideFormateur = z
  .object({
    aDire: texte.optional(),
    question: texte.optional(),
    reponse: texte.optional(),
    calcul: texte.optional(),
    relance: texte.optional(),
    transition: texte.optional(),
  })
  .strict();

const correctionDeQuiz = z
  .object({ correctIndex: rang, explanation: texte, nextAction: texte })
  .strict();

const correction = z.union([
  correctionDeQuiz,
  z.object({ expected: texte, nextAction: texte }).strict(),
  z.object({ nestedQuiz: correctionDeQuiz }).strict(),
]);

const presentationInitiale = z
  .object({
    version: z.literal(1),
    screenId: texte,
    renderer: texte,
    title: texte.optional(),
    subtitle: texte.optional(),
  })
  .strict();

const presentationDuDeck = z
  .object({
    version: z.literal(2),
    screenId: texte,
    renderer: texte,
    props: z.unknown(),
  })
  .strict()
  .transform((stockee, contexte) => {
    const lecture = presentationVisuelle.safeParse({
      renderer: stockee.renderer,
      props: stockee.props,
    });
    if (!lecture.success) {
      for (const probleme of lecture.error.issues) {
        contexte.issues.push({
          code: 'custom',
          input: stockee,
          path: probleme.path,
          message: probleme.message,
        });
      }
      return z.NEVER;
    }
    return {
      version: stockee.version,
      screenId: stockee.screenId,
      ...lecture.data,
    };
  });

type PresentationStockee =
  | z.output<typeof presentationInitiale>
  | z.output<typeof presentationDuDeck>;

interface QuizAffiche {
  readonly id: string;
  readonly question: string;
  readonly options: readonly string[];
}

function quizAffiche(
  presentation: PresentationStockee | undefined,
): QuizAffiche | undefined {
  if (presentation?.version !== 2) {
    return undefined;
  }
  if (presentation.renderer === 'quiz') {
    return presentation.props.questionData;
  }
  if (presentation.renderer === 'image-left') {
    return presentation.props.nestedQuiz;
  }
  return undefined;
}

function rangCorrige(
  corrige: z.output<typeof correction> | undefined,
): number | undefined {
  if (corrige === undefined || 'expected' in corrige) {
    return undefined;
  }
  return 'nestedQuiz' in corrige
    ? corrige.nestedQuiz.correctIndex
    : corrige.correctIndex;
}

function afficheLeQuizNote(
  affiche: QuizAffiche,
  note: QuizNote | undefined,
): boolean {
  return (
    note !== undefined &&
    note.id === affiche.id &&
    note.question === affiche.question &&
    JSON.stringify(note.options) === JSON.stringify(affiche.options)
  );
}

const proprietesRecit = z
  .object({
    titre: texte.optional(),
    paragraphes: z.array(texte).min(1).optional(),
    presentation: z
      .union([presentationInitiale, presentationDuDeck])
      .optional(),
    interaction: quizNote.optional(),
    guide: guideFormateur.optional(),
    correction: correction.optional(),
  })
  .strict()
  .superRefine((proprietes, contexte) => {
    const { presentation, interaction } = proprietes;
    if (
      presentation === undefined &&
      (proprietes.titre === undefined || proprietes.paragraphes === undefined)
    ) {
      contexte.addIssue({
        code: 'custom',
        path: ['presentation'],
        message: 'écran sans présentation ni titre et paragraphes à afficher',
      });
    }
    const affiche = quizAffiche(presentation);
    if (affiche !== undefined && !afficheLeQuizNote(affiche, interaction)) {
      contexte.addIssue({
        code: 'custom',
        path: ['interaction'],
        message:
          'le quiz affiché et le quiz noté diffèrent (identifiant, question ou options)',
      });
    }
    const corrige = rangCorrige(proprietes.correction);
    if (corrige !== undefined && corrige !== interaction?.correctIndex) {
      contexte.addIssue({
        code: 'custom',
        path: ['correction'],
        message:
          'la correction désigne une autre bonne réponse que le quiz noté',
      });
    }
  });

export type ProprietesRecit = z.output<typeof proprietesRecit>;

const ecranStocke = z
  .object({
    screenId: texte,
    brique: z.literal('fp-story'),
    dureeMinutes: duree,
    concepts,
    notes: z.string(),
    proprietes: proprietesRecit,
  })
  .strict()
  .superRefine((ecran, contexte) => {
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

const coursStocke = z
  .object({
    slug: texte,
    version: duree,
    titre: texte,
    niveau: texte,
    dureeMinutes: duree,
    concepts,
    ecrans: z.tuple([ecranStocke], ecranStocke),
  })
  .strict();

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

function versEcran(ecran: z.output<typeof ecranStocke>): Ecran {
  const { interaction, guide } = ecran.proprietes;
  return {
    id: ecran.screenId,
    brique: ecran.brique,
    dureeMinutes: ecran.dureeMinutes,
    concepts: ecran.concepts,
    notes: ecran.notes,
    proprietes: ecran.proprietes,
    question:
      interaction === undefined ? undefined : questionDuQuiz(interaction),
    guide,
  };
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
  const cours = lecture.data;
  return {
    slug: cours.slug,
    titre: cours.titre,
    niveau: cours.niveau,
    dureeMinutes: cours.dureeMinutes,
    concepts: cours.concepts,
    ecrans: mapperAuMoinsUn(cours.ecrans, versEcran),
    remediations: {},
  };
}
