import { MODALITES, REGIMES_DE_VERROU } from '../../contrats/contrat-de-l-api';
import { z } from 'zod';
import { lienHttps } from '../../../../../common/domain/liens/lien-web';
import { dansLesBornes } from '../../../../../common/domain/nombres/dans-les-bornes';
import { NOM_SERVI } from '../../../../../common/domain/types/types-de-fichier';
import { CHAMPS_EXTRAITS_DU_CAS } from '../../contrats/cours';
import type {
  CorrigeClassement,
  CorrigeProduction,
  CorrigeTableau,
} from '../correction/Corrige';
import {
  confusionsDuCorrige,
  corrigeClassement,
  corrigeDefi,
  corrigeEnigme,
  corrigeFeuille,
  corrigeTableau,
} from './CorrigeStocke';
import {
  dossierDeRappel,
  estUneValeurDeVerite,
  nomDeVariable,
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
  POINTS_MAX_D_UN_TRACE,
  pointsDuTrace,
  refusDuReglage,
} from '../evaluation/TraceServi';
import {
  auMoinsUn,
  concept,
  identifiantDeQuestion,
  media,
  signalerDoublons,
  signaleurDe,
  sourceDeVideo,
  texte,
  type Signaleur,
} from './SchemasCommuns';
import { presentationVisuelle } from '../structure/VisualPresentation';

const rang = z.number().int().nonnegative();
const seuil = z.number().gt(0).lte(1);
const modalite = z.enum(MODALITES);

const partFigeeDansLesVersionsPubliees = z.number().optional();

const cadrageDuRenvoi = z
  .object({
    part: partFigeeDansLesVersionsPubliees,
    extrait: z
      .object({
        lignes: z.array(rang).min(1).optional(),
        champs: z.array(z.enum(CHAMPS_EXTRAITS_DU_CAS)).min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .transform(({ extrait }) => (extrait === undefined ? {} : { extrait }));

export const FICHIER_DE_PIECE_JOINTE = new RegExp(
  String.raw`^/assets/cours/[a-z0-9-]+/${NOM_SERVI}$`,
);

export const CLASSEUR_RESERVE = new RegExp(
  String.raw`^[a-z0-9-]+/${NOM_SERVI}$`,
);

const pieceJointe = z.union([
  z
    .object({
      libelle: texte,
      fichier: z.string().regex(FICHIER_DE_PIECE_JOINTE),
    })
    .strict(),
  z
    .object({
      libelle: texte,
      classeur: z.string().regex(CLASSEUR_RESERVE),
      reprend: z.array(texte),
    })
    .strict(),
]);

const correction = z.object({ expected: texte, nextAction: texte }).strict();

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

export const visuel = z
  .object({
    src: media,
    alt: texte,
    legende: texte.optional(),
    source: texte.optional(),
  })
  .strict();

export const video = z
  .object({
    src: media,
    srcPoste: media.optional(),
    type: z.literal('video/webm'),
    titre: texte,
    poster: media.optional(),
    transcript: texte,
    source: sourceDeVideo,
    licence: texte,
    sousTitres: z
      .object({ src: media, srclang: texte, libelle: texte })
      .strict()
      .optional(),
    preload: z.literal('none').optional(),
  })
  .strict();

const proprietesRecitStockees = z
  .object({
    titre: texte.optional(),
    paragraphes: z.array(texte).min(1).optional(),
    presentation: presentationDuDeck.optional(),
    correction: correction.optional(),
    visuel: visuel.optional(),
    video: video.optional(),
    modalite: modalite.optional(),
    renvoi: texte.optional(),
    cadrageDuRenvoi: cadrageDuRenvoi.optional(),
    pieceJointe: pieceJointe.optional(),
  })
  .strict()
  .superRefine((proprietes, contexte) => {
    if (
      proprietes.presentation === undefined &&
      (proprietes.titre === undefined || proprietes.paragraphes === undefined)
    ) {
      signaleurDe(contexte)(
        ['presentation'],
        'écran sans présentation ni titre et paragraphes à afficher',
      );
    }
  });

export type ProprietesRecit = Omit<
  z.output<typeof proprietesRecitStockees>,
  'modalite' | 'renvoi' | 'cadrageDuRenvoi' | 'pieceJointe'
>;

const correctionSurPlace = z
  .object({
    explications: auMoinsUn(
      z.object({ reference: texte, texte }).strict(),
    ).superRefine((explications, contexte) => {
      signalerDoublons(
        explications.map(({ reference }) => reference),
        [],
        signaleurDe(contexte),
      );
    }),
  })
  .strict();

const communes = {
  modalite: modalite.optional(),
  renvoi: texte.optional(),
  cadrageDuRenvoi: cadrageDuRenvoi.optional(),
  correctionSurPlace: correctionSurPlace.optional(),
  pieceJointe: pieceJointe.optional(),
};

const parametreCurseur = z
  .object({
    cle: nomDeVariable,
    libelle: texte,
    min: z.number(),
    max: z.number(),
    pas: z.number().positive(),
    defaut: z.number(),
  })
  .strict()
  .refine((curseur) => dansLesBornes(curseur.defaut, curseur), {
    message: 'un curseur va de son minimum à son maximum, défaut compris',
  })
  .refine(({ min, max, pas }) => (max - min) / pas <= POINTS_MAX_D_UN_TRACE, {
    message: `un curseur sert au plus ${POINTS_MAX_D_UN_TRACE} positions`,
  });

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
    geste: texte.nullable(),
    consequence: texte.nullable(),
    questionsLibres: auMoinsUn(questionLibre).optional(),
    ...communes,
  })
  .strict()
  .superRefine(({ questionsLibres = [] }, contexte) => {
    signalerDoublons(
      questionsLibres.map(({ id }) => id),
      ['questionsLibres'],
      signaleurDe(contexte),
    );
  });

const proprietesExemple = z
  .object({
    exemple: z
      .object({
        id: identifiantDeQuestion,
        enonce: texte,
        rappel: dossierDeRappel.optional(),
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

const prereglages = z
  .array(
    z.object({ libelle: texte, valeurs: z.record(texte, z.number()) }).strict(),
  )
  .optional();

const animation = z
  .array(
    z
      .record(texte, z.number())
      .refine((etape) => Object.keys(etape).length > 0, {
        message: 'une étape d’animation règle au moins un paramètre',
      }),
  )
  .min(2)
  .optional();

type Curseur = z.output<typeof parametreCurseur>;

function signalerReglagesHorsCurseurs(support: string): (
  proprietes: {
    readonly parametres: readonly Curseur[];
    readonly prereglages?: readonly {
      readonly valeurs: Readonly<Record<string, number>>;
    }[];
    readonly animation?: readonly Readonly<Record<string, number>>[];
  },
  contexte: z.RefinementCtx,
) => void {
  return (proprietes, contexte) => {
    const signaler = signaleurDe(contexte);
    const curseurs = new Map(proprietes.parametres.map((p) => [p.cle, p]));
    proprietes.prereglages?.forEach(({ valeurs }, rang) => {
      for (const [cle, valeur] of Object.entries(valeurs)) {
        const curseur = curseurs.get(cle);
        if (curseur === undefined || !dansLesBornes(valeur, curseur)) {
          signaler(
            ['prereglages', rang, 'valeurs', cle],
            curseur === undefined
              ? `le préréglage règle un paramètre absent ${support} : ${cle}`
              : `le préréglage sort des bornes du curseur ${cle} : ${valeur}`,
          );
        }
      }
    });
    proprietes.animation?.forEach((etape, rang) => {
      for (const [cle, valeur] of Object.entries(etape)) {
        const refus = refusDuReglage(proprietes, cle, valeur);
        if (refus !== null) {
          signaler(
            ['animation', rang, cle],
            `l’animation ${support} : ${refus}`,
          );
        }
      }
    });
  };
}

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
    prereglages,
    animation,
    ...communes,
  })
  .strict()
  .superRefine(signalerReglagesHorsCurseurs('de la machine'));

const proprietesTrace = z
  .object({
    id: identifiantDeQuestion.optional(),
    titre: texte.optional(),
    source: texte.optional(),
    abscisse: z
      .object({ libelle: texte, min: z.number(), max: z.number() })
      .strict()
      .refine(({ min, max }) => min <= max, {
        message: 'l’axe des abscisses va de son minimum à son maximum',
      }),
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
    sourceUrl: lienHttps.optional(),
    description: texte.optional(),
    descriptionPapier: texte.optional(),
    forme: z.enum(['courbes', 'barres']).optional(),
    unite: z.literal('euros').optional(),
    etiquettes: z.array(texte).optional(),
    prereglages,
    reference: texte.optional(),
    animation,
    ...communes,
  })
  .strict()
  .superRefine(signalerReglagesHorsCurseurs('du tracé'))
  .superRefine((trace, contexte) => {
    if (
      trace.reference !== undefined &&
      !(trace.prereglages ?? []).some(
        ({ libelle }) => libelle === trace.reference,
      )
    ) {
      signaleurDe(contexte)(
        ['reference'],
        `la référence ne nomme aucun préréglage du tracé : ${trace.reference}`,
      );
    }
  })
  .superRefine((trace, contexte) => {
    const points = pointsDuTrace(trace);
    if (points > POINTS_MAX_D_UN_TRACE) {
      signaleurDe(contexte)(
        ['parametres'],
        `le tracé servirait ${points} points précalculés, au-delà de ${POINTS_MAX_D_UN_TRACE}`,
      );
    }
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

function controleDeProduction<
  Plan extends { readonly id: string },
  Question extends { readonly id: string; readonly corrige: CorrigeProduction },
>(controler: (plan: Plan, question: Question, signaler: Signaleur) => void) {
  return (
    {
      plan,
      questions: [question],
    }: { readonly plan: Plan; readonly questions: readonly [Question] },
    contexte: z.RefinementCtx,
  ): void => {
    controler(
      plan,
      question,
      controlerProductionDuPlan(plan, question, contexte),
    );
  };
}

function signalerCasesSansConfusion(
  attendu: CorrigeClassement['attendus'][number],
  categories: readonly string[],
  chemin: readonly (string | number)[],
  signaler: Signaleur,
): void {
  const cases = attendu.pieges.map((piege) => piege.categorieId);
  for (const categorie of cases.filter((id) => !categories.includes(id))) {
    signaler(
      chemin,
      `la carte ${attendu.carteId} porte une confusion pour la case ${categorie}, absente du plan`,
    );
  }
  for (const categorie of categories) {
    if (categorie !== attendu.categorieId && !cases.includes(categorie)) {
      signaler(
        chemin,
        `la carte ${attendu.carteId} rangée en ${categorie} n'a pas de confusion`,
      );
    }
  }
}

const proprietesClassement = z
  .object({
    plan: planClassement,
    questions: z.tuple([productionClassement]),
    ...communes,
  })
  .strict()
  .superRefine(
    controleDeProduction((plan, question, signaler) => {
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
        signalerCasesSansConfusion(attendu, categories, chemin, signaler);
      }
      const sansAttendu = cartes.filter((carte) => !classees.includes(carte));
      if (sansAttendu.length > 0) {
        signaler(chemin, `cartes sans attendu : ${sansAttendu.join(', ')}`);
      }
    }),
  );

const proprietesFeuille = z
  .object({
    plan: planFeuille,
    questions: z.tuple([productionFeuille]),
    ...communes,
  })
  .strict()
  .superRefine(
    controleDeProduction((plan, question, signaler) => {
      if (JSON.stringify(question.corrige.plan) !== JSON.stringify(plan)) {
        signaler(
          ['questions', 0, 'corrige', 'plan'],
          'le corrigé doit recopier le plan de l écran',
        );
      }
    }),
  );

function estUnAttenduDeVerite(
  attendu: CorrigeTableau['attendus'][number],
): boolean {
  return (
    estUneValeurDeVerite(attendu.valeur) &&
    attendu.pieges.every((piege) => piege.valeur === 1 - attendu.valeur)
  );
}

const proprietesTableau = z
  .object({
    plan: planTableau,
    questions: z.tuple([productionTableau]),
    ...communes,
  })
  .strict()
  .superRefine(
    controleDeProduction((plan, question, signaler) => {
      const saisies = plan.colonnes
        .filter((colonne) => colonne.role === 'saisie')
        .map((colonne) => colonne.cle);
      const booleennes = plan.colonnes
        .filter((colonne) => colonne.format === 'booleen')
        .map((colonne) => colonne.cle);
      question.corrige.attendus.forEach((attendu, position) => {
        const chemin = ['questions', 0, 'corrige', 'attendus', position];
        if (!saisies.includes(attendu.cle) || attendu.rang >= plan.echeances) {
          signaler(
            chemin,
            `l'attendu ${attendu.rang}:${attendu.cle} ne vise pas une saisie du plan`,
          );
        }
        if (
          booleennes.includes(attendu.cle) &&
          !estUnAttenduDeVerite(attendu)
        ) {
          signaler(
            chemin,
            `l'attendu booléen ${attendu.rang}:${attendu.cle} vaut 1 ou 0 et son piège la valeur contraire`,
          );
        }
      });
    }),
  );

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

const proprietesQuestionnaire = z
  .object({
    intitule: texte,
    consigne: texte.optional(),
    regime: z.enum(REGIMES_DE_VERROU),
    ordre: z.literal('fixe'),
    questions: auMoinsUn(z.union([voteStocke, numeriqueStockee])),
    ...communes,
  })
  .strict();

export const PROPRIETES_STOCKEES = {
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
  questionnaire: proprietesQuestionnaire,
} as const;
