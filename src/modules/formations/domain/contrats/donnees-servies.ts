import { z } from 'zod';
import { nommeAuContrat as nomme } from '../../../../common/domain/registre-du-contrat';
import {
  presentationInitiale,
  video,
  visuel,
} from '../cours/ProprietesStockees';
import { auMoinsUn, texte } from '../cours/SchemasCommuns';
import { presentationsVisuelles } from '../cours/VisualPresentation';
import { MODALITES, REGIMES_DE_VERROU } from './contrat-de-l-api';
import {
  NATURES_DE_CELLULE,
  type DonneesParBrique,
  type TypeDEcranServi,
} from './donnees-publiques';

const strict = <F extends z.ZodRawShape>(forme: F) => z.object(forme).strict();

const textes = z.array(z.string());
const valeursParCle = z.record(z.string(), z.number());
const valeurAffichee = strict({
  valeur: z.number().nullable(),
  affichage: z.string(),
});

const optionPublique = strict({ id: z.string(), libelle: z.string() });

const metadonnees = nomme(
  strict({
    concepts: textes,
    misconceptionsCiblees: textes,
    dureeMinutes: z.number(),
    modalite: z.enum(MODALITES),
    regime: z.enum(REGIMES_DE_VERROU),
  }),
  'MetadonneesBrique',
);

const ligneDuDossier = strict({ libelle: z.string(), valeur: z.string() });

const vote = strict({
  id: z.string(),
  enonce: z.string(),
  options: z.array(optionPublique),
});

const parametreCurseur = strict({
  cle: z.string(),
  libelle: z.string(),
  min: z.number(),
  max: z.number(),
  pas: z.number(),
  defaut: z.number(),
  positions: z.array(z.number()),
});

const prereglages = z.array(
  strict({ libelle: z.string(), valeurs: valeursParCle }),
);

const animation = z.array(valeursParCle);

const presentation = nomme(
  z.union([
    presentationInitiale,
    presentationsVisuelles({ version: z.literal(2), screenId: texte }),
  ]),
  'PresentationServie',
);

const recit = strict({
  id: z.string(),
  titre: z.string().optional(),
  paragraphes: textes.optional(),
  presentation: presentation.optional(),
  visuel: visuel.optional(),
  video: video.optional(),
  metadonnees,
});

const sortiesDeMachine = strict({
  valeurs: valeursParCle,
  resultat: valeurAffichee,
  etapes: z.array(valeurAffichee),
  courbes: z.record(
    z.string(),
    z.array(strict({ x: z.number(), y: z.number().nullable() })),
  ),
  lignes: z.record(
    z.string(),
    z.array(
      strict({
        valeur: valeurAffichee,
        resultat: valeurAffichee,
        courante: z.boolean(),
      }),
    ),
  ),
  phrase: z.string(),
});

const definitionDeMachine = strict({
  id: z.string(),
  parametres: auMoinsUn(parametreCurseur),
  formuleLatexSimplifie: z.string(),
  calcul: z.string(),
  phrase: z.string(),
  etapes: auMoinsUn(
    strict({ libelle: z.string(), calcul: z.string() }),
  ).optional(),
  prereglages: prereglages.optional(),
  animation: animation.optional(),
  sorties: z.array(sortiesDeMachine),
  metadonnees,
});

const definitionDeTrace = strict({
  id: z.string(),
  titre: z.string().optional(),
  source: z.string().optional(),
  abscisse: strict({ libelle: z.string(), min: z.number(), max: z.number() }),
  ordonnee: z.string(),
  parametres: z.array(parametreCurseur),
  series: auMoinsUn(
    strict({
      id: z.string(),
      libelle: z.string(),
      trait: z.enum(['plein', 'tirets']),
      calcul: z.string(),
    }),
  ),
  bornesOrdonnee: strict({
    min: z.number().optional(),
    max: z.number().optional(),
    minParametre: z.string().optional(),
    maxParametre: z.string().optional(),
  }).optional(),
  sourceUrl: z.string().optional(),
  description: z.string().optional(),
  descriptionPapier: z.string().optional(),
  forme: z.enum(['courbes', 'barres']).optional(),
  unite: z.literal('euros').optional(),
  etiquettes: textes.optional(),
  prereglages: prereglages.optional(),
  reference: z.string().optional(),
  animation: animation.optional(),
  abscisses: z.array(z.number()),
  positions: z.array(
    strict({
      valeurs: valeursParCle,
      ordonnees: z.record(z.string(), z.array(z.number().nullable())),
    }),
  ),
  metadonnees,
});

const feuilleEvaluee = strict({
  saisies: z.record(z.string(), z.string()),
  affichages: z.record(z.string(), z.string()),
  natures: z.record(z.string(), z.enum(NATURES_DE_CELLULE)),
  formules: textes,
});

const planDeFeuille = strict({
  id: z.string(),
  intitule: z.string(),
  lignes: z.number(),
  colonnes: z.number(),
  cellules: z.record(z.string(), z.string()),
  verrouillees: textes,
  consignes: textes,
  lettres: textes,
  grille: z.array(textes),
  longueurMaxSaisie: z.number(),
  initiale: feuilleEvaluee,
  metadonnees,
});

const tableauEvalue = strict({
  lignes: z.array(
    strict({
      rang: z.number(),
      valeurs: z.record(z.string(), valeurAffichee),
    }),
  ),
  totaux: z.record(z.string(), valeurAffichee),
  synthese: z.array(valeurAffichee),
  soldeFinal: valeurAffichee.nullable(),
});

const planDeTableau = strict({
  id: z.string(),
  intitule: z.string(),
  consignes: textes,
  echeances: z.number(),
  intituleDesLignes: z.string().optional(),
  libellesLignes: textes,
  parametres: valeursParCle,
  colonnes: z.array(
    strict({
      cle: z.string(),
      intitule: z.string(),
      role: z.enum(['donnee', 'saisie', 'deduite']),
      format: z.enum(['nombre', 'booleen']).optional(),
      decimales: z.number(),
      valeurs: z.array(z.number()).optional(),
      formule: z.string().optional(),
      formuleInitiale: z.string().optional(),
      soldeDe: z.string().optional(),
      totalise: z.boolean(),
    }),
  ),
  synthese: z.array(
    strict({
      libelle: z.string(),
      formule: z.string(),
      unite: z.string().nullable(),
      decimales: z.number(),
    }),
  ),
  tableauInitial: tableauEvalue,
  metadonnees,
});

const questionNumerique = strict({
  id: z.string(),
  enonce: z.string(),
  unite: z.string().nullable(),
  metadonnees,
});

type SchemasParBrique = {
  readonly [B in keyof DonneesParBrique]: z.ZodType<DonneesParBrique[B]>;
};

const donneesNumeriques: SchemasParBrique['fp-numeric'] = strict({
  question: questionNumerique,
});

const donneesDeVote: SchemasParBrique['fp-vote'] = strict({
  question: vote,
  questionJumelle: vote.optional(),
});

const DONNEES: SchemasParBrique = {
  'fp-quote': strict({
    citation: strict({
      id: z.string(),
      texte: z.string(),
      auteur: z.string().nullable(),
      source: z.string().nullable(),
      metadonnees,
    }),
  }),
  'fp-story': strict({ recit }),
  'fp-pro': strict({
    cas: strict({
      id: z.string(),
      metier: z.string(),
      situation: z.string(),
      geste: z.string().nullable(),
      consequence: z.string().nullable(),
      questionsLibres: auMoinsUn(
        strict({
          id: z.string(),
          question: z.string(),
          placeholder: z.string().optional(),
        }),
      ).optional(),
      metadonnees,
    }),
  }),
  'fp-worked': strict({
    exemple: strict({
      id: z.string(),
      enonce: z.string(),
      rappel: auMoinsUn(ligneDuDossier).optional(),
      etapes: z.array(
        strict({
          id: z.string(),
          intitule: z.string(),
          raisonnement: z.string(),
          invite: z.string(),
        }),
      ),
      metadonnees,
    }),
    etayage: z.number(),
    pilote: z.boolean().optional(),
    corrigeDe: z.string().optional(),
  }),
  'fp-concept4': strict({ definition: definitionDeMachine }),
  'fp-plot': strict({ definition: definitionDeTrace }),
  'fp-challenge': strict({
    probleme: strict({
      id: z.string(),
      enonce: z.string(),
      invite: z.string(),
      rappel: auMoinsUn(ligneDuDossier).optional(),
      strategies: z.tuple([]),
      metadonnees,
    }),
  }),
  'fp-cardsort': strict({
    plan: strict({
      id: z.string(),
      intitule: z.string(),
      cartes: z.array(optionPublique),
      categories: z.array(optionPublique),
      dureeJeuMs: z.number().optional(),
      metadonnees,
    }),
  }),
  'fp-sheet': strict({ plan: planDeFeuille }),
  'fp-table-build': strict({ plan: planDeTableau }),
  'fp-escape': strict({
    parcours: strict({
      id: z.string(),
      intitule: z.string(),
      delaiIndiceMs: z.number(),
      budgetEnigmeMs: z.number(),
      tentativesMax: z.number().int().min(1),
      enigmes: z.array(
        strict({
          id: z.string(),
          intitule: z.string(),
          enonce: z.string(),
          indice: z.string(),
        }),
      ),
      metadonnees,
    }),
  }),
  'fp-pulse': strict({
    sondage: strict({ id: z.string(), invite: z.string(), metadonnees }),
  }),
  'fp-spaced': strict({
    rappel: strict({ id: z.string(), intitule: z.string(), metadonnees }),
  }),
  'fp-numeric': donneesNumeriques,
  'fp-vote': donneesDeVote,
  'fp-recall': strict({
    question: vote.extend({ metadonnees }),
    delaiMs: z.number(),
    consigne: z.string().optional(),
  }),
  'fp-exit': strict({
    billet: strict({
      id: z.string(),
      question: z.string(),
      invite: z.string(),
      options: z.array(optionPublique),
      metadonnees,
    }),
  }),
  questionnaire: strict({
    intitule: z.string(),
    consigne: z.string().optional(),
    regime: z.enum(REGIMES_DE_VERROU),
    ordre: z.enum(['fixe', 'melange']),
    questions: z.array(
      z.discriminatedUnion('brique', [
        strict({ brique: z.literal('fp-numeric'), donnees: donneesNumeriques }),
        strict({ brique: z.literal('fp-vote'), donnees: donneesDeVote }),
      ]),
    ),
  }),
  'ecran-verrouille': strict({}),
};

const nomDuComposant = (brique: string): string =>
  `Donnees${brique
    .split('-')
    .map((mot) => `${mot.charAt(0).toUpperCase()}${mot.slice(1)}`)
    .join('')}`;

export const DONNEES_PAR_BRIQUE: SchemasParBrique = Object.fromEntries(
  Object.entries(DONNEES).map(([brique, schema]) => [
    brique,
    nomme(schema, nomDuComposant(brique)),
  ]),
) as unknown as SchemasParBrique;

export const TYPES_D_ECRAN_SERVI = Object.freeze(
  Object.keys(DONNEES_PAR_BRIQUE) as TypeDEcranServi[],
);
