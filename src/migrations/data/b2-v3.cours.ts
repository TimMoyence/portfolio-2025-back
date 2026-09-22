import type { z } from 'zod';
import type { ConceptId } from '../../modules/formations/domain/cours/banque/concepts';
import type { ConfusionId } from '../../modules/formations/domain/cours/banque/confusions';
import type { coursStocke } from '../../modules/formations/domain/cours/CoursStocke';
import {
  slugOption,
  type numeriqueStockee,
  type voteStocke,
} from '../../modules/formations/domain/cours/QuestionStockee';

type CoursV3 = z.input<typeof coursStocke>;
type EcranV3 = CoursV3['ecrans'][number];
type Acte = [EcranV3, ...EcranV3[]];
type EcranDeRecit = Extract<EcranV3, { readonly brique: 'fp-story' }>;
type SocleDEcran = Omit<EcranDeRecit, 'brique' | 'proprietes'>;
type ReserveDuRecit = Omit<EcranDeRecit['proprietes'], 'presentation'>;
type ProprietesDeClassement = Extract<
  EcranV3,
  { readonly brique: 'fp-cardsort' }
>['proprietes'];
type VoteV3 = z.input<typeof voteStocke>;
type NumeriqueV3 = z.input<typeof numeriqueStockee>;
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

function notes(
  action: string,
  observe: string,
  attendu: string,
  controle: string,
  transition: string,
): string {
  return [
    `Action : ${action}`,
    `Observé : ${observe}`,
    `Attendu : ${attendu}`,
    `Contrôle : ${controle}`,
    `Transition : ${transition}`,
  ].join('\n');
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
): VoteV3 {
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
  tolerance: NumeriqueV3['tolerance'],
  formePubliee: string,
  pieges: AuMoinsUn<readonly [number, ConfusionId]>,
): NumeriqueV3 {
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
    notes: notes(
      'projeter ; annoncer « question de reprise : seule la participation compte » ; 45 s d’écriture individuelle sans regarder les options, puis vote.',
      'l’histogramme du pupitre et la confusion dominante (« +20 % » : division par la valeur d’arrivée).',
      '(100 − 80) / 80 = 0,25, soit +25 % ; le dénominateur est la valeur de départ.',
      '80 × 1,25 = 100. Si plus de 30 % de « +20 % », le noter : la question 5 de l’atelier 2 (A3-07) repose la situation à l’envers, et l’atelier 1 (Q6) la retrouve dans le taux de marge.',
      '« Cette question — quelle est la base ? — revient dans toutes les analyses de deuxième année. Voici l’entreprise pour laquelle vous travaillez. »',
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
      delaiMs: 45000,
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A1-02-ACCROCHE',
      titre: 'Lire un chiffre, ce n’est pas le croire',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['contrat-de-lecture'],
      notes: notes(
        'lire le titre, présenter Atelier Rivage en une phrase, faire ouvrir le navigateur et la calculatrice.',
        'le graphique en barres de 1786 en fond, le seul graphique en barres de l’atlas de Playfair : l’écran A2-01 y revient.',
        'aucun calcul ; faire dire à la classe à quoi sert un tableau de bord (décider).',
        'chaque poste a rejoint la séance (compteur de participants au pupitre).',
        '« Voici le courriel reçu ce matin. »',
      ),
    },
    'hero',
    {
      title: 'Lire un chiffre, ce n’est pas le croire',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Lundi, 9 h : le comité de direction se réunit jeudi. Votre mission : fiabiliser le tableau de bord 2025.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · premier cours de mathématiques',
        '3 h 30 · 6 actes · socle BTS 2 · extensions bachelor et M1 facultatives',
      ],
      bgImage: '/assets/cours/b2-01/v3/playfair-ecosse-1786.webp',
      bgImageAlt:
        'Graphique en barres de William Playfair (1786) : exportations et importations de l’Écosse avec ses partenaires commerciaux sur une année',
    },
  ),
  {
    screenId: 'B2-01-A1-03-MISSION',
    titre: 'Votre mission chez Atelier Rivage',
    diffusion: 'catalogue',
    brique: 'fp-pro',
    dureeMinutes: 2,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      'lecture à voix haute, classe entière, en 90 secondes.',
      'la demande d’Hélène (« gagner plus ») et la proposition de Samir (investir).',
      'repérer que « gagner » peut désigner un montant ou un taux.',
      'faire reformuler l’enjeu par un étudiant en une phrase.',
      '« Regardons le tableau de bord tel qu’il a été envoyé. »',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 8 h 40. Hélène Garnier, la dirigeante, vous transfère le tableau de bord 2025 préparé par Samir Haddad, responsable commercial : « Samir annonce une excellente année et veut investir dans la marketplace. Est-ce qu’on gagne vraiment plus qu’en 2024 ? Préparez-moi un dossier fiable pour le comité de jeudi. »',
      geste:
        'Avant de recommander un investissement, répondez à trois questions : que mesure chaque chiffre ? Les bases et les périodes sont-elles comparables ? Le recalcul confirme-t-il la recommandation ?',
      consequence:
        'Si le comité décide sur un chiffre mal lu, Atelier Rivage peut investir dans le canal qui dégrade sa rentabilité.',
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A1-04-TABLEAU-DE-BORD',
      titre: 'Tableau de bord 2025 transmis au comité',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['contrat-de-lecture'],
      notes: notes(
        'laisser une minute de lecture silencieuse ; ne rien commenter.',
        'six lignes ; des pourcentages de natures différentes ; deux valeurs sans unité ; un libellé imprécis (« Taux de marge »).',
        'aucune réponse à ce stade ; l’activité suivante classe chaque ligne.',
        'vérifier que tous les postes affichent le tableau (rechargement si besoin).',
        '« Avant de discuter des chiffres, classons-les : que dit chacun ? »',
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
  {
    screenId: 'B2-01-A1-05-ANATOMIE',
    titre: 'Que dit chaque chiffre du tableau de bord ?',
    diffusion: 'seance',
    brique: 'fp-cardsort',
    dureeMinutes: 8,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      'binômes, 5 min de tri (annoncer « plus qu’une minute » à 4 min), puis 3 min de correction au pupitre sur le taux d’erreur par carte ; rappeler que chacun envoie depuis son poste.',
      'les cartes « Taux de marge : −2,3 % » et « Inflation : 4,9 » concentrent les erreurs.',
      '« −2,3 % » est un écart entre deux taux, donc des points, avec un libellé imprécis (il s’agit du taux de marge brute) ; « +1 200 » et « 4,9 » sont ambigus en l’état ; « Entretien : 20 % du CA » et « Taux de marge 2025 : 25,3 % » sont des proportions ; « +9,5 % » et « +4 % » sont des évolutions ; 1 150 000 € est une valeur.',
      'faire justifier une carte par binôme avec la question « rapporté à quoi ? ».',
      '« Un taux n’est une information que si l’on connaît sa fiche d’identité. »',
    ),
    proprietes: {
      modalite: 'binome',
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
  ecranV2(
    {
      screenId: 'B2-01-A1-06-FICHE-INDICATEUR',
      titre: '27,6 % : la fiche d’identité d’un taux',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['contrat-de-lecture', 'pourcentage', 'taux-evolution'],
      notes: notes(
        'retourner les six cartes une à une, classe entière.',
        '27,6 % n’a de sens qu’avec ses cinq réponses ; le même mot « taux de marge » désigne trois rapports.',
        '289 800 ÷ 1 050 000 = 0,276 ; « pour 100 € de CA HT, il reste 27,60 € de marge brute » ; un taux de marge se rapporte au coût, un taux de marque au prix de vente.',
        'demander ce qui manque à « Inflation : 4,9 » (unité, période, source) et quel dénominateur il faudrait écrire à côté de « Taux de marge » dans le tableau de Samir (le CA HT).',
        '« Voici le plan pour que chaque chiffre du dossier ait sa fiche. »',
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
      titre: 'Votre plan de reprise et de transfert',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['contrat-de-lecture'],
      notes: notes(
        'parcourir les six étapes en 90 secondes.',
        'la colonne « preuve » annonce ce qui sera demandé à chaque acte.',
        'chacun sait où il en est et ce qui compte pour la note (la participation, § 4.5).',
        'question rapide : « quel acte produit le graphique du comité ? » (l’acte 4).',
        '« Première preuve : transformer la question d’Hélène. »',
      ),
    },
    'method-path',
    {
      title: 'Votre plan de reprise et de transfert',
      subtitle:
        'Six gestes, six actes : on réactive les acquis, on les met sous contrôle, puis on les transfère à une décision de gestion.',
      steps: [
        {
          id: 'lire',
          title: 'Acte 1 · Diagnostiquer',
          question: 'Que mesure chaque chiffre ?',
          proof: 'Unité, base, période, périmètre, source.',
          result: 'Un diagnostic de niveau 2 et un tableau de bord qualifié.',
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
          title: 'Acte 3 · Modéliser',
          question: 'Quelle base, quel coefficient ?',
          proof: 'Écart, taux, coefficient, indice.',
          result:
            'Des évolutions justes, y compris successives et réciproques.',
        },
        {
          id: 'outiller',
          title: 'Acte 4 · Reproduire',
          question: 'La feuille se contrôle-t-elle seule ?',
          proof: 'Formules, références, contrôles, graphique.',
          result: 'Un classeur contrôlable qu’un tiers peut reproduire.',
        },
        {
          id: 'defendre',
          title: 'Acte 5 · Expliquer',
          question: 'Quel mécanisme explique l’écart ?',
          proof: 'Poids, répartition, preuve, limite.',
          result:
            'Une recommandation fondée sur les poids, les scénarios et les limites.',
        },
        {
          id: 'transferer',
          title: 'Acte 6 · Transférer',
          question: 'Saurez-vous le refaire seul·e ?',
          proof: 'Situation nouvelle, erreur d’IA corrigée, rappel adaptatif.',
          result: 'Des réflexes durables et une trace exploitable en CCF.',
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
      notes: notes(
        'écriture individuelle 2 min ; lire trois réponses anonymisées au pupitre.',
        'les réponses qui oublient la période ou le périmètre.',
        'indicateur (marge brute), base (CA HT), période (2024 → 2025), périmètre (trois canaux) ; deux mesures : un montant et un taux.',
        'chaque réponse lue doit permettre de dire quel chiffre la tranche.',
        '« Samir a déjà répondu à sa façon : avec une diapositive. »',
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
        context:
          'Une question de gestion devient traitable quand on sait quel chiffre y répond.',
        competency: 'S’informer · formuler une question mesurable',
      },
    },
    {
      correction: {
        expected:
          'Par exemple : la marge brute d’Atelier Rivage (trois canaux) a-t-elle augmenté entre 2024 et 2025, en euros et rapportée au CA HT ? Deux réponses sont attendues : un montant et un taux.',
        nextAction: 'Cette question ouvrira la recommandation de l’acte 5.',
      },
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A1-09-DIAPOSITIVE',
      titre: 'La diapositive de Samir',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['lecture-graphique'],
      notes: notes(
        'projeter 30 secondes sans commentaire, puis demander « peut-on la montrer jeudi ? ».',
        'la barre 2025 est sept fois plus haute que celle de 2022 (12,5 % et 87,5 % de la hauteur de l’échelle).',
        'aucune réponse orale ; les vérifications s’écrivent à l’écran suivant.',
        'ce graphique n’est pas un des quatre graphiques de référence (§ 5.7) : c’est une pièce à auditer, volontairement non conforme.',
        '« Écrivez ce que vous vérifieriez avant de répondre à Hélène. »',
      ),
    },
    'chart',
    {
      title: 'Marge brute : une croissance continue',
      caption: 'Diapositive 3 du support commercial',
      context: 'Voici la diapositive que Samir veut projeter jeudi.',
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
      reading:
        'Lecture proposée par le service commercial : « la marge brute progresse nettement chaque année ».',
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
    dureeMinutes: 3,
    concepts: ['lecture-graphique'],
    notes: notes(
      '2 min d’écriture individuelle, puis révélation au pupitre et 1 min de mise en commun.',
      'les étudiants qui citent l’axe et ceux qui citent seulement la couleur ou le titre.',
      'axe tronqué (284 000 €), évolution réelle à calculer, titre interprétatif, comparaison au CA ; la couleur ne prouve rien.',
      'faire repérer la stratégie fausse avant de la révéler.',
      '« Le calcul de l’évolution réelle ouvrira l’atelier de l’acte 2. »',
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
    },
  },
  {
    screenId: 'B2-01-A1-11-JALON-1',
    titre: 'Jalon 1 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      '30 secondes de vote anonyme ; afficher l’agrégat (masqué en projection sous 5 réponses).',
      'la répartition perdu / ça va / clair.',
      'au moins 60 % « ça va » ou « c’est clair ».',
      'si « perdu » dépasse 30 %, reprendre la fiche A1-06 en 2 min avec « Inflation : 4,9 ».',
      '« Acte 2 : comparer sans tromper, en commençant par l’inventeur des graphiques économiques. »',
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
      notes: notes(
        'raconter en une minute ; montrer l’écart entre les deux courbes, puis rappeler le graphique en barres du fond de A1-02 (l’Écosse, une seule année).',
        'titre, axes gradués, deux séries, légende.',
        'les quatre éléments du contrat de lecture graphique ; la forme suit la donnée.',
        '« qu’est-ce qui manque sur la diapositive de Samir ? » (une échelle honnête).',
        '« Faites l’expérience : déplacez vous-même l’origine et le haut de l’axe. »',
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
        'Vingt ans plus tôt, Joseph Priestley avait déjà placé des vies sur une frise chronologique (A Chart of Biography, 1765). Playfair, lui, trace des données économiques : dans The Commercial and Political Atlas, la balance commerciale de l’Angleterre se lit dans l’écart entre deux courbes.',
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
    notes: notes(
      'chaque étudiant fait glisser l’origine de 284 000 € à 0 €, puis le haut de l’axe de 292 000 € à 600 000 €.',
      'la pente s’écrase, les valeurs ne changent pas ; le premier affichage reproduit la diapositive de A1-09.',
      '« l’échelle change l’impression, pas la donnée ».',
      'faire lire la valeur 2025 dans les deux positions (291 000 €).',
      '« Atelier 1 : lire, rapporter, estimer. »',
    ),
    proprietes: {
      id: 'b2-01-a2-origine-axe',
      titre: 'Diapositive de Samir : marge brute et axe réglable',
      source: 'Service commercial d’Atelier Rivage (données fictives).',
      abscisse: { libelle: 'Année (0 = 2022, 3 = 2025)', min: 0, max: 3 },
      ordonnee: 'Marge brute (€)',
      bornesOrdonnee: { minParametre: 'origine', maxParametre: 'maximum' },
      parametres: [
        {
          cle: 'origine',
          libelle: 'Origine de l’axe vertical (€)',
          min: 0,
          max: 284000,
          pas: 4000,
          defaut: 284000,
        },
        {
          cle: 'maximum',
          libelle: 'Haut de l’axe vertical (€)',
          min: 292000,
          max: 600000,
          pas: 4000,
          defaut: 292000,
        },
      ],
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
        'Réglez l’origine et le haut de l’axe pour voir comment l’échelle transforme la lecture, sans changer les valeurs.',
    },
  },
  {
    screenId: 'B2-01-A2-03-ATELIER-1',
    titre: 'Atelier 1 — Lire, rapporter, estimer',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 14,
    concepts: [
      'lecture-graphique',
      'proportion',
      'taux-evolution',
      'pourcentage',
    ],
    notes: notes(
      '9 min de travail (annoncer « plus que 2 minutes » à 7 min), puis 5 min de correction question par question au pupitre.',
      'taux de réussite et confusion dominante par question ; pour Q6, la part de « taux de marque 25 % ».',
      'Q1 +2,1 % en trois ans (6 000 ÷ 285 000) ; Q2 45,5 ; Q3 une part des commandes n’est pas une part du CA ; Q4 −17,81 ; Q5 environ +45 % (1 300 ÷ 2 900) ; Q6 taux de marque 20 % (20 ÷ 100), taux de marge 25 % (20 ÷ 80, la même hausse qu’en A1-01).',
      'Q2 : 1 150 000 × 0,455 ≈ 523 000 ; Q4 : 483 000 × (1 − 0,1781) ≈ 397 000 ; Q5 : 2 900 × 1,45 ≈ 4 200 ; Q6 : 80 × 1,25 = 100 et 100 × 0,80 = 80.',
      '« Remettons la diapositive de Samir d’aplomb. »',
    ),
    proprietes: {
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne:
        'Calculatrice autorisée, sauf pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
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
  ecranV2(
    {
      screenId: 'B2-01-A2-04-MARGE-AXE-ZERO',
      titre: 'Marge brute 2022–2025, axe à zéro',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['lecture-graphique', 'taux-evolution'],
      notes: notes(
        'projeter à côté de la diapositive de Samir (deux onglets) si possible.',
        'des barres presque égales ; une phrase de lecture qui donne l’écart en euros et en %.',
        'titre descriptif, unité, source, phrase de lecture chiffrée : les quatre exigences d’un graphique de référence ; l’écart absolu et le taux se complètent (S12, S14).',
        'les hausses annuelles ralentissent : +1,05 %, +0,63 %, +0,41 %.',
        '« Cinq écritures reviennent sans cesse : fixons-les. »',
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
        'La marge brute augmente sur la période. L’écart reste faible à l’échelle du graphique et le rythme annuel ralentit.',
      source:
        'Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives).',
      description:
        'Diagramme en barres à partir de zéro : quatre barres presque égales, de 285 000 € en 2022 à 291 000 € en 2025.',
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A2-05-ECRITURES',
      titre: 'Cinq écritures, cinq questions',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['pourcentage', 'point-de-pourcentage'],
      notes: notes(
        'faire associer chaque écriture à une carte de A1-05.',
        'la différence entre « +9,5 % » (évolution) et « 20 % » (proportion) ; entre 100 000 € (valeur) et +9,5 % (taux).',
        'un pourcentage exprime soit une proportion, soit une évolution ; un écart entre deux taux s’écrit en points ; un indice se lit par rapport à 100.',
        '« −2,3 % » du tableau de bord : quelle écriture aurait dû être utilisée ?',
        '« Rédigeons la phrase juste sur le taux de marge brute. »',
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
  ),
  {
    screenId: 'B2-01-A2-06-POINTS',
    titre: 'Points ou pourcentage : la phrase du comité',
    diffusion: 'seance',
    brique: 'fp-worked',
    dureeMinutes: 5,
    concepts: ['point-de-pourcentage'],
    notes: notes(
      'première étape commentée, les suivantes rédigées par les étudiants ; baisser l’étayage à 2 si la classe a réussi A1-05.',
      'ceux qui écrivent « −2,3 % » à l’étape 3.',
      '−2,30 points ; −8,3 % en relatif ; une phrase qui contient les deux taux.',
      '27,6 × 0,917 = 25,31 (écart d’arrondi assumé).',
      '« Mini-jeu : tout n’est pas comparable. »',
    ),
    proprietes: {
      modalite: 'solo',
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
            invite: 'Écrivez l’écart avec son unité.',
          },
          {
            id: 'relatif',
            intitule: 'Évolution relative du taux',
            raisonnement:
              '−2,30 ÷ 27,60 ≈ −0,083, soit −8,3 % : le taux lui-même a perdu 8,3 % de sa valeur.',
            invite: 'Calculez l’évolution relative en précisant la base.',
          },
          {
            id: 'phrase',
            intitule: 'Phrase pour le comité',
            raisonnement:
              '« Le taux de marge brute recule de 2,3 points (de 27,6 % à 25,3 %), soit une baisse relative de 8,3 %. »',
            invite: 'Rédigez la phrase sans écrire « −2,3 % ».',
          },
          {
            id: 'controle',
            intitule: 'Contrôle',
            raisonnement:
              '27,60 × (1 − 0,083) ≈ 25,31 : l’évolution relative redonne le taux d’arrivée, à l’arrondi près.',
            invite: 'Faites le contrôle inverse.',
          },
        ],
      },
      etayage: 3,
    },
  },
  {
    screenId: 'B2-01-A2-07-JEU-COMPARABLE',
    titre: 'Mini-jeu : comparable ou pas ?',
    diffusion: 'seance',
    brique: 'fp-cardsort',
    dureeMinutes: 8,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      'lancer le chrono (5 min, annoncer la dernière minute), puis 3 min de débriefing sur les deux cartes les plus ratées.',
      'le score médian de la classe et les cartes les plus ratées.',
      'directes : mars/mars, taux 2024/2025, CA par salarié ; après retraitement : HT/TTC, m²/rouleau, périmètre (retirer la marketplace du CA 2025) ; impossibles sans nouvelle donnée : taux sectoriel, inflation de 2023, semestre/année.',
      'pour chaque retraitement, faire dire l’opération (÷ 1,2 ; ÷ 50 ; − 523 000 €) ; pour le semestre : l’activité est saisonnière, doubler un semestre ne donne pas l’année.',
      'jalon de confiance, puis acte 3.',
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
  {
    screenId: 'B2-01-A2-08-JALON-2',
    titre: 'Jalon 2 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      'vote anonyme 30 secondes.',
      'l’agrégat perdu / ça va / clair.',
      'au moins 60 % « ça va » ou « c’est clair ».',
      'au-delà de 30 % « perdu », reprendre la Q3 de l’atelier 1 (commandes / CA) et la Q6 (coût / prix de vente).',
      '« Acte 3 : un prix monte, puis redescend. »',
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

const ACTE_3: Acte = [
  {
    screenId: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
    titre: 'Vote : +10 %, puis −10 %',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['evolutions-successives'],
    notes: notes(
      'vote individuel sans calculatrice ; si 30 à 70 % de bonnes réponses, débat en binôme « convainquez votre voisin » ; sinon, passer directement à revote.',
      'l’histogramme du vote 1 (par option stable, toutes graines confondues), puis le gain entre vote 1 et vote 2.',
      '100 × 1,10 × 0,90 = 99 : inférieur de 1 % ; 0,90 × 0,98 = 0,882 : 11,8 % (net 3 528 € HT).',
      'la seconde variation s’applique à la valeur devenue courante (110, pas 100) ; une seconde remise « sur le net » est une réduction commerciale, pas un escompte.',
      '« Manipulez la machine à coefficients pour voir pourquoi. »',
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
    notes: notes(
      'faire tester +50 % puis −50 % (résultat 75).',
      'le résultat n’est jamais la valeur de départ tant que les deux taux sont opposés et non nuls.',
      'coefficient global = produit des coefficients ; taux global = coefficient − 1 ; une baisse s’écrit avec un signe moins.',
      '1,5 × 0,5 = 0,75, soit −25 %.',
      '« Conséquence pour la marge du sac. »',
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
      notes: notes(
        'commenter la seule courbe de marge, en 45 secondes.',
        '−1 % sur le prix devient −5 % sur la marge.',
        'quand la marge ne représente que 20 % du prix, une petite variation du prix pèse cinq fois plus lourd sur la marge.',
        '(19 − 20) ÷ 20 = −5 %.',
        '« Même raisonnement sur un achat : le fil technique. »',
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
  ),
  {
    screenId: 'B2-01-A3-04-FIL-TECHNIQUE',
    titre: 'Le fil technique : choisir l’opération inverse',
    diffusion: 'seance',
    brique: 'fp-worked',
    dureeMinutes: 4,
    concepts: ['evolutions-successives'],
    notes: notes(
      'faire distinguer trois opérations inverses : retrouver une base, annuler une évolution, passer du TTC au HT ; les calculs sont ensuite contrôlés par retour au montant connu.',
      'ceux qui retirent 10 % de 13,75 € à l’étape 4 (12,375 €) et ceux qui retirent 20 % du TTC à l’étape 6 (2 880 €).',
      '+1,2 % ; 12,65 € ; 12,50 € ; −9,1 % ; 3 000 € et −16,67 %.',
      '12,65 ÷ 12,50 = 1,012 ; 3 000 × 1,20 = 3 600.',
      '« Le niveau 2 consiste à choisir l’opération inverse et à prouver qu’elle fonctionne. »',
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
            invite: 'Traduisez chaque taux en coefficient.',
          },
          {
            id: 'global',
            intitule: 'Évolution globale',
            raisonnement:
              '1,10 × 0,92 = 1,012 : l’évolution globale est de +1,2 %, et non de +2 %.',
            invite: 'Multipliez les coefficients, puis retirez 1.',
          },
          {
            id: 'prix',
            intitule: 'Prix final',
            raisonnement: '12,50 × 1,012 = 12,65 € HT la bobine.',
            invite: 'Calculez le prix final.',
          },
          {
            id: 'base',
            intitule: 'Retrouver la base',
            raisonnement:
              'Après la hausse d’avril, la bobine coûte 13,75 €. Prix initial = 13,75 ÷ 1,10 = 12,50 € : on divise par le coefficient, on ne retire pas 10 %.',
            invite:
              'Retrouvez la valeur de départ à partir de la valeur d’arrivée.',
          },
          {
            id: 'reciproque',
            intitule: 'Évolution réciproque',
            raisonnement:
              'Pour annuler une hausse de 10 %, il faut multiplier par 1 ÷ 1,10 ≈ 0,909, soit une baisse d’environ 9,1 % ; une baisse de 10 % irait trop loin (13,75 × 0,90 = 12,375 €).',
            invite: 'Calculez le taux réciproque.',
          },
          {
            id: 'tva',
            intitule: 'Du TTC au HT',
            raisonnement:
              'Une facture d’entretien affiche 3 600 € TTC (TVA 20 %). HT = 3 600 ÷ 1,20 = 3 000 € : on divise par le coefficient 1,20. Retirer 20 % donnerait 2 880 €, ce qui est faux. Passer du TTC au HT, c’est une baisse de 1 − 1 ÷ 1,20 ≈ 16,67 %. Contrôle inverse : 3 000 × 1,20 = 3 600.',
            invite:
              'Retrouvez le HT, puis le taux de baisse du TTC vers le HT.',
          },
        ],
      },
      etayage: 3,
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A3-05-INFLATION-RYTHME',
      titre: 'Inflation annuelle en France, 2019–2025',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['indice-base-100'],
      notes: notes(
        'lire la série à voix haute, sans commentaire sur le niveau.',
        'un taux par année.',
        'chaque barre mesure une hausse sur un an, en moyenne annuelle.',
        'repérer que « 4,9 » du tableau de bord est la valeur de 2023.',
        '« Avant l’atelier : comment passer d’une série à un indice et à un taux moyen. »',
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
        'Source : Insee, indice des prix à la consommation, « L’essentiel sur… l’inflation », paru le 23 mars 2026.',
      description:
        'Diagramme en barres des taux d’inflation annuels moyens : 1,1 % en 2019, 0,5 % en 2020, 1,6 % en 2021, 5,2 % en 2022, 4,9 % en 2023, 2,0 % en 2024 et 0,9 % en 2025.',
    },
  ),
  {
    screenId: 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
    titre: 'Le loyer de l’atelier : lire un indice et un rythme',
    diffusion: 'seance',
    brique: 'fp-worked',
    dureeMinutes: 5,
    concepts: ['indice-base-100', 'taux-moyen'],
    notes: notes(
      'étapes 1 et 2 commentées ; 3 à 5 rédigées ; distinguer explicitement le niveau atteint, le taux global et le rythme annuel moyen.',
      'ceux qui lisent 119,10 comme +119,10 %, et ceux qui divisent 19,10 par 3.',
      '106,00 ; 112,36 ; 119,10 ; +19,10 % ; 6,00 % par an ; 6,37 % faux.',
      '1,06³ = 1,191016 ; 1,0637³ ≈ 1,2035.',
      '« Atelier 2 : rythme, niveau, indice, avec les données de l’Insee. »',
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
            invite: 'Calculez l’indice de chaque année.',
          },
          {
            id: 'lire',
            intitule: 'Lire un indice',
            raisonnement:
              '119,10 signifie +19,10 % depuis 2021 : taux = I ÷ 100 − 1. Ce n’est ni +119,10 %, ni un loyer de 119,10 €.',
            invite: 'Traduisez l’indice 2024 en taux d’évolution.',
          },
          {
            id: 'chainer',
            intitule: 'Chaîner des coefficients',
            raisonnement:
              'Indice = 100 × produit des coefficients : 100 × 1,06 × 1,06 × 1,06 = 119,10. Additionner les taux (6 + 6 + 6 = 18) sous-estime la hausse.',
            invite: 'Retrouvez l’indice 2024 à partir des coefficients.',
          },
          {
            id: 'taux-moyen',
            intitule: 'Taux annuel moyen',
            raisonnement:
              'On cherche x tel que x³ = 1,19102 : x = 1,19102^(1/3) ≈ 1,0600, soit +6,00 % par an. Calculatrice : 1,19102 ^ (1 ÷ 3) ; tableur : =PUISSANCE(1,19102;1/3).',
            invite: 'Calculez le taux annuel moyen avec la puissance 1/3.',
          },
          {
            id: 'piege',
            intitule: 'Pourquoi pas 19,10 ÷ 3 ?',
            raisonnement:
              '19,10 ÷ 3 ≈ 6,37 % est faux : 1,0637³ ≈ 1,2035, et non 1,1910. Diviser un taux global par le nombre d’années surestime le taux moyen.',
            invite: 'Vérifiez en élevant 1,0637 au cube.',
          },
        ],
      },
      etayage: 3,
    },
  },
  {
    screenId: 'B2-01-A3-07-ATELIER-2',
    titre: 'Atelier 2 — Rythme, niveau, indice',
    diffusion: 'seance',
    brique: 'questionnaire',
    dureeMinutes: 10,
    concepts: [
      'indice-base-100',
      'evolutions-successives',
      'taux-moyen',
      'evolution-reciproque',
    ],
    notes: notes(
      '7 min individuelles, 3 min de correction.',
      'confusions « rythme / niveau » (Q1), « addition des taux » (Q2, Q3), « moyenne arithmétique » (Q4).',
      'Q1 plus élevé qu’en 2024 ; Q2 112,68 ; Q3 15,97 % ; Q4 2,50 % ; Q5 une baisse de 20 %.',
      '1,025⁶ ≈ 1,1597 ; 100 × 0,80 = 80. Ici l’écart entre moyenne arithmétique des taux (2,52 %) et taux moyen (2,50 %) est faible parce que les taux sont petits ; en A3-06 il était visible (6,37 % contre 6,00 %) et en A6-04 il atteint 0,65 point (33,25 % contre 32,6 %) : la méthode reste fausse.',
      '« Voici la courbe que vous venez de calculer. »',
    ),
    proprietes: {
      intitule: 'Atelier 2 — Rythme, niveau, indice',
      consigne:
        'Calculatrice autorisée. Base 100 = moyenne annuelle 2019. Taux annuels moyens de l’Insee : 2020 : 0,5 % ; 2021 : 1,6 % ; 2022 : 5,2 % ; 2023 : 4,9 % ; 2024 : 2,0 % ; 2025 : 0,9 %.',
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
  ecranV2(
    {
      screenId: 'B2-01-A3-08-INDICE-PRIX',
      titre: 'Extension : lire un indice de prix fourni',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['indice-base-100'],
      notes: notes(
        'superposer mentalement le rythme annuel et le niveau de l’indice.',
        'des barres qui baissent, une courbe qui monte.',
        'rythme ≠ niveau ; le mot « désinflation ».',
        '115,97 − 100 = 15,97 % ; on lit un indice fourni ou reconstitué pour le cours, sans prétendre calculer un indice synthétique officiel.',
        '« Répondez à Samir, qui veut baisser les tarifs. »',
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
        'Indice 2025 = 100 × 1,005 × 1,016 × 1,052 × 1,049 × 1,020 × 1,009 ≈ 115,97 ; ce calcul est une reconstitution pédagogique, pas la construction de l’IPC officiel.',
      reading:
        'Les prix de 2025 sont en moyenne 16,0 % plus élevés qu’en 2019. Le rythme ralentit depuis 2023, mais l’indice continue de monter : une inflation qui ralentit tout en restant positive s’appelle une désinflation ; une baisse du niveau des prix s’appellerait une déflation.',
      source:
        'Lecture d’un indice fourni et reconstitution pédagogique à partir de taux annuels moyens publiés par l’Insee. Le cours ne demande pas de construire un indice synthétique officiel.',
      description:
        'Courbe croissante de l’indice : base 100 en 2019, niveau intermédiaire en 2022, niveau final supérieur à 115 en 2025 ; axe gradué de 95 à 120.',
    },
  ),
  ecranV2(
    {
      screenId: 'B2-01-A3-09-NOTE-CONJONCTURE',
      titre: 'Note de conjoncture pour Hélène',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['indice-base-100'],
      notes: notes(
        'rédaction individuelle 90 secondes, puis lecture de deux réponses.',
        'les phrases sans source et celles qui concluent sur le rythme seulement.',
        'deux chiffres (rythme, niveau), une source, une conséquence en euros de 2019 (évolution réciproque : −13,8 %).',
        'chaque phrase est-elle vérifiable par un tiers ?',
        'jalon 3, puis pause de 15 minutes (hors durée).',
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
          'Réutiliser la paire rythme / niveau dans la recommandation.',
      },
    },
  ),
  {
    screenId: 'B2-01-A3-10-JALON-3',
    titre: 'Jalon 3 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['evolutions-successives', 'indice-base-100', 'taux-moyen'],
    notes: notes(
      'vote anonyme.',
      'l’agrégat perdu / ça va / clair.',
      'au moins 60 % « ça va » ou « c’est clair ».',
      'au-delà de 30 % « perdu », rejouer la machine à coefficients (A3-02) et l’étape 4 de A3-06 au retour de pause.',
      'annoncer la pause (15 min) et l’acte 4 au tableur.',
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
    'En B7, contrôlez vos formules : les parts doivent faire 100 % : =SI(ARRONDI(SOMME(E2:E4);6)=1;1;0). En C7, contrôlez vos données : votre marge (G5) doit égaler celle du compte de résultat (B6) ; ce second contrôle surveille les données.',
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
  EcranV3,
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

const ACTE_4: Acte = [
  {
    screenId: 'B2-01-A4-01-CAPSULE',
    titre: 'Capsule : une formule qui se recopie',
    diffusion: 'catalogue',
    brique: 'fp-story',
    dureeMinutes: 3,
    concepts: ['tableur'],
    notes: notes(
      'projeter la capsule en plein écran, sous-titres activés.',
      'l’erreur #DIV/0! quand la référence au total n’est pas figée, et le contrôle qui passe à 0 quand une formule est écrasée par une valeur.',
      '$C$6 fige la colonne et la ligne ; le contrôle des parts surveille les formules ; le total comparé au compte de résultat surveille les données.',
      '« que devient =C2/C6 recopiée d’une ligne ? » (=C3/C7) ; « que détecte le contrôle des parts ? que détecte le contrôle par le compte de résultat ? ».',
      '« À vous, sur le tableau de bord d’Atelier Rivage. »',
    ),
    proprietes: {
      titre: 'Capsule : une formule qui se recopie, un tableau qui se contrôle',
      paragraphes: [
        'Regardez la capsule (2 min 30), puis ouvrez la tâche de tableur : vous y appliquerez les mêmes gestes à Atelier Rivage.',
        'Vidéo « Une formule qui se recopie, un tableau qui se contrôle », Asili Design, 2026, licence CC BY-SA 4.0. Voix de synthèse : Piper, modèle fr_FR-siwis-medium ; données SIWIS (Université d’Édimbourg), CC BY 4.0. Transcription et sous-titres disponibles.',
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
    notes: notes(
      'binômes ; circuler ; au bout de 9 min, projeter la grille d’un binôme volontaire ; rappeler que chacun envoie.',
      'les #DIV/0! en E3 (total non figé), les taux saisis en pourcentage (× 100), les résultats tapés sans formule.',
      'D2 −0,178054 ; E4 0,454783 ; G5 291 000 ; F5 0,253043 ; B7 et C7 = 1.',
      'C7 compare la marge calculée à la marge du compte de résultat (B6) : c’est une source indépendante ; B7 surveille les formules, C7 les données.',
      '« Comment montrer au comité l’activité de l’année, trimestre par trimestre ? »',
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
    dureeMinutes: 8,
    concepts: ['lecture-graphique'],
    notes: notes(
      '5 min de travail, 3 min de correction.',
      'choix de forme et de titre.',
      'trois courbes (une par canal, trimestres en abscisse) ; titre descriptif avec l’unité ; axe à 0 gradué ; phrase qui cite deux valeurs et leur unité.',
      'la phrase de lecture décrit, elle ne conclut pas ; la forme suit la question (évolution dans le temps : courbe).',
      '« Voici le graphique qui figurera au dossier. »',
    ),
    proprietes: {
      intitule: 'Atelier 3 — Habiller le graphique du comité',
      consigne:
        'Pour le comité, vous devez montrer comment le CA HT 2025 de chaque canal a évolué au fil des trimestres. CA HT 2025, en milliers d’euros, du 1er au 4e trimestre : sur-mesure 120 ; 95 ; 102 ; 80 · entretien 58 ; 61 ; 49 ; 62 · marketplace 98 ; 131 ; 167 ; 127.',
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
  ecranV2(
    {
      screenId: 'B2-01-A4-04-CA-TRIMESTRIEL',
      titre: 'Le graphique retenu pour le dossier du comité',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['lecture-graphique'],
      notes: notes(
        'comparer au choix fait à l’atelier 3.',
        'trois courbes étiquetées directement (pas de légende à décoder), des marqueurs distincts.',
        'lecture en milliers d’euros ; aucune conclusion causale.',
        'les totaux annuels redonnent 397, 230 et 523 milliers d’euros.',
        '« Deuxième tâche : le prix de la toile, révision après révision. »',
      ),
    },
    'chart',
    {
      title: 'CA HT 2025 : choisir une représentation temporelle',
      caption:
        'Une courbe par canal : la forme suit la question (une évolution dans le temps)',
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
    dureeMinutes: 11,
    concepts: ['evolutions-successives'],
    notes: notes(
      'individuel, 7 min ; correction 4 min sur la ligne de synthèse.',
      'les prix calculés à partir de 20,00 € à chaque ligne (addition déguisée des taux).',
      '21,60 ; 20,52 ; 21,34 ; 20,70 € et 108,00 ; 102,60 ; 106,70 ; 103,50 ; évolution réelle +3,50 % contre « +4 % ».',
      'la colonne « coefficient appliqué » redonne 1,0800 ; 0,9500 ; 1,0400 ; 0,9700. Pour comparer à l’inflation des grandeurs de même nature : la toile augmente de 3,50 % sur l’année (glissement) ; l’IPC augmente de 0,8 % entre décembre 2024 et décembre 2025 (99,17 → 99,95, base 2025), alors que 0,9 % est une moyenne annuelle.',
      'jalon 4, puis le dossier du comité.',
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
  {
    screenId: 'B2-01-A4-06-JALON-4',
    titre: 'Jalon 4 : où en êtes-vous ?',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['tableur'],
    notes: notes(
      'vote anonyme.',
      'l’agrégat perdu / ça va / clair.',
      'au moins 60 % « ça va » ou « c’est clair ».',
      'au-delà de 30 % « perdu », rejouer la capsule sur le passage du dollar (plans P05 et P06).',
      '« Acte 5 : défendre une décision. Commençons par une infirmière de 1858. »',
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

const ACTE_5: Acte = [
  ecranV2(
    {
      screenId: 'B2-01-A5-01-NIGHTINGALE',
      titre: '1858 : Florence Nightingale fait décider par les données',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['lecture-graphique'],
      notes: notes(
        'raconter en 45 secondes ; montrer un mois où le bleu domine.',
        'un secteur par mois, des aires comparables.',
        'un graphique au service d’une décision ; un taux pour 1 000 est une proportion.',
        '« quelle décision le comité doit-il prendre jeudi ? » (investir ou non dans la marketplace).',
        '« Voici le paradoxe à expliquer. »',
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
  {
    screenId: 'B2-01-A5-02-VOTE-PARADOXE',
    titre: 'Vote : le paradoxe du taux global',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 8,
    concepts: ['moyenne-ponderee'],
    notes: notes(
      'vote 1 (2 min), débat (3 min) après la démonstration de la moyenne pondérée, vote 2 (2 min), révélation (1 min) avec la grille du débat.',
      'la part de « c’est une erreur » au vote 1 ; la démonstration précédente doit permettre de justifier le choix par un poids et un exemple chiffré.',
      'le poids de chaque canal dans le CA a changé ; au lycée, la part des candidats de MCO a augmenté.',
      'un argument complet contient un mécanisme (poids) et un exemple chiffré.',
      '« Maintenant que la méthode est posée, prouvons-le par le calcul. »',
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
    screenId: 'B2-01-A5-03-MOYENNE-PONDEREE',
    titre: 'Prouver l’effet de répartition',
    diffusion: 'seance',
    brique: 'fp-worked',
    dureeMinutes: 5,
    concepts: ['moyenne-ponderee'],
    notes: notes(
      'étapes 1 et 2 guidées, 3 à 6 rédigées.',
      'l’étape 5 (raisonnement contrefactuel) et l’étape 6 (négation d’un « si… alors »).',
      '27,60 % ; 25,30 % ; 317 400 € ; −26 400 € ; une négation de la forme « il existe… et… ».',
      'effet volume (+27 600 €) + effet de répartition (−26 400 €) = +1 200 €.',
      '« Faites varier la part de la marketplace. »',
    ),
    proprietes: {
      modalite: 'solo',
      exemple: {
        id: 'b2-01-a5-ponderee',
        enonce:
          'Prouvez au comité que la baisse du taux global vient du changement de répartition du CA.',
        etapes: [
          {
            id: 'poids',
            intitule: 'Poids des canaux',
            raisonnement:
              'Poids d’un canal = CA du canal ÷ CA total. 2024 : 529 ÷ 1 150 ; 230 ÷ 1 150 ; 391 ÷ 1 150. 2025 : 397 ÷ 1 150 ; 230 ÷ 1 150 ; 523 ÷ 1 150.',
            invite: 'Calculez les poids des deux années.',
          },
          {
            id: 'taux-2024',
            intitule: 'Taux global 2024',
            raisonnement:
              '0,46 × 36 + 0,20 × 28 + 0,34 × 16 = 16,56 + 5,60 + 5,44 = 27,60 %.',
            invite: 'Pondérez chaque taux par son poids.',
          },
          {
            id: 'taux-2025',
            intitule: 'Taux global 2025',
            raisonnement:
              '0,345 × 36 + 0,20 × 28 + 0,455 × 16 = 12,42 + 5,60 + 7,28 = 25,30 %. Avec les poids exacts (397 ÷ 1 150 ; 230 ÷ 1 150 ; 523 ÷ 1 150), on obtient 25,304 %, soit 291 000 ÷ 1 150 000.',
            invite: 'Refaites le calcul avec les poids 2025.',
          },
          {
            id: 'moyenne-simple',
            intitule: 'Pourquoi pas la moyenne simple ?',
            raisonnement:
              '(36 + 28 + 16) ÷ 3 ≈ 26,7 % : ce nombre ne correspond à aucune année, car il suppose trois canaux de même poids.',
            invite: 'Expliquez pourquoi la moyenne simple ne convient pas.',
          },
          {
            id: 'effet',
            intitule: 'Chiffrer l’effet de répartition',
            raisonnement:
              'Avec la répartition de 2024, le CA 2025 (1 150 000 €) aurait donné 27,6 % de marge, soit 317 400 €. La marge réelle est de 291 000 € : le changement de répartition « coûte » 26 400 € de marge.',
            invite: 'Chiffrez l’effet du changement de répartition.',
          },
          {
            id: 'logique',
            intitule: 'Réfuter une implication',
            raisonnement:
              'L’affirmation « si chaque canal garde son taux, alors le taux global est inchangé » est fausse : Atelier Rivage en est un contre-exemple. Sa négation s’écrit : « il existe une répartition du CA pour laquelle chaque canal garde son taux et le taux global change ».',
            invite:
              'Écrivez la négation de l’affirmation, puis le contre-exemple.',
          },
        ],
      },
      etayage: 3,
    },
  },
  {
    screenId: 'B2-01-A5-04-SIMULATEUR-MIX',
    titre: 'Simulateur : la part de la marketplace',
    diffusion: 'seance',
    brique: 'fp-plot',
    dureeMinutes: 2,
    concepts: ['moyenne-ponderee'],
    notes: notes(
      'faire trouver la part de marketplace qui maintiendrait 27,6 % (34 %) et le taux de marge de la marketplace qui, à la répartition 2025, redonnerait 27,6 % (environ 21 % : curseur à 21, courbe à 27,6 % pour une part de 45,5 %).',
      'la pente de −0,2 point de taux global par point de part.',
      'chaque point de part gagné par la marketplace coûte 0,2 point de taux global.',
      'lire 30,4 % pour une part de 20 % (34,4 − 0,2 × 20).',
      '« Le tableur fait ce calcul pour vous, à condition de choisir le bon total. »',
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
        'Droite décroissante du taux global en fonction de la part de la marketplace, et droite horizontale du taux 2024 ; un curseur règle le taux de marge de la marketplace.',
    },
  },
  ecranV2(
    {
      screenId: 'B2-01-A5-05-TCD',
      titre: 'Tableau croisé dynamique : deux totaux de taux',
      diffusion: 'seance',
      dureeMinutes: 2,
      concepts: ['moyenne-ponderee', 'tableur'],
      notes: notes(
        'montrer les deux colonnes de droite ; faire dire ce que chacune calcule au total.',
        'les lignes sont identiques, seul le total diffère ; ce trimestre, la marketplace pèse plus de la moitié du CA.',
        'le total d’une « moyenne de taux » traite les canaux à égalité ; le champ calculé recalcule le taux sur les sommes, donc pondère chaque canal par son CA.',
        '77 160 ÷ 318 000 = 24,3 % ; (36 + 28 + 16) ÷ 3 = 26,7 %. Rappeler le devoir déposé (§ 5.2) : refaire ce TCD sur l’année (taux au total attendu : 25,3 %).',
        '« Atelier 4 : du constat à la preuve. »',
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
    dureeMinutes: 9,
    concepts: [
      'proportion',
      'taux-evolution',
      'lecture-graphique',
      'contrat-de-lecture',
      'moyenne-ponderee',
    ],
    notes: notes(
      '6 min de travail, 3 min de correction.',
      'Q3 (causalité) et Q5 (quel total).',
      'Q1 28,8 % (83 680 ÷ 291 000) ; Q2 −30 960 € ; Q3 une hypothèse à vérifier ; Q4 « +1 200 € mais −2,3 points » ; Q5 24,3 % (le total pondéré par le CA).',
      '83 680 − 57 120 = +26 560 € de marge apportée par la marketplace : elle pèse 45,5 % du CA mais 28,8 % de la marge.',
      '« Quel contrôle pour chaque anomalie du dossier ? »',
    ),
    proprietes: {
      intitule: 'Atelier 4 — Du constat à la preuve',
      consigne:
        'Données par canal, CA HT 2024 → 2025 : sur-mesure 483 000 € → 397 000 € (taux de marge brute 36 %) ; entretien 210 000 € → 230 000 € (28 %) ; marketplace 357 000 € → 523 000 € (16 %). Marge brute totale 2025 : 291 000 €.',
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
          'Le tableau croisé dynamique du 3e trimestre (écran précédent) affiche deux totaux de taux, 26,7 % et 24,3 %. Lequel portez-vous au dossier du comité ?',
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
  {
    screenId: 'B2-01-A5-07-CONTROLE-DISCRIMINANT',
    titre: 'Quel contrôle pour chaque anomalie ?',
    diffusion: 'seance',
    brique: 'fp-cardsort',
    dureeMinutes: 8,
    concepts: ['controle-coherence'],
    notes: notes(
      '5 min de tri (annoncer la dernière minute), 3 min de correction.',
      'les cartes « factures », « compensation » et « détourne nos clients ».',
      'métadonnées (inflation, +1 200) ; recalcul (−2,3 %, +4 %, moyenne simple) ; représentation (diapositive) ; preuve externe (clients, factures, compensation). À efficacité égale, le contrôle le moins coûteux d’abord : métadonnées avant recalcul, recalcul avant pièce.',
      'un total qui concorde ne prouve pas que chaque ligne est juste (février : +100 € et −100 € se compensent) ; un indice oriente, une pièce tranche.',
      '« Rédigez votre recommandation. »',
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
          ['metadonnees', 'Compléter les métadonnées (unité, période, source)'],
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
            justification: 'Compléter les métadonnées (unité, période, source)',
          },
          {
            id: 'marge',
            libelle: '« Marge brute : +1 200 »',
            categorie: 'metadonnees',
            confusion: 'unite-manquante-ignoree',
            justification: 'Compléter les métadonnées (unité, période, source)',
          },
          {
            id: 'points',
            libelle: '« Taux de marge : −2,3 % »',
            categorie: 'recalcul',
            confusion: 'points-confondus-avec-pourcentage',
            justification: 'Recalculer (coefficients, points, pondération)',
          },
          {
            id: 'toile',
            libelle: '« Prix de la toile : +4 % » (8 − 5 + 4 − 3)',
            categorie: 'recalcul',
            confusion: 'taux-successifs-additionnes',
            justification: 'Recalculer (coefficients, points, pondération)',
          },
          {
            id: 'moyenne',
            libelle:
              'Note de Samir : « taux de marge moyen des canaux : 26,7 % »',
            categorie: 'recalcul',
            confusion: 'moyenne-simple-des-taux',
            justification: 'Recalculer (coefficients, points, pondération)',
          },
          {
            id: 'diapo',
            libelle: 'Diapositive « Marge brute : une croissance continue »',
            categorie: 'representation',
            confusion: 'axe-tronque-lu-comme-ecart',
            justification: 'Refaire la représentation (axe, titre, forme)',
          },
          {
            id: 'clients',
            libelle: '« La marketplace détourne nos clients du sur-mesure »',
            categorie: 'preuve',
            confusion: 'correlation-prise-pour-causalite',
            justification:
              'Chercher une preuve externe (pièce, donnée détaillée)',
          },
          {
            id: 'factures',
            libelle:
              'Courriel du cabinet comptable : grand livre des ventes de mars 48 795 € HT, pièces 48 705 € HT',
            categorie: 'preuve',
            confusion: 'controle-non-discriminant',
            justification:
              'Chercher une preuve externe (pièce, donnée détaillée)',
          },
          {
            id: 'compensation',
            libelle:
              'Contrôle de février : total du grand livre égal au total des pièces, mais F002 à +100 € et F003 à −100 €',
            categorie: 'preuve',
            confusion: 'total-concordant-vaut-preuve',
            justification:
              'Chercher une preuve externe (pièce, donnée détaillée)',
          },
        ],
      ),
    },
  },
  {
    screenId: 'B2-01-A5-08-RECOMMANDATION',
    titre: 'Votre recommandation au comité',
    diffusion: 'seance',
    brique: 'fp-challenge',
    dureeMinutes: 6,
    concepts: ['moyenne-ponderee'],
    notes: notes(
      '3 min d’écriture, révélation, 3 min d’échange ; la production attendue est courte mais doit articuler constat, mécanisme et décision.',
      'les recommandations qui confondent taux et montant ; l’ordre des priorités.',
      'la marketplace apporte +26 560 € de marge : l’arrêter serait une erreur ; il faut piloter la marge en euros ; la priorité va à l’effet qui pèse le plus sur la décision.',
      'chaque phrase cite un chiffre ou une pièce.',
      'jalon 5, puis jeudi.',
    ),
    proprietes: {
      modalite: 'solo',
      probleme: {
        id: 'b2-01-a5-recommandation',
        enonce:
          'Mercredi, 17 h. Samir annonce qu’il proposera demain d’investir 40 000 € pour doubler les ventes de la marketplace. Hélène vous demande votre recommandation écrite, fondée sur le dossier.',
        invite:
          'Rédigez trois phrases structurées : 1) le constat chiffré et son unité ; 2) le mécanisme expliqué par les poids, ainsi que ce qui reste à prouver ; 3) la décision proposée, sa limite et le contrôle prioritaire. Si vous avez corrigé une anomalie, ajoutez une alerte courte au cabinet.',
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
            'À prouver : le transfert de clients du sur-mesure vers la marketplace (données par client) et l’écart de 90 € sur les factures de vente de mars (pièce F004).',
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
    notes: notes(
      'vote anonyme.',
      'l’agrégat perdu / ça va / clair.',
      'au moins 60 % « ça va » ou « c’est clair ».',
      'au-delà de 30 % « perdu », rejouer l’étape 2 de A5-03 au tableau.',
      '« Jeudi, 13 h 30. Avant d’entrer, un détour par Venise. »',
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
): VoteV3 {
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
      notes: notes(
        'raconter en une minute, puis écrire au tableau (10a + b) − (10b + a) = 9 × (a − b) avec l’exemple 1 263 / 1 623.',
        'le portrait et ses instruments ; la preuve algébrique du 9.',
        'concordance ≠ exactitude ligne à ligne ; un écart multiple de 9 oriente, la pièce tranche.',
        '« que prouve un total juste ? » (une cohérence, rien de plus) ; « 360 ÷ 9 = 40 : à quel rang l’inversion a-t-elle eu lieu ? » (centaines et dizaines).',
        '« Quatre vérifications ouvrent la salle du comité. »',
      ),
    },
    'image-left',
    {
      title: '1494 : Pacioli et la méthode du contrôle',
      subtitle: 'Les traces comptables doivent se répondre.',
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
    dureeMinutes: 10,
    concepts: [
      'moyenne-ponderee',
      'point-de-pourcentage',
      'evolution-reciproque',
      'controle-coherence',
    ],
    notes: notes(
      'lancer le parcours ; indices disponibles après 60 secondes ; au bout de 8 min, projeter les énigmes les moins résolues (progression au pupitre).',
      'progression par étudiant et tentatives moyennes par énigme au pupitre.',
      '23,4 % ; −2,8 points ; 1 035,00 € ; 9 741 €.',
      'E3 : 1 035 × 1,0176 = 1 053,22 (le prix du 1er janvier 2026 est celui du 31 décembre 2025 : 20,70 €/m² × 50 m²) ; E4 : l’écart de 90 € vient de F004 (inversion 3/4, 90 = 9 × 10) ; 48 705 × 0,20 = 9 741 ; 48 705 + 9 741 = 58 446 € TTC.',
      '« Dernier piège : une réponse d’IA. »',
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
  ecranV2(
    {
      screenId: 'B2-01-A6-03-IA-CADRE',
      titre: 'IA : accélérer la préparation, jamais déléguer le jugement',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['controle-coherence'],
      notes: notes(
        'lire les cinq gestes.',
        '« vérifier au tableur » et « je ne peux pas conclure ».',
        'l’IA propose, le professionnel prouve.',
        '« quelle donnée d’Atelier Rivage ne doit jamais être collée dans un outil grand public ? » (clients, montants réels).',
        '« Corrigez cette réponse. »',
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
    notes: notes(
      '3 min d’écriture, révélation, 1 min d’échange.',
      'qui trouve une seule erreur ; qui retrouve le CA 2023 (357 000 ÷ 1,20).',
      '+75,8 % et +32,6 % par an ; l’écart avec 33,25 % est de 0,65 point : l’ordre de grandeur ne suffit pas.',
      '297 500 × 1,326² ≈ 523 000.',
      '« Votre rappel personnel. »',
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
    notes: notes(
      '2 min 30 individuelles ; projeter la carte de maîtrise (répartition des boîtes par concept).',
      'les concepts qui restent en boîte 1 pour plus de 30 % de la classe.',
      'chaque étudiant répond à R10 et R11, puis revoit ses propres erreurs de la séance.',
      'annoncer que les concepts en boîte 1 reviendront en ouverture de B2-02.',
      '« Votre fiche mémo pour le CCF. »',
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
      notes: notes(
        'montrer la fiche et le bouton d’impression ; 90 secondes de lecture.',
        'les cartes que les étudiants retournent en premier.',
        'chacun sait retrouver la méthode d’une question du CCF.',
        'question rapide : « quelle carte pour « le taux global baisse alors que chaque taux est stable » ? » (moyenne pondérée).',
        '« Vos outils pour la suite. »',
      ),
    },
    'grid',
    {
      title: 'Fiche mémo : quelle méthode pour quelle question ?',
      subtitle:
        'À garder pour le CCF : chaque carte part d’une question et donne la méthode et son contrôle.',
      imprimable: true,
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
      titre: 'Ressources de transfert : BTS, bachelor, M1',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['tableur'],
      notes: notes(
        'montrer où retrouver la liste ; lire les cartes « une ligne = une observation » et « SIERREUR ».',
        'les outils déjà connus des étudiants.',
        'chacun note la ressource utile pour le devoir déposé (le TCD du § 5.2).',
        'le lien du référentiel et celui de la série Insee s’ouvrent.',
        '« Billet de sortie. »',
      ),
    },
    'grid',
    {
      title: 'Ressources de transfert : BTS, bachelor, M1',
      subtitle:
        'Le socle nécessaire pour le BTS, puis les ressources facultatives pour prolonger l’analyse.',
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
          title: 'Compétences en IA pour les élèves (UNESCO)',
          description: 'Le cadre de référence international.',
          href: 'https://www.unesco.org/en/articles/ai-competency-framework-students',
          external: true,
        },
        {
          title: 'Référentiel du BTS CG',
          description: 'Le programme de mathématiques et l’épreuve E3.',
          href: 'https://enqdip.sup.adc.education.fr/bts/referentiel/BTS_ComptabiliteGestion.pdf',
          external: true,
        },
        {
          title: 'Extension bachelor · volume / mix / taux',
          description: 'Décomposer un écart avant de recommander.',
          back: 'Séparer effet de volume, effet de structure et effet de taux ; cette lecture prolonge le simulateur de mix et reste facultative dans le socle BTS.',
        },
        {
          title: 'Extension M1 · sensibilité et preuve',
          description: 'Tester une hypothèse sans la transformer en certitude.',
          back: 'Faire varier une hypothèse, documenter l’intervalle de résultat et distinguer scénario, corrélation et causalité. Cette extension n’est pas évaluée au BTS.',
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
    notes: notes(
      '3 min ; clore la séance quand le compteur de billets est complet (synthèse envoyée au formateur).',
      'répartition des choix et qualité des justifications ; présence de l’alerte F004.',
      'la phrase qui distingue +9,5 % de CA et −2,3 points de taux et nomme la répartition ; une alerte du type « F004 saisie 12 430 € au lieu de 12 340 € (pièce), écart 90 €, TVA collectée à corriger de 18 €, écriture à rectifier ».',
      'la justification contient un calcul (poids ou taux) et une limite.',
      '« Rendez-vous en B2-02 : vos concepts en boîte 1 vous y attendent. »',
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
        'Justifiez en trois phrases : le calcul qui prouve votre choix, la limite de l’analyse et l’action que vous proposez. Si vous avez corrigé une anomalie, ajoutez l’alerte adressée au cabinet : constat, pièce, montant, action.',
    },
  },
];

const REMEDIATIONS: CoursV3['remediations'] = {
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

const MEDIAS: CoursV3['medias'] = [
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

const ECRANS_DU_COURS: CoursV3['ecrans'] = [
  ...ACTE_1,
  ...ACTE_2,
  ...ACTE_3,
  ...ACTE_4,
  ACTE_5[0],
  ACTE_5[2],
  ACTE_5[1],
  ...ACTE_5.slice(3),
  ...ACTE_6,
];

export const B2_COURS: CoursV3 = {
  slug: 'b2-01-traitement-information-chiffree',
  version: 1,
  titre: 'Lire, contrôler et décider avec l’information chiffrée',
  niveau: 'B2',
  dureeMinutes: 210,
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
