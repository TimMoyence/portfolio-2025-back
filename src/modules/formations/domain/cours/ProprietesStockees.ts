import { z } from 'zod';
import type { CorrigeProduction } from './Corrige';
import {
  confusionsDuCorrige,
  corrigeClassement,
  corrigeDefi,
  corrigeEnigme,
  corrigeFeuille,
  corrigeRevelation,
  corrigeTableau,
} from './CorrigeStocke';
import {
  parcoursEnigmes,
  planClassement,
  planFeuille,
  planTableau,
  probleme,
  rappel,
  sondage,
} from './PlansStockes';
import { numeriqueStockee, voteStocke } from './QuestionStockee';
import {
  auMoinsUn,
  concept,
  confusion,
  identifiantDeQuestion,
  media,
  signaleurDe,
  sourceDeVideo,
  texte,
  type Signaleur,
} from './SchemasCommuns';
import { presentationVisuelle } from './VisualPresentation';

const rang = z.number().int().nonnegative();
const seuil = z.number().gt(0).lte(1);
const modalite = z.enum(['solo', 'binome', 'groupe', 'classe']);

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

export type QuizNote = z.output<typeof quizNote>;

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

const visuel = z
  .object({
    src: media,
    alt: texte,
    legende: texte.optional(),
    source: texte.optional(),
  })
  .strict();

const video = z
  .object({
    src: media,
    srcPoste: media.optional(),
    type: z.enum(['video/webm', 'video/mp4']),
    titre: texte,
    poster: media.optional(),
    transcript: texte,
    source: sourceDeVideo,
    licence: texte,
    sousTitres: z
      .object({ src: media, srclang: texte, libelle: texte })
      .strict()
      .optional(),
    preload: z.enum(['none', 'metadata']).optional(),
  })
  .strict();

const proprietesRecitStockees = z
  .object({
    titre: texte.optional(),
    paragraphes: z.array(texte).min(1).optional(),
    presentation: z
      .union([presentationInitiale, presentationDuDeck])
      .optional(),
    interaction: quizNote.optional(),
    guide: guideFormateur.optional(),
    correction: correction.optional(),
    visuel: visuel.optional(),
    video: video.optional(),
    modalite: modalite.optional(),
    renvoi: texte.optional(),
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

export type ProprietesRecit = Omit<
  z.output<typeof proprietesRecitStockees>,
  'modalite' | 'renvoi'
>;

const communes = {
  guide: guideFormateur.optional(),
  modalite: modalite.optional(),
  renvoi: texte.optional(),
};

const parametreCurseur = z
  .object({
    cle: z.string().regex(/^[a-z][A-Za-z]*$/),
    libelle: texte,
    min: z.number(),
    max: z.number(),
    pas: z.number().positive(),
    defaut: z.number(),
  })
  .strict();

const proprietesCitation = z
  .object({
    texte,
    auteur: texte.nullable(),
    source: texte.nullable(),
    ...communes,
  })
  .strict();

const questionLibre = z
  .object({
    id: identifiantDeQuestion,
    question: texte,
    placeholder: texte.optional(),
  })
  .strict();

const proprietesCas = z
  .object({
    metier: texte,
    situation: texte,
    geste: texte,
    consequence: texte.nullable(),
    questionsLibres: auMoinsUn(questionLibre).optional(),
    ...communes,
  })
  .strict()
  .superRefine(({ questionsLibres = [] }, contexte) => {
    const vus = new Set<string>();
    for (const [position, { id }] of questionsLibres.entries()) {
      if (vus.has(id)) {
        signaleurDe(contexte)(
          ['questionsLibres', position, 'id'],
          `question libre ${id} en double`,
        );
      }
      vus.add(id);
    }
  });

const proprietesExemple = z
  .object({
    exemple: z
      .object({
        id: identifiantDeQuestion,
        enonce: texte,
        etapes: auMoinsUn(
          z
            .object({
              id: texte,
              intitule: texte,
              raisonnement: texte,
              invite: texte,
            })
            .strict(),
        ),
      })
      .strict(),
    etayage: rang,
    pilote: z.boolean().optional(),
    corrigeDe: texte.optional(),
    ...communes,
  })
  .strict()
  .superRefine((proprietes, contexte) => {
    if (proprietes.etayage > proprietes.exemple.etapes.length) {
      signaleurDe(contexte)(
        ['etayage'],
        `étayage ${proprietes.etayage} au-delà des ${proprietes.exemple.etapes.length} étapes`,
      );
    }
  });

const proprietesMachine = z
  .object({
    id: identifiantDeQuestion.optional(),
    parametres: auMoinsUn(parametreCurseur),
    formuleLatexSimplifie: texte,
    calcul: texte,
    phrase: texte,
    etapes: auMoinsUn(
      z.object({ libelle: texte, calcul: texte }).strict(),
    ).optional(),
    ...communes,
  })
  .strict();

const proprietesTrace = z
  .object({
    id: identifiantDeQuestion.optional(),
    titre: texte.optional(),
    source: texte.optional(),
    abscisse: z
      .object({ libelle: texte, min: z.number(), max: z.number() })
      .strict(),
    ordonnee: texte,
    parametres: z.array(parametreCurseur),
    series: auMoinsUn(
      z
        .object({
          id: texte,
          libelle: texte,
          trait: z.enum(['plein', 'tirets']),
          calcul: texte,
        })
        .strict(),
    ),
    bornesOrdonnee: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        minParametre: texte.optional(),
        maxParametre: texte.optional(),
      })
      .strict()
      .optional(),
    sourceUrl: z.url({ protocol: /^https$/ }).optional(),
    description: texte.optional(),
    forme: z.enum(['courbes', 'barres']).optional(),
    unite: z.literal('euros').optional(),
    etiquettes: z.array(texte).optional(),
    prereglages: z
      .array(
        z
          .object({ libelle: texte, valeurs: z.record(texte, z.number()) })
          .strict(),
      )
      .optional(),
    ...communes,
  })
  .strict()
  .superRefine((trace, contexte) => {
    const cles = new Set(trace.parametres.map(({ cle }) => cle));
    trace.prereglages?.forEach(({ valeurs }, rang) => {
      for (const cle of Object.keys(valeurs).filter((c) => !cles.has(c))) {
        contexte.addIssue({
          code: 'custom',
          path: ['prereglages', rang, 'valeurs', cle],
          message: `le préréglage règle un paramètre absent du tracé : ${cle}`,
        });
      }
    });
  });

const proprietesJalon = z.object({ sondage, ...communes }).strict();

const proprietesDefi = z
  .object({ probleme, corrige: corrigeDefi, ...communes })
  .strict();

function production<
  T extends 'feuille' | 'tableau' | 'classement' | 'enigme',
  C extends z.ZodType<CorrigeProduction>,
>(type: T, corrige: C) {
  return z
    .object({
      type: z.literal(type),
      id: identifiantDeQuestion,
      concept,
      noteCompte: z.boolean(),
      corrige,
    })
    .strict();
}

function signalerConfusions(
  corrige: CorrigeProduction,
  chemin: readonly (string | number)[],
  signaler: Signaleur,
): void {
  if (confusionsDuCorrige(corrige).length === 0) {
    signaler(chemin, 'aucune confusion reconnue par ce corrigé');
  }
}

const productionFeuille = production('feuille', corrigeFeuille);
const productionTableau = production('tableau', corrigeTableau);
const productionClassement = production('classement', corrigeClassement);
const productionEnigme = production('enigme', corrigeEnigme);

export type ProductionStockee =
  | z.output<typeof productionFeuille>
  | z.output<typeof productionTableau>
  | z.output<typeof productionClassement>
  | z.output<typeof productionEnigme>;

function controlerProductionDuPlan(
  plan: { readonly id: string },
  question: { readonly id: string; readonly corrige: CorrigeProduction },
  contexte: z.RefinementCtx,
): Signaleur {
  const signaler = signaleurDe(contexte);
  if (plan.id !== question.id) {
    signaler(
      ['questions', 0, 'id'],
      `la production ${question.id} doit porter l'identifiant du plan ${plan.id}`,
    );
  }
  signalerConfusions(question.corrige, ['questions', 0], signaler);
  return signaler;
}

const proprietesClassement = z
  .object({
    plan: planClassement,
    questions: z.tuple([productionClassement]),
    ...communes,
  })
  .strict()
  .superRefine(({ plan, questions: [question] }, contexte) => {
    const signaler = controlerProductionDuPlan(plan, question, contexte);
    const cartes = plan.cartes.map((carte) => carte.id);
    const categories = plan.categories.map((categorie) => categorie.id);
    const classees = question.corrige.attendus.map(
      (attendu) => attendu.carteId,
    );
    const chemin = ['questions', 0, 'corrige', 'attendus'];
    for (const attendu of question.corrige.attendus) {
      if (!cartes.includes(attendu.carteId)) {
        signaler(chemin, `la carte ${attendu.carteId} n'est pas au plan`);
      }
      if (!categories.includes(attendu.categorieId)) {
        signaler(
          chemin,
          `la catégorie ${attendu.categorieId} n'est pas au plan`,
        );
      }
    }
    const sansAttendu = cartes.filter((carte) => !classees.includes(carte));
    if (sansAttendu.length > 0) {
      signaler(chemin, `cartes sans attendu : ${sansAttendu.join(', ')}`);
    }
  });

const proprietesFeuille = z
  .object({
    plan: planFeuille,
    questions: z.tuple([productionFeuille]),
    ...communes,
  })
  .strict()
  .superRefine(({ plan, questions: [question] }, contexte) => {
    const signaler = controlerProductionDuPlan(plan, question, contexte);
    if (JSON.stringify(question.corrige.plan) !== JSON.stringify(plan)) {
      signaler(
        ['questions', 0, 'corrige', 'plan'],
        'le corrigé doit recopier le plan de l écran',
      );
    }
  });

const proprietesTableau = z
  .object({
    plan: planTableau,
    questions: z.tuple([productionTableau]),
    ...communes,
  })
  .strict()
  .superRefine(({ plan, questions: [question] }, contexte) => {
    const signaler = controlerProductionDuPlan(plan, question, contexte);
    const saisies = plan.colonnes
      .filter((colonne) => colonne.role === 'saisie')
      .map((colonne) => colonne.cle);
    question.corrige.attendus.forEach((attendu, position) => {
      if (!saisies.includes(attendu.cle) || attendu.rang >= plan.echeances) {
        signaler(
          ['questions', 0, 'corrige', 'attendus', position],
          `l'attendu ${attendu.rang}:${attendu.cle} ne vise pas une saisie du plan`,
        );
      }
    });
  });

const proprietesEnigmes = z
  .object({
    parcours: parcoursEnigmes,
    questions: auMoinsUn(productionEnigme),
    ...communes,
  })
  .strict()
  .superRefine(({ parcours, questions }, contexte) => {
    const signaler = signaleurDe(contexte);
    if (questions.length !== parcours.enigmes.length) {
      signaler(['questions'], 'une production par énigme du parcours');
    }
    questions.forEach((question, position) => {
      signalerConfusions(question.corrige, ['questions', position], signaler);
    });
    parcours.enigmes.forEach((enigme, position) => {
      const question = questions.at(position);
      if (
        question === undefined ||
        question.id !== enigme.id ||
        question.corrige.enigmeId !== enigme.id ||
        question.corrige.parcoursId !== parcours.id ||
        question.corrige.rang !== position
      ) {
        signaler(
          ['questions', position],
          `l'énigme ${enigme.id} n'a pas de corrigé à son rang`,
        );
      }
    });
  });

const proprietesRappel = z
  .object({
    rappel,
    banque: z
      .object({
        questions: auMoinsUn(voteStocke),
        obligatoires: z.array(texte),
      })
      .strict(),
    ...communes,
  })
  .strict()
  .superRefine(({ banque }, contexte) => {
    const connues = banque.questions.map((question) => question.id);
    const absentes = banque.obligatoires.filter((id) => !connues.includes(id));
    if (absentes.length > 0) {
      signaleurDe(contexte)(
        ['banque', 'obligatoires'],
        `questions obligatoires absentes de la banque : ${absentes.join(', ')}`,
      );
    }
  });

const proprietesNumerique = z
  .object({
    questions: z.tuple([numeriqueStockee]),
    seuil: seuil.optional(),
    ...communes,
  })
  .strict();

const proprietesVote = z
  .object({
    questions: z.union([
      z.tuple([voteStocke]),
      z.tuple([voteStocke, voteStocke]),
    ]),
    corrige: corrigeRevelation.optional(),
    seuil: seuil.optional(),
    ...communes,
  })
  .strict();

const proprietesRappelDOuverture = z
  .object({
    questions: z.tuple([voteStocke]),
    delaiMs: z.number().int().nonnegative(),
    consigne: texte.optional(),
    seuil: seuil.optional(),
    ...communes,
  })
  .strict();

const proprietesBillet = z
  .object({
    questions: z.tuple([voteStocke]),
    invite: texte,
    ...communes,
  })
  .strict();

const proprietesQuestionnaire = z
  .object({
    intitule: texte,
    consigne: texte,
    regime: z.enum(['ouvert', 'focus', 'examen']),
    ordre: z.enum(['fixe', 'melange']),
    questions: auMoinsUn(z.union([voteStocke, numeriqueStockee])),
    ...communes,
  })
  .strict();

export const PROPRIETES_STOCKEES = {
  'fp-quote': proprietesCitation,
  'fp-story': proprietesRecitStockees,
  'fp-pro': proprietesCas,
  'fp-worked': proprietesExemple,
  'fp-concept4': proprietesMachine,
  'fp-plot': proprietesTrace,
  'fp-pulse': proprietesJalon,
  'fp-challenge': proprietesDefi,
  'fp-cardsort': proprietesClassement,
  'fp-sheet': proprietesFeuille,
  'fp-table-build': proprietesTableau,
  'fp-escape': proprietesEnigmes,
  'fp-spaced': proprietesRappel,
  'fp-numeric': proprietesNumerique,
  'fp-vote': proprietesVote,
  'fp-recall': proprietesRappelDOuverture,
  'fp-exit': proprietesBillet,
  questionnaire: proprietesQuestionnaire,
} as const;
