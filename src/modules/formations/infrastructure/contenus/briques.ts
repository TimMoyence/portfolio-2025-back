import type { z } from 'zod';
import {
  mapperAuMoinsUn,
  type AuMoinsUn,
  type AuMoinsUnModifiable,
} from '../../../../common/domain/objets/au-moins-un';
import { somme } from '../../../../common/domain/nombres/statistiques';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import type { ContenuDeCours } from '../../domain/cours/stockage/CoursStocke';
import type { VisualPresentation } from '../../domain/cours/structure/VisualPresentation';
import {
  slugOption,
  type numeriqueStockee,
  type voteStocke,
} from '../../domain/cours/stockage/QuestionStockee';

type EcranDuCours = ContenuDeCours['ecrans'][number];
type MediasDuCours = NonNullable<ContenuDeCours['medias']>;
export type Acte = [EcranDuCours, ...EcranDuCours[]];
export type EcranDeRecit = Extract<
  EcranDuCours,
  { readonly brique: 'fp-story' }
>;
export type SocleDEcran = Omit<EcranDeRecit, 'brique' | 'proprietes'>;
type SocleNomme = Pick<SocleDEcran, 'screenId' | 'titre' | 'concepts'>;
type ReserveDuRecit = Omit<EcranDeRecit['proprietes'], 'presentation'>;
type EcranDeTri = Extract<EcranDuCours, { readonly brique: 'fp-cardsort' }>;
type ProprietesDeClassement = EcranDeTri['proprietes'];
type CorrectionDeTri = Omit<SocleDEcran, 'diffusion'> & {
  readonly sousTitre: string;
  readonly intitule?: string;
};
type EcranDeRappel = Extract<EcranDuCours, { readonly brique: 'fp-spaced' }>;
type EcranDExemple = Extract<EcranDuCours, { readonly brique: 'fp-worked' }>;
type EcranDePulsation = Extract<EcranDuCours, { readonly brique: 'fp-pulse' }>;
export type VoteDuCours = z.input<typeof voteStocke>;
type NumeriqueDuCours = z.input<typeof numeriqueStockee>;
export type Piege = readonly [string, ConfusionId];
type EcranDeTableau = Extract<
  EcranDuCours,
  { readonly brique: 'fp-table-build' }
>;
export type PlanDeTableau = EcranDeTableau['proprietes']['plan'];
type QuestionDeTableau = EcranDeTableau['proprietes']['questions'][number];
type EcranDeFeuille = Extract<EcranDuCours, { readonly brique: 'fp-sheet' }>;
type QuestionDeFeuille = Extract<
  EcranDeFeuille['proprietes']['questions'][number],
  { readonly type: 'feuille' }
>;

export const TOLERANCE_RELATIVE = {
  type: 'relative',
  valeur: 0.0001,
} as const;
export const TOLERANCE_NULLE = { type: 'absolue', valeur: 0 } as const;
export const A_L_UNITE = { type: 'decimales', valeur: 0 } as const;
export const UNE_DECIMALE = { type: 'decimales', valeur: 1 } as const;
export const DEUX_DECIMALES = { type: 'decimales', valeur: 2 } as const;
export const TROIS_DECIMALES = { type: 'decimales', valeur: 3 } as const;

export function puces(...lignes: AuMoinsUnModifiable<string>): string {
  return lignes.map((ligne) => `• ${ligne}`).join('\n');
}

export const NOTES_DU_VOTE_A_DEUX_QUESTIONS = [
  'Question 1 en vote individuel, puis question 2, sans débat entre les deux.',
  'La révélation s’ouvre après la question 2 : les deux corrections se commentent ensemble.',
  'Papier : vote à main levée sur chaque question.',
] as const;

function notesDuVote(temps: string): string {
  return puces(
    `Temps « réfléchir » ${temps} : votes non notés.`,
    ...NOTES_DU_VOTE_A_DEUX_QUESTIONS,
  );
}

export function notesDuVoteQuiOuvreLaNotion(notion: 1 | 2 | 3): string {
  return notesDuVote(`de la notion ${notion}`);
}

export function notesDuVoteQuiRelanceLaNotion(notion: 1 | 2 | 3): string {
  return notesDuVote(`du second cycle de la notion ${notion}`);
}

type SocleDuVote = Pick<
  SocleDEcran,
  'screenId' | 'titre' | 'dureeMinutes' | 'concepts' | 'notes'
>;

export interface PieceReservee {
  readonly libelle: string;
  readonly classeur: string;
  readonly reprend: string[];
}

type EcranDeVote = Extract<EcranDuCours, { readonly brique: 'fp-vote' }>;

export function voteQuiOuvre(
  socle: SocleDuVote,
  questions: EcranDeVote['proprietes']['questions'],
  pieceJointe?: PieceReservee,
): EcranDuCours {
  return {
    ...socle,
    diffusion: 'seance',
    brique: 'fp-vote',
    proprietes: {
      modalite: 'solo',
      ...(pieceJointe === undefined ? {} : { pieceJointe }),
      questions,
    },
  };
}

export const PAUSE_HORS_DUREE = 'Pause de 15 minutes, hors durée programmée.';

export const REPONSES_SOUS_CHAQUE_ETAPE =
  'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.';

export const NOTES_DE_L_EXEMPLE_ETAPE_PAR_ETAPE = [
  REPONSES_SOUS_CHAQUE_ETAPE,
  'Papier : réponses sous chaque étape du livret.',
] as const;

export const AVANT_SA_PAGE =
  '1 min, avant la trace écrite : faire décrire l’image, la page suivante en donne la règle.';

export const PAGE_APRES_SON_ILLUSTRATION =
  '2 min après l’illustration ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.';

export const DEUXIEME_PAGE_APRES_SON_ILLUSTRATION =
  '2 min après l’illustration, enchaînées sur la page 1 : 6 min pour les deux pages et leurs illustrations.';

export const CORRIGER_PAR_LA_MOINS_REUSSIE =
  'Corriger question par question, en commençant par la moins réussie.';

export const CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE =
  'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).';

export function tempsDeLExercice(reflexion: number, travail: number): string {
  return `Temps : réflexion ${reflexion} min · travail ${travail} min`;
}

export function pulsation(
  { screenId, titre, concepts }: SocleNomme,
  sondage: EcranDePulsation['proprietes']['sondage'],
  ...notesDuJalon: string[]
): EcranDePulsation {
  return {
    screenId,
    titre,
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts,
    notes: puces('30 s de vote anonyme.', ...notesDuJalon),
    proprietes: { sondage },
  };
}

function option(libelle: string, confusion: ConfusionId | null) {
  return { id: slugOption(libelle), libelle, confusion };
}

export function vote(
  id: string,
  concept: ConceptId,
  noteCompte: boolean,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUnModifiable<Piege>,
  segments: readonly string[] = [],
): VoteDuCours {
  const [premier, ...suite] = pieges;
  return {
    type: 'vote',
    id,
    concept,
    noteCompte,
    enonce,
    options: [
      option(bonne, null),
      option(...premier),
      ...suite.map((piege) => option(...piege)),
    ],
    segments: [...segments],
  };
}

export function numerique(
  id: string,
  concept: ConceptId,
  enonce: string,
  unite: string | null,
  solution: number,
  tolerance: NumeriqueDuCours['tolerance'],
  formePubliee: string,
  pieges: AuMoinsUnModifiable<readonly [number, ConfusionId]>,
): NumeriqueDuCours {
  return {
    type: 'numeric',
    id,
    concept,
    noteCompte: true,
    enonce,
    unite,
    solution,
    tolerance,
    formePubliee,
    pieges: mapperAuMoinsUn(pieges, ([valeur, confusion]) => ({
      valeur,
      confusion,
    })),
  };
}

export function ecranV2(
  socle: SocleDEcran,
  renderer: string,
  props: Readonly<Record<string, unknown>>,
  reserve: ReserveDuRecit = {},
): EcranDeRecit {
  return {
    ...socle,
    brique: 'fp-story',
    proprietes: {
      presentation: { version: 2, screenId: socle.screenId, renderer, props },
      ...reserve,
    },
  };
}

interface CarteRangee {
  readonly id: string;
  readonly libelle: string;
  readonly categorie: string;
  readonly confusions: Readonly<Partial<Record<string, ConfusionId>>>;
  readonly justification: string;
}

type Carte<C extends string> = {
  readonly [K in C]: Omit<CarteRangee, 'categorie' | 'confusions'> & {
    readonly categorie: K;
    readonly confusions: Readonly<Record<Exclude<C, K>, ConfusionId>>;
  };
}[C];

export function classement<C extends string>(
  plan: {
    readonly id: string;
    readonly intitule: string;
    readonly dureeJeuMs?: number;
  },
  concept: ConceptId,
  categories: AuMoinsUnModifiable<readonly [C, string]>,
  cartes: AuMoinsUnModifiable<NoInfer<Carte<C>>>,
): Pick<ProprietesDeClassement, 'plan' | 'questions'> {
  const rangees: AuMoinsUn<CarteRangee> = cartes;
  return {
    plan: {
      ...plan,
      cartes: mapperAuMoinsUn(rangees, (carte) => ({
        id: carte.id,
        libelle: carte.libelle,
      })),
      categories: mapperAuMoinsUn(categories, ([id, libelle]) => ({
        id,
        libelle,
      })),
    },
    questions: [
      {
        type: 'classement',
        id: plan.id,
        concept,
        noteCompte: true,
        corrige: {
          type: 'classement',
          attendus: mapperAuMoinsUn(rangees, (carte) => ({
            carteId: carte.id,
            categorieId: carte.categorie,
            pieges: categories.flatMap(([id]) => {
              const confusion = carte.confusions[id];
              return confusion === undefined
                ? []
                : [{ categorieId: id, confusion }];
            }),
            justification: carte.justification,
          })),
        },
      },
    ],
  };
}

export function suiviDeSaCorrection(
  { sousTitre, intitule = 'Correction du tri', ...socle }: CorrectionDeTri,
  tri: EcranDeTri,
): [EcranDeTri, EcranDeRecit] {
  const {
    plan,
    questions: [{ corrige }],
  } = tri.proprietes;
  const attendus = new Map(
    corrige.attendus.map((attendu) => [attendu.carteId, attendu]),
  );
  return [
    tri,
    ecranV2({ ...socle, diffusion: 'seance' }, 'sort-review', {
      title: intitule,
      subtitle: sousTitre,
      source: { screenId: tri.screenId, sortId: plan.id },
      categories: plan.categories.map(({ id, libelle }) => ({
        id,
        label: libelle,
      })),
      cards: plan.cartes.map(({ id, libelle }) => ({
        id,
        label: libelle,
        category: attendus.get(id)?.categorieId,
        justification: attendus.get(id)?.justification,
      })),
    }),
  ];
}

export interface TempsDeCorrection {
  readonly minutes: number;
  readonly notes: AuMoinsUnModifiable<string>;
}

function correctionAvantLaPause(jalon: 1 | 2): TempsDeCorrection {
  return {
    minutes: 2,
    notes: [
      CORRIGER_PAR_LA_MOINS_REUSSIE_SOUS_SON_SCORE,
      `Transition : jalon ${jalon}, puis pause de 15 minutes.`,
    ],
  };
}

export const CORRECTION_AVANT_LA_PREMIERE_PAUSE = correctionAvantLaPause(1);

export const CORRECTION_AVANT_LA_SECONDE_PAUSE = correctionAvantLaPause(2);

function annoncerLaCorrection(notes: string, minutes: number): string {
  return notes.replace(
    /^(• Temps : réflexion \d+ min · travail \d+ min)$/m,
    `$1 · correction ${minutes} min`,
  );
}

export function corrigeEtapeParEtape(
  exercice: EcranDExemple,
  { minutes, notes }: TempsDeCorrection,
): EcranDExemple {
  return {
    ...exercice,
    dureeMinutes: exercice.dureeMinutes + minutes,
    notes: [exercice.notes, puces(...notes)].join('\n'),
  };
}

export function corrigeSurPlace<E extends EcranDuCours>(
  exercice: E,
  { minutes, notes }: TempsDeCorrection,
  explications: AuMoinsUnModifiable<readonly [string, string]>,
): E {
  return {
    ...exercice,
    dureeMinutes: exercice.dureeMinutes + minutes,
    notes: [
      annoncerLaCorrection(exercice.notes, minutes),
      puces(...notes),
    ].join('\n'),
    proprietes: {
      ...exercice.proprietes,
      correctionSurPlace: {
        explications: mapperAuMoinsUn(explications, ([reference, texte]) => ({
          reference,
          texte,
        })),
      },
    },
  };
}

export function strategie(id: string, libelle: string, fausse = false) {
  return { id, libelle, fausse };
}

type EcranDeDefi = Extract<EcranDuCours, { readonly brique: 'fp-challenge' }>;

export interface DefiDeConsigne {
  readonly screenId: string;
  readonly titre: string;
  readonly aRelire: string;
  readonly probleme: EcranDeDefi['proprietes']['probleme'];
  readonly strategies: readonly ReturnType<typeof strategie>[];
  readonly pourquoiLaFausse: string;
  readonly explication: string;
}

export function defiDeConsigne({
  screenId,
  titre,
  aRelire,
  probleme,
  strategies,
  pourquoiLaFausse,
  explication,
}: DefiDeConsigne): EcranDeDefi {
  return corrigeSurPlace<EcranDeDefi>(
    {
      screenId,
      titre,
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 5,
      concepts: ['ia-redactrice'],
      notes: puces(
        tempsDeLExercice(1, 4),
        `Réflexion : faire relire ${aRelire}.`,
        'La consigne écrite ici sert telle quelle à l’écran suivant.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme,
        corrige: {
          type: 'defi',
          strategies: [
            strategie(
              'role',
              'Rôle : « Tu es assistant de la directrice commerciale de Norvane Équipement. »',
            ),
            ...strategies,
          ],
        },
      },
    },
    {
      minutes: 2,
      notes: [
        `Révéler les stratégies ; demander pourquoi la dernière est fausse : ${pourquoiLaFausse}`,
        'Transition : « Votre IA au travail. »',
      ],
    },
    [['consigne', explication]],
  );
}

export function attendu(
  reference: string,
  formuleReference: string,
  valeur: number | string,
  forme: 'references' | { readonly memeQue: string },
  pieges: readonly (readonly [number, ConfusionId])[] = [],
  confusionSiErreurFormule: ConfusionId | null = null,
  tolerance:
    | typeof TOLERANCE_RELATIVE
    | typeof TOLERANCE_NULLE
    | typeof DEUX_DECIMALES = TOLERANCE_RELATIVE,
) {
  return {
    reference,
    formuleReference,
    valeur,
    tolerance,
    forme,
    confusionSiErreurFormule,
    pieges: pieges.map(([valeurDuPiege, confusion]) => ({
      valeur: valeurDuPiege,
      confusion,
    })),
  };
}

export function enigme(
  parcoursId: string,
  rang: number,
  id: string,
  concept: ConceptId,
  valeur: number,
  tolerance: NumeriqueDuCours['tolerance'],
  formePubliee: string,
  fragment: string,
  pieges: AuMoinsUnModifiable<readonly [number, ConfusionId]>,
) {
  return {
    type: 'enigme' as const,
    id,
    concept,
    noteCompte: false,
    corrige: {
      type: 'enigme' as const,
      parcoursId,
      enigmeId: id,
      rang,
      solution: {
        type: 'nombre' as const,
        valeur,
        tolerance,
        formePubliee,
      },
      fragment,
      pieges: mapperAuMoinsUn(pieges, ([valeurDuPiege, confusion]) => ({
        valeur: valeurDuPiege,
        confusion,
      })),
    },
  };
}

export function rappel(
  id: string,
  concept: ConceptId,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUnModifiable<Piege>,
): VoteDuCours {
  return vote(id, concept, false, enonce, bonne, pieges);
}

const INTITULE_DU_RAPPEL = 'Rappel : de mémoire, sans vos notes';

export function ecranDeRappel(
  { screenId, concepts }: Pick<SocleDEcran, 'screenId' | 'concepts'>,
  obligatoiresEnNote: string,
  rappelId: string,
  banque: EcranDeRappel['proprietes']['banque'],
): EcranDeRappel {
  return {
    screenId,
    titre: INTITULE_DU_RAPPEL,
    diffusion: 'seance',
    brique: 'fp-spaced',
    dureeMinutes: 6,
    concepts,
    notes: puces(
      '5 min individuelles, puis projeter la carte de maîtrise.',
      obligatoiresEnNote,
    ),
    proprietes: {
      rappel: { id: rappelId, intitule: INTITULE_DU_RAPPEL },
      banque,
    },
  };
}

export function rappelDeToutLeCours(
  socle: Pick<SocleDEcran, 'screenId' | 'concepts'>,
  rappelId: string,
  questions: AuMoinsUnModifiable<VoteDuCours>,
): EcranDeRappel {
  return ecranDeRappel(
    socle,
    'Tous reçoivent les douze questions de la banque : le rappel couvre tout le cours pour chacun.',
    rappelId,
    { questions, obligatoires: questions.map((question) => question.id) },
  );
}

export function ficheMemo(
  { screenId, titre, concepts }: SocleNomme,
  items: readonly unknown[],
): EcranDeRecit {
  return ecranV2(
    {
      screenId,
      titre,
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts,
      notes: puces(
        '90 s de lecture ; la fiche s’imprime pour le classeur de CCF.',
      ),
    },
    'grid',
    {
      title: titre,
      subtitle:
        'À garder pour le CCF : chaque carte part d’une question et donne la méthode et son piège.',
      imprimable: true,
      items,
    },
  );
}

export interface ImageDIllustration {
  readonly fichier: string;
  readonly imageAlt: string;
}

type Correspondance = readonly [dansLImage: string, dansLeCours: string];

export type Correspondances = readonly [
  Correspondance,
  Correspondance,
  Correspondance,
  Correspondance?,
];

function enListe(correspondances: Correspondances): string[] {
  return correspondances.flatMap((correspondance) =>
    correspondance === undefined
      ? []
      : [`${correspondance[0]} → ${correspondance[1]}`],
  );
}

export interface ScenePourComprendre extends ImageDIllustration {
  readonly scene: string;
  readonly regle: string;
  readonly correspondances: Correspondances;
}

const REGLE_DE_LA_NOTION = 'En maths, on écrit : ';

function ecranDImage(
  { screenId, titre, concepts }: SocleNomme,
  notes: AuMoinsUnModifiable<string>,
  renderer: 'illustration' | 'image-left' | 'page',
  props: Readonly<Record<string, unknown>>,
  dureeMinutes = 1,
): EcranDeRecit {
  return ecranV2(
    {
      screenId,
      titre,
      diffusion: 'catalogue',
      dureeMinutes,
      concepts,
      notes: puces(...notes),
    },
    renderer,
    props,
  );
}

export interface TexteDeLImage {
  readonly sousTitre?: string;
  readonly paragraphes: AuMoinsUnModifiable<string>;
  readonly correspondances: Correspondances;
  readonly dureeMinutes: number;
}

export interface Serie {
  readonly nom: string;
  readonly pages: number;
}

export interface PageDeSerie {
  readonly rang: number;
  readonly syntaxe: string;
  readonly piege: string;
  readonly exemple: string;
  readonly correspondances: Correspondances;
}

export type SocleDeLaPage = SocleNomme & {
  readonly notes: AuMoinsUnModifiable<string>;
};

const DUREE_D_UNE_PAGE_DE_SERIE = 2;

export function texteDeLaPage(
  { nom, pages }: Serie,
  { rang, syntaxe, piege, exemple, correspondances }: PageDeSerie,
): TexteDeLImage {
  return {
    sousTitre: `${nom} · page ${rang} sur ${pages}`,
    paragraphes: [
      `Syntaxe : ${syntaxe}`,
      `Le piège : ${piege}`,
      `Exemple : ${exemple}`,
    ],
    correspondances,
    dureeMinutes: DUREE_D_UNE_PAGE_DE_SERIE,
  };
}

function ecranCommente(
  socle: SocleNomme,
  renderer: 'image-left' | 'page',
  visuel: Readonly<Record<string, unknown>>,
  { sousTitre, paragraphes, correspondances, dureeMinutes }: TexteDeLImage,
  notes: AuMoinsUnModifiable<string>,
): EcranDeRecit {
  return ecranDImage(
    socle,
    notes,
    renderer,
    {
      title: socle.titre,
      ...(sousTitre === undefined ? {} : { subtitle: sousTitre }),
      ...visuel,
      paragraphs: [...paragraphes],
      items: enListe(correspondances),
    },
    dureeMinutes,
  );
}

export function ecranDImageCommentee(
  socle: SocleNomme,
  dossier: string,
  { fichier, imageAlt }: ImageDIllustration,
  texte: TexteDeLImage,
  notes: AuMoinsUnModifiable<string>,
): EcranDeRecit {
  return ecranCommente(
    socle,
    'image-left',
    { image: `${dossier}/${fichier}`, imageAlt },
    texte,
    notes,
  );
}

export type PageDeWord = Extract<
  VisualPresentation,
  { readonly renderer: 'page' }
>['props']['page'];

type ParagrapheDePage = Extract<
  PageDeWord['blocks'][number],
  { readonly runs: unknown }
>;

export const paragraphe = (
  runs: ParagrapheDePage['runs'],
  marker?: ParagrapheDePage['marker'],
): ParagrapheDePage => ({
  style: 'normal',
  runs,
  ...(marker === undefined ? {} : { marker }),
});

export interface PageDessinee {
  readonly page: PageDeWord;
  readonly pageAlt: string;
}

export const pageDessineeDeLaSerie =
  (serie: Serie) =>
  (
    { notes, ...socle }: SocleDeLaPage,
    { page, pageAlt, ...texte }: PageDessinee & PageDeSerie,
  ): EcranDeRecit =>
    ecranCommente(
      socle,
      'page',
      { page, pageAlt },
      texteDeLaPage(serie, texte),
      notes,
    );

export function ecranDIllustration(
  socle: SocleNomme,
  dossier: string,
  { fichier, imageAlt }: ImageDIllustration,
  notes: AuMoinsUnModifiable<string>,
): EcranDeRecit {
  return ecranDImage(socle, notes, 'illustration', {
    image: `${dossier}/${fichier}`,
    imageAlt,
  });
}

export const pourComprendreDans =
  (dossier: string) =>
  (
    socle: SocleNomme,
    { fichier, imageAlt, scene, regle, correspondances }: ScenePourComprendre,
    relance: string,
  ): EcranDeRecit =>
    ecranDImage(
      socle,
      [
        '1 min : faire décrire l’image, puis faire dire à quoi correspond chaque élément dans le cours.',
        relance,
      ],
      'image-left',
      {
        title: socle.titre,
        image: `${dossier}/${fichier}`,
        imageAlt,
        paragraphs: [scene, `${REGLE_DE_LA_NOTION}${regle}`],
        items: enListe(correspondances),
      },
    );

export function mediasDesIllustrations(
  dossier: string,
  illustrations: readonly (readonly [string, string, string])[],
  ...gravures: MediasDuCours
): MediasDuCours {
  return [
    ...illustrations.map(([id, fichier, titre]): MediasDuCours[number] => ({
      id,
      chemins: [`${dossier}/${fichier}`],
      pageSource: null,
      auteur: 'Asili Design',
      date: '2026',
      licence: 'CC BY-SA 4.0',
      attribution: `${titre} · Asili Design, 2026 · CC BY-SA 4.0`,
    })),
    ...gravures,
  ];
}

export function gravureDuDomainePublic({
  id,
  chemin,
  pageSource,
  auteur,
  date,
}: {
  readonly id: string;
  readonly chemin: string;
  readonly pageSource: string;
  readonly auteur: string;
  readonly date: string;
}): MediasDuCours[number] {
  return {
    id,
    chemins: [chemin],
    pageSource,
    auteur,
    date,
    licence: 'domaine public',
    attribution: `${auteur}, ${date} · Wikimedia Commons (domaine public)`,
  };
}

export function controle(reference: string, formuleReference: string) {
  return attendu(
    reference,
    formuleReference,
    1,
    'references',
    [],
    null,
    TOLERANCE_NULLE,
  );
}

export function questionDeTableau(
  id: string,
  concept: ConceptId,
  attendus: QuestionDeTableau['corrige']['attendus'],
  ecartToleree = 0.01,
): QuestionDeTableau {
  return {
    type: 'tableau',
    id,
    concept,
    noteCompte: true,
    corrige: {
      type: 'tableau',
      attendus,
      tolerance: { type: 'absolue', valeur: ecartToleree },
    },
  };
}

export function questionDeFeuille(
  plan: QuestionDeFeuille['corrige']['plan'],
  attendus: QuestionDeFeuille['corrige']['attendus'],
  concept: ConceptId = 'tableur',
): QuestionDeFeuille {
  return {
    type: 'feuille',
    id: plan.id,
    concept,
    noteCompte: true,
    corrige: { type: 'feuille', plan, attendus },
  };
}

export const ETAPE_TRANSFERER = {
  id: 'transferer',
  title: 'Acte 6 · Transférer',
  question: 'Saurez-vous le refaire seul·e ?',
  proof: 'Situation nouvelle, rappel.',
  result: 'Une fiche mémo pour le CCF.',
} as const;

export const COLONNES_DU_DOSSIER = [
  { key: 'rubrique', label: 'Rubrique' },
  { key: 'contenu', label: 'Ce que montre le dossier' },
] as const;

export const REFERENTIEL_DU_BTS_CG = {
  title: 'Référentiel du BTS CG',
  description: 'Le programme de mathématiques et l’épreuve E3.',
  href: 'https://enqdip.sup.adc.education.fr/bts/referentiel/BTS_ComptabiliteGestion.pdf',
  external: true,
} as const;

function coursDuNiveau(niveau: string) {
  return (
    actes: AuMoinsUnModifiable<Acte>,
    remediations: ContenuDeCours['remediations'],
    medias: ContenuDeCours['medias'],
    fiche: Pick<ContenuDeCours, 'slug' | 'titre' | 'concepts' | 'gabarit'>,
  ): ContenuDeCours => {
    const [premier, ...suite] = actes;
    const ecrans: ContenuDeCours['ecrans'] = [...premier, ...suite.flat()];
    return {
      ...fiche,
      niveau,
      dureeMinutes: somme(ecrans.map((ecran) => ecran.dureeMinutes)),
      remediations,
      medias,
      ecrans,
    };
  };
}

export const coursB2 = coursDuNiveau('B2');
export const DONNEES_FICTIVES_DU_B2 =
  'Données fictives Atelier Rivage, créées pour ce cours.';
export const coursB3 = coursDuNiveau('B3');
export const coursB1 = coursDuNiveau('B1');
