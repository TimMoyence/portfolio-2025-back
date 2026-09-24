import type { z } from 'zod';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import {
  slugOption,
  type numeriqueStockee,
  type voteStocke,
} from '../../domain/cours/QuestionStockee';

type EcranDuCours = ContenuDeCours['ecrans'][number];
type Acte = [EcranDuCours, ...EcranDuCours[]];
type EcranDeRecit = Extract<EcranDuCours, { readonly brique: 'fp-story' }>;
type SocleDEcran = Omit<EcranDeRecit, 'brique' | 'proprietes'>;
type ReserveDuRecit = Omit<EcranDeRecit['proprietes'], 'presentation'>;
type EcranDeTri = Extract<EcranDuCours, { readonly brique: 'fp-cardsort' }>;
type ProprietesDeClassement = EcranDeTri['proprietes'];
type CorrectionDeTri = Omit<SocleDEcran, 'diffusion'> & {
  readonly sousTitre: string;
  readonly intitule?: string;
};
type CorrectionDeReponses = Omit<SocleDEcran, 'diffusion' | 'titre'> & {
  readonly titre: string;
  readonly sousTitre?: string;
};
type EcranDExemple = Extract<EcranDuCours, { readonly brique: 'fp-worked' }>;
type VoteDuCours = z.input<typeof voteStocke>;
type NumeriqueDuCours = z.input<typeof numeriqueStockee>;
type AuMoinsUn<T> = [T, ...T[]];
type Piege = readonly [string, ConfusionId];

const TOLERANCE_RELATIVE = { type: 'relative', valeur: 0.0001 } as const;
const TOLERANCE_NULLE = { type: 'absolue', valeur: 0 } as const;
const DEUX_DECIMALES = { type: 'decimales', valeur: 2 } as const;

function mapper<T, U>(
  liste: AuMoinsUn<T>,
  transformer: (element: T) => U,
): AuMoinsUn<U> {
  const [premier, ...suite] = liste;
  return [transformer(premier), ...suite.map(transformer)];
}

function puces(...lignes: AuMoinsUn<string>): string {
  return lignes.map((ligne) => `• ${ligne}`).join('\n');
}

function option(libelle: string, confusion: ConfusionId | null) {
  return { id: slugOption(libelle), libelle, confusion };
}

function vote(
  id: string,
  concept: ConceptId,
  noteCompte: boolean,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUn<Piege>,
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

function numerique(
  id: string,
  concept: ConceptId,
  enonce: string,
  unite: string | null,
  solution: number,
  tolerance: NumeriqueDuCours['tolerance'],
  formePubliee: string,
  pieges: AuMoinsUn<readonly [number, ConfusionId]>,
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
    pieges: mapper(pieges, ([valeur, confusion]) => ({ valeur, confusion })),
  };
}

function ecranV2(
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

interface Carte {
  readonly id: string;
  readonly libelle: string;
  readonly categorie: string;
  readonly confusion: ConfusionId;
  readonly justification: string;
}

function classement(
  plan: {
    readonly id: string;
    readonly intitule: string;
    readonly dureeJeuMs?: number;
  },
  concept: ConceptId,
  categories: AuMoinsUn<readonly [string, string]>,
  cartes: AuMoinsUn<Carte>,
): Pick<ProprietesDeClassement, 'plan' | 'questions'> {
  return {
    plan: {
      ...plan,
      cartes: mapper(cartes, (carte) => ({
        id: carte.id,
        libelle: carte.libelle,
      })),
      categories: mapper(categories, ([id, libelle]) => ({ id, libelle })),
    },
    questions: [
      {
        type: 'classement',
        id: plan.id,
        concept,
        noteCompte: true,
        corrige: {
          type: 'classement',
          attendus: mapper(cartes, (carte) => ({
            carteId: carte.id,
            categorieId: carte.categorie,
            confusionSiErreur: carte.confusion,
            justification: carte.justification,
          })),
          seuilReussite: 0.75,
        },
      },
    ],
  };
}

function suiviDeSaCorrection(
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

function correctionDesReponses(
  { sousTitre, ...socle }: CorrectionDeReponses,
  source: string,
  explications: AuMoinsUn<readonly [string, string]>,
): EcranDeRecit {
  return ecranV2({ ...socle, diffusion: 'seance' }, 'answer-review', {
    title: socle.titre,
    ...(sousTitre === undefined ? {} : { subtitle: sousTitre }),
    source: { screenId: source },
    explications: explications.map(([reference, texte]) => ({
      reference,
      texte,
    })),
  });
}

function suiviDeSonCorrige(
  socle: Omit<SocleDEcran, 'diffusion'>,
  exercice: EcranDExemple,
): [EcranDExemple, EcranDExemple] {
  const { exemple } = exercice.proprietes;
  return [
    exercice,
    {
      ...socle,
      diffusion: 'seance',
      brique: 'fp-worked',
      proprietes: {
        exemple: { ...exemple, id: `${exemple.id}-corrige` },
        etayage: 0,
        pilote: true,
        corrigeDe: exercice.screenId,
      },
    },
  ];
}

function strategie(id: string, libelle: string, fausse = false) {
  return { id, libelle, fausse };
}

const ACTE_1: Acte = [
  {
    screenId: 'B2-01-A1-01-DIAGNOSTIC',
    titre: 'Diagnostic : le prix d’une réparation',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['taux-evolution'],
    notes: puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». 30 s de calcul écrit avant l’apparition des options.',
      'Piège dominant : « +20 % » (division par 100, la valeur d’arrivée). Contrôle à faire dire : 80 × 1,25 = 100.',
      'Ne pas s’attarder : la situation revient en atelier 1 (Q6, taux de marge) et en atelier 2 (Q5, à l’envers).',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        vote(
          'b2-01-a1-diagnostic',
          'taux-evolution',
          true,
          'Le prix d’une réparation de voile passe de 80 € à 100 €. De quel pourcentage a-t-il augmenté ?',
          '+25 %',
          [
            ['+20 %', 'base-arrivee'],
            ['+20 €', 'ecart-absolu-au-lieu-du-taux'],
            ['+125 %', 'coefficient-confondu-avec-taux'],
          ],
        ),
      ],
      delaiMs: 30000,
      consigne:
        'Écrivez votre calcul avant de voir les propositions : elles apparaissent au bout de 30 secondes.',
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A1-02-ACCROCHE',
      titre: 'Lire un chiffre, ce n’est pas le croire',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        'Présenter Atelier Rivage en une phrase ; faire sortir les calculatrices.',
        'Question à la classe : « À quoi sert un tableau de bord ? » (à décider).',
        'Transition : « Voici le courriel reçu ce matin. »',
      ),
    },
    'hero',
    {
      title: 'Lire un chiffre, ce n’est pas le croire',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Lundi, 9 h : le comité de direction se réunit jeudi. Votre mission : fiabiliser le tableau de bord 2025.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · premier cours de mathématiques',
        '3 h 30 · 6 actes',
      ],
      bgImage: '/assets/cours/b2-01/v3/playfair-ecosse-1786.webp',
      bgImageAlt:
        'Graphique en barres de William Playfair (1786) : exportations et importations de l’Écosse avec ses partenaires commerciaux sur une année',
    },
  ),
  {
    screenId: 'B2-01-A1-03-MISSION',
    titre: 'Votre mission chez Atelier Rivage',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 4,
    concepts: ['contrat-de-lecture'],
    notes: puces(
      'Lecture à voix haute (90 s), puis 2 min d’écriture individuelle.',
      'Au pupitre, lire deux réponses à « Que mesure chaque chiffre ? » : l’une parle d’un montant, l’autre d’un taux. « Gagner plus » peut vouloir dire les deux : c’est le fil de la séance.',
      'Transition : « Regardons le tableau de bord tel qu’il a été envoyé. »',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 8 h 40. Hélène Garnier, la dirigeante, vous transfère le tableau de bord 2025 préparé par Samir Haddad, responsable commercial : « Samir annonce une excellente année et veut investir dans la marketplace. Est-ce qu’on gagne vraiment plus qu’en 2024 ? Préparez-moi un dossier fiable pour le comité de jeudi. »',
      geste:
        'Avant de recommander un investissement, répondez par écrit aux trois questions ci-dessous.',
      consequence:
        'Si le comité décide sur un chiffre mal lu, Atelier Rivage peut investir dans le canal qui dégrade sa rentabilité.',
      questionsLibres: [
        {
          id: 'b2-01-a1-mission:mesure',
          question: 'Que mesure chaque chiffre ?',
          placeholder: 'Un montant, une part, une évolution…',
        },
        {
          id: 'b2-01-a1-mission:comparable',
          question: 'Les bases et les périodes sont-elles comparables ?',
          placeholder: 'Même base de départ, même période ?',
        },
        {
          id: 'b2-01-a1-mission:recalcul',
          question: 'Que faudrait-il recalculer avant de décider ?',
          placeholder: 'Un ou deux chiffres à refaire…',
        },
      ],
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A1-04-TABLEAU-DE-BORD',
      titre: 'Tableau de bord 2025 transmis au comité',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        '1 min de lecture silencieuse ; ne rien commenter, ne rien corriger.',
        'Anomalies à laisser trouver au tri : « −2,3 % » (écart de deux taux), « +1 200 » et « 4,9 » (sans unité), « Taux de marge » (lequel ?), toile à 20,80 € (le vrai prix, 20,70 €, sort en acte 4).',
        'Transition : « Avant de discuter des chiffres, classons-les. »',
      ),
    },
    'table',
    {
      title: 'Tableau de bord 2025 transmis au comité',
      subtitle:
        'Avant de calculer, repérez pour chaque ligne ce qu’elle mesure, sa base et sa période.',
      columns: [
        { key: 'indicateur', label: 'Indicateur' },
        { key: 'a2024', label: '2024' },
        { key: 'a2025', label: '2025' },
        { key: 'evolution', label: 'Évolution affichée' },
      ],
      rows: [
        {
          indicateur: 'CA HT total',
          a2024: '1 050 000 €',
          a2025: '1 150 000 €',
          evolution: '+9,5 %',
        },
        {
          indicateur: 'CA HT de la marketplace',
          a2024: '357 000 €',
          a2025: '523 000 €',
          evolution: '+46,5 %',
        },
        {
          indicateur: 'Marge brute',
          a2024: '289 800 €',
          a2025: '291 000 €',
          evolution: '+1 200',
        },
        {
          indicateur: 'Taux de marge',
          a2024: '27,6 %',
          a2025: '25,3 %',
          evolution: '−2,3 %',
        },
        {
          indicateur: 'Prix de la toile (€ par m², au 31 décembre)',
          a2024: '20,00',
          a2025: '20,80',
          evolution: '+4 %',
        },
        { indicateur: 'Inflation', a2024: '—', a2025: '4,9', evolution: '—' },
      ],
      note: 'Données fictives Atelier Rivage, créées pour ce cours.',
    },
  ),
  ...suiviDeSaCorrection(
    {
      screenId: 'B2-01-A1-05-CORRECTION',
      titre: 'Correction : ce que dit chaque chiffre du tableau de bord',
      sousTitre:
        'Un pourcentage se lit avec sa base : part d’un total, évolution depuis une valeur de départ, ou écart entre deux taux, en points.',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        'Commencer par les deux cartes les plus ratées (taux d’erreur au pupitre).',
        'Faire dire à un binôme pourquoi sa carte bordée de rouge change de colonne.',
        'Transition : « Un taux n’est une information que si l’on connaît sa fiche d’identité. »',
      ),
    },
    {
      screenId: 'B2-01-A1-05-ANATOMIE',
      titre: 'Que dit chaque chiffre du tableau de bord ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        'Binômes, 5 min de tri ; annoncer « plus qu’une minute » à 4 min. Chacun envoie depuis son poste.',
        'Cartes les plus ratées : « Taux de marge : −2,3 % » (des points) et « Inflation : 4,9 » (ambigu, pas une évolution).',
        'Relance pour toute carte discutée : « Rapporté à quoi ? »',
        'Les 3 dernières minutes : débriefing sur l’écran de correction suivant.',
      ),
      proprietes: {
        modalite: 'binome',
        renvoi: 'B2-01-A1-04-TABLEAU-DE-BORD',
        ...classement(
          {
            id: 'b2-01-a1-anatomie',
            intitule:
              'Classez chaque chiffre du tableau de bord selon ce qu’il exprime.',
          },
          'contrat-de-lecture',
          [
            ['valeur', 'Valeur en euros'],
            ['proportion', 'Proportion : part d’un total'],
            [
              'evolution',
              'Évolution : variation par rapport à une valeur de départ',
            ],
            ['points', 'Écart entre deux taux, en points'],
            ['ambigu', 'Ambigu en l’état : unité, base ou période manquante'],
          ],
          [
            {
              id: 'ca-2025',
              libelle: 'CA HT 2025 : 1 150 000 €',
              categorie: 'valeur',
              confusion: 'valeur-confondue-avec-taux',
              justification: 'montant en euros : « combien ? »',
            },
            {
              id: 'evolution-ca',
              libelle: 'CA : « +9,5 % » par rapport à 2024',
              categorie: 'evolution',
              confusion: 'proportion-confondue-avec-evolution',
              justification: 'variation rapportée à la valeur de 2024',
            },
            {
              id: 'part-entretien',
              libelle: 'Entretien : 20 % du CA 2025',
              categorie: 'proportion',
              confusion: 'proportion-confondue-avec-evolution',
              justification: '230 000 € rapportés à 1 150 000 €',
            },
            {
              id: 'taux-marge',
              libelle: 'Taux de marge 2025 : 25,3 %',
              categorie: 'proportion',
              confusion: 'proportion-confondue-avec-evolution',
              justification:
                'marge brute rapportée au CA HT de la même année : une part',
            },
            {
              id: 'ecart-taux',
              libelle: 'Taux de marge : « −2,3 % » par rapport à 2024',
              categorie: 'points',
              confusion: 'points-confondus-avec-pourcentage',
              justification:
                'libellé imprécis (taux de marge brute) et unité fausse : −2,3 points',
            },
            {
              id: 'marge-sans-unite',
              libelle:
                'Marge brute : « +1 200 » (colonne « Évolution affichée », dont les autres lignes sont en %)',
              categorie: 'ambigu',
              confusion: 'unite-manquante-ignoree',
              justification:
                'euros ou pourcentage ? Dans une colonne de %, un nombre sans unité est ambigu',
            },
            {
              id: 'inflation',
              libelle: 'Inflation : « 4,9 »',
              categorie: 'ambigu',
              confusion: 'unite-manquante-ignoree',
              justification: 'ni unité, ni période, ni source',
            },
            {
              id: 'toile',
              libelle: 'Prix de la toile : « +4 % » sur l’année',
              categorie: 'evolution',
              confusion: 'proportion-confondue-avec-evolution',
              justification:
                'variation depuis le 1er janvier (calcul à vérifier à l’acte 4)',
            },
          ],
        ),
      },
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A1-06-FICHE-INDICATEUR',
      titre: '27,6 % : la fiche d’identité d’un taux',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['contrat-de-lecture', 'pourcentage', 'taux-evolution'],
      notes: puces(
        'Retourner les six cartes une à une, classe entière.',
        'Calcul à faire dire : 289 800 ÷ 1 050 000 = 0,276, soit « pour 100 € de CA HT, 27,60 € de marge brute ».',
        'Relances : « Que manque-t-il à "Inflation : 4,9" ? » (unité, période, source) ; « Quel dénominateur écrire à côté de "Taux de marge" chez Samir ? » (le CA HT).',
        'Piège : taux de marge (÷ coût d’achat) ≠ taux de marque (÷ prix de vente) ; il revient en atelier 1, Q6.',
      ),
    },
    'grid',
    {
      title: '27,6 % : la fiche d’identité d’un taux',
      subtitle:
        'Un taux devient une information quand on sait ce qu’il rapporte, à quoi, quand, pour qui et d’où il vient.',
      items: [
        {
          title: 'Mesure',
          description: 'Quel indicateur ?',
          back: 'Taux de marge brute (sur CA HT) = marge brute ÷ CA HT. Ici, marge brute = CA HT − coûts directs (matière, sous-traitance, commissions) : c’est une marge sur coûts directs.',
        },
        {
          title: 'Base',
          description: 'Rapporté à quoi ?',
          back: '289 800 € de marge brute pour 1 050 000 € de CA HT. Pour une évolution, la base est la valeur de départ : t = (y₂ − y₁) ÷ y₁, donc y₂ = (1 + t) × y₁.',
        },
        {
          title: 'Période',
          description: 'Quand ?',
          back: 'Exercice 2024, du 1er janvier au 31 décembre.',
        },
        {
          title: 'Périmètre',
          description: 'Pour qui ?',
          back: 'Atelier Rivage, trois canaux : sur-mesure, entretien, marketplace.',
        },
        {
          title: 'Source',
          description: 'D’où vient le montant ?',
          back: 'Compte de résultat 2024 et grand livre (comptes de produits et de charges directes).',
        },
        {
          title: 'Un mot, trois taux',
          description: '« Taux de marge » : lequel ?',
          back: 'Taux de marge = marge ÷ coût d’achat HT (une hausse depuis le coût). Taux de marque = marge ÷ prix de vente HT (une part du prix). Taux de marge commerciale = marge commerciale ÷ ventes de marchandises (soldes intermédiaires de gestion). Écrivez toujours le dénominateur.',
        },
      ],
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A1-07-PLAN',
      titre: 'Le plan de la séance',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture'],
      notes: '',
    },
    'method-path',
    {
      title: 'Le plan de la séance',
      steps: [
        {
          id: 'lire',
          title: 'Acte 1 · Diagnostiquer',
          question: 'Que mesure chaque chiffre ?',
          proof: 'Unité, base, période, périmètre, source.',
          result: 'Le tableau de bord annoté : chaque chiffre qualifié.',
        },
        {
          id: 'comparer',
          title: 'Acte 2 · Auditer',
          question: 'Compare-t-on la même chose ?',
          proof: 'Population de référence, axe, ordre de grandeur.',
          result: 'Des comparaisons justes et défendables.',
        },
        {
          id: 'evoluer',
          title: 'Acte 3 · Calculer les évolutions',
          question: 'Quelle base, quel coefficient ?',
          proof: 'Écart, taux, coefficient, indice.',
          result:
            'Des évolutions justes, y compris successives et réciproques.',
        },
        {
          id: 'outiller',
          title: 'Acte 4 · Outiller au tableur',
          question: 'La feuille se contrôle-t-elle seule ?',
          proof: 'Formules, références, contrôles, graphique.',
          result: 'Un classeur contrôlable qu’un tiers peut reproduire.',
        },
        {
          id: 'defendre',
          title: 'Acte 5 · Défendre au comité',
          question: 'Quel mécanisme explique l’écart ?',
          proof: 'Poids, répartition, preuve, limite.',
          result:
            'Une recommandation fondée sur les poids, les scénarios et les limites.',
        },
        {
          id: 'transferer',
          title: 'Acte 6 · Transférer',
          question: 'Saurez-vous le refaire seul·e ?',
          proof: 'Situation nouvelle, réponse d’IA corrigée, rappel.',
          result: 'Une fiche mémo pour le CCF.',
        },
      ],
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A1-08-QUESTION-DE-GESTION',
      titre: 'La question d’Hélène, en chiffres',
      diffusion: 'seance',
      dureeMinutes: 3,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        '2 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Refuser toute réponse sans période (2024 → 2025) ou sans dénominateur (CA HT).',
        'Attendu : deux mesures, un montant (marge brute en €) et un taux (marge ÷ CA HT).',
        'Transition : « Samir a déjà répondu à sa façon : avec une diapositive. »',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-01-a1-question-gestion',
        type: 'reflection',
        question:
          'Hélène demande : « Est-ce qu’on gagne vraiment plus qu’en 2024 ? » Réécrivez sa question pour qu’un chiffre puisse y répondre : quel indicateur, rapporté à quoi, sur quelle période, pour quel périmètre ?',
        placeholder: 'Indicateur… rapporté à… entre… et… pour…',
        competency: 'S’informer · formuler une question mesurable',
      },
    },
    {
      correction: {
        expected:
          'Par exemple : la marge brute d’Atelier Rivage (trois canaux) a-t-elle augmenté entre 2024 et 2025, en euros et rapportée au CA HT ? Deux réponses sont attendues : un montant et un taux.',
        nextAction:
          'Vérifiez que votre question nomme un indicateur, un dénominateur, deux dates et un périmètre.',
      },
      renvoi: 'B2-01-A1-03-MISSION',
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A1-09-DIAPOSITIVE',
      titre: 'La diapositive de Samir',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['lecture-graphique'],
      notes: puces(
        '30 s de projection sans commentaire, puis : « Peut-on la montrer jeudi ? » Pas de réponse orale : on écrit à l’écran suivant.',
        'Chiffre de contrôle : sur un axe de 284 000 à 292 000 €, la barre 2025 est 7 fois plus haute que celle de 2022 (7 000 € contre 1 000 € au-dessus de l’origine), pour +2,1 % réel.',
        'Transition : « Écrivez ce que vous vérifieriez avant de répondre à Hélène. »',
      ),
    },
    'chart',
    {
      title: 'Marge brute : une croissance continue',
      caption: 'Extrait du support commercial présenté au comité',
      context:
        'Voici la diapositive que Samir veut projeter jeudi, avec son commentaire : « la marge brute progresse nettement chaque année ».',
      labels: ['2022', '2023', '2024', '2025'],
      series: [
        {
          label: 'Marge brute',
          values: [285000, 288000, 289800, 291000],
          tone: 'gold',
        },
      ],
      axisRanges: [[284000, 292000]],
      axisLabels: ['284 000 à 292 000 €'],
      unit: '€',
      source: 'Service commercial d’Atelier Rivage (données fictives).',
      description:
        'Diagramme en barres : marge brute de 2022 à 2025, axe vertical de 284 000 € à 292 000 € ; barres de 285 000 €, 288 000 €, 289 800 € et 291 000 €.',
    },
  ),
  {
    screenId: 'B2-01-A1-10-AUDIT-DIAPOSITIVE',
    titre: 'Audit de la diapositive',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 2,
    concepts: ['lecture-graphique'],
    notes: puces(
      '2 min d’écriture individuelle, puis révélation au pupitre.',
      'Repérer ceux qui citent l’axe et ceux qui ne citent que la couleur ou le titre.',
      'Avant de révéler, faire trouver la piste fausse : changer la couleur ne corrige rien.',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-01-a1-audit-diapositive',
        enonce:
          'Sur la diapositive de Samir, la barre 2025 est sept fois plus haute que la barre 2022. Hélène demande si elle peut la projeter telle quelle jeudi.',
        invite:
          'Écrivez trois vérifications à faire avant de lui répondre, puis votre réponse en une phrase.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          strategie(
            'axe',
            'Lire l’origine et l’amplitude de l’axe vertical avant de comparer les hauteurs.',
          ),
          strategie(
            'evolution',
            'Calculer l’évolution réelle entre 2022 et 2025 avant de parler de croissance.',
          ),
          strategie(
            'titre',
            'Vérifier que le titre décrit la mesure au lieu de conclure.',
          ),
          strategie(
            'montant',
            'Comparer la marge au CA : un montant ne dit rien de la rentabilité.',
          ),
          strategie(
            'couleur',
            'Changer la couleur des barres pour rendre le graphique plus neutre.',
            true,
          ),
        ],
      },
      renvoi: 'B2-01-A1-09-DIAPOSITIVE',
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A1-10-CORRECTION',
      titre: 'Correction : l’audit de la diapositive',
      sousTitre:
        'Avant de comparer des hauteurs, on lit l’axe ; avant de parler de croissance, on calcule l’évolution.',
      dureeMinutes: 1,
      concepts: ['lecture-graphique'],
      notes: puces(
        '1 min de mise en commun : faire lire à voix haute deux vérifications justes.',
        'Ne pas donner l’évolution réelle (+2,1 %) : c’est la première question de l’atelier 1.',
        'Transition : jalon 1.',
      ),
    },
    'B2-01-A1-10-AUDIT-DIAPOSITIVE',
    [
      [
        'axe',
        'L’axe vertical part de 284 000 € : la barre 2025 dépasse l’origine de 7 000 €, celle de 2022 de 1 000 €, d’où l’impression d’un rapport de 1 à 7.',
      ],
      [
        'evolution',
        'Avant de parler de croissance, on rapporte l’écart de marge à la valeur de 2022 : c’est la première question de l’atelier 1.',
      ],
      [
        'titre',
        '« Une croissance continue » conclut à la place du lecteur ; un titre de référence décrit la mesure, son unité et sa période.',
      ],
      [
        'montant',
        'Une marge en euros ne dit rien de la rentabilité : il faut la rapporter au CA HT.',
      ],
      [
        'couleur',
        'Changer la couleur ne corrige ni l’axe, ni le titre, ni l’absence de taux : piste fausse.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A1-11-JALON-1',
    titre: 'Jalon 1 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['contrat-de-lecture'],
    notes: puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la fiche A1-06 en 2 min sur « Inflation : 4,9 ».',
      'Transition : « Acte 2 : comparer sans tromper. Retour en 1786. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-01-a1-jalon',
        invite:
          'Je sais dire ce que mesure chaque chiffre du tableau de bord : unité, base, période.',
      },
    },
  },
];

const ACTE_2: Acte = [
  ecranV2(
    {
      screenId: 'B2-01-A2-01-PLAYFAIR',
      titre: '1786 : le graphique devient un langage',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['lecture-graphique'],
      notes: puces(
        'Raconter en 1 min ; montrer que l’écart entre les deux courbes est la balance commerciale.',
        'Relance : « Qu’est-ce qui manque à la diapositive de Samir ? » (une échelle honnête).',
        'Transition : « Déplacez vous-même l’origine de l’axe. »',
      ),
    },
    'image-left',
    {
      title: '1786 : le graphique devient un langage',
      subtitle:
        'En 1786, William Playfair publie les premiers graphiques en courbes et en barres de données économiques. Un coup d’œil peut aussi tromper.',
      image: '/assets/cours/b2-01/v3/playfair-series-1786.webp',
      imageAlt:
        'Graphique de William Playfair (1786) : exportations et importations de l’Angleterre avec le Danemark et la Norvège, de 1700 à 1780, deux courbes dont l’écart figure la balance commerciale',
      paragraphs: [
        'Dans The Commercial and Political Atlas, la balance commerciale de l’Angleterre se lit dans l’écart entre deux courbes.',
        'Son atlas compte 43 courbes et un seul graphique en barres : pour l’Écosse, faute de série sur plusieurs années, il compare 17 partenaires sur une seule année. La forme suit la donnée disponible.',
        'Le graphique accélère la comparaison ; il ne remplace ni les valeurs, ni l’axe, ni la source. C’est ce contrat de lecture que vous appliquez à la diapositive de Samir.',
      ],
      items: ['Titre', 'Axes et échelle', 'Séries', 'Source'],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries.png',
        label: 'Document original · Wikimedia Commons (domaine public)',
      },
    },
  ),
  {
    screenId: 'B2-01-A2-02-ORIGINE-AXE',
    titre: 'La diapositive de Samir — axe réglable',
    diffusion: 'catalogue',
    brique: 'fp-plot',
    dureeMinutes: 2,
    concepts: ['lecture-graphique'],
    notes: puces(
      'Chacun passe de « Axe de Samir » à « Axe à zéro ».',
      'Faire lire le rapport des hauteurs : ×7 avec l’axe à 284 000 €, ≈ ×1,02 avec l’axe à zéro ; la barre 2025 vaut toujours 291 000 €.',
      'Phrase à faire dire : « L’échelle change l’impression, pas la donnée ».',
    ),
    proprietes: {
      renvoi: 'B2-01-A1-09-DIAPOSITIVE',
      id: 'b2-01-a2-origine-axe',
      titre: 'Diapositive de Samir : marge brute et axe réglable',
      source: 'Service commercial d’Atelier Rivage (données fictives).',
      forme: 'barres',
      unite: 'euros',
      abscisse: { libelle: 'Année', min: 0, max: 3 },
      etiquettes: ['2022', '2023', '2024', '2025'],
      ordonnee: 'Marge brute (€)',
      bornesOrdonnee: { minParametre: 'origine', max: 292000 },
      parametres: [
        {
          cle: 'origine',
          libelle: 'Origine de l’axe vertical (€)',
          min: 0,
          max: 284000,
          pas: 4000,
          defaut: 284000,
        },
      ],
      prereglages: [
        { libelle: 'Axe de Samir', valeurs: { origine: 284000 } },
        { libelle: 'Axe à zéro', valeurs: { origine: 0 } },
      ],
      reference: 'Axe de Samir',
      series: [
        {
          id: 'marge',
          libelle: 'Marge brute',
          trait: 'plein',
          calcul:
            'SI(x<=1;285000+3000*x;SI(x<=2;288000+1800*(x-1);289800+1200*(x-2)))',
        },
      ],
      description:
        'Passez de « Axe de Samir » à « Axe à zéro », puis faites glisser l’origine de l’axe vertical. Combien de fois la barre 2025 paraît-elle plus haute que celle de 2022 dans chaque cas ? Les montants, eux, ne bougent pas.',
    },
  },
  {
    screenId: 'B2-01-A2-03-ATELIER-1',
    titre: 'Atelier 1 — Lire, rapporter, estimer',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['lecture-graphique', 'proportion'],
    notes: puces(
      '5 min de travail sur les questions 1 à 3 (annoncer « plus qu’une minute » à 4 min), puis 1 min de comparaison avec le voisin.',
      'Pièges : Q1 « sept fois plus » (axe) ; Q3 « 84 % des commandes, donc 84 % du CA ».',
      'Contrôle à faire dire : 1 150 000 × 0,455 ≈ 523 000.',
    ),
    proprietes: {
      renvoi: 'B2-01-A1-09-DIAPOSITIVE',
      intitule: 'Atelier 1 — Lire, rapporter, estimer (questions 1 à 3)',
      consigne:
        'Calculatrice autorisée. Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        vote(
          'b2-01-a2-evolution-marge',
          'lecture-graphique',
          true,
          'La diapositive de Samir montre une marge brute passée de 285 000 € (2022) à 291 000 € (2025). Quelle évolution réelle représente-t-elle ?',
          '+2,1 % en trois ans',
          [
            [
              'Environ sept fois plus de marge qu’en 2022',
              'axe-tronque-lu-comme-ecart',
            ],
            ['+6 000 € : une forte croissance', 'ecart-absolu-au-lieu-du-taux'],
          ],
          ['+2,1 %', 'trois ans'],
        ),
        numerique(
          'b2-01-a2-part-marketplace',
          'proportion',
          'En 2025, la marketplace réalise 523 000 € d’un CA HT total de 1 150 000 €. Quelle part du CA représente-t-elle ? Réponse en %, arrondie au dixième.',
          '%',
          45.478261,
          { type: 'absolue', valeur: 0.05 },
          '45,5',
          [
            [0.454783, 'taux-valeur-facteur-cent'],
            [219.885277, 'base-inversee'],
          ],
        ),
        vote(
          'b2-01-a2-population-reference',
          'proportion',
          true,
          'La marketplace traite 4 200 des 5 000 commandes de 2025, soit 84 %. Samir en conclut qu’elle réalise « l’essentiel du chiffre d’affaires ». Que lui répondez-vous ?',
          'Rien ne le prouve : 84 % des commandes ne disent rien de la part du CA.',
          [
            [
              'Il a raison : 84 % des commandes, c’est environ 84 % du CA.',
              'population-reference-ignoree',
            ],
            [
              'Il a tort : il fallait diviser 5 000 par 4 200.',
              'base-inversee',
            ],
          ],
          ['commandes', 'part du CA'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A2-03-CORRECTION-1',
      titre: 'Correction de l’atelier 1 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['lecture-graphique', 'proportion'],
      notes: puces(
        'Commencer par la question la moins réussie (score affiché sous chaque correction).',
        'Rapprocher Q2 et Q3 : la marketplace fait 84 % des commandes mais 45,5 % du CA ; même canal, deux populations de référence.',
        'Q1 : si « +6 000 € : une forte croissance » domine, faire rapporter l’écart à 285 000 € : +2,1 %.',
        'Transition : « Trois questions de plus : deux évolutions, puis marge et marque. »',
      ),
    },
    'B2-01-A2-03-ATELIER-1',
    [
      [
        'b2-01-a2-evolution-marge',
        '(291 000 − 285 000) ÷ 285 000 ≈ 0,021 : +2,1 % en trois ans. La hauteur des barres dépendait de l’axe, pas de la marge.',
      ],
      [
        'b2-01-a2-part-marketplace',
        '523 000 ÷ 1 150 000 ≈ 0,455, soit 45,5 % du CA. Contrôle : 1 150 000 × 0,455 ≈ 523 000.',
      ],
      [
        'b2-01-a2-population-reference',
        '84 % des commandes ne disent rien de la part du CA : une commande de la marketplace rapporte moins qu’une voile sur mesure. Nommez toujours la population de référence.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A2-03-ATELIER-1-SUITE',
    titre: 'Atelier 1 — Lire, rapporter, estimer (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 6,
    concepts: ['taux-evolution', 'pourcentage'],
    notes: puces(
      '5 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 à 3).',
      'Pièges : sur-mesure (Q4) −21,66 % (÷ 397 000) ou 17,81 sans signe ; commandes (Q5) ≈ +31 % (÷ 4 200) ; marque et marge (Q6) inversées.',
      'Contrôles à faire dire : 483 000 × 0,822 ≈ 397 000 ; 80 × 1,25 = 100.',
    ),
    proprietes: {
      intitule: 'Atelier 1 — Lire, rapporter, estimer (questions 4 à 6)',
      consigne:
        'Calculatrice autorisée, sauf pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        numerique(
          'b2-01-a2-evolution-sur-mesure',
          'taux-evolution',
          'Le CA HT du sur-mesure passe de 483 000 € (2024) à 397 000 € (2025). Quel est son taux d’évolution ? Réponse en %, arrondie au centième, signe compris.',
          '%',
          -17.805383,
          DEUX_DECIMALES,
          '−17,81',
          [
            [-21.662469, 'base-arrivee'],
            [-86000, 'ecart-absolu-au-lieu-du-taux'],
            [82.194617, 'coefficient-confondu-avec-taux'],
            [17.805383, 'sens-de-variation'],
          ],
        ),
        vote(
          'b2-01-a2-ordre-de-grandeur',
          'taux-evolution',
          true,
          'Sans calculatrice : le nombre de commandes de la marketplace passe de 2 900 (2024) à 4 200 (2025). La hausse est d’environ…',
          'Environ +45 %',
          [
            ['Environ +31 %', 'base-arrivee'],
            ['Environ +1 300 %', 'ecart-absolu-au-lieu-du-taux'],
          ],
        ),
        vote(
          'b2-01-a2-marge-marque',
          'pourcentage',
          true,
          'Atelier Rivage achète un sac étanche 80 € HT à son atelier partenaire et le revend 100 € HT. Quelle affirmation est exacte ?',
          'Taux de marque : 20 % ; taux de marge : 25 %',
          [
            [
              'Taux de marque : 25 % ; taux de marge : 20 %',
              'marque-confondue-avec-marge',
            ],
            ['Taux de marque : 20 % ; taux de marge : 20 %', 'base-arrivee'],
          ],
          ['marque : 20 %', 'marge : 25 %'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A2-03-CORRECTION-2',
      titre: 'Correction de l’atelier 1 : questions 4 à 6',
      dureeMinutes: 1,
      concepts: ['taux-evolution', 'pourcentage'],
      notes: puces(
        'Commencer par la question la moins réussie ; à l’écran, elles sont numérotées 1 à 3.',
        'Sur-mesure : nommer les deux erreurs, −21,66 % (÷ 397 000, la valeur d’arrivée) et 17,81 sans signe moins.',
        'Transition : « Remettons la diapositive de Samir d’aplomb. »',
      ),
    },
    'B2-01-A2-03-ATELIER-1-SUITE',
    [
      [
        'b2-01-a2-evolution-sur-mesure',
        '(397 000 − 483 000) ÷ 483 000 ≈ −17,8 %. On divise par la valeur de départ (483 000 €), pas par celle d’arrivée.',
      ],
      [
        'b2-01-a2-ordre-de-grandeur',
        '1 300 commandes de plus pour 2 900 au départ : un peu moins de la moitié, soit environ +45 %. Contrôle : 2 900 × 1,45 ≈ 4 200.',
      ],
      [
        'b2-01-a2-marge-marque',
        'Marge : 20 €. Taux de marque = 20 ÷ 100 = 20 % (sur le prix de vente) ; taux de marge = 20 ÷ 80 = 25 % (sur le coût d’achat), la même hausse qu’au diagnostic.',
      ],
    ],
  ),
  ecranV2(
    {
      screenId: 'B2-01-A2-04-MARGE-AXE-ZERO',
      titre: 'Marge brute 2022–2025, axe à zéro',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['lecture-graphique', 'taux-evolution'],
      notes: puces(
        'Projeter à côté de la diapositive de Samir si possible.',
        'Faire nommer les quatre exigences d’un graphique de référence : titre descriptif, unité, source, phrase de lecture chiffrée.',
        'Transition : « Cinq écritures reviennent sans cesse : fixons-les. »',
      ),
    },
    'chart',
    {
      title: 'Marge brute d’Atelier Rivage, 2022–2025',
      caption: 'Axe vertical de 0 à 300 000 €',
      labels: ['2022', '2023', '2024', '2025'],
      series: [
        {
          label: 'Marge brute',
          values: [285000, 288000, 289800, 291000],
          tone: 'teal',
        },
      ],
      axisRanges: [[0, 300000]],
      axisLabels: ['0 à 300 000 €'],
      unit: '€',
      formula: 'Évolution 2022–2025 = (291 000 − 285 000) ÷ 285 000 ≈ 0,021',
      reading:
        'De 2022 à 2025, la marge brute passe de 285 000 € à 291 000 € : +6 000 €, soit +2,1 % en trois ans. Les hausses annuelles ralentissent : +1,05 %, +0,63 %, puis +0,41 %.',
      source:
        'Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives).',
      description:
        'Diagramme en barres à partir de zéro : quatre barres presque égales, de 285 000 € en 2022 à 291 000 € en 2025.',
    },
    { renvoi: 'B2-01-A1-09-DIAPOSITIVE' },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A2-05-ECRITURES',
      titre: 'Cinq écritures, cinq questions',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['pourcentage', 'point-de-pourcentage'],
      notes: puces(
        'Faire associer chaque écriture à une carte du tri A1-05.',
        'Relance : « Quelle écriture aurait dû remplacer "−2,3 %" dans le tableau de bord ? » (−2,3 points).',
        'Piège : confondre +9,5 % (évolution) et 20 % (proportion) : les deux s’écrivent en %.',
      ),
    },
    'stats',
    {
      title: 'Cinq écritures, cinq questions',
      subtitle:
        'Chaque écriture répond à une question différente ; les mélanger dans une note crée une erreur de décision.',
      stats: [
        {
          value: '100 000 €',
          label: 'valeur : combien ? (hausse du CA HT en 2025)',
        },
        {
          value: '20 %',
          label:
            'proportion : quelle part du total ? (l’entretien dans le CA 2025)',
        },
        {
          value: '+9,5 %',
          label:
            'évolution : de combien par rapport au départ ? (CA HT 2024 → 2025)',
        },
        {
          value: '−2,3 points',
          label: 'écart entre deux taux (taux de marge brute 2024 → 2025)',
        },
        {
          value: 'indice 112',
          label: 'niveau relatif : +12 % par rapport à la base 100',
        },
      ],
    },
    { renvoi: 'B2-01-A1-05-CORRECTION' },
  ),
  ...suiviDeSonCorrige(
    {
      screenId: 'B2-01-A2-06-CORRECTION',
      titre: 'Correction : points ou pourcentage',
      dureeMinutes: 2,
      concepts: ['point-de-pourcentage'],
      notes: puces(
        'Révéler une étape à la fois (« Corriger une étape de plus »), après avoir lu une réponse d’élève à l’étape.',
        'S’arrêter sur l’étape 3 : la phrase du comité donne les points et l’évolution relative, jamais « −2,3 % ».',
        'Transition : « Mini-jeu : tout n’est pas comparable. »',
      ),
    },
    {
      screenId: 'B2-01-A2-06-POINTS',
      titre: 'Points ou pourcentage : la phrase du comité',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 2,
      concepts: ['point-de-pourcentage'],
      notes: puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'À l’étape 1, guetter « −2,3 % » : exiger « points ».',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: 'B2-01-A1-04-TABLEAU-DE-BORD',
        exemple: {
          id: 'b2-01-a2-points',
          enonce:
            'Le taux de marge brute passe de 27,60 % (2024) à 25,30 % (2025). Hélène veut une phrase juste pour le comité.',
          etapes: [
            {
              id: 'ecart',
              intitule: 'Écart entre les deux taux',
              raisonnement:
                '25,30 − 27,60 = −2,30. Un écart entre deux pourcentages se mesure en points de pourcentage : −2,30 points.',
              invite:
                'Quel est l’écart entre les deux taux, et dans quelle unité s’exprime-t-il ?',
            },
            {
              id: 'relatif',
              intitule: 'Évolution relative du taux',
              raisonnement:
                '−2,30 ÷ 27,60 ≈ −0,083, soit −8,3 % : le taux lui-même a perdu 8,3 % de sa valeur.',
              invite:
                'De quel pourcentage le taux lui-même a-t-il baissé par rapport à celui de 2024 ?',
            },
            {
              id: 'phrase',
              intitule: 'Phrase pour le comité',
              raisonnement:
                '« Le taux de marge brute recule de 2,3 points (de 27,6 % à 25,3 %), soit une baisse relative de 8,3 %. »',
              invite:
                'Quelle phrase écrivez-vous pour le comité, sans utiliser « −2,3 % » ?',
            },
            {
              id: 'controle',
              intitule: 'Contrôle',
              raisonnement:
                '27,60 × (1 − 0,083) ≈ 25,31 : l’évolution relative redonne le taux d’arrivée, à l’arrondi près.',
              invite:
                'En appliquant cette baisse relative à 27,60 %, retrouvez-vous le taux de 2025 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  ...suiviDeSaCorrection(
    {
      screenId: 'B2-01-A2-07-CORRECTION',
      titre: 'Correction : comparable ou pas ?',
      intitule: 'Correction du mini-jeu',
      sousTitre:
        'Comparable si même unité, même périmètre et même période ; sinon on retraite, ou on cherche la donnée manquante.',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        'Commencer par les deux cartes les plus ratées (pupitre).',
        'Pour chaque retraitement, faire dire l’opération : TTC ÷ 1,2 ; prix du rouleau ÷ 50 ; CA 2025 − 523 000 €.',
        'Transition : jalon 2, puis acte 3.',
      ),
    },
    {
      screenId: 'B2-01-A2-07-JEU-COMPARABLE',
      titre: 'Mini-jeu : comparable ou pas ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['contrat-de-lecture'],
      notes: puces(
        'Binômes, chrono de 5 min (annoncer la dernière minute), puis débriefing sur l’écran de correction.',
        'Cartes à risque : « semestre / année » (activité saisonnière : doubler un semestre ne donne pas l’année) et « inflation » (4,9 = inflation 2023, pas 2025).',
      ),
      proprietes: {
        modalite: 'binome',
        ...classement(
          {
            id: 'b2-01-a2-comparable',
            intitule:
              'Mini-jeu : comparable ou pas ? Classez les neuf comparaisons avant la fin du chrono.',
            dureeJeuMs: 300000,
          },
          'contrat-de-lecture',
          [
            ['directe', 'Comparable directement'],
            ['retraitement', 'Comparable après retraitement'],
            ['impossible', 'Pas comparable sans nouvelle donnée'],
          ],
          [
            {
              id: 'mars',
              libelle: 'CA de mars 2025 / CA de mars 2024',
              categorie: 'directe',
              confusion: 'bases-incompatibles',
              justification: 'même mois, même périmètre, même unité',
            },
            {
              id: 'taux',
              libelle:
                'Taux de marge brute 2024 / 2025 d’Atelier Rivage (même définition)',
              categorie: 'directe',
              confusion: 'bases-incompatibles',
              justification: 'écart en points',
            },
            {
              id: 'salarie',
              libelle:
                'CA par salarié 2025 (14 salariés) / CA par salarié 2024 (12 salariés)',
              categorie: 'directe',
              confusion: 'bases-incompatibles',
              justification: 'ratios rapportés à la même base',
            },
            {
              id: 'ht-ttc',
              libelle: 'Marge brute HT 2025 / ventes TTC 2025',
              categorie: 'retraitement',
              confusion: 'bases-incompatibles',
              justification: 'ramener les ventes en HT : TTC ÷ 1,2',
            },
            {
              id: 'rouleau',
              libelle:
                'Prix de la toile en € par m² / prix en € par rouleau de 50 m²',
              categorie: 'retraitement',
              confusion: 'bases-incompatibles',
              justification: 'diviser le prix du rouleau par 50',
            },
            {
              id: 'perimetre',
              libelle:
                'CA 2025 d’Atelier Rivage (trois canaux) / CA 2024 de l’atelier seul, sans la marketplace',
              categorie: 'retraitement',
              confusion: 'bases-incompatibles',
              justification: 'retirer la marketplace du CA 2025 (523 000 €)',
            },
            {
              id: 'secteur',
              libelle:
                'Taux de marge brute d’Atelier Rivage / « taux de marge moyen des voileries » lu dans la presse',
              categorie: 'impossible',
              confusion: 'bases-incompatibles',
              justification: 'définition, période et périmètre inconnus',
            },
            {
              id: 'inflation',
              libelle:
                'Hausse des tarifs d’Atelier Rivage en 2025 / « Inflation : 4,9 » du tableau de bord',
              categorie: 'impossible',
              confusion: 'bases-incompatibles',
              justification:
                '« 4,9 » est l’inflation de 2023 : il faut celle de 2025, publiée par l’Insee',
            },
            {
              id: 'semestre',
              libelle:
                'CA du 1er semestre 2025 / CA annuel 2024 (le fichier 2024 ne contient que le total annuel)',
              categorie: 'impossible',
              confusion: 'bases-incompatibles',
              justification:
                'activité saisonnière : doubler un semestre ne donne pas l’année ; il faut le 1er semestre 2024',
            },
          ],
        ),
      },
    },
  ),
  {
    screenId: 'B2-01-A2-08-JALON-2',
    titre: 'Jalon 2 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['contrat-de-lecture'],
    notes: puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la Q3 de l’atelier 1 (commandes ≠ CA) et la Q6 (coût ≠ prix de vente).',
      'Transition : « Acte 3 : un prix monte, puis redescend. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-01-a2-jalon',
        invite:
          'Je sais choisir la bonne base et repérer une comparaison trompeuse (axe, population de référence, taux de marge ou de marque).',
      },
    },
  },
];

const CONSIGNE_DE_L_ATELIER_2 =
  'Calculatrice autorisée. Base 100 = moyenne annuelle 2019. Taux annuels moyens de l’Insee : 2020 : 0,5 % ; 2021 : 1,6 % ; 2022 : 5,2 % ; 2023 : 4,9 % ; 2024 : 2,0 % ; 2025 : 0,9 %.';

const ACTE_3: Acte = [
  {
    screenId: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
    titre: 'Vote : +10 %, puis −10 %',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['evolutions-successives'],
    notes: puces(
      'Vote 1 individuel, sans calculatrice.',
      'Entre 30 et 70 % de bonnes réponses : débat en binôme « convainquez votre voisin », puis revote ; sinon, revote directement.',
      'Pièges : « identique » (+10 % puis −10 % s’annuleraient) ; « 12 % » (remises additionnées). Contrôles : 110 × 0,90 = 99 ; 4 000 × 0,882 = 3 528 € HT.',
      'Relance CG : une seconde remise « sur le net » reste une réduction commerciale, pas un escompte.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        vote(
          'b2-01-a3-sac-v1',
          'evolutions-successives',
          true,
          'Atelier Rivage augmente de 10 % le prix de son sac étanche en mars, puis le baisse de 10 % en septembre. Par rapport au prix de départ, le prix final est…',
          'Inférieur de 1 % au prix de départ',
          [
            ['Identique au prix de départ', 'hausse-baisse-symetriques'],
            [
              'Supérieur de 1 % au prix de départ',
              'coefficient-global-mal-interprete',
            ],
          ],
          ['Inférieur', '1 %'],
        ),
        vote(
          'b2-01-a3-remise-v2',
          'evolutions-successives',
          true,
          'Une voile au prix catalogue de 4 000 € HT bénéficie d’une remise de 10 %, puis d’une seconde remise de 2 % calculée sur le net. De quel pourcentage le net commercial est-il inférieur au prix catalogue ?',
          '11,8 %',
          [
            ['12 %', 'taux-successifs-additionnes'],
            ['88,2 %', 'coefficient-confondu-avec-taux'],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Pourquoi le prix ne revient pas à son point de départ',
        lignes: [
          '100 × 1,10 = 110, puis 110 × 0,90 = 99 : la baisse s’applique à 110, pas à 100.',
          'Coefficient global : 1,10 × 0,90 = 0,99, soit −1 %.',
          'Remises : 0,90 × 0,98 = 0,882 : le net est inférieur de 11,8 % au prix catalogue (3 528 € HT), pas de 12 %.',
        ],
      },
    },
  },
  {
    screenId: 'B2-01-A3-02-MACHINE-COEFFICIENTS',
    titre: 'La machine à coefficients',
    diffusion: 'seance',
    brique: 'fp-concept4',
    dureeMinutes: 2,
    concepts: ['coefficient-multiplicateur', 'evolutions-successives'],
    notes: puces(
      'Faire tester +50 % puis −50 % : on arrive à 75, soit −25 % (1,5 × 0,5 = 0,75).',
      'Faire formuler : on multiplie les coefficients ; taux global = coefficient global − 1.',
      'Transition : « Conséquence pour la marge du sac. »',
    ),
    proprietes: {
      id: 'b2-01-a3-machine',
      parametres: [
        {
          cle: 'depart',
          libelle: 'Valeur de départ (€)',
          min: 1,
          max: 200,
          pas: 1,
          defaut: 100,
        },
        {
          cle: 'tauxUn',
          libelle: 'Premier taux (%)',
          min: -50,
          max: 50,
          pas: 1,
          defaut: 10,
        },
        {
          cle: 'tauxDeux',
          libelle: 'Second taux (%)',
          min: -50,
          max: 50,
          pas: 1,
          defaut: -10,
        },
      ],
      formuleLatexSimplifie: 'arrivée = départ × (1 + t₁) × (1 + t₂)',
      calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)',
      etapes: [
        { libelle: 'Départ', calcul: 'depart' },
        { libelle: 'Après t₁', calcul: 'depart * (1 + tauxUn / 100)' },
        {
          libelle: 'Arrivée',
          calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)',
        },
      ],
      prereglages: [
        { libelle: '+10 % puis −10 %', valeurs: { tauxUn: 10, tauxDeux: -10 } },
        { libelle: '−10 % puis +10 %', valeurs: { tauxUn: -10, tauxDeux: 10 } },
        { libelle: '+20 % puis −20 %', valeurs: { tauxUn: 20, tauxDeux: -20 } },
      ],
      phrase:
        'Chaque taux s’applique à la valeur devenue courante : on multiplie les coefficients, on n’additionne pas les taux. Taux d’évolution = (arrivée − départ) ÷ départ.',
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A3-03-PRIX-SAC',
      titre: 'Le sac étanche : prix et marge',
      diffusion: 'seance',
      dureeMinutes: 1,
      concepts: ['evolutions-successives'],
      notes: puces(
        '45 s, sur la seule courbe de marge.',
        'Chiffre clé : −1 % sur le prix = −5 % sur la marge ((19 − 20) ÷ 20), car la marge ne fait que 20 % du prix.',
        'Transition : « Même raisonnement sur un achat : le fil technique. »',
      ),
    },
    'chart',
    {
      title: 'Prix du sac étanche : +10 %, puis −10 %',
      caption: '100 ventes par période ; coût d’achat unitaire : 80 € HT',
      kind: 'line',
      unit: '€ HT par sac',
      labels: ['Prix initial', 'Après +10 %', 'Après −10 %'],
      series: [
        {
          label: 'Prix de vente unitaire',
          values: [100, 110, 99],
          tone: 'teal',
        },
        { label: 'Coût d’achat unitaire', values: [80, 80, 80], tone: 'ink' },
        { label: 'Marge unitaire', values: [20, 30, 19], tone: 'gold' },
      ],
      axisRanges: [[0, 120]],
      formula:
        'Prix : 100 × 1,10 × 0,90 = 99 € · CA : 10 000 → 11 000 → 9 900 € · marge totale : 2 000 → 3 000 → 1 900 €',
      reading:
        'Après la baisse, le prix (99 €) reste sous le prix initial : −1 %. Avec un coût inchangé, la marge unitaire tombe à 19 € et la marge totale perd 100 €, soit −5 %.',
      source:
        'Cas Atelier Rivage (données fictives) : 100 ventes à chaque période, coût d’achat constant.',
      description:
        'Trois courbes étiquetées : prix de vente 100, 110 puis 99 € ; coût d’achat constant à 80 € ; marge unitaire 20, 30 puis 19 €.',
    },
    { renvoi: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE' },
  ),
  ...suiviDeSonCorrige(
    {
      screenId: 'B2-01-A3-04-CORRECTION',
      titre: 'Correction : le fil technique',
      dureeMinutes: 2,
      concepts: ['evolutions-successives'],
      notes: puces(
        '« Corriger une étape de plus » : passer vite sur les étapes 1 à 3, s’arrêter sur 4 à 6 (l’opération inverse).',
        'Réflexe à faire dire : retour au montant connu, 12,50 × 1,10 = 13,75.',
        'L’étape 5 prépare la question « retour de 100 € à 80 € » de l’atelier 2.',
        'Transition : « Et quand tous les prix montent ? L’inflation. »',
      ),
    },
    {
      screenId: 'B2-01-A3-04-FIL-TECHNIQUE',
      titre: 'Le fil technique : choisir l’opération inverse',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 2,
      concepts: ['evolutions-successives'],
      notes: puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Pièges : étapes 4-5, retirer 10 % de 13,75 € (12,375 € au lieu de 12,50 €) ; étape 6, retirer 20 % du TTC (2 880 € au lieu de 3 000 €).',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-01-a3-fil',
          enonce:
            'Atelier Rivage achète son fil technique 12,50 € HT la bobine. Le fournisseur annonce +10 % au 1er avril, puis −8 % au 1er octobre. Le service commercial écrit : « au final, +2 % ».',
          etapes: [
            {
              id: 'coefficients',
              intitule: 'Traduire les taux',
              raisonnement: '+10 % → × 1,10 ; −8 % → × 0,92.',
              invite:
                'Par quel nombre multiplie-t-on le prix pour appliquer +10 % ? Et pour appliquer −8 % ?',
            },
            {
              id: 'global',
              intitule: 'Évolution globale',
              raisonnement:
                '1,10 × 0,92 = 1,012 : l’évolution globale est de +1,2 %, et non de +2 %.',
              invite:
                'Quelle est l’évolution globale du prix sur l’année, en % ? Le « +2 % » annoncé est-il juste ?',
            },
            {
              id: 'prix',
              intitule: 'Prix final',
              raisonnement: '12,50 × 1,012 = 12,65 € HT la bobine.',
              invite:
                'Combien coûte la bobine après les deux changements de prix, en € HT ?',
            },
            {
              id: 'base',
              intitule: 'Retrouver la base',
              raisonnement:
                'Après la hausse d’avril, la bobine coûte 13,75 €. Prix initial = 13,75 ÷ 1,10 = 12,50 € : on divise par le coefficient, on ne retire pas 10 %.',
              invite:
                'La bobine coûte 13,75 € après la hausse d’avril : quel était son prix avant cette hausse ?',
            },
            {
              id: 'reciproque',
              intitule: 'Évolution réciproque',
              raisonnement:
                'Pour annuler une hausse de 10 %, il faut multiplier par 1 ÷ 1,10 ≈ 0,909, soit une baisse d’environ 9,1 % ; une baisse de 10 % irait trop loin (13,75 × 0,90 = 12,375 €).',
              invite:
                'De quel pourcentage faut-il baisser 13,75 € pour revenir à 12,50 € ?',
            },
            {
              id: 'tva',
              intitule: 'Du TTC au HT',
              raisonnement:
                'Une facture d’entretien affiche 3 600 € TTC (TVA 20 %). HT = 3 600 ÷ 1,20 = 3 000 € : on divise par le coefficient 1,20. Retirer 20 % donnerait 2 880 €, ce qui est faux. Passer du TTC au HT, c’est une baisse de 1 − 1 ÷ 1,20 ≈ 16,67 %. Contrôle inverse : 3 000 × 1,20 = 3 600.',
              invite:
                'Une facture affiche 3 600 € TTC (TVA 20 %) : quel est son montant HT, et de quel pourcentage baisse-t-on en passant du TTC au HT ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A3-05-INFLATION-RYTHME',
      titre: 'Inflation annuelle en France, 2019–2025',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['indice-base-100'],
      notes: puces(
        'Lire la série sans commenter le niveau des prix : chaque barre est une hausse sur un an.',
        'Faire repérer que le « 4,9 » du tableau de bord de Samir est l’inflation de 2023, pas celle de 2025 (0,9 %).',
        'Transition : « Comment passer d’une série de taux à un indice et à un taux moyen ? »',
      ),
    },
    'chart',
    {
      title: 'Inflation annuelle en France, 2019–2025',
      caption: 'Taux d’inflation annuel moyen (IPC), en %',
      labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
      series: [
        {
          label: 'Inflation (IPC)',
          values: [1.1, 0.5, 1.6, 5.2, 4.9, 2.0, 0.9],
          tone: 'teal',
        },
      ],
      axisRanges: [[0, 6]],
      unit: '% par an',
      reading:
        'Le taux culmine à 5,2 % en 2022, puis diminue : 2,0 % en 2024 et 0,9 % en 2025.',
      source:
        'Insee, indice des prix à la consommation, « L’essentiel sur… l’inflation », paru le 23 mars 2026.',
      description:
        'Diagramme en barres des taux d’inflation annuels moyens : 1,1 % en 2019, 0,5 % en 2020, 1,6 % en 2021, 5,2 % en 2022, 4,9 % en 2023, 2,0 % en 2024 et 0,9 % en 2025.',
    },
  ),
  ...suiviDeSonCorrige(
    {
      screenId: 'B2-01-A3-06-CORRECTION',
      titre: 'Correction : lire un indice et un rythme',
      dureeMinutes: 2,
      concepts: ['indice-base-100', 'taux-moyen'],
      notes: puces(
        '« Corriger une étape de plus » : 5 étapes en 2 min ; s’arrêter sur la 5ᵉ (19,10 ÷ 3).',
        'Distinguer à voix haute le niveau (indice 119,10), le taux global (+19,10 %) et le rythme (+6 % par an).',
        'Transition : « Même méthode sur les prix en France depuis 2019 : atelier 2. »',
      ),
    },
    {
      screenId: 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
      titre: 'Le loyer de l’atelier : lire un indice et un rythme',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['indice-base-100', 'taux-moyen'],
      notes: puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Pièges : lire 119,10 comme +119,10 % ; diviser 19,10 par 3 (6,37 %).',
        'Vérifier que chacun sait taper 1,19102 ^ (1 ÷ 3) sur sa calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-01-a3-indice-taux-moyen',
          enonce:
            'Le loyer de l’atelier d’Atelier Rivage passe de 1 000 € (2021) à 1 060 € (2022), 1 123,60 € (2023) et 1 191,02 € (2024). Samir écrit : « +19,10 % en trois ans, donc +6,37 % par an ».',
          etapes: [
            {
              id: 'indice',
              intitule: 'Indice base 100 en 2021',
              raisonnement:
                'I = 100 × V ÷ V₀ : 2022 : 100 × 1 060 ÷ 1 000 = 106,00 ; 2023 : 112,36 ; 2024 : 119,10.',
              invite:
                'Quel est l’indice du loyer en 2022, en 2023 et en 2024, base 100 en 2021 ?',
            },
            {
              id: 'lire',
              intitule: 'Lire un indice',
              raisonnement:
                '119,10 signifie +19,10 % depuis 2021 : taux = I ÷ 100 − 1. Ce n’est ni +119,10 %, ni un loyer de 119,10 €.',
              invite:
                'Que signifie l’indice 119,10 de 2024, traduit en taux d’évolution depuis 2021 ?',
            },
            {
              id: 'chainer',
              intitule: 'Chaîner des coefficients',
              raisonnement:
                'Indice = 100 × produit des coefficients : 100 × 1,06 × 1,06 × 1,06 = 119,10. Additionner les taux (6 + 6 + 6 = 18) sous-estime la hausse.',
              invite:
                'Comment retrouvez-vous l’indice 2024 à partir des coefficients annuels ?',
            },
            {
              id: 'taux-moyen',
              intitule: 'Taux annuel moyen',
              raisonnement:
                'On cherche x tel que x³ = 1,19102 : x = 1,19102^(1/3) ≈ 1,0600, soit +6,00 % par an. Calculatrice : 1,19102 ^ (1 ÷ 3) ; tableur : =PUISSANCE(1,19102;1/3).',
              invite:
                'Quel taux annuel constant, appliqué trois années de suite, donne +19,10 % ?',
            },
            {
              id: 'piege',
              intitule: 'Pourquoi pas 19,10 ÷ 3 ?',
              raisonnement:
                '19,10 ÷ 3 ≈ 6,37 % est faux : 1,0637³ ≈ 1,2035, et non 1,1910. Diviser un taux global par le nombre d’années surestime le taux moyen.',
              invite:
                'En appliquant +6,37 % trois années de suite, obtient-on bien +19,10 % ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-01-A3-07-ATELIER-2',
    titre: 'Atelier 2 — Rythme, niveau, indice',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 4,
    concepts: ['indice-base-100', 'evolutions-successives'],
    notes: puces(
      '4 min individuelles sur les questions 1 à 3.',
      'Pièges : Q1 « plus bas » (rythme lu comme niveau) ; Q2 112,2 et Q3 15,1 % (taux additionnés).',
    ),
    proprietes: {
      renvoi: 'B2-01-A3-05-INFLATION-RYTHME',
      intitule: 'Atelier 2 — Rythme, niveau, indice (questions 1 à 3)',
      consigne: CONSIGNE_DE_L_ATELIER_2,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        vote(
          'b2-01-a3-niveau-prix',
          'indice-base-100',
          true,
          'L’inflation passe de 2,0 % en 2024 à 0,9 % en 2025. En 2025, le niveau général des prix est…',
          'Plus élevé qu’en 2024',
          [
            ['Plus bas qu’en 2024', 'rythme-confondu-avec-niveau'],
            ['Identique à celui de 2024', 'rythme-confondu-avec-niveau'],
          ],
          ['Plus élevé', '2024'],
        ),
        numerique(
          'b2-01-a3-indice-2023',
          'indice-base-100',
          'Calculez l’indice des prix de 2023 (base 100 = moyenne 2019), arrondi au centième.',
          null,
          112.681079,
          DEUX_DECIMALES,
          '112,68',
          [
            [112.2, 'taux-successifs-additionnes'],
            [12.681079, 'indice-lu-comme-taux'],
          ],
        ),
        numerique(
          'b2-01-a3-hausse-2019-2025',
          'evolutions-successives',
          'De combien les prix ont-ils augmenté entre 2019 et 2025 ? Réponse en %, arrondie au centième.',
          '%',
          15.969113,
          DEUX_DECIMALES,
          '15,97',
          [
            [15.1, 'taux-successifs-additionnes'],
            [115.969113, 'indice-lu-comme-taux'],
          ],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A3-07-CORRECTION-1',
      titre: 'Correction de l’atelier 2 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['indice-base-100', 'evolutions-successives'],
      notes: puces(
        'Commencer par la question la moins réussie.',
        'Ne pas citer le taux moyen ni 1,025⁶ : c’est la question suivante. Laisser 1,1597 en vue, elle en part.',
        'Niveau des prix : si « plus bas » domine, faire dire que 0,9 % reste une hausse (le mot « désinflation » viendra en A3-08).',
        'Transition : « Deux questions de plus : le rythme moyen, puis le retour en arrière. »',
      ),
    },
    'B2-01-A3-07-ATELIER-2',
    [
      [
        'b2-01-a3-niveau-prix',
        'Une inflation de 0,9 % reste une hausse : le rythme ralentit, mais le niveau des prix de 2025 dépasse celui de 2024.',
      ],
      [
        'b2-01-a3-indice-2023',
        '100 × 1,005 × 1,016 × 1,052 × 1,049 ≈ 112,68. Additionner les taux (112,2) oublie que chaque hausse s’applique au niveau déjà atteint.',
      ],
      [
        'b2-01-a3-hausse-2019-2025',
        'Coefficient global : 1,005 × 1,016 × 1,052 × 1,049 × 1,020 × 1,009 ≈ 1,1597, soit +15,97 % ; la somme des taux (15,1 %) sous-estime la hausse.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A3-07-ATELIER-2-SUITE',
    titre: 'Atelier 2 — Rythme, niveau, indice (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 4,
    concepts: ['taux-moyen', 'evolution-reciproque'],
    notes: puces(
      '3 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 et 2).',
      'Pièges : taux moyen (Q4) 2,66 % (15,97 ÷ 6) ; réparation (Q5) « baisse de 25 % » (même taux à l’envers).',
      'La réparation est le diagnostic du début à l’envers : +25 % à l’aller, −20 % au retour.',
    ),
    proprietes: {
      renvoi: 'B2-01-A3-05-INFLATION-RYTHME',
      intitule: 'Atelier 2 — Rythme, niveau, indice (questions 4 et 5)',
      consigne: CONSIGNE_DE_L_ATELIER_2,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        numerique(
          'b2-01-a3-taux-moyen',
          'taux-moyen',
          'Quel taux annuel constant, appliqué six années de suite, donne la même hausse des prix entre 2019 et 2025 ? Réponse en %, arrondie au centième.',
          '%',
          2.499966,
          DEUX_DECIMALES,
          '2,50',
          [
            [2.661519, 'taux-moyen-arithmetique'],
            [2.516667, 'taux-successifs-additionnes'],
          ],
        ),
        vote(
          'b2-01-a3-reciproque',
          'evolution-reciproque',
          true,
          'Le prix d’une réparation est passé de 80 € à 100 €. Pour revenir à 80 €, de quel pourcentage faut-il le baisser ?',
          'Une baisse de 20 %',
          [
            ['Une baisse de 25 %', 'reciproque-meme-taux'],
            ['Une baisse de 80 %', 'coefficient-confondu-avec-taux'],
          ],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A3-07-CORRECTION-2',
      titre: 'Correction de l’atelier 2 : questions 4 et 5',
      dureeMinutes: 1,
      concepts: ['taux-moyen', 'evolution-reciproque'],
      notes: puces(
        'Taux moyen : la moyenne des six taux annuels (2,52 %) tombe près de 2,50 % parce que les taux sont petits ; la méthode reste fausse (A6-04 : 33,25 % au lieu de 32,6 %).',
        'Transition : « Voici la courbe que vous venez de calculer. »',
      ),
    },
    'B2-01-A3-07-ATELIER-2-SUITE',
    [
      [
        'b2-01-a3-taux-moyen',
        'On cherche x tel que x⁶ = 1,1597 : 1,1597 ^ (1 ÷ 6) ≈ 1,0250, soit +2,50 % par an. Diviser 15,97 par 6 (2,66 %) surestime le rythme.',
      ],
      [
        'b2-01-a3-reciproque',
        'Coefficient de retour : 80 ÷ 100 = 0,80, soit −20 %. Reprendre le même taux à l’envers (−25 %) mènerait à 75 €.',
      ],
    ],
  ),
  ecranV2(
    {
      screenId: 'B2-01-A3-08-INDICE-PRIX',
      titre: 'Rythme et niveau : l’indice des prix depuis 2019',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['indice-base-100'],
      notes: puces(
        'Faire superposer : les barres de A3-05 baissent depuis 2023, la courbe de l’indice monte toujours.',
        'Mot à fixer : désinflation (le rythme ralentit, les prix montent encore) ≠ déflation (les prix baissent).',
        'Transition : « Répondez à Samir, qui veut baisser les tarifs. »',
      ),
    },
    'chart',
    {
      title: 'Indice des prix à la consommation, base 100 = moyenne 2019',
      caption: 'Indice reconstitué à partir des taux annuels moyens de l’Insee',
      kind: 'line',
      labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
      series: [
        {
          label: 'Indice des prix',
          values: [100, 100.5, 102.11, 107.42, 112.68, 114.93, 115.97],
          tone: 'gold',
        },
      ],
      axisRanges: [[95, 120]],
      axisLabels: ['95 à 120'],
      unit: 'indice (base 100 en 2019)',
      formula:
        'Indice 2025 = 100 × 1,005 × 1,016 × 1,052 × 1,049 × 1,020 × 1,009 ≈ 115,97',
      reading:
        'Les prix de 2025 sont en moyenne 16,0 % plus élevés qu’en 2019. Le rythme ralentit depuis 2023, mais l’indice continue de monter : une inflation qui ralentit tout en restant positive s’appelle une désinflation ; une baisse du niveau des prix s’appellerait une déflation.',
      source:
        'Calcul d’après les taux annuels moyens de l’IPC publiés par l’Insee.',
      description:
        'Courbe croissante de l’indice : base 100 en 2019, niveau intermédiaire en 2022, niveau final supérieur à 115 en 2025 ; axe gradué de 95 à 120.',
    },
    { renvoi: 'B2-01-A3-05-INFLATION-RYTHME' },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A3-09-NOTE-CONJONCTURE',
      titre: 'Note de conjoncture pour Hélène',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['indice-base-100'],
      notes: puces(
        '90 s de rédaction, puis lire deux réponses.',
        'Écarter les phrases sans source ou qui ne parlent que du rythme.',
        'Calcul attendu : 1 ÷ 1,1597 − 1 ≈ −13,8 % de valeur réelle pour des tarifs inchangés depuis 2019.',
        'Transition : jalon 3, puis pause de 15 min.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-01-a3-note-conjoncture',
        type: 'reflection',
        question:
          'Samir propose de baisser les tarifs 2026 de 2 % « puisque l’inflation baisse ». Nos tarifs n’ont pas bougé depuis 2019. En deux phrases chiffrées et sourcées, dites à Hélène si l’argument tient et ce que valent aujourd’hui nos tarifs en euros de 2019.',
        placeholder:
          'L’argument de Samir… Nos tarifs, en euros de 2019… Source : …',
        context:
          'Une note de conjoncture sépare le rythme d’une hausse et le niveau atteint.',
        competency: 'Communiquer · distinguer rythme et niveau',
      },
    },
    {
      correction: {
        expected:
          'L’argument ne tient pas : l’inflation ralentit (désinflation : 0,9 % en 2025 après 2,0 % en 2024), mais le niveau des prix continue de monter. Les prix ayant augmenté de 16,0 % depuis 2019 (Insee, IPC), des tarifs inchangés ont perdu 13,8 % de leur valeur réelle (1 ÷ 1,1597 − 1) : les baisser aggraverait la perte.',
        nextAction:
          'Citez toujours deux chiffres : le rythme (taux annuel) et le niveau (indice), avec leur source.',
      },
      renvoi: 'B2-01-A3-08-INDICE-PRIX',
    },
  ),
  {
    screenId: 'B2-01-A3-10-JALON-3',
    titre: 'Jalon 3 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['evolutions-successives', 'indice-base-100', 'taux-moyen'],
    notes: puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : au retour de pause, rejouer la machine à coefficients (A3-02) et l’étape « Taux annuel moyen » de A3-06.',
      'Annoncer la pause de 15 min ; au retour, acte 4 au tableur.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-01-a3-jalon',
        invite:
          'Je sais enchaîner des évolutions avec des coefficients, lire un indice base 100 et calculer un taux moyen.',
      },
    },
  },
];

const TRANSCRIPTION_DE_LA_CAPSULE = [
  '[Carton titre : « Une formule qui se recopie, un tableau qui se contrôle », sous-titre « B2-01 · 4 gestes de tableur ». Puis une grille de tableur : trimestres T1 à T4 en lignes, ventes 2024 et 2025 en euros HT, ligne 6 « Total » ; étiquette « données fictives ».] Une formule qui se recopie, un tableau qui se contrôle : quatre gestes de tableur, sur les ventes trimestrielles de sacs étanches, en euros hors taxes. Les données sont fictives.',
  '[La cellule C6 reçoit la formule =SOMME(C2:C5) ; la plage C2 à C5 est surlignée ; C6 affiche 120 000. B6 reçoit =SOMME(B2:B5) et affiche 110 000.] Premier geste : le total. En C6, on écrit : égal, SOMME, parenthèse, C2 deux-points C5. Le tableur affiche cent vingt mille. En B6, la même formule donne cent dix mille.',
  '[D2 reçoit =(C2-B2)/B2 ; C2 est marquée « arrivée », B2 « départ » ; D2 affiche 0,125 ; le panneau indique 0,125 × 100 = 12,5 % et t = (arrivée − départ) / départ.] Deuxième geste : le taux d’évolution. En D2 : égal, parenthèse, C2 moins B2, parenthèse fermée, divisé par B2, la valeur de départ. Résultat : zéro virgule cent vingt-cinq, soit douze virgule cinq pour cent.',
  '[Quatre clics sur le bouton « Recopier vers le bas » ; D3 à D6 affichent 0,05 ; 0,1333 ; 0 ; 0,0909 ; le panneau liste les formules recopiées, de =(C3-B3)/B3 à =(C6-B6)/B6.] On recopie vers le bas avec le bouton « Recopier vers le bas ». Les références glissent d’une ligne : C2 devient C3, B2 devient B3. C’est ce que l’on veut : chaque ligne compare ses propres valeurs.',
  '[E2 contient =C2/C6 et affiche 0,15. Après recopie, E3 contient =C3/C7 et affiche l’erreur #DIV/0! ; la cellule C7 est vide.] Troisième geste : la part du total. En E2, on divise C2 par le total, C6. Mais, recopiée telle quelle, la formule divise C3 par C7, une cellule vide : le tableur affiche une erreur de division par zéro.',
  '[E2 devient =C2/$C$6, les dollars en gras ; après quatre recopies, E3 affiche 0,35, E4 0,425, E5 0,075 et E6 1.] Le total doit rester fixe. On écrit dollar C dollar 6 : le dollar fige la colonne et la ligne. On recopie : les parts s’affichent, et celle du total vaut 1, c’est-à-dire cent pour cent.',
  '[E8 reçoit =SI(ARRONDI(SOMME(E2:E5);6)=1;1;0) ; les cinq parties de la formule s’allument dans l’ordre ; E8 affiche 1 sur fond vert avec « OK ».] Quatrième geste : le contrôle. Les quatre parts doivent faire 1. En E8, on écrit : SI l’arrondi de la somme de E2 à E5 est égal à 1, alors 1, sinon 0. Le contrôle affiche 1.',
  '[La formule de E3 est remplacée par la valeur tapée 0,4 ; E8 passe à 0, en rouge, « À vérifier » ; le panneau affiche 0,15 + 0,4 + 0,425 + 0,075 = 1,05. Puis E3 retrouve =C3/$C$6 et E8 revient à 1.] Mettons-le à l’épreuve : si quelqu’un tape zéro virgule quatre à la place de la formule de E3, la somme ne vaut plus 1 et le contrôle passe à 0. On rétablit la formule : il revient à 1.',
  '[La ligne 9 apparaît : « Compte de résultat 2025 : ventes de sacs », 120 000, marqué « source externe » ; E9 reçoit =SI(ARRONDI(C6-C9;0)=0;1;0) et affiche 1, « OK ».] Ce contrôle surveille les formules, pas les données. Pour les données, on compare le total à une source indépendante : le compte de résultat indique cent vingt mille euros de ventes de sacs. Le second contrôle affiche 1.',
  '[Quatre cartes numérotées : 1, Total : =SOMME(plage) ; 2, Évolution : (arrivée − départ) / départ ; 3, Part : total figé, $C$6 ; 4, Contrôles : formules et source indépendante. En bas : « À vous : tâche de tableur 1 — Atelier Rivage ».] Total, évolution, part figée par le dollar, contrôles : à vous de les appliquer au tableau de bord d’Atelier Rivage.',
  '[Carton de crédits, sans voix : titre, Asili Design 2026, licence CC BY-SA 4.0, voix de synthèse Piper fr_FR-siwis-medium, données SIWIS de l’Université d’Édimbourg sous CC BY 4.0, polices sous licence OFL, données fictives.]',
].join('\n\n');

const PLAN_FEUILLE = {
  id: 'b2-01-a4-feuille-canaux',
  intitule: 'Tâche de tableur 1 — Tableau de bord par canal, 2024–2025',
  lignes: 7,
  colonnes: 7,
  cellules: {
    A1: 'Canal',
    B1: 'CA HT 2024 (€)',
    C1: 'CA HT 2025 (€)',
    D1: 'Évolution du CA',
    E1: 'Part du CA 2025',
    F1: 'Taux de marge brute',
    G1: 'Marge brute 2025 (€)',
    A2: 'Sur-mesure',
    B2: '483000',
    C2: '397000',
    F2: '0,36',
    A3: 'Entretien',
    B3: '210000',
    C3: '230000',
    F3: '0,28',
    A4: 'Marketplace',
    B4: '357000',
    C4: '523000',
    F4: '0,16',
    A5: 'Total',
    A6: 'Marge brute 2025 (compte de résultat)',
    B6: '291000',
    A7: 'Contrôles',
  },
  verrouillees: [
    'A1',
    'B1',
    'C1',
    'D1',
    'E1',
    'F1',
    'G1',
    'A2',
    'A3',
    'A4',
    'A5',
    'A6',
    'A7',
    'B2',
    'B3',
    'B4',
    'C2',
    'C3',
    'C4',
    'F2',
    'F3',
    'F4',
    'B6',
  ],
  consignes: [
    'En B5 et C5, calculez les totaux avec SOMME.',
    'En D2, écrivez le taux d’évolution du CA du sur-mesure, puis recopiez jusqu’en D5 avec le bouton « Recopier vers le bas ». Écrivez les taux en décimal : 0,125 correspond à 12,5 %.',
    'En E2, écrivez la part du sur-mesure dans le CA 2025 en figeant le total, puis recopiez jusqu’en E5.',
    'En G2, calculez la marge brute 2025 du canal (CA 2025 × taux de marge brute), recopiez jusqu’en G4, puis totalisez en G5 avec SOMME.',
    'En F5, calculez le taux de marge brute global : marge totale ÷ CA total.',
    'En B7, contrôlez vos formules : les parts doivent faire 100 % : =SI(ARRONDI(SOMME(E2:E4);6)=1;1;0). En C7, contrôlez vos données : votre marge (G5) doit égaler celle du compte de résultat (B6).',
  ],
};

function attendu(
  reference: string,
  formuleReference: string,
  valeur: number,
  forme: 'references' | { readonly memeQue: string },
  pieges: readonly (readonly [number, ConfusionId])[] = [],
  confusionSiErreurFormule: ConfusionId | null = null,
  tolerance:
    | typeof TOLERANCE_RELATIVE
    | typeof TOLERANCE_NULLE = TOLERANCE_RELATIVE,
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

const RECOPIE_DE_D2 = { memeQue: 'D2' } as const;
const RECOPIE_DE_E2 = { memeQue: 'E2' } as const;
const RECOPIE_DE_G2 = { memeQue: 'G2' } as const;
const NON_FIGEE = 'reference-relative-non-figee';

const PLAN_TABLEAU = {
  id: 'b2-01-a4-indice-toile',
  intitule: 'Tâche de tableur 2 — Prix et indice de la toile en 2025',
  consignes: [
    'Au 1er janvier 2025, le m² de toile coûte 20,00 € HT. Pour chaque révision, calculez le nouveau prix à partir du prix précédent. Le fournisseur facture des prix arrondis au centime : arrondissez chaque prix au centime.',
    'Vérifiez la colonne « Coefficient appliqué » : elle doit redonner le taux annoncé (1,0800 pour +8 %).',
    'Calculez l’indice de chaque prix, base 100 au 1er janvier : prix ÷ 20 × 100, arrondi au centième.',
    'Comparez l’évolution réelle sur l’année à la somme des taux annoncés, celle du tableau de bord.',
  ],
  echeances: 4,
  libellesLignes: [
    '1er mars : +8 %',
    '1er juin : −5 %',
    '1er septembre : +4 %',
    '1er décembre : −3 %',
  ],
  parametres: { prixInitial: 20 },
  colonnes: [
    {
      cle: 'taux',
      intitule: 'Taux annoncé (%)',
      role: 'donnee',
      valeurs: [8, -5, 4, -3],
      decimales: 0,
      totalise: true,
    },
    {
      cle: 'prix',
      intitule: 'Prix du m² après révision (€ HT)',
      role: 'saisie',
      decimales: 2,
      totalise: false,
    },
    {
      cle: 'coef',
      intitule: 'Coefficient appliqué',
      role: 'deduite',
      formuleInitiale: 'prix / prixInitial',
      formule: 'prix / avantPrix',
      decimales: 4,
      totalise: false,
    },
    {
      cle: 'indice',
      intitule: 'Indice (base 100 au 1er janvier)',
      role: 'saisie',
      decimales: 2,
      totalise: false,
    },
    {
      cle: 'evolution',
      intitule: 'Évolution depuis le 1er janvier (%)',
      role: 'deduite',
      formule: 'indice - 100',
      decimales: 2,
      totalise: false,
    },
  ],
  synthese: [
    {
      libelle: 'Somme des taux annoncés (calcul du tableau de bord)',
      formule: 'totalTaux',
      unite: '%',
      decimales: 2,
    },
    {
      libelle: 'Évolution réelle sur l’année',
      formule: 'dernierEvolution',
      unite: '%',
      decimales: 2,
    },
  ],
} as const satisfies Extract<
  EcranDuCours,
  { readonly brique: 'fp-table-build' }
>['proprietes']['plan'];

function ligneDeTableau(
  rang: number,
  prix: number,
  piegeDePrix: number | null,
  indice: number,
  piegesDIndice: readonly (readonly [number, ConfusionId])[],
) {
  return [
    {
      rang,
      cle: 'prix',
      valeur: prix,
      pieges:
        piegeDePrix === null
          ? []
          : [
              {
                valeur: piegeDePrix,
                confusion: 'taux-successifs-additionnes' as const,
              },
            ],
    },
    {
      rang,
      cle: 'indice',
      valeur: indice,
      pieges: piegesDIndice.map(([valeur, confusion]) => ({
        valeur,
        confusion,
      })),
    },
  ];
}

const [PREMIERE_LIGNE_DU_TABLEAU, ...AUTRES_LIGNES_DU_TABLEAU] = [
  ...ligneDeTableau(0, 21.6, null, 108, [[8, 'indice-lu-comme-taux']]),
  ...ligneDeTableau(1, 20.52, 20.6, 102.6, [
    [103, 'taux-successifs-additionnes'],
    [2.6, 'indice-lu-comme-taux'],
  ]),
  ...ligneDeTableau(2, 21.34, 21.4, 106.7, [
    [107, 'taux-successifs-additionnes'],
    [6.7, 'indice-lu-comme-taux'],
  ]),
  ...ligneDeTableau(3, 20.7, 20.8, 103.5, [
    [104, 'taux-successifs-additionnes'],
    [3.5, 'indice-lu-comme-taux'],
  ]),
];

const CONSIGNE_DE_L_ATELIER_3 =
  'Pour le comité, vous devez montrer comment le CA HT 2025 de chaque canal a évolué au fil des trimestres. CA HT 2025, en milliers d’euros, du 1er au 4e trimestre : sur-mesure 120 ; 95 ; 102 ; 80 · entretien 58 ; 61 ; 49 ; 62 · marketplace 98 ; 131 ; 167 ; 127.';

const ACTE_4: Acte = [
  {
    screenId: 'B2-01-A4-01-CAPSULE',
    titre: 'Capsule : une formule qui se recopie',
    diffusion: 'catalogue',
    brique: 'fp-story',
    dureeMinutes: 3,
    concepts: ['tableur'],
    notes: puces(
      'Projeter en plein écran, sous-titres activés (2 min 30).',
      'Après la vidéo : « Que devient =C2/C6 recopiée d’une ligne ? » (=C3/C7, d’où #DIV/0!) ; « Que détecte chaque contrôle ? » (les parts : les formules ; le compte de résultat : les données).',
      'Transition : « À vous, sur le tableau de bord d’Atelier Rivage. »',
    ),
    proprietes: {
      titre: 'Capsule : une formule qui se recopie, un tableau qui se contrôle',
      paragraphes: [
        'Regardez la capsule (2 min 30), puis ouvrez la tâche de tableur : vous y appliquerez les mêmes gestes à Atelier Rivage.',
        'Vidéo « Une formule qui se recopie, un tableau qui se contrôle », Asili Design, 2026, licence CC BY-SA 4.0. Voix de synthèse : Piper, modèle fr_FR-siwis-medium ; données SIWIS (Université d’Édimbourg), CC BY 4.0.',
      ],
      video: {
        src: '/assets/cours/b2-01/v3/capsule-formule-recopiable-720p.webm',
        srcPoste: '/assets/cours/b2-01/v3/capsule-formule-recopiable-480p.webm',
        type: 'video/webm',
        titre:
          'Une formule qui se recopie, un tableau qui se contrôle (2 min 30)',
        poster: '/assets/cours/b2-01/v3/capsule-formule-recopiable.jpg',
        transcript: TRANSCRIPTION_DE_LA_CAPSULE,
        source: '/formations/b2-01-traitement-information-chiffree',
        licence: 'CC BY-SA 4.0 · Asili Design, 2026',
        sousTitres: {
          src: '/assets/cours/b2-01/v3/capsule-formule-recopiable.fr.vtt',
          srclang: 'fr',
          libelle: 'Français',
        },
        preload: 'none',
      },
    },
  },
  {
    screenId: 'B2-01-A4-02-FEUILLE-CANAUX',
    titre: 'Tâche de tableur 1 — Tableau de bord par canal',
    diffusion: 'seance',
    brique: 'fp-sheet',
    dureeMinutes: 13,
    concepts: ['tableur'],
    notes: puces(
      'Binômes ; circuler. À 9 min, projeter la grille d’un binôme volontaire.',
      'Erreurs à chercher : #DIV/0! en E3 ($C$5 oublié) ; taux saisis × 100 (−17,8 au lieu de −0,178) ; valeurs tapées sans formule.',
      'Valeurs de contrôle : D2 −0,178 ; E4 0,455 ; G5 291 000 ; F5 0,253 ; B7 = C7 = 1.',
      'F5 = 0,267 : moyenne simple des trois taux ; renvoyer à « marge totale ÷ CA total ».',
    ),
    proprietes: {
      modalite: 'binome',
      plan: PLAN_FEUILLE,
      questions: [
        {
          type: 'feuille',
          id: 'b2-01-a4-feuille-canaux',
          concept: 'tableur',
          noteCompte: true,
          corrige: {
            type: 'feuille',
            plan: PLAN_FEUILLE,
            attendus: [
              attendu('B5', '=SOMME(B2:B4)', 1050000, 'references'),
              attendu('C5', '=SOMME(C2:C4)', 1150000, 'references'),
              attendu('D2', '=(C2-B2)/B2', -0.178054, 'references', [
                [-17.805383, 'taux-valeur-facteur-cent'],
                [-0.216625, 'base-arrivee'],
              ]),
              attendu('D3', '=(C3-B3)/B3', 0.095238, RECOPIE_DE_D2, [
                [9.52381, 'taux-valeur-facteur-cent'],
                [0.086957, 'base-arrivee'],
              ]),
              attendu('D4', '=(C4-B4)/B4', 0.464986, RECOPIE_DE_D2, [
                [46.498599, 'taux-valeur-facteur-cent'],
                [0.3174, 'base-arrivee'],
              ]),
              attendu('D5', '=(C5-B5)/B5', 0.095238, RECOPIE_DE_D2, [
                [9.52381, 'taux-valeur-facteur-cent'],
                [0.086957, 'base-arrivee'],
              ]),
              attendu(
                'E2',
                '=C2/$C$5',
                0.345217,
                'references',
                [[34.521739, 'taux-valeur-facteur-cent']],
                NON_FIGEE,
              ),
              attendu('E3', '=C3/$C$5', 0.2, RECOPIE_DE_E2, [], NON_FIGEE),
              attendu(
                'E4',
                '=C4/$C$5',
                0.454783,
                RECOPIE_DE_E2,
                [[523000, NON_FIGEE]],
                NON_FIGEE,
              ),
              attendu('E5', '=C5/$C$5', 1, RECOPIE_DE_E2, [], NON_FIGEE),
              attendu('G2', '=C2*F2', 142920, 'references'),
              attendu('G3', '=C3*F3', 64400, RECOPIE_DE_G2),
              attendu('G4', '=C4*F4', 83680, RECOPIE_DE_G2),
              attendu('G5', '=SOMME(G2:G4)', 291000, 'references'),
              attendu('F5', '=G5/C5', 0.253043, 'references', [
                [25.304348, 'taux-valeur-facteur-cent'],
                [0.266667, 'moyenne-simple-des-taux'],
              ]),
              attendu(
                'B7',
                '=SI(ARRONDI(SOMME(E2:E4);6)=1;1;0)',
                1,
                'references',
                [],
                null,
                TOLERANCE_NULLE,
              ),
              attendu(
                'C7',
                '=SI(ARRONDI(G5-B6;0)=0;1;0)',
                1,
                'references',
                [],
                null,
                TOLERANCE_NULLE,
              ),
            ],
            seuilReussite: 0.8,
          },
        },
      ],
    },
  },
  {
    screenId: 'B2-01-A4-03-ATELIER-3',
    titre: 'Atelier 3 — Habiller le graphique du comité',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 3,
    concepts: ['lecture-graphique'],
    notes: puces(
      '3 min de travail sur la forme et le titre.',
      'Piège principal : un titre qui conclut (« La marketplace s’envole… ») ; exiger un titre qui décrit, avec l’unité.',
    ),
    proprietes: {
      intitule:
        'Atelier 3 — Habiller le graphique du comité (questions 1 et 2)',
      consigne: CONSIGNE_DE_L_ATELIER_3,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        vote(
          'b2-01-a4-forme',
          'lecture-graphique',
          true,
          'Quel graphique choisissez-vous pour montrer l’évolution trimestrielle du CA HT de chaque canal ?',
          'Trois courbes, une par canal, trimestres en abscisse',
          [
            ['Trois secteurs en relief, un par canal', 'forme-inadaptee'],
            ['Une barre par canal avec son CA annuel', 'forme-inadaptee'],
          ],
          ['courbes', 'trimestres'],
        ),
        vote(
          'b2-01-a4-titre',
          'lecture-graphique',
          true,
          'Quel titre donnez-vous à ce graphique ?',
          'CA HT 2025 par canal et par trimestre (en milliers d’euros)',
          [
            [
              'La marketplace s’envole au troisième trimestre',
              'titre-interpretatif',
            ],
            ['Évolution des canaux', 'unite-manquante-ignoree'],
          ],
          ['par canal et par trimestre'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A4-03-CORRECTION-1',
      titre: 'Correction de l’atelier 3 : forme et titre',
      dureeMinutes: 1,
      concepts: ['lecture-graphique'],
      notes: puces(
        'Faire justifier la forme par la question posée : une évolution dans le temps.',
        'Transition : « Il reste l’axe et la phrase de lecture. »',
      ),
    },
    'B2-01-A4-03-ATELIER-3',
    [
      [
        'b2-01-a4-forme',
        'Une évolution dans le temps se montre par des courbes : une par canal, les trimestres en abscisse. Des secteurs ou une barre annuelle effacent le temps.',
      ],
      [
        'b2-01-a4-titre',
        'Le titre décrit ce que montre le graphique, avec l’unité. « La marketplace s’envole… » conclut à la place du lecteur ; « Évolution des canaux » ne dit ni l’année ni l’unité.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A4-03-ATELIER-3-SUITE',
    titre: 'Atelier 3 — Habiller le graphique du comité (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 3,
    concepts: ['lecture-graphique'],
    notes: puces(
      '3 min seul.',
      'Pièges : l’axe à 49 000 € (le geste de la diapositive de Samir) ; « 167 % du CA » (167 milliers d’euros lus comme un pourcentage).',
      'Pour les plus rapides : « Les quatre trimestres redonnent-ils le CA annuel ? » (397, 230 et 523 k€ : oui).',
    ),
    proprietes: {
      intitule:
        'Atelier 3 — Habiller le graphique du comité (questions 3 et 4)',
      consigne: CONSIGNE_DE_L_ATELIER_3,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        vote(
          'b2-01-a4-axe',
          'lecture-graphique',
          true,
          'Où placez-vous l’origine de l’axe vertical ?',
          'À 0, avec une graduation tous les 20 000 €',
          [
            [
              'À 49 000 €, la plus petite valeur du tableau',
              'axe-tronque-lu-comme-ecart',
            ],
            [
              'Nulle part : sans graduation, seules les courbes comptent',
              'axe-tronque-lu-comme-ecart',
            ],
          ],
          ['À 0', 'graduation'],
        ),
        vote(
          'b2-01-a4-lecture',
          'lecture-graphique',
          true,
          'Quelle phrase de lecture placez-vous sous le graphique ?',
          'Au 3e trimestre, la marketplace atteint 167 000 €, contre 102 000 € pour le sur-mesure.',
          [
            [
              'Au 3e trimestre, la marketplace réalise 167 % du CA.',
              'valeur-confondue-avec-taux',
            ],
            [
              'Au 3e trimestre, le sur-mesure s’effondre.',
              'titre-interpretatif',
            ],
          ],
          ['167 000 €', '102 000 €'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A4-03-CORRECTION-2',
      titre: 'Correction de l’atelier 3 : axe et lecture',
      dureeMinutes: 1,
      concepts: ['lecture-graphique'],
      notes: puces(
        '« Le sur-mesure s’effondre » est même faux au 3e trimestre : il remonte de 95 à 102 k€.',
        'Relance sur « 167 % du CA » : quelle est la vraie part ? 167 ÷ 318 ≈ 52,5 % (on la retrouvera dans le TCD).',
        'Transition : « Voici le graphique retenu pour le dossier. »',
      ),
    },
    'B2-01-A4-03-ATELIER-3-SUITE',
    [
      [
        'b2-01-a4-axe',
        'L’axe part de zéro et reste gradué : le tronquer à 49 000 € grossirait les écarts, comme sur la diapositive de Samir.',
      ],
      [
        'b2-01-a4-lecture',
        'La phrase décrit deux valeurs avec leur unité ; elle ne conclut pas (« s’effondre ») et ne confond pas un montant avec un pourcentage.',
      ],
    ],
  ),
  ecranV2(
    {
      screenId: 'B2-01-A4-04-CA-TRIMESTRIEL',
      titre: 'Le graphique retenu pour le dossier du comité',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['lecture-graphique'],
      notes: puces(
        'Comparer au choix de l’atelier 3 : courbes étiquetées directement, axe à zéro.',
        'Rappeler : la phrase de lecture décrit, elle n’explique pas (pas de « parce que »).',
        'Transition : « Deuxième tâche : le prix de la toile, révision après révision. »',
      ),
    },
    'chart',
    {
      title: 'CA HT 2025 par canal et par trimestre (en milliers d’euros)',
      kind: 'line',
      labels: ['T1', 'T2', 'T3', 'T4'],
      series: [
        { label: 'Sur-mesure', values: [120, 95, 102, 80], tone: 'ink' },
        { label: 'Entretien', values: [58, 61, 49, 62], tone: 'gold' },
        { label: 'Marketplace', values: [98, 131, 167, 127], tone: 'teal' },
      ],
      axisRanges: [[0, 180]],
      axisLabels: ['0 à 180 milliers d’euros'],
      unit: 'milliers d’euros HT',
      reading:
        'La marketplace culmine au 3e trimestre (167 000 €) ; le sur-mesure recule de 120 000 € à 80 000 € entre le 1er et le 4e trimestre ; l’entretien reste entre 49 000 € et 62 000 €.',
      source:
        'Comptabilité analytique d’Atelier Rivage, 2025 (données fictives).',
      description:
        'Trois séries étiquetées sur quatre périodes : sur-mesure 120, 95, 102, 80 ; entretien 58, 61, 49, 62 ; marketplace 98, 131, 167, 127 (milliers d’euros) ; axe de 0 à 180.',
    },
  ),
  {
    screenId: 'B2-01-A4-05-INDICE-TOILE',
    titre: 'Tâche de tableur 2 — Prix et indice de la toile',
    diffusion: 'seance',
    brique: 'fp-table-build',
    dureeMinutes: 9,
    concepts: ['evolutions-successives'],
    notes: puces(
      'Individuel, 7 min ; la correction de la synthèse vient à l’écran suivant.',
      'Piège : recalculer chaque prix depuis 20,00 € (20,60 ; 21,40 ; 20,80 €). Le 20,80 € du tableau de bord de Samir vient de là.',
      'Contrôles : 21,60 ; 20,52 ; 21,34 ; 20,70 € ; coefficients 1,08 ; 0,95 ; 1,04 ; 0,97 ; évolution réelle +3,50 % contre « +4 % ».',
    ),
    proprietes: {
      modalite: 'solo',
      plan: PLAN_TABLEAU,
      questions: [
        {
          type: 'tableau',
          id: 'b2-01-a4-indice-toile',
          concept: 'evolutions-successives',
          noteCompte: true,
          corrige: {
            type: 'tableau',
            attendus: [PREMIERE_LIGNE_DU_TABLEAU, ...AUTRES_LIGNES_DU_TABLEAU],
            tolerance: { type: 'absolue', valeur: 0.01 },
            seuilReussite: 0.75,
          },
        },
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A4-05-CORRECTION',
      titre: 'Correction : prix et indice de la toile',
      dureeMinutes: 2,
      concepts: ['evolutions-successives'],
      notes: puces(
        'Boucler avec la carte « toile » du tri A1-05, laissée « à vérifier à l’acte 4 » : +3,50 %, et non +4 %.',
        'Comparaison à l’inflation : prendre le glissement de l’IPC sur l’année (décembre à décembre, ≈ +0,8 %), pas la moyenne annuelle de 0,9 %.',
        'Transition : jalon 4, puis l’acte 5.',
      ),
    },
    'B2-01-A4-05-INDICE-TOILE',
    [
      [
        'b2-01-a4-indice-toile',
        'Chaque révision s’applique au prix précédent : 20,00 × 1,08 = 21,60 € ; × 0,95 = 20,52 € ; × 1,04 = 21,34 € ; × 0,97 = 20,70 €. Indice final : 20,70 ÷ 20 × 100 = 103,50, soit +3,50 % sur l’année, et non la somme des taux annoncés (+4 %). Recalculer chaque prix depuis 20,00 € mène au 20,80 € du tableau de bord.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A4-06-JALON-4',
    titre: 'Jalon 4 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['tableur'],
    notes: puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : rejouer la capsule de 1 min 02 à 1 min 34 (#DIV/0!, puis $C$6).',
      'Transition : « Acte 5 : défendre une décision. D’abord, une infirmière en 1858. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-01-a4-jalon',
        invite:
          'Je sais écrire une formule recopiable et contrôler un tableau.',
      },
    },
  },
];

const DONNEES_PAR_CANAL =
  'Données par canal, CA HT 2024 → 2025 : sur-mesure 483 000 € → 397 000 € (taux de marge brute 36 %) ; entretien 210 000 € → 230 000 € (28 %) ; marketplace 357 000 € → 523 000 € (16 %).';

const CONSIGNE_DE_L_ATELIER_4 = `${DONNEES_PAR_CANAL} Marge brute totale 2025 : 291 000 €.`;

const ACTE_5: Acte = [
  ecranV2(
    {
      screenId: 'B2-01-A5-01-NIGHTINGALE',
      titre: '1858 : Florence Nightingale fait décider par les données',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['lecture-graphique'],
      notes: puces(
        'Raconter en 45 s ; montrer un mois où le bleu (maladies évitables) écrase le rouge (blessures).',
        'Relance : « Quelle décision le comité doit-il prendre jeudi ? » (investir ou non dans la marketplace).',
        'Transition : « Prouvons d’où vient la baisse du taux de marge. »',
      ),
    },
    'image-right',
    {
      title: '1858 : Florence Nightingale fait décider par les données',
      image: '/assets/cours/b2-01/v3/nightingale-1858.webp',
      imageAlt:
        'Diagramme polaire de Florence Nightingale (1858) : un secteur par mois de la guerre de Crimée ; la plupart des mois, les secteurs bleus (décès par maladies évitables) sont bien plus grands que les rouges (blessures) et les noirs (autres causes).',
      paragraphs: [
        'Pendant la guerre de Crimée, Florence Nightingale montre, mois par mois, que la plupart des soldats meurent de maladies évitables plutôt que de blessures.',
        'Chaque secteur représente un mois ; son aire mesure un taux annuel de mortalité pour 1 000 soldats : en bleu les maladies évitables, en rouge les blessures, en noir les autres causes. Publié en 1858 et adressé à la reine Victoria, le diagramme appuie des réformes sanitaires.',
        'Jeudi, votre dossier devra faire de même : un constat, un mécanisme, une preuve, une décision.',
      ],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg',
        label:
          'Florence Nightingale, 1858 · Wikimedia Commons (domaine public)',
      },
    },
  ),
  ...suiviDeSonCorrige(
    {
      screenId: 'B2-01-A5-03-CORRECTION',
      titre: 'Correction : prouver l’effet de répartition',
      dureeMinutes: 2,
      concepts: ['moyenne-ponderee'],
      notes: puces(
        '« Corriger une étape de plus » : vite sur les étapes 1 à 4, s’arrêter sur 5 (effet de répartition) et 6 (négation).',
        'Contrôle à écrire au tableau : effet volume +27 600 € (100 000 × 27,6 %) + effet de répartition −26 400 € = +1 200 € de marge.',
        'Transition : « Vérifions que la classe sait l’expliquer : vote. »',
      ),
    },
    {
      screenId: 'B2-01-A5-03-MOYENNE-PONDEREE',
      titre: 'Prouver l’effet de répartition',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 3,
      concepts: ['moyenne-ponderee'],
      notes: puces(
        'Chacun répond sous chaque étape ; la correction vient à l’écran suivant.',
        'Étapes difficiles : 5 (que serait la marge avec la répartition de 2024 ?) et 6 (négation d’un « si… alors » : « il existe… et… »).',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-01-a5-ponderee',
          enonce: `${DONNEES_PAR_CANAL} Prouvez au comité que la baisse du taux global vient du changement de répartition du CA.`,
          etapes: [
            {
              id: 'poids',
              intitule: 'Poids des canaux',
              raisonnement:
                'Poids d’un canal = CA du canal ÷ CA total. 2024 : 483 ÷ 1 050 ≈ 0,46 ; 210 ÷ 1 050 = 0,20 ; 357 ÷ 1 050 = 0,34. 2025 : 397 ÷ 1 150 ≈ 0,345 ; 230 ÷ 1 150 = 0,20 ; 523 ÷ 1 150 ≈ 0,455.',
              invite:
                'Quelle part du CA total représente chaque canal, en 2024 puis en 2025 ?',
            },
            {
              id: 'taux-2024',
              intitule: 'Taux global 2024',
              raisonnement:
                '0,46 × 36 + 0,20 × 28 + 0,34 × 16 = 16,56 + 5,60 + 5,44 = 27,60 %.',
              invite:
                'Quel taux global de 2024 obtenez-vous en pondérant le taux de chaque canal par son poids ?',
            },
            {
              id: 'taux-2025',
              intitule: 'Taux global 2025',
              raisonnement:
                '0,345 × 36 + 0,20 × 28 + 0,455 × 16 = 12,42 + 5,60 + 7,28 = 25,30 %. Avec les poids exacts (397 ÷ 1 150 ; 230 ÷ 1 150 ; 523 ÷ 1 150), on obtient 25,304 %, soit 291 000 ÷ 1 150 000.',
              invite:
                'Quel taux global de 2025 obtenez-vous avec les poids de 2025 ?',
            },
            {
              id: 'moyenne-simple',
              intitule: 'Pourquoi pas la moyenne simple ?',
              raisonnement:
                '(36 + 28 + 16) ÷ 3 ≈ 26,7 % : ce nombre ne correspond à aucune année, car il suppose trois canaux de même poids.',
              invite:
                'Pourquoi la moyenne simple des trois taux ne donne-t-elle le taux global d’aucune année ?',
            },
            {
              id: 'effet',
              intitule: 'Chiffrer l’effet de répartition',
              raisonnement:
                'Avec la répartition de 2024, le CA 2025 (1 150 000 €) aurait donné 27,6 % de marge, soit 317 400 €. La marge réelle est de 291 000 € : le changement de répartition « coûte » 26 400 € de marge.',
              invite:
                'Combien de marge le changement de répartition fait-il perdre en 2025, en euros ?',
            },
            {
              id: 'logique',
              intitule: 'Réfuter une implication',
              raisonnement:
                'L’affirmation « si chaque canal garde son taux, alors le taux global est inchangé » est fausse : Atelier Rivage en est un contre-exemple. Sa négation s’écrit : « il existe une répartition du CA pour laquelle chaque canal garde son taux et le taux global change ».',
              invite:
                'Comment s’écrit la négation de « si chaque canal garde son taux, alors le taux global est inchangé », et quel contre-exemple la prouve ?',
            },
          ],
        },
        etayage: 0,
      },
    },
  ),
  {
    screenId: 'B2-01-A5-02-VOTE-PARADOXE',
    titre: 'Vote : le paradoxe du taux global',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['moyenne-ponderee'],
    notes: puces(
      'Vote 1 (2 min), débat en binôme (3 min), vote 2 sur le lycée (2 min), révélation (1 min).',
      'Juste après la démonstration, le vote 1 devrait dépasser 70 % : dans ce cas, écourter le débat et passer au vote 2.',
      'Grille du débat : un argument complet associe taux stables, poids modifiés et un exemple chiffré.',
      'Transition : « Faites varier la part de la marketplace. »',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        vote(
          'b2-01-a5-paradoxe-v1',
          'moyenne-ponderee',
          true,
          'Entre 2024 et 2025, chaque canal d’Atelier Rivage garde exactement le même taux de marge brute (36 %, 28 % et 16 %). Pourtant, le taux global passe de 27,6 % à 25,3 %. Comment l’expliquez-vous ?',
          'Le poids des canaux dans le CA a changé.',
          [
            [
              'Taux locaux stables, taux global stable : c’est une erreur.',
              'moyenne-simple-des-taux',
            ],
            [
              'Plus de CA fait toujours baisser un taux.',
              'hausse-base-baisse-taux',
            ],
          ],
        ),
        vote(
          'b2-01-a5-paradoxe-v2',
          'moyenne-ponderee',
          true,
          'Dans un lycée qui ne prépare que deux BTS, le taux de réussite reste de 90 % en CG et de 70 % en MCO d’une session à l’autre. Pourtant, le taux de réussite global du lycée baisse. Comment l’expliquez-vous ?',
          'Les candidats de MCO pèsent davantage dans l’ensemble des candidats.',
          [
            [
              'C’est impossible : le taux global est la moyenne de 90 % et 70 %.',
              'moyenne-simple-des-taux',
            ],
            [
              'Il y a eu plus de candidats au total.',
              'hausse-base-baisse-taux',
            ],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Un taux global est une moyenne pondérée',
        lignes: [
          'Taux global = somme des (poids × taux) : si les poids changent, le taux global change, même quand chaque taux reste stable.',
          'Grille du débat — argument correct : taux locaux constants et poids modifiés, avec un exemple chiffré ; incomplet : une intuition sans chiffre ; faux : moyenne simple des taux, ou poids ignorés.',
          'Au lycée, la part des candidats de MCO, moins souvent reçus, a augmenté.',
        ],
      },
    },
  },
  {
    screenId: 'B2-01-A5-04-SIMULATEUR-MIX',
    titre: 'Simulateur : la part de la marketplace',
    diffusion: 'seance',
    brique: 'fp-plot',
    dureeMinutes: 2,
    concepts: ['moyenne-ponderee'],
    notes: puces(
      'Réponses : part de marketplace qui garde 27,6 % → 34 % (celle de 2024) ; taux de marketplace qui redonne 27,6 % à 45,5 % de part → ≈ 21 %.',
      'Pente à faire lire : chaque point de part gagné par la marketplace coûte 0,2 point de taux global (part 20 % → 30,4 %).',
      'Transition : « Le tableur fait ce calcul, à condition de choisir le bon total. »',
    ),
    proprietes: {
      id: 'b2-01-a5-simulateur',
      titre: 'Taux de marge brute global selon la part de la marketplace',
      source:
        'Hypothèses Atelier Rivage : entretien fixé à 20 % du CA, taux par canal 36 %, 28 % et 16 % (données fictives).',
      abscisse: {
        libelle: 'Part de la marketplace dans le CA (%)',
        min: 0,
        max: 80,
      },
      ordonnee: 'Taux de marge brute global (%)',
      bornesOrdonnee: { min: 0, max: 40 },
      parametres: [
        {
          cle: 'tauxMarketplace',
          libelle: 'Taux de marge brute de la marketplace (%)',
          min: 10,
          max: 30,
          pas: 1,
          defaut: 16,
        },
      ],
      series: [
        {
          id: 'global',
          libelle: 'Taux global',
          trait: 'plein',
          calcul: '(20*28 + (80 - x)*36 + x*tauxMarketplace)/100',
        },
        {
          id: 'reference',
          libelle: 'Taux 2024 (27,6 %)',
          trait: 'tirets',
          calcul: '27.6',
        },
      ],
      description:
        'Quelle part de la marketplace garderait le taux de 2024 (27,6 %) ? Réglez ensuite le taux de marge de la marketplace : lequel redonnerait 27,6 % avec la part de 2025 (45,5 %) ?',
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A5-05-TCD',
      titre: 'Tableau croisé dynamique : deux totaux de taux',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['moyenne-ponderee', 'tableur'],
      notes: puces(
        'Faire dire ce que calcule chaque colonne de droite au total : la moyenne des trois taux (26,7 %) ; la marge totale ÷ le CA total (77 160 ÷ 318 000 = 24,3 %).',
        'Pourquoi 24,3 % < 26,7 % : ce trimestre, la marketplace (16 %) pèse 52,5 % du CA.',
        'Annoncer le devoir à déposer : refaire ce TCD sur l’année (taux au total attendu : 25,3 %).',
        'Transition : « Atelier 4 : du constat à la preuve. »',
      ),
    },
    'table',
    {
      title: 'Tableau croisé dynamique : ventes du 3e trimestre 2025 par canal',
      subtitle:
        'Le fichier trimestriel, résumé par le tableur : deux façons d’obtenir un taux au total.',
      columns: [
        { key: 'canal', label: 'Étiquettes de lignes' },
        { key: 'ca', label: 'Somme de CA HT (€)' },
        { key: 'marge', label: 'Somme de marge brute (€)' },
        { key: 'moyenne', label: 'Moyenne de Taux' },
        { key: 'calcule', label: 'Taux (champ calculé = Marge ÷ CA)' },
      ],
      rows: [
        {
          canal: 'Sur-mesure',
          ca: '102 000',
          marge: '36 720',
          moyenne: '36 %',
          calcule: '36 %',
        },
        {
          canal: 'Entretien',
          ca: '49 000',
          marge: '13 720',
          moyenne: '28 %',
          calcule: '28 %',
        },
        {
          canal: 'Marketplace',
          ca: '167 000',
          marge: '26 720',
          moyenne: '16 %',
          calcule: '16 %',
        },
        {
          canal: 'Total général',
          ca: '318 000',
          marge: '77 160',
          moyenne: '26,7 %',
          calcule: '24,3 %',
        },
      ],
      note: '« Moyenne de Taux » applique la fonction Moyenne aux trois valeurs du champ Taux ; le champ calculé Taux divise la marge par le CA, ligne par ligne et au total. Données fictives Atelier Rivage (3e trimestre 2025).',
    },
  ),
  {
    screenId: 'B2-01-A5-06-ATELIER-4',
    titre: 'Atelier 4 — Du constat à la preuve',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 4,
    concepts: ['proportion', 'taux-evolution', 'lecture-graphique'],
    notes: puces(
      '3 min de travail sur les questions 1 à 3.',
      'Pièges : Q1 45,5 % (part du CA, pas de la marge) ; Q2 −86 000 € (écart de CA, pas de marge) ; Q3 « c’est prouvé ».',
    ),
    proprietes: {
      intitule: 'Atelier 4 — Du constat à la preuve (questions 1 à 3)',
      consigne: CONSIGNE_DE_L_ATELIER_4,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        numerique(
          'b2-01-a5-part-marge-marketplace',
          'proportion',
          'En 2025, quelle part de la marge brute d’Atelier Rivage provient de la marketplace ? Réponse en %, arrondie au dixième.',
          '%',
          28.756014,
          { type: 'absolue', valeur: 0.05 },
          '28,8',
          [
            [45.478261, 'population-reference-ignoree'],
            [0.28756, 'taux-valeur-facteur-cent'],
            [347.753346, 'base-inversee'],
          ],
        ),
        numerique(
          'b2-01-a5-variation-marge-sur-mesure',
          'taux-evolution',
          'De combien la marge brute du sur-mesure a-t-elle varié entre 2024 et 2025 ? Réponse en euros, signe compris.',
          '€',
          -30960,
          { type: 'absolue', valeur: 0.5 },
          '−30 960',
          [
            [30960, 'sens-de-variation'],
            [-86000, 'ca-confondu-avec-marge'],
          ],
        ),
        vote(
          'b2-01-a5-causalite',
          'lecture-graphique',
          true,
          'Samir écrit : « La marketplace détourne nos clients du sur-mesure : son CA monte pendant que celui du sur-mesure baisse. » Que lui répondez-vous ?',
          'Hypothèse plausible, à vérifier avec les données par client.',
          [
            [
              'C’est prouvé : les deux évolutions sont simultanées.',
              'correlation-prise-pour-causalite',
            ],
            [
              'C’est exclu : les deux canaux n’ont pas les mêmes clients.',
              'correlation-prise-pour-causalite',
            ],
          ],
          ['Hypothèse', 'par client'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A5-06-CORRECTION-1',
      titre: 'Correction de l’atelier 4 : questions 1 à 3',
      dureeMinutes: 1,
      concepts: ['proportion', 'taux-evolution', 'lecture-graphique'],
      notes: puces(
        'Chiffre absent de l’écran : la marketplace apporte +26 560 € de marge (83 680 − 57 120) ; c’est l’argument contre « arrêter la marketplace ».',
        'Contrôle par canal : −30 960 + 5 600 + 26 560 = +1 200 €, la hausse de marge du tableau de bord.',
        'Transition : « Deux questions de plus, pour rédiger le dossier. »',
      ),
    },
    'B2-01-A5-06-ATELIER-4',
    [
      [
        'b2-01-a5-part-marge-marketplace',
        'Marge de la marketplace : 523 000 × 0,16 = 83 680 €, soit 83 680 ÷ 291 000 ≈ 28,8 % de la marge. 45,5 % est sa part du CA, pas de la marge.',
      ],
      [
        'b2-01-a5-variation-marge-sur-mesure',
        'Marge du sur-mesure : 483 000 × 0,36 = 173 880 € en 2024, 397 000 × 0,36 = 142 920 € en 2025, soit −30 960 €. −86 000 € est l’écart de CA, pas de marge.',
      ],
      [
        'b2-01-a5-causalite',
        'Deux évolutions simultanées ne prouvent pas une cause : l’hypothèse de Samir reste à vérifier, client par client.',
      ],
    ],
  ),
  {
    screenId: 'B2-01-A5-06-ATELIER-4-SUITE',
    titre: 'Atelier 4 — Du constat à la preuve (suite)',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 3,
    concepts: ['contrat-de-lecture', 'moyenne-ponderee'],
    notes: puces(
      '2 min seul, puis 1 min avec le voisin (le pupitre numérote ces questions 1 et 2).',
      'Phrase du dossier (Q4) : pièges « recule de 2,3 % » (des points) et « la rentabilité progresse » (un montant ne dit rien d’un taux).',
      'TCD (Q5) : piège 26,7 %, la moyenne simple qui met les trois canaux à égalité.',
    ),
    proprietes: {
      renvoi: 'B2-01-A5-05-TCD',
      intitule: 'Atelier 4 — Du constat à la preuve (questions 4 et 5)',
      consigne: CONSIGNE_DE_L_ATELIER_4,
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        vote(
          'b2-01-a5-synthese',
          'contrat-de-lecture',
          true,
          'Quelle phrase pouvez-vous écrire telle quelle dans le dossier du comité ?',
          'En 2025, la marge brute progresse de 1 200 € et son taux recule de 2,3 points.',
          [
            [
              'En 2025, la marge brute progresse de 1 200 € et son taux recule de 2,3 %.',
              'points-confondus-avec-pourcentage',
            ],
            [
              'En 2025, la rentabilité progresse, puisque la marge brute gagne 1 200 €.',
              'valeur-confondue-avec-taux',
            ],
          ],
          ['1 200 €', '2,3 points'],
        ),
        vote(
          'b2-01-a5-tcd',
          'moyenne-ponderee',
          true,
          'Le tableau croisé dynamique du 3e trimestre affiche deux totaux de taux, 26,7 % et 24,3 %. Lequel portez-vous au dossier du comité ?',
          '24,3 % : il pondère chaque canal par son CA',
          [
            [
              '26,7 % : il traite les trois canaux à égalité',
              'moyenne-simple-des-taux',
            ],
            [
              'L’un ou l’autre : ils mesurent le même taux',
              'moyenne-simple-des-taux',
            ],
          ],
          ['pondère', '24,3 %'],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A5-06-CORRECTION-2',
      titre: 'Correction de l’atelier 4 : questions 4 et 5',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture', 'moyenne-ponderee'],
      notes: puces(
        'Faire relire la phrase retenue à voix haute : c’est celle du dossier.',
        'Transition : « Quel contrôle pour chaque anomalie du dossier ? »',
      ),
    },
    'B2-01-A5-06-ATELIER-4-SUITE',
    [
      [
        'b2-01-a5-synthese',
        'La marge passe de 289 800 € à 291 000 € (+1 200 €) ; son taux passe de 27,6 % à 25,3 % : l’écart entre deux taux se dit en points, pas en %. Une marge en euros ne dit rien de la rentabilité.',
      ],
      [
        'b2-01-a5-tcd',
        '77 160 ÷ 318 000 ≈ 24,3 % : le total recalculé sur les sommes tient compte du CA de chaque canal. 26,7 % traite les trois canaux à égalité.',
      ],
    ],
  ),
  ...suiviDeSaCorrection(
    {
      screenId: 'B2-01-A5-07-CORRECTION',
      titre: 'Correction : le contrôle qui tranche chaque anomalie',
      sousTitre:
        'À efficacité égale, le contrôle le moins coûteux d’abord : métadonnées, puis recalcul, puis pièce.',
      dureeMinutes: 1,
      concepts: ['controle-coherence'],
      notes: puces(
        'Commencer par « factures », « compensation » et « détourne nos clients ».',
        'Point clé : un total qui concorde ne prouve pas chaque ligne (+100 € et −100 € se compensent) ; un indice oriente, une pièce tranche.',
        'Transition : « Rédigez votre recommandation. »',
      ),
    },
    {
      screenId: 'B2-01-A5-07-CONTROLE-DISCRIMINANT',
      titre: 'Quel contrôle pour chaque anomalie ?',
      diffusion: 'seance',
      brique: 'fp-cardsort',
      dureeMinutes: 8,
      concepts: ['controle-coherence'],
      notes: puces(
        'Binômes, 5 min de tri (annoncer la dernière minute), puis écran de correction.',
        'Cartes à risque : « factures de mars » et « compensation de février » (preuve par la pièce, pas recalcul) ; « détourne nos clients » (seule une donnée par client tranche).',
        'Relance : « Ce contrôle permet-il de trancher, ou seulement de soupçonner ? »',
      ),
      proprietes: {
        modalite: 'binome',
        ...classement(
          {
            id: 'b2-01-a5-controle',
            intitule:
              'Pour chaque anomalie du dossier, choisissez le contrôle le plus direct qui permet de trancher.',
          },
          'controle-coherence',
          [
            [
              'metadonnees',
              'Compléter les métadonnées (unité, période, source)',
            ],
            ['recalcul', 'Recalculer (coefficients, points, pondération)'],
            ['representation', 'Refaire la représentation (axe, titre, forme)'],
            ['preuve', 'Chercher une preuve externe (pièce, donnée détaillée)'],
          ],
          [
            {
              id: 'inflation',
              libelle: '« Inflation : 4,9 » dans le tableau de bord',
              categorie: 'metadonnees',
              confusion: 'unite-manquante-ignoree',
              justification:
                '« 4,9 » sans unité ni période : taux annuel, indice ou écart ? Compléter la fiche d’identité suffit à trancher.',
            },
            {
              id: 'marge',
              libelle: '« Marge brute : +1 200 »',
              categorie: 'metadonnees',
              confusion: 'unite-manquante-ignoree',
              justification:
                '« +1 200 » : des euros, des unités, sur quelle période ? Sans unité ni base, le chiffre ne se lit pas.',
            },
            {
              id: 'points',
              libelle: '« Taux de marge : −2,3 % »',
              categorie: 'recalcul',
              confusion: 'points-confondus-avec-pourcentage',
              justification:
                'L’écart entre deux taux se recalcule en points : −2,3 points, soit −8,3 % en évolution relative.',
            },
            {
              id: 'toile',
              libelle: '« Prix de la toile : +4 % » (8 − 5 + 4 − 3)',
              categorie: 'recalcul',
              confusion: 'taux-successifs-additionnes',
              justification:
                'Des taux successifs se multiplient : 1,08 × 0,95 × 1,04 × 0,97 ≈ 1,035, soit +3,5 % et non +4 %.',
            },
            {
              id: 'moyenne',
              libelle:
                'Note de Samir : « taux de marge moyen des canaux : 26,7 % »',
              categorie: 'recalcul',
              confusion: 'moyenne-simple-des-taux',
              justification:
                'Une moyenne simple ignore le poids de chaque canal : on recalcule une moyenne pondérée par le CA.',
            },
            {
              id: 'diapo',
              libelle: 'Diapositive « Marge brute : une croissance continue »',
              categorie: 'representation',
              confusion: 'axe-tronque-lu-comme-ecart',
              justification:
                'L’axe tronqué grossit l’écart : on refait le graphique avec un axe à zéro avant de conclure.',
            },
            {
              id: 'clients',
              libelle: '« La marketplace détourne nos clients du sur-mesure »',
              categorie: 'preuve',
              confusion: 'correlation-prise-pour-causalite',
              justification:
                'Deux évolutions simultanées ne prouvent pas une cause : seule une donnée détaillée des clients par canal tranche.',
            },
            {
              id: 'factures',
              libelle:
                'Courriel du cabinet comptable : grand livre des ventes de mars 48 795 € HT, pièces 48 705 € HT',
              categorie: 'preuve',
              confusion: 'controle-non-discriminant',
              justification:
                '90 € d’écart entre le grand livre et les pièces : seule la pièce de mars dit laquelle des deux se trompe.',
            },
            {
              id: 'compensation',
              libelle:
                'Contrôle de février : total du grand livre égal au total des pièces, mais F002 à +100 € et F003 à −100 €',
              categorie: 'preuve',
              confusion: 'total-concordant-vaut-preuve',
              justification:
                'Un total qui concorde peut cacher +100 € et −100 € : on contrôle ligne à ligne, pièce en main.',
            },
          ],
        ),
      },
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A5-08-DOSSIER-COMITE',
      titre: 'Le dossier du comité en une page',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['moyenne-ponderee'],
      notes: puces(
        '1 min de lecture silencieuse, sans commentaire.',
        'Relance : « Si la marketplace double à taux constant, combien de marge en plus ? » (+83 680 €, face à 40 000 € investis).',
        '« Et le taux global ? » (≈ 22,4 % : le taux baisse encore, la marge en euros monte).',
        'Transition : « À vous de recommander, en trois phrases. »',
      ),
    },
    'table',
    {
      title: 'Le dossier du comité : ce que disent les chiffres',
      subtitle: 'Atelier Rivage, exercices 2024 et 2025 (données fictives).',
      columns: [
        { key: 'rubrique', label: 'Rubrique' },
        { key: 'contenu', label: 'Ce que montre le dossier' },
      ],
      rows: [
        {
          rubrique: 'Constat',
          contenu:
            'CA HT : 1 050 000 € → 1 150 000 € (+9,5 %). Marge brute : 289 800 € → 291 000 € (+1 200 €). Taux de marge brute : 27,6 % → 25,3 % (−2,3 points). Prix : inflation de 0,9 % en 2025, niveau des prix +16,0 % depuis 2019 ; toile +3,5 % sur l’année, et non +4 %.',
        },
        {
          rubrique: 'Mécanisme',
          contenu:
            'Taux par canal inchangés : sur-mesure 36 %, entretien 28 %, marketplace 16 %. CA par canal : 483 000 € → 397 000 €, 210 000 € → 230 000 €, 357 000 € → 523 000 €. Part de la marketplace : 34 % → 45,5 % du CA. Effet de répartition −26 400 €, effet volume +27 600 €. La marketplace apporte +26 560 € de marge ; le sur-mesure en perd 30 960 €. Au 3e trimestre, le taux au total vaut 24,3 % (marge ÷ CA), et non 26,7 % (moyenne simple).',
        },
        {
          rubrique: 'À prouver',
          contenu:
            'Le transfert de clients du sur-mesure vers la marketplace (données par client) ; l’écart de 90 € entre le grand livre (48 795 € HT) et les factures de vente de mars (48 705 € HT).',
        },
        {
          rubrique: 'Proposition de Samir',
          contenu:
            'Investir 40 000 € pour doubler les ventes de la marketplace.',
        },
      ],
    },
  ),
  {
    screenId: 'B2-01-A5-08-RECOMMANDATION',
    titre: 'Votre recommandation au comité',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['moyenne-ponderee'],
    notes: puces(
      '3 min d’écriture, révélation, 1 min d’échange.',
      'Piège : recommander d’arrêter la marketplace parce qu’elle fait baisser le taux ; elle apporte +26 560 € de marge.',
      'Exiger un chiffre ou une pièce dans chaque phrase ; la décision porte sur la marge en euros, pas sur le CA.',
      'Transition : jalon 5.',
    ),
    proprietes: {
      modalite: 'solo',
      renvoi: 'B2-01-A5-08-DOSSIER-COMITE',
      probleme: {
        id: 'b2-01-a5-recommandation',
        enonce:
          'Mercredi, 17 h. Samir annonce qu’il proposera demain d’investir 40 000 € pour doubler les ventes de la marketplace. Hélène vous demande votre recommandation écrite, fondée sur le dossier.',
        invite:
          'Rédigez trois phrases structurées : 1) le constat chiffré et son unité ; 2) le mécanisme expliqué par les poids, ainsi que ce qui reste à prouver ; 3) la décision proposée, sa limite et le contrôle prioritaire.',
        rappel: [
          {
            libelle: 'Le dossier',
            valeur:
              'Atelier Rivage, trois canaux (sur-mesure, entretien, marketplace), exercices 2024 et 2025, données annuelles.',
          },
          {
            libelle: 'La proposition de Samir',
            valeur:
              'Investir 40 000 € pour doubler les ventes de la marketplace.',
          },
          {
            libelle: 'Chiffre d’affaires HT',
            valeur: '1 050 000 € → 1 150 000 €, soit +9,5 %.',
          },
          {
            libelle: 'Marge brute',
            valeur: '289 800 € → 291 000 €, soit +1 200 €.',
          },
          {
            libelle: 'Taux de marge brute global',
            valeur: '27,6 % → 25,3 %, soit −2,3 points.',
          },
          {
            libelle: 'CA HT par canal',
            valeur:
              'sur-mesure 483 000 € → 397 000 € ; entretien 210 000 € → 230 000 € ; marketplace 357 000 € → 523 000 €.',
          },
          {
            libelle:
              'Taux de marge brute par canal, identiques les deux années',
            valeur: 'sur-mesure 36 % ; entretien 28 % ; marketplace 16 %.',
          },
          {
            libelle: 'Part de la marketplace dans le CA',
            valeur: '34 % → 45,5 %.',
          },
          {
            libelle: 'Anomalie relevée au contrôle',
            valeur:
              '90 € d’écart entre le grand livre (48 795 € HT) et les factures de vente de mars (48 705 € HT).',
          },
        ],
      },
      corrige: {
        type: 'defi',
        strategies: [
          strategie(
            'constat',
            'Constat : CA +9,5 %, marge brute +1 200 €, taux de marge brute −2,3 points (27,6 % → 25,3 %).',
          ),
          strategie(
            'mecanisme',
            'Mécanisme : taux par canal stables ; la marketplace (16 %) passe de 34 % à 45,5 % du CA : effet de répartition d’environ −26 400 € de marge, confirmé par le champ calculé du TCD.',
          ),
          strategie(
            'a-prouver',
            'À prouver : le transfert de clients du sur-mesure vers la marketplace (données par client) et l’écart de 90 € sur les factures de vente de mars.',
          ),
          strategie(
            'decision',
            'Décision : conditionner l’investissement à un objectif de marge en euros et à un plan pour le sur-mesure, plutôt qu’à un objectif de CA.',
          ),
          strategie(
            'limite',
            'Limite : deux exercices seulement, données annuelles, coûts directs supposés stables.',
          ),
          strategie(
            'priorites',
            'Priorités : d’abord l’effet de répartition (−26 400 € de marge), puis le recul du sur-mesure (−30 960 €), enfin l’écart de 90 € des factures, sans effet sur la décision mais à corriger.',
          ),
          strategie(
            'arreter',
            'Arrêter la marketplace, puisqu’elle fait baisser le taux global.',
            true,
          ),
        ],
      },
    },
  },
  {
    screenId: 'B2-01-A5-09-JALON-5',
    titre: 'Jalon 5 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['moyenne-ponderee'],
    notes: puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : refaire au tableau l’étape « Taux global 2024 » de A5-03 (poids × taux).',
      'Transition : « Jeudi, 13 h 30. Avant d’entrer, un détour par Venise. »',
    ),
    proprietes: {
      sondage: {
        id: 'b2-01-a5-jalon',
        invite:
          'Je sais expliquer un écart par un effet de répartition et défendre une recommandation chiffrée.',
      },
    },
  },
];

function enigme(
  rang: number,
  id: string,
  concept: ConceptId,
  valeur: number,
  tolerance: number,
  formePubliee: string,
  fragment: string,
  pieges: AuMoinsUn<readonly [number, ConfusionId]>,
) {
  return {
    type: 'enigme' as const,
    id,
    concept,
    noteCompte: false,
    corrige: {
      type: 'enigme' as const,
      parcoursId: 'b2-01-a6-coffre',
      enigmeId: id,
      rang,
      solution: {
        type: 'nombre' as const,
        valeur,
        tolerance: { type: 'absolue' as const, valeur: tolerance },
        formePubliee,
      },
      fragment,
      pieges: mapper(pieges, ([valeurDuPiege, confusion]) => ({
        valeur: valeurDuPiege,
        confusion,
      })),
    },
  };
}

function rappel(
  id: string,
  concept: ConceptId,
  enonce: string,
  bonne: string,
  pieges: AuMoinsUn<Piege>,
): VoteDuCours {
  return vote(id, concept, false, enonce, bonne, pieges);
}

const ACTE_6: Acte = [
  ecranV2(
    {
      screenId: 'B2-01-A6-01-PACIOLI',
      titre: '1494 : Pacioli et la méthode du contrôle',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['controle-coherence'],
      notes: puces(
        'Écrire au tableau (10a + b) − (10b + a) = 9 × (a − b), avec 1 263 saisi 1 623 : écart de 360 = 9 × 40.',
        'Relances : « Que prouve un total juste ? » (une cohérence, pas l’exactitude de chaque ligne) ; « 360 ÷ 9 = 40 : où est l’inversion ? » (centaines et dizaines).',
        'Transition : « Quatre vérifications ouvrent la salle du comité. »',
      ),
    },
    'image-left',
    {
      title: '1494 : Pacioli et la méthode du contrôle',
      subtitle: 'Une concordance oriente, la pièce tranche.',
      image: '/assets/cours/b2-01/v3/pacioli-1495.webp',
      imageAlt:
        'Portrait de Luca Pacioli en habit franciscain, démontrant une figure d’Euclide, à côté d’un jeune homme non identifié ; tableau daté de 1495, attribué à Jacopo de’ Barbari.',
      paragraphs: [
        'En 1494, à Venise, Luca Pacioli publie dans la Summa de arithmetica la première description imprimée de la comptabilité en partie double. Il n’en est pas l’inventeur : il décrit la pratique des marchands vénitiens.',
        'Chaque opération y est enregistrée deux fois et les totaux doivent concorder. Une concordance est un signal, pas une preuve : deux erreurs de sens contraire peuvent se compenser, et c’est la pièce justificative qui tranche.',
        'Quand deux totaux diffèrent, l’écart oriente la recherche. Intervertir deux chiffres voisins a et b change un nombre de 9 × (a − b) unités du rang concerné, car (10a + b) − (10b + a) = 9 × (a − b) : saisir 1 623 au lieu de 1 263 crée un écart de 360, divisible par 9. Un tel écart fait soupçonner une inversion ; seule la pièce la confirme.',
      ],
      sourceLink: {
        href: 'https://commons.wikimedia.org/wiki/File:Pacioli.jpg',
        label:
          'Portrait attribué à Jacopo de’ Barbari, 1495 · Wikimedia Commons (domaine public)',
      },
    },
  ),
  {
    screenId: 'B2-01-A6-02-COFFRE',
    titre: 'Le coffre du comité',
    diffusion: 'seance',
    brique: 'fp-escape',
    dureeMinutes: 9,
    concepts: [
      'moyenne-ponderee',
      'point-de-pourcentage',
      'evolution-reciproque',
      'controle-coherence',
    ],
    notes: puces(
      'Lancer ; indices disponibles après 60 s. À 7 min, projeter l’énigme la moins résolue.',
      'Pièges : E1 26,7 % (moyenne simple) ; E2 −10,7 (en %, pas en points) ; E3 1 032,57 € (÷ 1,02, taux additionnés).',
      'E3 : le prix du 1er janvier 2026 est celui du 31 décembre 2025 : 20,70 €/m² × 50 m² = 1 035,00 € ; contrôle 1 035 × 1,06 × 0,96 = 1 053,22.',
      'E4 : l’écart de 90 € vient de F004 (12 430 saisi pour 12 340 : inversion, 90 = 9 × 10). TVA = 48 705 × 0,20 = 9 741 €, pas 9 759 € (base du grand livre).',
    ),
    proprietes: {
      modalite: 'solo',
      parcours: {
        id: 'b2-01-a6-coffre',
        intitule:
          'Le coffre du comité : quatre vérifications, un code pour ouvrir la salle',
        delaiIndiceMs: 60000,
        budgetEnigmeMs: 150000,
        tentativesMax: 10,
        enigmes: [
          {
            id: 'b2-01-a6-e1-mix',
            intitule: 'Le premier semestre 2026',
            enonce:
              'Au 1er semestre 2026 : sur-mesure 150 000 € de CA HT (taux de marge brute 36 %), entretien 120 000 € (28 %), marketplace 330 000 € (16 %). Quel est le taux de marge brute global, en %, arrondi au dixième ?',
            indice:
              'Additionnez les marges en euros, puis divisez par le CA total.',
          },
          {
            id: 'b2-01-a6-e2-points',
            intitule: 'L’écart',
            enonce:
              'Au 1er semestre 2025, le taux de marge brute global était de 26,2 %. De combien a-t-il varié au 1er semestre 2026 (taux trouvé à l’énigme précédente) ? Réponse en points, signe compris, arrondie au dixième.',
            indice:
              'Comparez deux semestres entre eux ; un écart entre deux taux se lit en points : soustrayez le taux de départ.',
          },
          {
            id: 'b2-01-a6-e3-rouleau',
            intitule: 'Le rouleau en 2026',
            enonce:
              'Pour 2026, le fournisseur annonce +6 % au 1er mars, puis −4 % au 1er juin. Au 1er juin 2026, un rouleau de 50 m² de toile coûte 1 053,22 € HT. Quel était son prix au 1er janvier 2026, en euros, arrondi au centime ?',
            indice:
              'Remontez le temps : divisez par le coefficient global, pas par la somme des taux.',
          },
          {
            id: 'b2-01-a6-e4-tva',
            intitule: 'Les factures de vente de mars',
            enonce:
              'Courriel du cabinet : grand livre des ventes de mars 48 795 € HT, pièces 48 705 € HT. Détail (grand livre / pièce) : F001 12 000 / 12 000 ; F002 8 500 / 8 500 ; F003 15 865 / 15 865 ; F004 12 430 / 12 340. Quel montant de TVA collectée à 20 % faut-il retenir pour les ventes de mars, en euros ?',
            indice:
              'Comparez chaque ligne du grand livre à sa pièce : la pièce justificative fait foi.',
          },
        ],
      },
      questions: [
        enigme(
          0,
          'b2-01-a6-e1-mix',
          'moyenne-ponderee',
          23.4,
          0.05,
          '23,4',
          'K7',
          [[26.666667, 'moyenne-simple-des-taux']],
        ),
        enigme(
          1,
          'b2-01-a6-e2-points',
          'point-de-pourcentage',
          -2.8,
          0.05,
          '−2,8',
          'M2',
          [
            [-10.687023, 'points-confondus-avec-pourcentage'],
            [2.8, 'sens-de-variation'],
            [-1.904348, 'bases-incompatibles'],
          ],
        ),
        enigme(
          2,
          'b2-01-a6-e3-rouleau',
          'evolution-reciproque',
          1035.003931,
          0.005,
          '1 035,00',
          'Q9',
          [
            [1032.568627, 'taux-successifs-additionnes'],
            [1034.683328, 'reciproque-meme-taux'],
            [1032.1556, 'reciproque-meme-taux'],
          ],
        ),
        enigme(
          3,
          'b2-01-a6-e4-tva',
          'controle-coherence',
          9741,
          0.5,
          '9 741',
          '4X',
          [
            [9759, 'tva-base-non-corrigee'],
            [8117.5, 'tva-calculee-sur-ttc'],
            [18, 'controle-non-discriminant'],
          ],
        ),
      ],
    },
  },
  correctionDesReponses(
    {
      screenId: 'B2-01-A6-02-CORRECTION',
      titre: 'Correction du coffre : les quatre vérifications',
      dureeMinutes: 1,
      concepts: [
        'moyenne-ponderee',
        'point-de-pourcentage',
        'evolution-reciproque',
        'controle-coherence',
      ],
      notes: puces(
        'S’attarder sur l’énigme la moins résolue (pupitre).',
        'Faire relier chaque énigme à son acte : E1 la moyenne pondérée (A5-03), E2 les points (A2-06), E3 le 20,70 €/m² de la tâche de tableur 2 (A4-05), E4 l’inversion de Pacioli (A6-01).',
        'Transition : « Avant la dernière réponse à corriger, le cadre : ce que l’IA peut faire, et ce qu’elle ne peut pas faire. »',
      ),
    },
    'B2-01-A6-02-COFFRE',
    [
      [
        'b2-01-a6-e1-mix',
        'Marges : 54 000 + 33 600 + 52 800 = 140 400 € ; 140 400 ÷ 600 000 = 23,4 %. La moyenne simple des trois taux (26,7 %) ignore le poids de chaque canal.',
      ],
      [
        'b2-01-a6-e2-points',
        '23,4 − 26,2 = −2,8 points. L’écart entre deux taux se dit en points ; −10,7 % serait l’évolution relative du taux.',
      ],
      [
        'b2-01-a6-e3-rouleau',
        'Coefficient global : 1,06 × 0,96 = 1,0176 ; 1 053,22 ÷ 1,0176 ≈ 1 035,00 €, soit 20,70 €/m² × 50 m². Diviser par 1,02 (taux additionnés) donnerait 1 032,57 €.',
      ],
      [
        'b2-01-a6-e4-tva',
        'L’écart de 90 € vient de F004 : 12 430 saisi pour 12 340 (inversion, 90 = 9 × 10). La pièce fait foi : TVA = 48 705 × 0,20 = 9 741 €, et non 9 759 € (base du grand livre).',
      ],
    ],
  ),
  ecranV2(
    {
      screenId: 'B2-01-A6-03-IA-CADRE',
      titre: 'IA : accélérer la préparation, jamais déléguer le jugement',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['controle-coherence'],
      notes: puces(
        'Relance : « Quelle donnée d’Atelier Rivage ne doit jamais être collée dans un outil grand public ? » (noms de clients, montants réels).',
        'Insister sur « Faire challenger » : savoir écrire « je ne peux pas conclure ».',
        'Transition : « Corrigez cette réponse d’IA. »',
      ),
    },
    'guide',
    {
      title: 'IA : accélérer la préparation, jamais déléguer le jugement',
      subtitle:
        'Une IA générative peut proposer une méthode ou une formule. Elle ne valide ni un chiffre, ni une pièce, ni une conclusion.',
      context:
        'Le cadre d’usage de l’IA en éducation (ministère de l’Éducation nationale, juin 2025) demande un usage encadré, la protection des données et la vérification des productions. Pour un comptable, cela rejoint le secret professionnel et le contrôle interne.',
      takeaway:
        'L’IA peut réduire le temps de préparation ; la responsabilité de la preuve reste humaine.',
      nextAction:
        'Pour chaque réponse d’IA : source, calcul refait au tableur, contrôle, limite.',
      items: [
        {
          title: 'Cadrer',
          description:
            'Décrire le rôle, la question, le format attendu et les contraintes de calcul.',
          detail:
            'Demander une méthode vérifiable, pas une réponse persuasive.',
        },
        {
          title: 'Anonymiser',
          description:
            'Remplacer noms, clients et montants réels par des données fictives.',
          detail: 'Aucune donnée confidentielle dans un service grand public.',
        },
        {
          title: 'Faire challenger',
          description:
            'Demander les hypothèses, les unités et les cas limites.',
          detail:
            'L’IA est utile comme contradicteur, pas comme source ; sachez écrire « je ne peux pas conclure » quand la donnée manque.',
        },
        {
          title: 'Vérifier au tableur',
          description:
            'Qualifier la source de chaque chiffre, recalculer avec un outil déterministe et comparer aux pièces.',
          detail:
            'Un résultat doit être reproductible hors de la conversation.',
        },
        {
          title: 'Tracer',
          description:
            'Conserver la question, la version retenue et les corrections humaines.',
          detail:
            'Le lecteur doit savoir ce qui vient de l’outil et ce qui vient du professionnel.',
        },
      ],
    },
  ),
  {
    screenId: 'B2-01-A6-04-IA-ERREUR',
    titre: 'Corriger une réponse d’IA',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 4,
    concepts: ['taux-moyen'],
    notes: puces(
      '3 min d’écriture, révélation, 1 min d’échange.',
      'Repérer qui ne trouve qu’une erreur, et qui retrouve le CA 2023 : 357 000 ÷ 1,20 = 297 500 €.',
      'Contrôle : 297 500 × 1,326² ≈ 523 000. L’IA se trompe de 0,65 point (33,25 % contre 32,6 %) : l’ordre de grandeur ne suffit pas.',
      'Transition : « Votre rappel personnel. »',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-01-a6-ia-erreur',
        enonce:
          'Samir a demandé à un assistant IA : « Évolution du CA de notre marketplace entre 2023 et 2025, et taux annuel moyen ? », en donnant +20 % en 2024 et +46,5 % en 2025. Réponse obtenue : « Hausse totale : 20 + 46,5 = 66,5 %. Taux annuel moyen : 66,5 ÷ 2 = 33,25 %. »',
        invite:
          'Trouvez les deux erreurs, corrigez les deux résultats, puis écrivez le contrôle que vous feriez au tableur.',
      },
      corrige: {
        type: 'defi',
        strategies: [
          strategie(
            'successives',
            'Erreur 1 : des évolutions successives se multiplient : 1,20 × 1,465 ≈ 1,758, soit +75,8 % (297 500 € → 523 000 €).',
          ),
          strategie(
            'racine',
            'Erreur 2 : le taux moyen se calcule avec une racine carrée : √1,758 − 1 ≈ 0,326, soit +32,6 % par an.',
          ),
          strategie(
            'tableur',
            'Contrôle au tableur : =297500*PUISSANCE(1,326;2) redonne environ 523 000.',
          ),
          strategie(
            'garder',
            'Garder la réponse de l’IA : elle donne le bon ordre de grandeur.',
            true,
          ),
        ],
      },
    },
  },
  {
    screenId: 'B2-01-A6-05-RAPPEL',
    titre: 'Rappel : de mémoire, sans vos notes',
    diffusion: 'seance',
    brique: 'fp-spaced',
    dureeMinutes: 3,
    concepts: [
      'taux-evolution',
      'point-de-pourcentage',
      'evolutions-successives',
      'evolution-reciproque',
      'indice-base-100',
      'taux-moyen',
      'moyenne-ponderee',
      'proportion',
      'lecture-graphique',
      'controle-coherence',
    ],
    notes: puces(
      '2 min 30 individuelles, puis projeter la carte de maîtrise.',
      'Tous reçoivent les deux questions obligatoires (compensation, multiple de 9), en plus de leurs points faibles.',
      'Annoncer que les concepts restés en boîte 1 pour plus de 30 % de la classe ouvriront B2-02.',
    ),
    proprietes: {
      rappel: {
        id: 'b2-01-a6-rappel',
        intitule: 'Rappel : de mémoire, sans vos notes',
      },
      banque: {
        questions: [
          rappel(
            'b2-01-r-taux-evolution',
            'taux-evolution',
            'Le CA de l’entretien passe de 210 000 € à 230 000 €. Quel est son taux d’évolution ?',
            'Environ +9,5 %',
            [
              ['Environ +8,7 %', 'base-arrivee'],
              ['+20 000 €', 'ecart-absolu-au-lieu-du-taux'],
            ],
          ),
          rappel(
            'b2-01-r-points',
            'point-de-pourcentage',
            'Le taux de retour des colis passe de 4 % à 5 %. Quelle phrase est exacte ?',
            '+1 point, soit +25 % en valeur relative',
            [
              ['+1 %', 'points-confondus-avec-pourcentage'],
              ['+25 points', 'points-confondus-avec-pourcentage'],
            ],
          ),
          rappel(
            'b2-01-r-successives',
            'evolutions-successives',
            'Un prix augmente de 20 %, puis baisse de 20 %. Quelle est son évolution globale ?',
            'Une baisse de 4 %',
            [
              ['Aucune évolution : 0 %', 'hausse-baisse-symetriques'],
              ['Une hausse de 4 %', 'coefficient-global-mal-interprete'],
            ],
          ),
          rappel(
            'b2-01-r-reciproque',
            'evolution-reciproque',
            'Après une baisse de 20 %, quelle hausse ramène au prix initial ?',
            'Une hausse de 25 %',
            [
              ['Une hausse de 20 %', 'reciproque-meme-taux'],
              ['Une hausse de 80 %', 'coefficient-confondu-avec-taux'],
            ],
          ),
          rappel(
            'b2-01-r-indice',
            'indice-base-100',
            'L’indice du prix de la toile vaut 103,5 (base 100 au 1er janvier). Que signifie-t-il ?',
            'Le prix a augmenté de 3,5 % depuis le 1er janvier',
            [
              ['Le m² coûte 103,50 €', 'indice-lu-comme-valeur'],
              ['Le prix a augmenté de 103,5 %', 'indice-lu-comme-taux'],
            ],
          ),
          rappel(
            'b2-01-r-taux-moyen',
            'taux-moyen',
            'Un CA augmente de 21 % en deux ans. Quel taux annuel moyen ?',
            '10 % par an',
            [
              ['10,5 % par an', 'taux-moyen-arithmetique'],
              ['4,6 % par an', 'coefficient-confondu-avec-taux'],
            ],
          ),
          rappel(
            'b2-01-r-ponderee',
            'moyenne-ponderee',
            'Canal A : 100 000 € de CA à 30 % de marge ; canal B : 300 000 € à 10 %. Taux de marge global ?',
            'Un taux global de 15 %',
            [
              ['Un taux global de 20 %', 'moyenne-simple-des-taux'],
              ['Un taux global de 40 %', 'raisonnement-additif'],
            ],
          ),
          rappel(
            'b2-01-r-population',
            'proportion',
            'Un canal réalise 45 % des commandes mais 20 % du CA. Est-ce contradictoire ?',
            'Non : les deux parts n’ont pas la même population de référence',
            [
              [
                'Oui : l’un des deux chiffres est faux',
                'population-reference-ignoree',
              ],
              [
                'Oui : les deux parts devraient être égales',
                'population-reference-ignoree',
              ],
            ],
          ),
          rappel(
            'b2-01-r-axe',
            'lecture-graphique',
            'Deux barres valent 98 et 100 ; l’axe vertical va de 97 à 101 ; la seconde paraît trois fois plus haute. Quel est l’écart réel ?',
            'Environ +2 %',
            [
              ['+200 %', 'axe-tronque-lu-comme-ecart'],
              ['La valeur a triplé', 'axe-tronque-lu-comme-ecart'],
            ],
          ),
          rappel(
            'b2-01-r-compensation',
            'controle-coherence',
            'Contrôle de février : le total du grand livre égale celui des pièces, mais F002 est à +100 € et F003 à −100 €. Peut-on valider chaque écriture ?',
            'Non : deux erreurs de sens contraire se compensent',
            [
              ['Oui : le total concorde', 'total-concordant-vaut-preuve'],
              [
                'Oui : un écart de 100 € est négligeable',
                'controle-non-discriminant',
              ],
            ],
          ),
          rappel(
            'b2-01-r-multiple-neuf',
            'controle-coherence',
            'Un écart de 270 € sépare le grand livre d’avril des pièces ; 270 est divisible par 9. Qu’en concluez-vous ?',
            'C’est un indice d’inversion de chiffres, à confirmer avec la pièce',
            [
              [
                'C’est la preuve d’une inversion de chiffres',
                'indice-pris-pour-preuve',
              ],
              ['Il n’y a pas d’erreur', 'total-concordant-vaut-preuve'],
            ],
          ),
          rappel(
            'b2-01-r-taux-mensuel',
            'taux-moyen',
            'Un placement rapporte 6 % par an. Quel taux mensuel, appliqué douze fois, donne le même résultat ?',
            'Environ 0,49 % par mois',
            [
              ['0,5 % par mois', 'taux-moyen-arithmetique'],
              ['72 % par an', 'taux-successifs-additionnes'],
            ],
          ),
          rappel(
            'b2-01-r-ttc-ht',
            'evolution-reciproque',
            'Pour passer d’un prix TTC (TVA 20 %) au prix HT, de quel pourcentage le prix baisse-t-il ?',
            'Une baisse d’environ 16,7 %',
            [
              ['Une baisse de 20 %', 'reciproque-meme-taux'],
              ['Une baisse d’environ 83,3 %', 'coefficient-confondu-avec-taux'],
            ],
          ),
        ],
        obligatoires: ['b2-01-r-compensation', 'b2-01-r-multiple-neuf'],
      },
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A6-06-FICHE-MEMO',
      titre: 'Fiche mémo : quelle méthode pour quelle question ?',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: [
        'proportion',
        'pourcentage',
        'taux-evolution',
        'evolutions-successives',
        'evolution-reciproque',
        'point-de-pourcentage',
        'indice-base-100',
        'taux-moyen',
        'moyenne-ponderee',
        'lecture-graphique',
        'controle-coherence',
      ],
      notes: puces(
        '90 s de lecture.',
        'Relance : « Quelle carte pour "le taux global baisse alors que chaque taux est stable" ? » (moyenne pondérée).',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : quelle méthode pour quelle question ?',
      subtitle:
        'À garder pour le CCF : chaque carte part d’une question et donne la méthode et son contrôle.',
      items: [
        {
          title: 'Proportion',
          description: 'Quelle part du total ?',
          back: 'Partie ÷ total. Nommez la population de référence (commandes ou CA ?).',
        },
        {
          title: 'Évolution',
          description: 'De combien a-t-il varié ?',
          back: 't = (y₂ − y₁) ÷ y₁ ; y₂ = (1 + t) × y₁. Le dénominateur est la valeur de départ.',
        },
        {
          title: 'Successives',
          description: 'Plusieurs hausses et baisses ?',
          back: 'Multipliez les coefficients, puis retirez 1. On n’additionne jamais des taux successifs.',
        },
        {
          title: 'Réciproque',
          description: 'Comment revenir au départ ?',
          back: 'Valeur de départ = arrivée ÷ coefficient ; taux réciproque = 1 ÷ (1 + t) − 1. Du TTC au HT : ÷ 1,20, soit une baisse de 16,67 %.',
        },
        {
          title: 'Points',
          description: 'Deux taux à comparer ?',
          back: 'Écart en points (de 27 % à 25 % : −2 points) ; l’évolution relative du taux se calcule à part.',
        },
        {
          title: 'Indice',
          description: 'Que signifie un indice ?',
          back: 'I = 100 × V ÷ V₀ ; taux = I ÷ 100 − 1. Un indice n’est ni un prix ni un taux.',
        },
        {
          title: 'Taux moyen',
          description: 'Quel rythme annuel constant ?',
          back: '(Vₙ ÷ V₀)^(1/n) − 1, jamais le taux global divisé par n.',
        },
        {
          title: 'Moyenne pondérée',
          description: 'Pourquoi le taux global bouge-t-il ?',
          back: 'Taux global = somme des marges ÷ somme des CA : il dépend des poids. Dans un TCD, utilisez un champ calculé, jamais « Moyenne de taux ».',
        },
        {
          title: 'Représenter',
          description: 'Quel graphique ?',
          back: 'Évolution dans le temps : courbes ; comparaison de catégories : barres ; parts d’un total : barres empilées à 100 %. Toujours titre, unité, axe gradué, source et phrase de lecture ; un tableau reste l’alternative quand la forme trompe.',
        },
        {
          title: 'Contrôler',
          description: 'Le tableau est-il juste ?',
          back: '$ fige une référence ; un contrôle de formules (les parts font 1) ; un contrôle de données (source indépendante) ; un écart multiple de 9 oriente vers une inversion ; seule la pièce prouve ; à efficacité égale, le contrôle le moins coûteux d’abord.',
        },
        {
          title: 'Libellés',
          description: 'Quel « taux de marge » ?',
          back: 'Taux de marge = marge ÷ coût d’achat HT ; taux de marque = marge ÷ prix de vente HT ; taux de marge brute (sur CA HT) = marge sur coûts directs ÷ CA HT.',
        },
      ],
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A6-07-BOITE-A-OUTILS',
      titre: 'Pour aller plus loin : outils et sources',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableur'],
      notes: puces(
        'Montrer les cartes « Une ligne = une observation » et « SIERREUR ».',
        'Rappeler le devoir : refaire le TCD du 3e trimestre sur l’année ; les liens Excel et LibreOffice de l’écran montrent la manipulation.',
        'Transition : « Billet de sortie. »',
      ),
    },
    'grid',
    {
      title: 'Pour aller plus loin : outils et sources',
      items: [
        {
          title: 'Une ligne = une observation',
          description: 'Des données propres avant tout calcul.',
          back: 'Pas de cellule fusionnée, ni de sous-total ou de titre au milieu des données : le tableau croisé dynamique en dépend.',
        },
        {
          title: 'Tableau croisé dynamique (Excel)',
          description:
            'Agréger par canal, vérifier le total général, ajouter un champ calculé.',
          back: 'Pour un taux au total : champ calculé, jamais « Moyenne de taux » ; datez chaque tableau de bord (date d’extraction).',
          href: 'https://support.microsoft.com/fr-fr/excel/get-started/create-a-pivottable-to-analyze-worksheet-data',
          external: true,
        },
        {
          title: 'Table pilote (LibreOffice Calc)',
          description: 'Le même outil dans un tableur libre.',
          href: 'https://help.libreoffice.org/latest/fr/text/scalc/guide/datapilot.html',
          external: true,
        },
        {
          title: 'SOMME.SI.ENS',
          description: 'Agréger par canal et par période.',
          back: 'Contrôle : la somme des sous-totaux égale le total sans filtre.',
        },
        {
          title: 'RECHERCHEX (Excel)',
          description: 'Retrouver une valeur par sa clé.',
          back: 'Testez une clé absente et un doublon avant de faire confiance au résultat.',
          href: 'https://support.microsoft.com/fr-fr/excel/functions/xlookup-function',
          external: true,
        },
        {
          title: 'SIERREUR',
          description: 'Afficher un message, jamais un 0 muet.',
          back: 'Un 0 peut cacher une clé manquante : affichez « à vérifier ».',
        },
        {
          title: 'ARRONDI à l’affichage',
          description: 'Calculer en pleine précision.',
          back: 'N’arrondissez que le résultat affiché ou facturé ; un prix facturé, lui, est arrondi au centime.',
        },
        {
          title: 'Power Query (Excel)',
          description: 'Nettoyer sans détruire.',
          back: 'Des étapes rejouables, une source intacte, un nettoyage tracé.',
          href: 'https://support.microsoft.com/fr-fr/Excel/power-query-for-excel-help',
          external: true,
        },
        {
          title: 'L’inflation expliquée (Insee)',
          description: 'Taux annuels moyens et glissements.',
          href: 'https://www.insee.fr/fr/statistiques/4268033',
          external: true,
        },
        {
          title: 'Indice des prix, base 2025 (Insee)',
          description: 'La série officielle de l’IPC, France, ensemble.',
          href: 'https://www.insee.fr/fr/statistiques/serie/011814630',
          external: true,
        },
        {
          title: 'Cadre d’usage de l’IA en éducation',
          description: 'Ministère de l’Éducation nationale, juin 2025.',
          href: 'https://www.education.gouv.fr/cadre-d-usage-de-l-ia-en-education-450647',
          external: true,
        },
        {
          title: 'Référentiel du BTS CG',
          description: 'Le programme de mathématiques et l’épreuve E3.',
          href: 'https://enqdip.sup.adc.education.fr/bts/referentiel/BTS_ComptabiliteGestion.pdf',
          external: true,
        },
      ],
    },
  ),
  {
    screenId: 'B2-01-A6-08-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la phrase du compte rendu',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 3,
    concepts: ['contrat-de-lecture'],
    notes: puces(
      '3 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : la phrase en « −2,3 % » et celle qui attribue la baisse au taux de chaque canal.',
      'Alerte attendue : « F004 saisie 12 430 € au lieu de 12 340 € (pièce) : écart de 90 €, TVA collectée à corriger de 18 €, écriture à rectifier. »',
      'Transition : « Rendez-vous en B2-02. »',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        vote(
          'b2-01-a6-billet',
          'contrat-de-lecture',
          true,
          'Le comité ne retiendra qu’une phrase. Laquelle peut figurer telle quelle au compte rendu ?',
          'Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 points : la marketplace, moins margée, pèse davantage dans le CA.',
          [
            [
              'Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 % : la marketplace, moins margée, pèse davantage dans le CA.',
              'points-confondus-avec-pourcentage',
            ],
            [
              'Le CA progresse de 9,5 % mais le taux de marge brute recule de 2,3 points : chaque canal a vu son propre taux baisser.',
              'baisse-attribuee-aux-taux-locaux',
            ],
            [
              'La marge brute progresse de 1 200 € et le CA de 9,5 % : la rentabilité de l’entreprise s’améliore.',
              'valeur-confondue-avec-taux',
            ],
          ],
          ['2,3 points', 'pèse davantage'],
        ),
      ],
      invite:
        'Justifiez en trois phrases : le calcul qui prouve votre choix, la limite de l’analyse et l’action que vous proposez. Ajoutez l’alerte au cabinet sur les ventes de mars : pièce, montant, action.',
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'hausse-baisse-symetriques': 'B2-01-A3-03-PRIX-SAC',
  'taux-successifs-additionnes': 'B2-01-A3-04-FIL-TECHNIQUE',
  'reciproque-meme-taux': 'B2-01-A3-04-FIL-TECHNIQUE',
  'base-arrivee': 'B2-01-A3-02-MACHINE-COEFFICIENTS',
  'ecart-absolu-au-lieu-du-taux': 'B2-01-A2-05-ECRITURES',
  'coefficient-confondu-avec-taux': 'B2-01-A3-02-MACHINE-COEFFICIENTS',
  'taux-valeur-facteur-cent': 'B2-01-A2-05-ECRITURES',
  'raisonnement-additif': 'B2-01-A5-03-MOYENNE-PONDEREE',
  'proportion-confondue-avec-evolution': 'B2-01-A2-05-ECRITURES',
  'points-confondus-avec-pourcentage': 'B2-01-A2-06-POINTS',
  'population-reference-ignoree': 'B2-01-A1-06-FICHE-INDICATEUR',
  'base-inversee': 'B2-01-A1-06-FICHE-INDICATEUR',
  'sens-de-variation': 'B2-01-A3-02-MACHINE-COEFFICIENTS',
  'coefficient-global-mal-interprete': 'B2-01-A3-02-MACHINE-COEFFICIENTS',
  'rythme-confondu-avec-niveau': 'B2-01-A3-08-INDICE-PRIX',
  'indice-lu-comme-taux': 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
  'indice-lu-comme-valeur': 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
  'taux-moyen-arithmetique': 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
  'moyenne-simple-des-taux': 'B2-01-A5-03-MOYENNE-PONDEREE',
  'hausse-base-baisse-taux': 'B2-01-A5-04-SIMULATEUR-MIX',
  'baisse-attribuee-aux-taux-locaux': 'B2-01-A5-03-MOYENNE-PONDEREE',
  'axe-tronque-lu-comme-ecart': 'B2-01-A2-02-ORIGINE-AXE',
  'correlation-prise-pour-causalite': 'B2-01-A5-08-RECOMMANDATION',
  'forme-inadaptee': 'B2-01-A4-04-CA-TRIMESTRIEL',
  'titre-interpretatif': 'B2-01-A4-04-CA-TRIMESTRIEL',
  'unite-manquante-ignoree': 'B2-01-A1-06-FICHE-INDICATEUR',
  'bases-incompatibles': 'B2-01-A2-07-JEU-COMPARABLE',
  'valeur-confondue-avec-taux': 'B2-01-A2-05-ECRITURES',
  'ca-confondu-avec-marge': 'B2-01-A1-06-FICHE-INDICATEUR',
  'marque-confondue-avec-marge': 'B2-01-A1-06-FICHE-INDICATEUR',
  'total-concordant-vaut-preuve': 'B2-01-A6-01-PACIOLI',
  'indice-pris-pour-preuve': 'B2-01-A6-01-PACIOLI',
  'controle-non-discriminant': 'B2-01-A5-07-CONTROLE-DISCRIMINANT',
  'tva-base-non-corrigee': 'B2-01-A3-04-FIL-TECHNIQUE',
  'tva-calculee-sur-ttc': 'B2-01-A3-04-FIL-TECHNIQUE',
  'reference-relative-non-figee': 'B2-01-A4-01-CAPSULE',
  'valeur-saisie-sans-formule': 'B2-01-A4-01-CAPSULE',
  'formule-non-recopiable': 'B2-01-A4-01-CAPSULE',
};

const MEDIAS: ContenuDeCours['medias'] = [
  {
    id: 'M1',
    chemins: ['/assets/cours/b2-01/v3/playfair-ecosse-1786.webp'],
    pageSource:
      'https://commons.wikimedia.org/wiki/File:1786_Playfair_-_Exports_and_Imports_of_Scotland_to_and_from_different_parts_for_one_Year_from_Christmas_1780_to_Christmas_1781.jpg',
    auteur: 'William Playfair, The Commercial and Political Atlas',
    date: '1786',
    licence: 'domaine public',
    attribution: 'William Playfair, 1786 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M2',
    chemins: ['/assets/cours/b2-01/v3/playfair-series-1786.webp'],
    pageSource:
      'https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries.png',
    auteur: 'William Playfair',
    date: '1786',
    licence: 'domaine public',
    attribution: 'Document original · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M3',
    chemins: ['/assets/cours/b2-01/v3/nightingale-1858.webp'],
    pageSource:
      'https://commons.wikimedia.org/wiki/File:Nightingale-mortality.jpg',
    auteur: 'Florence Nightingale (numérisation David Rumsey Map Collection)',
    date: '1858',
    licence: 'domaine public',
    attribution:
      'Florence Nightingale, 1858 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M4',
    chemins: ['/assets/cours/b2-01/v3/pacioli-1495.webp'],
    pageSource: 'https://commons.wikimedia.org/wiki/File:Pacioli.jpg',
    auteur: 'portrait attribué à Jacopo de’ Barbari',
    date: '1495',
    licence: 'domaine public (PD-Art)',
    attribution:
      'Portrait attribué à Jacopo de’ Barbari, 1495 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M5',
    chemins: [
      '/assets/cours/b2-01/v3/capsule-formule-recopiable-720p.webm',
      '/assets/cours/b2-01/v3/capsule-formule-recopiable-480p.webm',
      '/assets/cours/b2-01/v3/capsule-formule-recopiable.jpg',
      '/assets/cours/b2-01/v3/capsule-formule-recopiable.fr.vtt',
    ],
    pageSource: null,
    auteur:
      'Asili Design ; voix de synthèse Piper fr_FR-siwis-medium (modèle MIT, données SIWIS de l’Université d’Édimbourg, CC BY 4.0) ; polices Atkinson Hyperlegible et JetBrains Mono (SIL OFL 1.1)',
    date: '2026',
    licence: 'CC BY-SA 4.0',
    attribution:
      'Une formule qui se recopie, un tableau qui se contrôle · Asili Design, 2026 · CC BY-SA 4.0 · Voix : Piper fr_FR-siwis-medium, données SIWIS (Université d’Édimbourg), CC BY 4.0',
  },
];

const ECRANS_DU_COURS: ContenuDeCours['ecrans'] = [
  ...ACTE_1,
  ...ACTE_2,
  ...ACTE_3,
  ...ACTE_4,
  ...ACTE_5,
  ...ACTE_6,
];

export const COURS_B2_01: ContenuDeCours = {
  slug: 'b2-01-traitement-information-chiffree',
  titre: 'Lire, contrôler et décider avec l’information chiffrée',
  niveau: 'B2',
  dureeMinutes: 213,
  concepts: [
    'proportion',
    'pourcentage',
    'taux-evolution',
    'coefficient-multiplicateur',
    'evolutions-successives',
    'evolution-reciproque',
    'taux-moyen',
    'indice-base-100',
    'point-de-pourcentage',
    'moyenne-ponderee',
    'lecture-graphique',
    'controle-coherence',
    'contrat-de-lecture',
    'tableur',
  ],
  remediations: REMEDIATIONS,
  medias: MEDIAS,
  ecrans: ECRANS_DU_COURS,
};
