import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import * as moteur from './briques';
import {
  anneesEtRangs,
  avecVirgule,
  colonneDeValeurs,
  colonneRecopiee,
  rangIdentique,
  termes,
  type AttenduDeFeuille,
} from './feuilles';

const CONCEPTS_DU_COURS = [
  'suite-arithmetique',
  'suite-geometrique',
  'algorithme-de-seuil',
  'somme-de-termes',
  'tableur',
  'coefficient-multiplicateur',
  'ajustement-affine',
  'negation',
] as const satisfies readonly ConceptId[];

const CONCEPTS_DES_SUITES = [
  'suite-arithmetique',
  'suite-geometrique',
  'algorithme-de-seuil',
  'somme-de-termes',
  'tableur',
] as const satisfies readonly ConceptId[];

const ANNEE_DE_DEPART = 2025;
const CA_OBSERVE = [610, 652, 694, 736, 790, 826];
const PREMIERE_ANNEE_OBSERVEE = ANNEE_DE_DEPART - CA_OBSERVE.length + 1;
const CA_DE_DEPART = 826;
const RAISON_A = 44;
const TAUX_B = 0.06;
const DERNIER_RANG_DU_PLAN = 5;
const SEUIL_DE_L_EXERCICE_5 = 1000;
const PASSAGES_DE_L_EXERCICE_5 = 4;

const CA_DE_LA_BOUTIQUE = 120;
const TAUX_DE_LA_BOUTIQUE = 0.16;
const SEUIL_DE_LA_BOUTIQUE = 280;
const DERNIER_RANG_DE_LA_BOUTIQUE = 7;

const NON_FIGEE = 'reference-relative-non-figee';
const TAUX_POUR_RAISON = 'coefficient-confondu-avec-taux';

const DONNEES_FICTIVES =
  'Données fictives Atelier Rivage, créées pour ce cours.';

const RENVOI_A_L_HISTORIQUE = 'B2-04-A1-05-HISTORIQUE';
const RENVOI_A_LA_BOUTIQUE = 'B2-04-A4-01-SITUATION-BOUTIQUE';

const hypotheseA = (rang: number): number => CA_DE_DEPART + RAISON_A * rang;
const hypotheseB = (rang: number): number =>
  auMillionieme(CA_DE_DEPART * (1 + TAUX_B) ** rang);
const ecartBMoinsA = (rang: number): number =>
  auMillionieme(hypotheseB(rang) - hypotheseA(rang));
const boutique = (rang: number): number =>
  auMillionieme(CA_DE_LA_BOUTIQUE * (1 + TAUX_DE_LA_BOUTIQUE) ** rang);
const seuilDeLaBoutiqueAtteint = (rang: number): string =>
  boutique(rang) >= SEUIL_DE_LA_BOUTIQUE ? 'Oui' : 'Non';

function cumulDeLaBoutique(premier: number, dernier: number): number {
  return auMillionieme(
    termes(boutique, premier, dernier).reduce(
      (total, terme) => total + terme,
      0,
    ),
  );
}

const LIGNES_DE_L_HISTORIQUE = CA_OBSERVE.map((ca, rang) => {
  const precedent = CA_OBSERVE[rang - 1];
  return {
    annee: String(PREMIERE_ANNEE_OBSERVEE + rang),
    ca: String(ca),
    hausse: rang === 0 ? '—' : `+${ca - precedent}`,
    taux: rang === 0 ? '—' : `+${avecVirgule((ca / precedent - 1) * 100, 1)} %`,
  };
});

const FORMULE_DE_L_HYPOTHESE_A = '=C2+$F$1';

const CELLULES_DE_L_EXERCICE_2 = {
  A1: 'Année',
  B1: 'Rang n',
  C1: 'CA hypothèse A (k€)',
  C2: String(CA_DE_DEPART),
  E1: 'Raison r (k€)',
  F1: String(RAISON_A),
  ...anneesEtRangs(ANNEE_DE_DEPART, DERNIER_RANG_DU_PLAN),
};

const PLAN_DE_L_HYPOTHESE_A = {
  id: 'b2-04-a1-tableur-arithmetique',
  intitule: 'Exercice 2 — L’hypothèse A au tableur',
  lignes: DERNIER_RANG_DU_PLAN + 2,
  colonnes: 6,
  cellules: CELLULES_DE_L_EXERCICE_2,
  verrouillees: Object.keys(CELLULES_DE_L_EXERCICE_2),
  consignes: [
    'En C3, écrivez la formule qui calcule le chiffre d’affaires de 2026 à partir de celui de 2025 (C2) et de la raison (F1).',
    'Recopiez la formule de C3 jusqu’en C7 : elle doit rester juste sur chaque ligne.',
    'La raison ne s’écrit pas dans la formule : utilisez la cellule F1.',
  ],
};

const ATTENDUS_DE_L_HYPOTHESE_A = colonneRecopiee(
  {
    colonne: 'C',
    premiereLigne: 3,
    formule: FORMULE_DE_L_HYPOTHESE_A,
    piegesDeLaRecopie: [[hypotheseA(1), NON_FIGEE]],
  },
  termes(hypotheseA, 1, DERNIER_RANG_DU_PLAN),
);

const FORMULE_DE_L_HYPOTHESE_B = '=D2*(1+$G$2)';
const FORMULE_DE_L_ECART = '=D3-C3';

const CELLULES_DE_L_EXERCICE_4 = {
  A1: 'Année',
  B1: 'Rang n',
  C1: 'Hypothèse A (k€)',
  D1: 'Hypothèse B (k€)',
  D2: String(CA_DE_DEPART),
  E1: 'Écart B − A (k€)',
  E2: '0',
  F1: 'Raison r (k€)',
  G1: String(RAISON_A),
  F2: 'Taux annuel t',
  G2: avecVirgule(TAUX_B, 2),
  ...anneesEtRangs(ANNEE_DE_DEPART, DERNIER_RANG_DU_PLAN),
  ...colonneDeValeurs('C', termes(hypotheseA, 0, DERNIER_RANG_DU_PLAN)),
};

const PLAN_DES_DEUX_HYPOTHESES = {
  id: 'b2-04-a2-tableur-geometrique',
  intitule: 'Exercice 4 — Les deux hypothèses au tableur',
  lignes: DERNIER_RANG_DU_PLAN + 2,
  colonnes: 7,
  cellules: CELLULES_DE_L_EXERCICE_4,
  verrouillees: Object.keys(CELLULES_DE_L_EXERCICE_4),
  consignes: [
    'En D3, écrivez la formule qui calcule l’hypothèse B de 2026 à partir de D2 et du taux (G2). Recopiez-la jusqu’en D7.',
    'En E3, écrivez l’écart entre l’hypothèse B et l’hypothèse A de la même année. Recopiez jusqu’en E7.',
    'Le taux ne s’écrit pas dans la formule : utilisez la cellule G2.',
  ],
};

const ATTENDUS_DES_DEUX_HYPOTHESES: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'D',
      premiereLigne: 3,
      formule: FORMULE_DE_L_HYPOTHESE_B,
      piegesDuModele: [[CA_DE_DEPART * TAUX_B, TAUX_POUR_RAISON]],
      piegesDeLaRecopie: [[hypotheseB(1), NON_FIGEE]],
    },
    termes(hypotheseB, 1, DERNIER_RANG_DU_PLAN),
  ),
  ...colonneRecopiee(
    { colonne: 'E', premiereLigne: 3, formule: FORMULE_DE_L_ECART },
    termes(ecartBMoinsA, 1, DERNIER_RANG_DU_PLAN),
  ),
];

const [PREMIER_PASSAGE, ...AUTRES_PASSAGES] = termes(
  rangIdentique,
  1,
  PASSAGES_DE_L_EXERCICE_5,
).flatMap((passage) => {
  const u = hypotheseA(passage);
  const continuer = u < SEUIL_DE_L_EXERCICE_5 ? 1 : 0;
  return [
    {
      rang: passage - 1,
      cle: 'u',
      valeur: u,
      pieges: [
        { valeur: hypotheseA(passage - 1), confusion: 'rang-decale' as const },
      ],
    },
    {
      rang: passage - 1,
      cle: 'condition',
      valeur: continuer,
      pieges: [
        {
          valeur: 1 - continuer,
          confusion: 'condition-tant-que-inversee' as const,
        },
      ],
    },
  ];
});

const FORMULE_DE_LA_BOUTIQUE = '=C2*(1+$F$1)';
const FORMULE_DU_SEUIL = '=SI(C2>=$H$1;"Oui";"Non")';
const FORMULE_DU_CUMUL = '=SOMME(C2:C7)';

const CELLULES_DE_LA_BOUTIQUE = {
  A1: 'Année',
  B1: 'Rang n',
  C1: 'CA boutique (k€)',
  C2: String(CA_DE_LA_BOUTIQUE),
  D1: 'Seuil atteint ?',
  E1: 'Taux annuel',
  F1: avecVirgule(TAUX_DE_LA_BOUTIQUE, 2),
  G1: 'Seuil (k€)',
  H1: String(SEUIL_DE_LA_BOUTIQUE),
  E3: 'Cumul 2025-2030 (k€)',
  ...anneesEtRangs(ANNEE_DE_DEPART, DERNIER_RANG_DE_LA_BOUTIQUE),
};

const PLAN_DE_LA_BOUTIQUE = {
  id: 'b2-04-a4-feuille-boutique',
  intitule: 'Question tableur (3 points) — Le plan de la boutique en ligne',
  lignes: DERNIER_RANG_DE_LA_BOUTIQUE + 2,
  colonnes: 8,
  cellules: CELLULES_DE_LA_BOUTIQUE,
  verrouillees: Object.keys(CELLULES_DE_LA_BOUTIQUE),
  consignes: [
    'En C3, écrivez la formule qui calcule le chiffre d’affaires de 2026 à partir de C2 et du taux (F1). Recopiez-la jusqu’en C9.',
    'En D2, avec SI : « Oui » si le chiffre d’affaires de la ligne atteint le seuil (H1), « Non » sinon. Recopiez jusqu’en D9.',
    'En F3, calculez le chiffre d’affaires cumulé de 2025 à 2030 inclus.',
    'Le taux et le seuil ne s’écrivent pas dans les formules : utilisez F1 et H1.',
  ],
};

const ATTENDUS_DE_LA_BOUTIQUE: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 3,
      formule: FORMULE_DE_LA_BOUTIQUE,
      piegesDuModele: [
        [CA_DE_LA_BOUTIQUE * TAUX_DE_LA_BOUTIQUE, TAUX_POUR_RAISON],
      ],
      piegesDeLaRecopie: [[boutique(1), NON_FIGEE]],
    },
    termes(boutique, 1, DERNIER_RANG_DE_LA_BOUTIQUE),
  ),
  ...colonneRecopiee(
    {
      colonne: 'D',
      premiereLigne: 2,
      formule: FORMULE_DU_SEUIL,
      confusionSiErreur: 'critere-sans-guillemets',
    },
    termes(seuilDeLaBoutiqueAtteint, 0, DERNIER_RANG_DE_LA_BOUTIQUE),
  ),
  moteur.attendu(
    'F3',
    FORMULE_DU_CUMUL,
    cumulDeLaBoutique(0, DERNIER_RANG_DU_PLAN),
    'references',
    [
      [cumulDeLaBoutique(1, DERNIER_RANG_DU_PLAN), 'nombre-de-termes-decale'],
      [boutique(DERNIER_RANG_DU_PLAN), 'terme-pris-pour-somme'],
    ],
  ),
];

const PARCOURS_DU_COFFRE = 'b2-04-a4-coffre-boutique';

const ACTE_1: moteur.Acte = [
  {
    screenId: 'B2-04-A1-01-RAPPEL-COEFFICIENT',
    titre: 'Rappel du B2-01 : augmenter de 6 %',
    diffusion: 'seance',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['coefficient-multiplicateur'],
    notes: moteur.puces(
      'Avant de lancer : vérifier au pupitre que tous les postes ont rejoint la séance.',
      'Annoncer « seule la participation compte ». Chacun répond sans calculatrice.',
      'Piège : prendre le taux (0,06) pour le coefficient ; tout l’acte 2 repose sur cette distinction.',
      'Papier : la question est en tête du livret ; vote à main levée.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-04-a1-rappel-coefficient',
          'coefficient-multiplicateur',
          true,
          'Pour augmenter un montant de 6 %, par quel nombre le multiplie-t-on ?',
          'Par 1,06 : le coefficient multiplicateur 1 + 6 ÷ 100',
          [
            ['Par 0,06 : le taux écrit en décimal', TAUX_POUR_RAISON],
            ['Par 6 : le taux lu tel quel', TAUX_POUR_RAISON],
          ],
        ),
      ],
      delaiMs: 0,
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-04-A1-02-ACCROCHE',
      titre: 'Modéliser une évolution régulière',
      diffusion: 'catalogue',
      dureeMinutes: 1,
      concepts: ['suite-arithmetique', 'suite-geometrique'],
      notes: moteur.puces(
        'Rappeler en une phrase le B2-03 : Atelier Rivage a contrôlé ses factures ; Hélène prépare maintenant un dossier de prêt.',
        'Annoncer le plan : un rappel rapide des trois premiers cours, puis trois notions, chacune en trois temps (réfléchir, comprendre, s’exercer), et une mini-situation CCF.',
        'Annoncer les deux pauses de 15 minutes, après l’acte 1 et après l’acte 3.',
      ),
    },
    'hero',
    {
      title: 'Modéliser une évolution régulière',
      subtitle:
        'Atelier Rivage, voilerie de La Rochelle. Pour sa banque, la dirigeante veut un plan à cinq ans : deux hypothèses de croissance, une année-seuil, un chiffre d’affaires cumulé.',
      bullets: [
        'BTS Comptabilité et gestion · 2e année · quatrième cours de mathématiques',
        'Un rappel rapide des trois premiers cours, réinvestis aujourd’hui',
        'Trois notions : suites arithmétiques, suites géométriques, seuil et cumul',
        'Une mini-situation CCF et sa question tableur',
      ],
    },
  ),
  {
    screenId: 'B2-04-A1-03-VOTE-ACQUIS',
    titre: 'Vote : deux rappels, B2-02 et B2-03',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['ajustement-affine', 'negation'],
    notes: moteur.puces(
      'Rappel rapide : deux votes non notés, un par cours précédent.',
      'Dire où chaque acquis resservira : la pente dans l’hypothèse A, la négation dans la boucle « Tant que ».',
      ...moteur.NOTES_DU_VOTE_A_DEUX_QUESTIONS,
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-04-a1-rappel-pente',
          'ajustement-affine',
          false,
          'Rappel du B2-02. La droite d’ajustement du chiffre d’affaires d’Atelier Rivage s’écrit y = 43,9x + 564,4, où x est le rang de l’année et y le chiffre d’affaires en k€. Que mesure le nombre 43,9 ?',
          'La hausse moyenne du chiffre d’affaires par an, en k€',
          [
            [
              'Le chiffre d’affaires de départ, quand x vaut 0',
              'pente-ordonnee-inversees',
            ],
          ],
        ),
        moteur.vote(
          'b2-04-a1-rappel-negation',
          'negation',
          false,
          'Rappel du B2-03. Quel est le contraire de « le chiffre d’affaires est inférieur à 1 200 k€ » ?',
          'Le chiffre d’affaires est supérieur ou égal à 1 200 k€',
          [
            [
              'Le chiffre d’affaires est supérieur à 1 200 k€',
              'negation-comparaison',
            ],
          ],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'Deux acquis qui resservent aujourd’hui',
        lignes: [
          'La pente d’une droite d’ajustement est la variation de y quand x augmente de 1 : ici, environ 44 k€ de plus par an.',
          'Le contraire de « < » est « ≥ » : la borne passe de l’autre côté.',
          'L’écran suivant rassemble ce que les trois premiers cours apportent à celui-ci.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-04-A1-04-ACQUIS',
      titre: 'Ce que vous savez déjà',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['coefficient-multiplicateur', 'ajustement-affine', 'negation'],
      notes: moteur.puces(
        '2 min : lire la dernière ligne de chaque colonne, c’est le fil du cours.',
        'Question : « Lequel de ces trois acquis servira à écrire + 6 % par an ? » Le coefficient multiplicateur.',
        'Ne pas refaire les trois cours : renvoyer aux fiches mémo du classeur de CCF.',
      ),
    },
    'comparison',
    {
      title: 'Ce que vous savez déjà',
      subtitle: 'Trois acquis réinvestis aujourd’hui.',
      columns: [
        {
          label: 'B2-01 · Information chiffrée',
          tone: 'info',
          items: [
            'Augmenter de t % : multiplier par 1 + t ÷ 100.',
            'Hausses successives : les coefficients se multiplient.',
            'Aujourd’hui : ce coefficient devient la raison q.',
          ],
        },
        {
          label: 'B2-02 · Statistiques',
          tone: 'success',
          items: [
            'Droite d’ajustement : y = ax + b.',
            'La pente a : ce que gagne y quand x augmente de 1.',
            'Aujourd’hui : cette pente devient la raison r.',
          ],
        },
        {
          label: 'B2-03 · Logique',
          tone: 'warning',
          items: [
            'Une condition : non, et, ou, et une borne bien placée.',
            'Le contraire de < est ≥.',
            'Aujourd’hui : la condition d’une boucle « Tant que ».',
          ],
        },
      ],
      note: 'Les trois fiches mémo sont dans votre classeur de CCF.',
    },
  ),
  moteur.ecranV2(
    {
      screenId: RENVOI_A_L_HISTORIQUE,
      titre: 'Le chiffre d’affaires d’Atelier Rivage, 2020-2025',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['suite-arithmetique', 'suite-geometrique'],
      notes: moteur.puces(
        '1 min de lecture silencieuse ; ne rien calculer.',
        'Faire comparer les deux dernières colonnes : ni les hausses en k€ ni les hausses en % ne sont constantes ; un modèle simplifie la réalité.',
        'Relier aux rappels : la pente 43,9 donnera l’hypothèse A, le taux moyen donnera l’hypothèse B.',
      ),
    },
    'table',
    {
      title: 'Le chiffre d’affaires d’Atelier Rivage, 2020-2025',
      subtitle:
        'Chiffre d’affaires annuel et hausse par rapport à l’année précédente.',
      columns: [
        { key: 'annee', label: 'Année' },
        { key: 'ca', label: 'Chiffre d’affaires (k€)' },
        { key: 'hausse', label: 'Hausse sur un an (k€)' },
        { key: 'taux', label: 'Hausse sur un an (%)' },
      ],
      rows: LIGNES_DE_L_HISTORIQUE,
      note: `Taux moyen annuel de 2020 à 2025 : (826 ÷ 610)^(1/5) − 1, soit 6,25 % par an (méthode du B2-01). ${DONNEES_FICTIVES}`,
    },
  ),
  {
    screenId: 'B2-04-A1-06-MISSION',
    titre: 'Votre mission : le plan à cinq ans',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: [
      'suite-arithmetique',
      'suite-geometrique',
      'algorithme-de-seuil',
    ],
    notes: moteur.puces(
      'Lecture à voix haute du courriel (1 min), puis 4 min d’écriture individuelle et 1 min de mise en commun au pupitre.',
      'Question 1 : faire dire « on ajoute toujours le même montant ».',
      'Question 2 : faire dire que 6 % d’un chiffre d’affaires qui grossit représentent de plus en plus de k€.',
      'Question 3 : faire émerger l’idée d’avancer année après année jusqu’au seuil ; c’est l’acte 3.',
      'Papier : trois lignes d’écriture dans le livret.',
    ),
    proprietes: {
      metier:
        'Assistant·e de gestion — Atelier Rivage (voilerie artisanale, 14 salariés, La Rochelle)',
      situation:
        'Lundi, 9 h. Hélène Garnier, la dirigeante, prépare un plan à cinq ans, de 2026 à 2030, pour le dossier de prêt de la banque. Elle écrit : « Notre chiffre d’affaires 2025 est de 826 k€. Il me faut une prévision année par année, et l’année où nous atteindrons 1 200 k€ : à partir de ce seuil, la banque finance le second atelier. » Marc Lefèvre, l’expert-comptable, propose l’hypothèse A : « Prolongez la droite d’ajustement : + 44 k€ chaque année. » Samir, le responsable commercial, défend l’hypothèse B : « Notre croissance moyenne est d’environ 6 % par an : appliquez + 6 % chaque année. »',
      geste:
        'Sans calculatrice, répondez aux trois questions à partir des deux hypothèses.',
      consequence:
        'Un plan trop optimiste, et la banque finance un atelier que les ventes ne rempliront pas ; trop prudent, et le prêt est refusé. Les deux hypothèses sont proches en 2026, beaucoup moins au bout de cinq ans.',
      questionsLibres: [
        {
          id: 'b2-04-a1-mission:hypothese-a',
          question:
            'Avec l’hypothèse A, comment passe-t-on du chiffre d’affaires d’une année à celui de l’année suivante ?',
          placeholder: 'On … toujours le même …',
        },
        {
          id: 'b2-04-a1-mission:hypothese-b',
          question:
            'Avec l’hypothèse B, la hausse en k€ est-elle la même chaque année ? Pourquoi ?',
          placeholder: 'Oui / Non, parce que…',
        },
        {
          id: 'b2-04-a1-mission:seuil',
          question:
            'Comment trouver l’année où le chiffre d’affaires atteint 1 200 k€, sans formule toute faite ?',
          placeholder: 'Je calcule… jusqu’à ce que…',
        },
      ],
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-04-A1-07-COURS-ARITHMETIQUE',
      titre: 'Cours : suites arithmétiques',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['suite-arithmetique'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret : on lit et on commente, on ne recopie pas.',
        'Avant l’exemple, demander : « Le loyer de 2035, faut-il calculer les dix loyers ? » Laisser venir « dix fois 15 € ».',
        'Insister sur le rang 0 : c’est l’année de départ, pas la première année du plan.',
        'Lien au dossier : « L’hypothèse de Marc, est-ce une suite arithmétique ? De quelle raison ? »',
      ),
    },
    'lesson',
    {
      title: 'Suites arithmétiques : ajouter toujours le même nombre',
      subtitle: 'Trace écrite · notion 1 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Une liste numérotée de nombres',
          text: 'Une suite est une liste de nombres numérotés : u₀, u₁, u₂… Le numéro n s’appelle le rang, et uₙ est le terme de rang n. Une suite est arithmétique quand on passe d’un terme au suivant en ajoutant toujours le même nombre r, appelé la raison. On obtient alors n’importe quel terme sans calculer les précédents : on part de u₀ et l’on ajoute n fois la raison. En gestion, c’est le modèle d’une grandeur qui gagne ou perd le même montant à chaque période : un loyer révisé d’un montant fixe, un amortissement linéaire.',
          formula: 'uₙ₊₁ = uₙ + r · uₙ = u₀ + n × r',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le loyer',
          text: 'Un local est loué 900 € par mois en 2025 ; le bail prévoit 15 € de plus chaque année. u₀ = 900 et r = 15.',
          steps: [
            'u₁ = 900 + 15 = 915 € : le loyer de 2026.',
            'u₂ = 915 + 15 = 930 € : le loyer de 2027.',
            'Directement : u₁₀ = 900 + 10 × 15 = 1 050 €, le loyer de 2035, sans calculer les neuf loyers précédents.',
            'Le rang compte les années écoulées depuis 2025 : le rang 10 est l’année 2025 + 10.',
          ],
        },
        {
          kind: 'method',
          title: 'Reconnaître et utiliser une suite arithmétique',
          text: 'Pour reconnaître : calculer les différences entre termes consécutifs ; si elles sont toutes égales, la suite est arithmétique et cette différence est la raison. Pièges : compter un rang de trop ou de moins (le terme de départ est u₀, pas u₁) ; répondre par le rang quand on demande l’année.',
          steps: [
            'Différences constantes : suite arithmétique, de raison cette différence.',
            'Noter ce que représente le rang 0 avant tout calcul.',
            'Terme de rang n : u₀ + n × r.',
            'Retrouver un rang : (uₙ − u₀) ÷ r.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-04-A1-08-COURS-RAISON-TABLEUR',
      titre: 'Cours : raison, graphique et tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['suite-arithmetique', 'ajustement-affine', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Relier au vote de rappel : la pente 43,9 de la droite du B2-02 est la raison, arrondie à 44.',
        'Faire taper la formule sans $ sur un poste volontaire, puis la recopier : la colonne se bloque, l’erreur fixe la règle.',
      ),
    },
    'lesson',
    {
      title: 'Raison, graphique et tableur',
      subtitle: 'Trace écrite · notion 1 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Des points alignés',
          text: 'Les points (n ; uₙ) d’une suite arithmétique sont alignés : uₙ = u₀ + n × r est de la forme y = ax + b, avec la raison r pour pente et u₀ pour ordonnée à l’origine. C’est la droite d’ajustement du B2-02, lue aux seuls rangs entiers. Si r est positif, la suite est croissante ; si r est négatif, elle est décroissante ; si r est nul, elle est constante.',
          formula:
            'r > 0 : croissante · r < 0 : décroissante · pente = r · ordonnée à l’origine = u₀',
        },
        {
          kind: 'method',
          title: 'Au tableur : une formule, recopiée',
          text: 'On écrit la valeur de départ, puis une seule formule qui ajoute la raison au terme du dessus, et on la recopie vers le bas. La raison est rangée dans une cellule à part : on la fige avec des $ pour que la recopie ne la décale pas.',
          steps: [
            'B2 contient u₀ ; la raison est en E1.',
            'En B3 : =B2+$E$1, puis recopier vers le bas.',
            'Sans les $, B4 contiendrait =B3+E2 : E2 est vide, la suite n’avance plus.',
            'Changer E1 recalcule toute la colonne : c’est l’intérêt de la cellule à part.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : justifier la nature de la suite',
          text: 'Une réponse complète nomme la suite, donne son premier terme et sa raison avec l’unité, puis écrit la formule. Pièges : échanger u₀ et r dans la formule ; oublier l’unité de la raison.',
          steps: [
            'Phrase type : « la suite (uₙ) est arithmétique, de premier terme u₀ = … et de raison r = … ».',
            'Vérifier la formule sur un terme connu, par exemple u₁.',
            'Conclure par une phrase, avec l’unité.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-04-A1-09-EXEMPLE-ARITHMETIQUE',
      titre: 'Exemple guidé : la production de voiles',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['suite-arithmetique', 'tableur'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-04-a1-exemple-arithmetique',
          enonce:
            'L’atelier a cousu 320 voiles en 2025. Le plan de production prévoit 25 voiles de plus chaque année. On note uₙ le nombre de voiles cousues l’année 2025 + n.',
          etapes: [
            {
              id: 'nature',
              intitule: 'Reconnaître la suite',
              raisonnement:
                'On ajoute 25 chaque année : la suite est arithmétique, de premier terme u₀ = 320 et de raison r = 25 voiles.',
              invite:
                'Quelle est la nature de la suite ? Donnez u₀ et la raison.',
            },
            {
              id: 'premiers',
              intitule: 'Les premiers termes',
              raisonnement:
                'u₁ = 320 + 25 = 345 voiles en 2026 ; u₂ = 345 + 25 = 370 voiles en 2027.',
              invite: 'Calculez u₁ et u₂.',
            },
            {
              id: 'general',
              intitule: 'Le terme de rang n',
              raisonnement:
                'uₙ = 320 + 25n. Pour 2030, n = 5 : u₅ = 320 + 5 × 25 = 445 voiles.',
              invite:
                'Écrivez uₙ en fonction de n, puis calculez la production de 2030.',
            },
            {
              id: 'rang',
              intitule: 'Retrouver un rang',
              raisonnement:
                '520 = 320 + 25n donne n = 200 ÷ 25 = 8 : c’est le rang 8, soit l’année 2033. Le rang n’est pas l’année.',
              invite: 'En quelle année la production atteint-elle 520 voiles ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                'En B3 : =B2+$E$1, recopiée vers le bas. Les $ figent la raison.',
              invite:
                'Production de 2025 en B2, raison en E1 : quelle formule écrire en B3 pour la recopier ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur le rang 0 (étape 3) et sur la conversion du rang en année (étape 4).',
        'Transition : « À vous, sur l’hypothèse de Marc : exercice 1. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A1-10-ATELIER-ARITHMETIQUE',
      titre: 'Exercice 1 — L’hypothèse A, année par année',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 8,
      concepts: ['suite-arithmetique'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire u₀, la raison et ce que représente le rang 0 avant de calculer.',
        'Pièges : un rang de trop ; u₀ et r échangés ; répondre par l’année quand on demande un nombre d’années.',
        'Papier : exercice 1 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_A_L_HISTORIQUE,
        intitule: 'Exercice 1 — L’hypothèse A, année par année',
        consigne:
          'Hypothèse A : 826 k€ en 2025, puis + 44 k€ par an. uₙ : chiffre d’affaires de 2025 + n.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-04-a1-nature',
            'suite-arithmetique',
            true,
            'Quelle est la nature de la suite (uₙ) ?',
            'Arithmétique : on ajoute 44 k€ chaque année',
            [
              [
                'Géométrique : on multiplie par 44 chaque année',
                'nature-de-suite-confondue',
              ],
            ],
          ),
          moteur.numerique(
            'b2-04-a1-u3',
            'suite-arithmetique',
            'Calculez u₃, le chiffre d’affaires prévu en 2028.',
            'k€',
            hypotheseA(3),
            moteur.TOLERANCE_NULLE,
            '958 k€',
            [[hypotheseA(4), 'rang-decale']],
          ),
          moteur.vote(
            'b2-04-a1-terme-general',
            'suite-arithmetique',
            true,
            'Quelle formule donne uₙ en fonction de n ?',
            'uₙ = 826 + 44n : le départ, plus n fois la raison',
            [
              [
                'uₙ = 44 + 826n : la raison, plus n fois le départ',
                'pente-ordonnee-inversees',
              ],
              [
                'uₙ = 826 × 44ⁿ : le départ, multiplié n fois par 44',
                'nature-de-suite-confondue',
              ],
            ],
          ),
          moteur.numerique(
            'b2-04-a1-rang',
            'suite-arithmetique',
            'Combien d’années après 2025 le chiffre d’affaires atteint-il 1 090 k€ ?',
            'années',
            6,
            moteur.TOLERANCE_NULLE,
            '6 années',
            [
              [2031, 'rang-confondu-avec-annee'],
              [7, 'rang-decale'],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie (score sous chaque correction).',
        'Transition : « Faisons calculer tout le plan par le tableur : exercice 2. »',
      ],
    },
    [
      [
        'b2-04-a1-nature',
        'On ajoute le même montant, 44 k€, chaque année : la suite est arithmétique, de premier terme u₀ = 826 et de raison r = 44 k€.',
      ],
      [
        'b2-04-a1-u3',
        '2028 est le rang 3 : u₃ = 826 + 3 × 44 = 958 k€. Répondre 1 002 k€, c’est compter un rang de trop.',
      ],
      [
        'b2-04-a1-terme-general',
        'uₙ = u₀ + n × r = 826 + 44n. Contrôle : u₁ = 826 + 44 = 870 k€.',
      ],
      [
        'b2-04-a1-rang',
        '1 090 = 826 + 44n donne n = 264 ÷ 44 = 6 : six années après 2025, soit en 2031. La question demande le nombre d’années, pas l’année.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A1-11-TABLEUR-ARITHMETIQUE',
      titre: 'Exercice 2 — L’hypothèse A au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 6,
      concepts: ['tableur', 'suite-arithmetique'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 5 min',
        'Réflexion : écrire sur papier la formule de C3, puis ce qu’elle devient en C4 une fois recopiée.',
        'Erreurs à chercher : la raison écrite en dur (44) ; F1 sans $ : la colonne reste bloquée à 870.',
        'Papier : formule écrite sur la copie, puis les cinq valeurs calculées à la main.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DE_L_HYPOTHESE_A,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DE_L_HYPOTHESE_A.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DE_L_HYPOTHESE_A,
              attendus: ATTENDUS_DE_L_HYPOTHESE_A,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire la formule de C3, puis celle de C7.',
        'Transition : jalon 1, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'C3',
        `${FORMULE_DE_L_HYPOTHESE_A} : le terme du dessus, plus la raison figée par les $.`,
      ],
      [
        'C4 à C7',
        'Recopiée, la formule devient =C3+$F$1, puis =C4+$F$1… La colonne affiche 914, 958, 1 002 et 1 046 k€. Sans les $, elle lirait F2, F3…, vides, et resterait bloquée à 870.',
      ],
    ],
  ),
  {
    screenId: 'B2-04-A1-12-JALON',
    titre: 'Jalon 1 : suites arithmétiques',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['suite-arithmetique'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A1-07 après la pause.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-04-a1-jalon',
        invite:
          'Je sais reconnaître une suite arithmétique, calculer un terme et l’écrire au tableur.',
      },
    },
  },
];

const ACTE_2: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-04-A2-01-REFLEXION-TAUX',
      titre: 'Réfléchir : +6 % par an pendant cinq ans',
      diffusion: 'seance',
      dureeMinutes: 5,
      concepts: ['suite-geometrique', 'coefficient-multiplicateur'],
      notes: moteur.puces(
        'Temps « réfléchir » de la notion 2 : 3 min d’écriture individuelle, puis lire trois réponses au pupitre.',
        'Ne rien trancher : la trace écrite suivante répond.',
        'Relance : « En 2027, les 6 % se calculent-ils sur 826 k€ ? »',
        'Papier : cadre de réponse du livret.',
      ),
    },
    'reflection',
    {
      promptData: {
        id: 'b2-04-a2-reflexion-taux',
        type: 'reflection',
        question:
          'Un stagiaire résume l’hypothèse B : « + 6 % par an pendant cinq ans, cela fait + 30 % : 826 k€ deviendront 1 073,8 k€ en 2030. » Sans calculatrice, dites s’il a raison, et expliquez ce que fait vraiment une hausse de 6 % répétée cinq fois.',
        placeholder: 'Il a raison / il a tort, parce que chaque année…',
        competency: 'Modéliser · reconnaître une évolution à taux constant',
      },
    },
    {
      correction: {
        expected:
          'Il a tort : chaque hausse de 6 % s’applique au chiffre d’affaires de l’année précédente, qui a déjà grossi. On multiplie cinq fois par 1,06 ; les taux successifs ne s’ajoutent pas (B2-01). Le résultat dépasse donc 1 073,8 k€.',
        nextAction:
          'Gardez votre réponse : la trace écrite donne le modèle de cette évolution.',
      },
      renvoi: RENVOI_A_L_HISTORIQUE,
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-04-A2-02-COURS-GEOMETRIQUE',
      titre: 'Cours : suites géométriques',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['suite-geometrique', 'coefficient-multiplicateur'],
      notes: moteur.puces(
        '3 min ; garder la réflexion précédente sous les yeux.',
        'Question : « Le livret à 3 %, par combien multiplie-t-on chaque année ? » 1,03, pas 0,03.',
        'Faire faire le calcul de u₁₀ à la calculatrice : repérer la touche puissance sur chaque modèle.',
      ),
    },
    'lesson',
    {
      title: 'Suites géométriques : multiplier toujours par le même nombre',
      subtitle: 'Trace écrite · notion 2 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Multiplier par la raison',
          text: 'Une suite est géométrique quand on passe d’un terme au suivant en multipliant toujours par le même nombre q, appelé la raison. Le terme de rang n s’obtient en multipliant u₀ n fois par q. Une évolution à taux constant est une suite géométrique : augmenter de t % à chaque période, c’est multiplier chaque fois par le coefficient multiplicateur du B2-01. La raison est ce coefficient, pas le taux. C’est le modèle de l’hypothèse de Samir.',
          formula: 'uₙ₊₁ = uₙ × q · uₙ = u₀ × qⁿ · q = 1 + t ÷ 100',
        },
        {
          kind: 'example',
          title: 'Pour débuter : le livret',
          text: 'Un livret contient 2 000 € en 2025 et rapporte 3 % par an, intérêts laissés sur le livret. u₀ = 2 000 et q = 1,03.',
          steps: [
            'u₁ = 2 000 × 1,03 = 2 060 €.',
            'u₂ = 2 060 × 1,03 = 2 121,80 €.',
            'Directement : u₁₀ = 2 000 × 1,03¹⁰ ≈ 2 687,83 €.',
            'Erreur classique : 10 × 3 % = 30 %, soit 2 600 € ; il manque les intérêts des intérêts.',
            'À la calculatrice : 2000 × 1,03 ^ 10.',
          ],
        },
        {
          kind: 'method',
          title: 'Reconnaître et utiliser une suite géométrique',
          text: 'Pour reconnaître : calculer les quotients de termes consécutifs ; s’ils sont tous égaux, la suite est géométrique et ce quotient est la raison. Différences égales : arithmétique ; quotients égaux : géométrique. Pièges : prendre le taux pour la raison (0,03 au lieu de 1,03) ; additionner les taux au lieu de multiplier les coefficients.',
          steps: [
            'Quotients constants : suite géométrique, de raison ce quotient.',
            '« + t % par période » : q = 1 + t ÷ 100 ; « − t % par période » : q = 1 − t ÷ 100.',
            'Terme de rang n : u₀ × qⁿ, avec la touche puissance.',
            'Arrondir seulement le résultat final, jamais la raison.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-04-A2-03-COURS-VARIATION',
      titre: 'Cours : variation et tableur',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['suite-geometrique', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Question : « − 5 % par an : la raison est-elle négative ? » Non : 0,95, positive et plus petite que 1.',
        'Relier à la réflexion A2-01 : faire relire les réponses qui ont ajouté les taux.',
      ),
    },
    'lesson',
    {
      title: 'Variation, comparaison et tableur',
      subtitle: 'Trace écrite · notion 2 · page 2 sur 2',
      blocks: [
        {
          kind: 'property',
          title: 'Croissante ou décroissante ?',
          text: 'Pour une suite géométrique de premier terme positif : si q est plus grand que 1, la suite est croissante ; si q est entre 0 et 1, elle est décroissante ; si q vaut 1, elle est constante. Une baisse de 5 % par an donne q = 0,95 : les termes diminuent, de moins en moins vite. Une croissance géométrique finit toujours par dépasser une croissance arithmétique : ses hausses grossissent d’année en année, alors que celles de la suite arithmétique restent égales.',
          formula: 'q > 1 : croissante · 0 < q < 1 : décroissante',
        },
        {
          kind: 'method',
          title: 'Au tableur : le taux dans une cellule figée',
          text: 'Même principe que pour une suite arithmétique : une valeur de départ, puis une formule recopiée. Le taux est rangé dans une cellule à part, figée par des $ ; la formule multiplie le terme du dessus par 1 + taux.',
          steps: [
            'B2 contient u₀ ; le taux, écrit 0,03, est en E1.',
            'En B3 : =B2*(1+$E$1), puis recopier vers le bas.',
            'Piège : =B2*$E$1 multiplie par le taux seul : on obtient les intérêts, pas le nouveau montant.',
            'Terme de rang 10 en une formule : =B2*(1+$E$1)^10.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : comparer deux modèles',
          text: 'Un sujet oppose souvent une évolution à montant constant (arithmétique) et une évolution à taux constant (géométrique). On calcule les deux au même rang, puis on conclut par une phrase. Pièges : comparer des rangs différents ; conclure sans unité.',
          steps: [
            'Identifier, pour chaque modèle, le premier terme et la raison.',
            'Calculer le terme demandé dans chaque modèle, au même rang.',
            'Donner l’écart, dire quel modèle est le plus favorable et à partir de quand.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-04-A2-04-EXEMPLE-GEOMETRIQUE',
      titre: 'Exemple guidé : la consommation d’électricité',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['suite-geometrique'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-04-a2-exemple-geometrique',
          enonce:
            'L’atelier a consommé 48 000 kWh d’électricité en 2025. Le plan de sobriété vise une baisse de 5 % par an. On note cₙ la consommation de l’année 2025 + n, en kWh.',
          etapes: [
            {
              id: 'raison',
              intitule: 'La raison',
              raisonnement:
                'Baisser de 5 %, c’est multiplier par 1 − 0,05 = 0,95. La suite est géométrique, de premier terme c₀ = 48 000 et de raison q = 0,95. La raison n’est ni 0,05 ni −5.',
              invite: 'Quelle est la nature de la suite ? Donnez sa raison.',
            },
            {
              id: 'premiers',
              intitule: 'Les premiers termes',
              raisonnement:
                'c₁ = 48 000 × 0,95 = 45 600 kWh ; c₂ = 45 600 × 0,95 = 43 320 kWh.',
              invite: 'Calculez c₁ et c₂.',
            },
            {
              id: 'general',
              intitule: 'Le terme de rang n',
              raisonnement:
                'cₙ = 48 000 × 0,95ⁿ. Pour 2029, n = 4 : c₄ = 48 000 × 0,95⁴ ≈ 39 096,30 kWh.',
              invite:
                'Écrivez cₙ en fonction de n, puis calculez la consommation de 2029.',
            },
            {
              id: 'sens',
              intitule: 'Le sens de variation',
              raisonnement:
                'La raison est entre 0 et 1 : la suite est décroissante. Les baisses rétrécissent : 2 400 kWh la première année, 2 280 kWh la deuxième.',
              invite:
                'La suite est-elle croissante ou décroissante ? Les baisses en kWh sont-elles égales ?',
            },
            {
              id: 'piege',
              intitule: 'Le piège des taux ajoutés',
              raisonnement:
                'Quatre baisses de 5 % ne font pas − 20 % : 48 000 × 0,80 = 38 400 kWh, alors que le modèle donne environ 39 096 kWh.',
              invite:
                'Que donnerait le calcul « 4 × 5 % = 20 % de baisse » pour 2029 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la raison 0,95 (étape 1) et sur l’écart avec le calcul additif (étape 5).',
        'Transition : « À vous, sur l’hypothèse de Samir : exercice 3. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A2-05-ATELIER-GEOMETRIQUE',
      titre: 'Exercice 3 — L’hypothèse B, année par année',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['suite-geometrique'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : écrire v₀ et la raison, puis poser le calcul de v₃ sans l’effectuer.',
        'Pièges : raison 0,06 ; taux ajoutés (3 × 6 % = 18 %) ; un rang de trop.',
        'Papier : exercice 3 du livret.',
      ),
      proprietes: {
        renvoi: RENVOI_A_L_HISTORIQUE,
        intitule: 'Exercice 3 — L’hypothèse B, année par année',
        consigne:
          'Hypothèse B : 826 k€ en 2025, puis + 6 % par an. vₙ : chiffre d’affaires de 2025 + n.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.vote(
            'b2-04-a2-raison',
            'suite-geometrique',
            true,
            'Quelle est la raison de la suite (vₙ) ?',
            'q = 1,06 : on multiplie par 1 + 0,06',
            [['q = 0,06 : le taux écrit en décimal', TAUX_POUR_RAISON]],
          ),
          moteur.numerique(
            'b2-04-a2-v3',
            'suite-geometrique',
            'Calculez v₃, le chiffre d’affaires de 2028, au centième de k€.',
            'k€',
            983.78,
            moteur.DEUX_DECIMALES,
            '983,78 k€',
            [
              [974.68, 'taux-successifs-additionnes'],
              [1042.81, 'rang-decale'],
            ],
          ),
          moteur.vote(
            'b2-04-a2-terme-general',
            'suite-geometrique',
            true,
            'Quelle formule donne vₙ en fonction de n ?',
            'vₙ = 826 × 1,06ⁿ',
            [
              ['vₙ = 826 + 1,06n', 'nature-de-suite-confondue'],
              ['vₙ = 826 × 0,06ⁿ', TAUX_POUR_RAISON],
            ],
          ),
          moteur.numerique(
            'b2-04-a2-ecart',
            'suite-geometrique',
            'En 2030, A prévoit 1 046 k€. De combien B la dépasse-t-elle, au centième ?',
            'k€',
            59.37,
            moteur.DEUX_DECIMALES,
            '59,37 k€',
            [[27.8, 'taux-successifs-additionnes']],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Transition : « Mettons les deux hypothèses côte à côte au tableur : exercice 4. »',
      ],
    },
    [
      [
        'b2-04-a2-raison',
        'Augmenter de 6 %, c’est multiplier par 1,06 : la suite est géométrique, de premier terme v₀ = 826 et de raison q = 1,06. 0,06 est le taux, pas la raison.',
      ],
      [
        'b2-04-a2-v3',
        'v₃ = 826 × 1,06³ ≈ 983,78 k€. Avec 3 × 6 % = 18 %, on trouverait 974,68 k€ ; avec un rang de trop, 1 042,81 k€.',
      ],
      [
        'b2-04-a2-terme-general',
        'vₙ = v₀ × qⁿ = 826 × 1,06ⁿ. Contrôle : v₁ = 826 × 1,06 = 875,56 k€.',
      ],
      [
        'b2-04-a2-ecart',
        'v₅ = 826 × 1,06⁵ ≈ 1 105,37 k€, et 1 105,37 − 1 046 = 59,37 k€. En ajoutant les taux (+ 30 %), l’écart tomberait à 27,80 k€.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A2-06-TABLEUR-GEOMETRIQUE',
      titre: 'Exercice 4 — Les deux hypothèses au tableur',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 8,
      concepts: ['tableur', 'suite-geometrique'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : écrire sur papier la formule de D3, puis ce qu’elle devient en D4 une fois recopiée.',
        'Erreurs à chercher : =D2*$G$2 (le taux seul) ; G2 sans $ ; le taux écrit en dur.',
        'Papier : les deux formules écrites sur la copie, puis les valeurs de 2026 et 2030 à la calculatrice.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: PLAN_DES_DEUX_HYPOTHESES,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DES_DEUX_HYPOTHESES.id,
            concept: 'suite-geometrique',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DES_DEUX_HYPOTHESES,
              attendus: ATTENDUS_DES_DEUX_HYPOTHESES,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire ; faire lire la colonne des écarts de haut en bas.',
        'Transition : jalon 2.',
      ],
    },
    [
      [
        'D3',
        `${FORMULE_DE_L_HYPOTHESE_B} : le terme du dessus, multiplié par le coefficient 1 + t, taux figé par les $.`,
      ],
      [
        'D4 à D7',
        'Recopiée, la formule garde $G$2. Avec =D2*$G$2, on n’obtient que la hausse de l’année, 49,56 k€ ; sans les $, la colonne reste bloquée à 875,56.',
      ],
      [
        'E3 à E7',
        `${FORMULE_DE_L_ECART}, recopiée : l’écart passe de 5,56 k€ en 2026 à 59,37 k€ en 2030. Il grossit chaque année.`,
      ],
    ],
  ),
  {
    screenId: 'B2-04-A2-07-JALON',
    titre: 'Jalon 2 : suites géométriques',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['suite-geometrique'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Si plus de 30 % « Perdu » : reprendre la trace écrite A2-02 sur la raison et le taux.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-04-a2-jalon',
        invite:
          'Je sais passer d’un taux à une raison, calculer un terme d’une suite géométrique et l’écrire au tableur.',
      },
    },
  },
];

const ACTE_3: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: 'B2-04-A3-01-GRAPHIQUE',
      titre: 'Les deux hypothèses sur un graphique',
      diffusion: 'catalogue',
      dureeMinutes: 2,
      concepts: ['suite-arithmetique', 'suite-geometrique'],
      notes: moteur.puces(
        '2 min : faire décrire les deux courbes avant de lire la légende.',
        'Question : « Laquelle est une droite ? Pourquoi ? » L’hypothèse A : on ajoute toujours le même montant.',
        'Signaler l’axe tronqué (B2-01) : l’écart paraît plus grand qu’il ne l’est.',
        'Transition : « Aucune n’atteint 1 200 k€ en 2030. Comment savoir quand ? »',
      ),
    },
    'chart',
    {
      title: 'Hypothèse A et hypothèse B, de 2025 à 2030',
      caption: 'Chiffre d’affaires prévu ; départ commun en 2025',
      kind: 'line',
      unit: 'k€',
      labels: termes(
        (rang) => String(ANNEE_DE_DEPART + rang),
        0,
        DERNIER_RANG_DU_PLAN,
      ),
      series: [
        {
          label: 'Hypothèse A : + 44 k€ par an',
          values: termes(hypotheseA, 0, DERNIER_RANG_DU_PLAN),
          tone: 'ink',
        },
        {
          label: 'Hypothèse B : + 6 % par an',
          values: termes(
            (rang) => arrondi(hypotheseB(rang), 2),
            0,
            DERNIER_RANG_DU_PLAN,
          ),
          tone: 'teal',
        },
      ],
      axisRanges: [[800, 1200]],
      formula:
        'A : suite arithmétique, points alignés · B : suite géométrique, courbe qui se redresse',
      reading:
        'Les deux courbes partent du même point, puis s’écartent de plus en plus. En 2030, aucune n’atteint encore le seuil de 1 200 k€ : il faut prolonger les deux suites.',
      source: `Hypothèses du plan d’Atelier Rivage. ${DONNEES_FICTIVES} L’axe vertical est tronqué : il commence à 800 k€.`,
      description:
        'Deux courbes de 2025 à 2030, partant de 826. L’hypothèse A est une droite qui monte jusqu’à 1 046. L’hypothèse B est une courbe au-dessus de la droite dès 2026, qui monte jusqu’à 1 105 environ.',
    },
  ),
  {
    screenId: 'B2-04-A3-02-VOTE-SEUIL',
    titre: 'Vote : s’arrêter et additionner',
    diffusion: 'seance',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['algorithme-de-seuil', 'somme-de-termes'],
    notes: moteur.notesDuVoteQuiOuvreLaNotion(3),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-04-a3-arret',
          'algorithme-de-seuil',
          false,
          'Un compteur part de 100. On lui ajoute 30 tant qu’il est strictement inférieur à 200. Sur quelle valeur s’arrête-t-il ?',
          'Sur 220 : la première valeur qui n’est plus inférieure à 200',
          [
            [
              'Sur 190 : la dernière valeur encore inférieure à 200',
              'seuil-mal-arrondi',
            ],
          ],
        ),
        moteur.vote(
          'b2-04-a3-nombre-de-termes',
          'somme-de-termes',
          false,
          'On additionne les chiffres d’affaires des années 2026 à 2030 incluses. Combien de nombres additionne-t-on ?',
          'Cinq nombres : un par année, de 2026 à 2030',
          [['Quatre nombres : 2030 − 2026 = 4', 'nombre-de-termes-decale']],
        ),
      ],
      corrige: {
        type: 'revelation',
        titre: 'S’arrêter au bon moment, compter les bons termes',
        lignes: [
          'Une boucle « tant que » s’arrête sur la première valeur qui rend la condition fausse : 100, 130, 160, 190, puis 220.',
          'Entre deux années incluses, on compte dernière − première + 1 termes : 2030 − 2026 + 1 = 5.',
          'La trace écrite donne l’algorithme de seuil et la somme de termes.',
        ],
      },
    },
  },
  moteur.ecranV2(
    {
      screenId: 'B2-04-A3-03-COURS-SEUIL',
      titre: 'Cours : seuil et boucle « Tant que »',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['algorithme-de-seuil', 'negation', 'tableur'],
      notes: moteur.puces(
        '3 min ; la trace écrite est imprimée dans le livret.',
        'Dérouler la tirelire au tableau, une ligne par passage : c’est le geste de l’exercice 5.',
        'Relier au rappel du B2-03 : la condition de la boucle est la négation de l’objectif.',
        'Question : « Que se passe-t-il si l’on écrit Tant que u ≥ 200 ? » La boucle ne démarre pas.',
      ),
    },
    'lesson',
    {
      title: 'Chercher un seuil : la boucle « Tant que »',
      subtitle: 'Trace écrite · notion 3 · page 1 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Le premier rang qui atteint le seuil',
          text: 'Chercher un seuil, c’est trouver le premier rang pour lequel un terme atteint ou dépasse une valeur donnée. On avance terme après terme tant que le seuil n’est pas atteint. Un algorithme l’écrit avec une boucle « Tant que » : la condition de la boucle est le contraire de l’objectif. Pour l’objectif « u ≥ 1 000 », on continue tant que u < 1 000 : c’est la négation d’une comparaison, vue au B2-03. Pour Hélène, c’est la question de la banque : en quelle année le chiffre d’affaires atteint-il le seuil ?',
          formula: 'Tant que (objectif non atteint) : passer au terme suivant',
        },
        {
          kind: 'example',
          title: 'Pour débuter : la tirelire',
          text: 'Une tirelire contient 150 € ; on y ajoute 20 € par mois. Dans combien de mois contiendra-t-elle au moins 200 € ?',
          steps: [
            'n ← 0 ; u ← 150',
            'Tant que u < 200 : n ← n + 1 ; u ← u + 20',
            'Passages : n = 1, u = 170 ; n = 2, u = 190 ; n = 3, u = 210. La condition 210 < 200 est fausse : la boucle s’arrête.',
            'Afficher n : l’algorithme affiche 3. La tirelire atteint 200 € au bout de trois mois.',
          ],
        },
        {
          kind: 'method',
          title: 'Dérouler l’algorithme, à la main ou au tableur',
          text: 'On remplit un tableau, une ligne par passage dans la boucle : rang, terme, condition vraie ou fausse. Pièges : inverser la condition (avec « Tant que u ≥ seuil », la boucle ne démarre pas et affiche 0) ; s’arrêter un terme trop tôt, sur la dernière valeur sous le seuil ; répondre par le rang quand on demande l’année.',
          steps: [
            'Initialiser : rang 0, premier terme.',
            'À chaque passage : augmenter le rang, calculer le terme, tester la condition.',
            'Arrêt : première ligne où la condition est fausse ; le rang affiché est celui de cette ligne.',
            'Au tableur : =SI(B5>=200;"Atteint";"") à côté de chaque terme ; le texte s’écrit entre guillemets (B2-03).',
            'Convertir le rang en année ou en mois pour conclure.',
          ],
        },
      ],
    },
  ),
  moteur.ecranV2(
    {
      screenId: 'B2-04-A3-04-COURS-SOMME',
      titre: 'Cours : cumul et somme de termes',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['somme-de-termes', 'tableur'],
      notes: moteur.puces(
        '3 min, enchaînées sur la page 1 : 6 min pour les deux pages.',
        'Question : « De 2026 à 2028 inclus, combien de loyers ? » Trois, pas deux.',
        'Insister : un terme est la valeur d’une année, une somme est un total sur plusieurs années.',
      ),
    },
    'lesson',
    {
      title: 'Cumul : additionner des termes consécutifs',
      subtitle: 'Trace écrite · notion 3 · page 2 sur 2',
      blocks: [
        {
          kind: 'definition',
          title: 'Un terme, ou une somme ?',
          text: 'Le cumul d’une grandeur sur plusieurs périodes est la somme des termes de la suite sur ces périodes : chiffre d’affaires cumulé d’un plan, total des loyers d’un bail. Un terme donne la valeur d’une seule période ; la somme donne le total. Du rang p au rang n inclus, on additionne n − p + 1 termes. On calcule la somme à la calculatrice ou, plus sûrement, au tableur. C’est ce que la banque demande à Hélène : le chiffre d’affaires cumulé du plan.',
          formula: 'Du rang p au rang n inclus : n − p + 1 termes',
        },
        {
          kind: 'example',
          title: 'Pour débuter : les loyers d’un bail',
          text: 'Loyer annuel : 10 800 € en 2025, puis 180 € de plus chaque année (suite arithmétique). Quel est le total des loyers de 2026 à 2028 ?',
          steps: [
            '2026 : 10 980 € ; 2027 : 11 160 € ; 2028 : 11 340 €.',
            'Trois termes, de 2026 à 2028 inclus : 2028 − 2026 + 1 = 3.',
            'Somme : 10 980 + 11 160 + 11 340 = 33 480 €.',
            'Au tableur, loyers de 2025 à 2028 en B2:B5 : =SOMME(B3:B5). La plage commence en B3, car 2025 n’est pas demandé.',
          ],
        },
        {
          kind: 'exam',
          title: 'Au CCF : seuil et cumul',
          text: 'Deux questions reviennent : « à partir de quelle année… ? » (seuil) et « quel total sur la période… ? » (cumul). Pièges : donner le dernier terme à la place de la somme ; compter un terme de trop ou de moins, selon que l’année de départ est demandée ou non.',
          steps: [
            'Seuil : dérouler la boucle, donner le rang, puis l’année.',
            'Cumul : lister les années demandées, compter les termes, puis additionner.',
            'Contrôle : avec des termes positifs, la somme dépasse le plus grand terme.',
          ],
        },
      ],
    },
  ),
  moteur.corrigeEtapeParEtape(
    {
      screenId: 'B2-04-A3-05-EXEMPLE-SEUIL',
      titre: 'Exemple guidé : passer sous un seuil',
      diffusion: 'seance',
      brique: 'fp-worked',
      dureeMinutes: 4,
      concepts: ['algorithme-de-seuil', 'somme-de-termes'],
      notes: moteur.puces(
        'Chacun répond sous chaque étape, puis la correction se dévoile étape par étape sur ce même écran.',
        'Papier : réponses sous chaque étape du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        exemple: {
          id: 'b2-04-a3-exemple-seuil',
          enonce:
            'Retour à la consommation d’électricité : 48 000 kWh en 2025, puis − 5 % par an, soit cₙ = 48 000 × 0,95ⁿ. Objectif du plan de sobriété : passer sous 40 000 kWh. En quelle année, et combien aura-t-on consommé de 2026 à 2028 ?',
          etapes: [
            {
              id: 'condition',
              intitule: 'La condition de la boucle',
              raisonnement:
                'Objectif : c < 40 000. On continue tant que l’objectif n’est pas atteint : « Tant que c ≥ 40 000 ». Le contraire de < est ≥.',
              invite: 'Quelle condition écrire après « Tant que » ?',
            },
            {
              id: 'derouler',
              intitule: 'Dérouler la boucle',
              raisonnement:
                'n = 1 : 45 600 ; n = 2 : 43 320 ; n = 3 : 41 154 ; n = 4 : 39 096,30. À n = 4, la condition 39 096,30 ≥ 40 000 est fausse : la boucle s’arrête.',
              invite: 'Calculez les termes jusqu’à l’arrêt de la boucle.',
            },
            {
              id: 'conclure',
              intitule: 'Conclure',
              raisonnement:
                'L’algorithme affiche 4 : l’objectif est atteint au rang 4, soit en 2029. S’arrêter à n = 3, avec 41 154 kWh, serait un terme trop tôt.',
              invite:
                'Qu’affiche l’algorithme ? En quelle année l’objectif est-il atteint ?',
            },
            {
              id: 'cumul',
              intitule: 'Le cumul de 2026 à 2028',
              raisonnement:
                'Trois termes : 45 600 + 43 320 + 41 154 = 130 074 kWh. La consommation de 2025 n’est pas demandée : l’ajouter compterait un terme de trop.',
              invite:
                'Combien d’électricité l’atelier consomme-t-il de 2026 à 2028 inclus ?',
            },
            {
              id: 'tableur',
              intitule: 'Au tableur',
              raisonnement:
                '=SOMME(C3:C5) : la plage suit les années demandées, de 2026 (ligne 3) à 2028 (ligne 5).',
              invite:
                'Consommations de 2025 à 2029 en C2:C6 : quelle formule donne le cumul de 2026 à 2028 ?',
            },
          ],
        },
        etayage: 0,
      },
    },
    {
      minutes: 2,
      notes: [
        'S’arrêter sur la condition inversée (étape 1) et sur le nombre de termes (étape 4).',
        'Transition : « À vous : déroulez l’algorithme de l’hypothèse A, exercice 5. »',
      ],
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A3-06-TABLEAU-ALGORITHME',
      titre: 'Exercice 5 — Dérouler l’algorithme',
      diffusion: 'seance',
      brique: 'fp-table-build',
      dureeMinutes: 5,
      concepts: ['algorithme-de-seuil'],
      notes: moteur.puces(
        'Temps : réflexion 1 min · travail 4 min',
        'Réflexion : lire l’algorithme à voix basse et dire ce qu’il cherche.',
        'Pièges : écrire le u d’avant le calcul ; répondre V au dernier passage.',
        'Papier : tableau du livret, V ou F à entourer dans la dernière colonne.',
      ),
      proprietes: {
        modalite: 'solo',
        plan: {
          id: 'b2-04-a3-tableau-algorithme',
          intitule: 'Dérouler l’algorithme de seuil',
          consignes: [
            'Algorithme : n ← 0 ; u ← 826. Tant que u < 1 000 : n ← n + 1 ; u ← u + 44. Fin Tant que. Afficher n.',
            'Chaque ligne est un passage dans la boucle : écrivez la valeur de u après le calcul.',
            'Dernière colonne : après ce passage, la condition « u < 1 000 » est-elle vraie (V) ou fausse (F) ?',
          ],
          echeances: PASSAGES_DE_L_EXERCICE_5,
          intituleDesLignes: 'Passage',
          libellesLignes: [
            '1er passage',
            '2e passage',
            '3e passage',
            '4e passage',
          ],
          parametres: {},
          colonnes: [
            {
              cle: 'n',
              intitule: 'n',
              role: 'donnee',
              valeurs: termes(rangIdentique, 1, PASSAGES_DE_L_EXERCICE_5),
              decimales: 0,
              totalise: false,
            },
            {
              cle: 'u',
              intitule: 'u (k€)',
              role: 'saisie',
              decimales: 0,
              totalise: false,
            },
            {
              cle: 'condition',
              intitule: 'u < 1 000 ?',
              role: 'saisie',
              format: 'booleen',
              decimales: 0,
              totalise: false,
            },
          ],
          synthese: [],
        },
        questions: [
          moteur.questionDeTableau(
            'b2-04-a3-tableau-algorithme',
            'algorithme-de-seuil',
            [PREMIER_PASSAGE, ...AUTRES_PASSAGES],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter le tableau juste, ligne par ligne ; faire dire ce qu’affiche l’algorithme.',
        'Transition : « Même question pour le seuil de la banque : exercice 6. »',
      ],
    },
    [
      [
        'b2-04-a3-tableau-algorithme',
        'u vaut 870, 914, 958, puis 1 002. La condition u < 1 000 est vraie aux trois premiers passages, fausse au quatrième : la boucle s’arrête et l’algorithme affiche 4. L’hypothèse A atteint 1 000 k€ au rang 4, en 2029. Écrire le u d’avant le calcul décale toute la colonne d’un rang.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A3-07-ATELIER-SEUIL',
      titre: 'Exercice 6 — Seuil et cumul des deux hypothèses',
      diffusion: 'seance',
      brique: 'questionnaire',
      dureeMinutes: 9,
      concepts: ['algorithme-de-seuil', 'somme-de-termes'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 7 min',
        'Réflexion : écrire la condition de la boucle, puis la liste des années du cumul, sans rien calculer.',
        'Pièges : s’arrêter un terme trop tôt ; l’année à la place du nombre d’années ; le terme de 2030 pris pour le cumul ; 2025 compté en trop.',
        'Papier : exercice 6 du livret.',
      ),
      proprietes: {
        renvoi: 'B2-04-A3-01-GRAPHIQUE',
        intitule: 'Exercice 6 — Seuil et cumul des deux hypothèses',
        consigne:
          'A : 870, 914, 958, 1 002, 1 046 k€ de 2026 à 2030. B : v₀ = 826, puis + 6 % par an.',
        regime: 'focus',
        ordre: 'fixe',
        questions: [
          moteur.numerique(
            'b2-04-a3-seuil-b',
            'algorithme-de-seuil',
            'Hypothèse B : après combien d’années atteint-on 1 200 k€ ?',
            'années',
            7,
            moteur.TOLERANCE_NULLE,
            '7 années',
            [
              [6, 'seuil-mal-arrondi'],
              [2032, 'rang-confondu-avec-annee'],
            ],
          ),
          moteur.vote(
            'b2-04-a3-condition',
            'algorithme-de-seuil',
            true,
            'Quelle condition écrire dans la boucle qui cherche ce rang ?',
            'Tant que v < 1 200',
            [['Tant que v ≥ 1 200', 'condition-tant-que-inversee']],
          ),
          moteur.numerique(
            'b2-04-a3-cumul-a',
            'somme-de-termes',
            'Hypothèse A : quel cumul de 2026 à 2030 inclus ?',
            'k€',
            4790,
            moteur.TOLERANCE_NULLE,
            '4 790 k€',
            [
              [hypotheseA(DERNIER_RANG_DU_PLAN), 'terme-pris-pour-somme'],
              [5616, 'nombre-de-termes-decale'],
            ],
          ),
          moteur.vote(
            'b2-04-a3-somme',
            'somme-de-termes',
            true,
            'Années 2025 à 2030 en C2:C7 : quelle formule cumule 2026 à 2030 ?',
            '=SOMME(C3:C7)',
            [
              ['=SOMME(C2:C7)', 'nombre-de-termes-decale'],
              ['=C7', 'terme-pris-pour-somme'],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Corriger question par question, en commençant par la moins réussie.',
        'Conclure pour Hélène : 2032 avec l’hypothèse B, 2034 avec l’hypothèse A ; deux ans d’écart sur le second atelier.',
        'Transition : « Une IA a rédigé le même plan. »',
      ],
    },
    [
      [
        'b2-04-a3-seuil-b',
        '826 × 1,06⁶ ≈ 1 171,70 k€, encore sous le seuil ; 826 × 1,06⁷ ≈ 1 242,00 k€ : le seuil est atteint au rang 7, soit sept années après 2025, en 2032. Répondre 6, c’est s’arrêter un terme trop tôt.',
      ],
      [
        'b2-04-a3-condition',
        'L’objectif est v ≥ 1 200 ; la boucle continue tant qu’il n’est pas atteint, donc tant que v < 1 200. Avec ≥, la boucle ne démarrerait pas.',
      ],
      [
        'b2-04-a3-cumul-a',
        'Cinq termes, de 2026 à 2030 : 870 + 914 + 958 + 1 002 + 1 046 = 4 790 k€. 1 046 k€ n’est que le terme de 2030 ; 5 616 k€ compte 2025 en trop.',
      ],
      [
        'b2-04-a3-somme',
        'La ligne 3 porte 2026 et la ligne 7 porte 2030 : =SOMME(C3:C7). La plage suit les années demandées.',
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A3-08-DEFI-IA',
      titre: 'Exercice 7 — Corriger le plan d’une IA',
      diffusion: 'seance',
      brique: 'fp-challenge',
      dureeMinutes: 8,
      concepts: ['suite-geometrique', 'algorithme-de-seuil', 'somme-de-termes'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 6 min',
        'Réflexion : relire les traces écrites des notions 2 et 3.',
        'Repérer qui trouve la puissance, la condition et le cumul ; faire trouver la piste fausse avant de révéler.',
        'Papier : exercice 7 du livret.',
      ),
      proprietes: {
        modalite: 'solo',
        probleme: {
          id: 'b2-04-a3-defi-ia',
          enonce:
            'Hélène a demandé à un assistant IA de rédiger le plan avec l’hypothèse B. Réponse : « 1. Avec + 6 % par an, le chiffre d’affaires de 2030 sera de 826 × (1 + 5 × 0,06) = 1 073,8 k€. 2. Pour trouver l’année du seuil, j’utilise la boucle : Tant que v ≥ 1 200, passer à l’année suivante. Elle affiche 0 : le seuil est donc atteint dès 2025. 3. Le chiffre d’affaires cumulé de 2026 à 2030 est celui de 2030, soit 1 073,8 k€. »',
          invite:
            'Trouvez les erreurs de l’IA, corrigez chacune et dites comment la contrôler.',
        },
        corrige: {
          type: 'defi',
          strategies: [
            moteur.strategie(
              'puissance',
              'Cinq hausses de 6 % multiplient cinq fois par 1,06 : 826 × 1,06⁵, et non 826 × (1 + 5 × 0,06).',
            ),
            moteur.strategie(
              'condition',
              'La boucle continue tant que le seuil n’est pas atteint : « Tant que v < 1 200 », et non « ≥ ».',
            ),
            moteur.strategie(
              'cumul',
              'Un cumul est une somme de cinq termes, de 2026 à 2030, pas le seul terme de 2030.',
            ),
            moteur.strategie(
              'controle',
              'Contrôler sur une valeur connue : 826 k€ en 2025 est sous 1 200 k€, le seuil ne peut pas être atteint en 2025.',
            ),
            moteur.strategie(
              'garder',
              'Garder le plan : l’IA a appliqué des formules, ses calculs sont forcément justes.',
              true,
            ),
          ],
        },
      },
    },
    {
      minutes: 2,
      notes: [
        'Faire lire deux corrections écrites par la classe, puis dévoiler les pistes une à une.',
        'Transition : jalon 3, puis pause de 15 minutes.',
      ],
    },
    [
      [
        'puissance',
        '826 × 1,06⁵ ≈ 1 105,37 k€ : l’IA a additionné les taux (+ 30 %) au lieu de multiplier les coefficients.',
      ],
      [
        'condition',
        'Avec « Tant que v ≥ 1 200 », la condition est fausse dès le départ : la boucle ne tourne pas et affiche 0. La bonne boucle affiche 7.',
      ],
      [
        'cumul',
        'Le cumul additionne les cinq termes de 2026 à 2030 : il dépasse forcément le chiffre d’affaires de la seule année 2030.',
      ],
      [
        'controle',
        'Un résultat se contrôle sur une valeur connue et sur son ordre de grandeur : un seuil atteint « dès 2025 » contredit les données.',
      ],
      [
        'garder',
        'Piste fausse : une réponse d’IA se contrôle comme une copie, calcul par calcul.',
      ],
    ],
  ),
  {
    screenId: 'B2-04-A3-09-JALON',
    titre: 'Jalon 3 : seuils et cumuls',
    diffusion: 'seance',
    brique: 'fp-pulse',
    dureeMinutes: 1,
    concepts: ['algorithme-de-seuil', 'somme-de-termes'],
    notes: moteur.puces(
      '30 s de vote anonyme.',
      'Pause de 15 minutes, hors durée programmée.',
    ),
    proprietes: {
      sondage: {
        id: 'b2-04-a3-jalon',
        invite:
          'Je sais dérouler une boucle « Tant que » pour trouver un seuil, et calculer un cumul sans me tromper de termes.',
      },
    },
  },
];

const ACTE_4: moteur.Acte = [
  moteur.ecranV2(
    {
      screenId: RENVOI_A_LA_BOUTIQUE,
      titre: 'Mini-situation CCF : la boutique en ligne',
      diffusion: 'catalogue',
      dureeMinutes: 3,
      concepts: ['suite-geometrique', 'algorithme-de-seuil'],
      notes: moteur.puces(
        'Mini-situation de 33 min (tableur 16, coffre 14, lecture 3), calculatrice, poste individuel ; barème sur 10 : tableur 3, énigmes 2, 2, 1,5 et 1,5.',
        'Papier : la situation est en tête de la partie 4 du livret.',
      ),
    },
    'table',
    {
      title: 'Mini-situation CCF : la boutique en ligne',
      subtitle:
        'Le dossier de la boutique en ligne d’Atelier Rivage. Barème sur 10 : une question tableur, puis quatre énigmes.',
      columns: [...moteur.COLONNES_DU_DOSSIER],
      rows: [
        {
          rubrique: 'Contexte',
          contenu:
            'Atelier Rivage a ouvert une boutique en ligne. Hélène Garnier veut un plan de 2025 à 2032 pour décider d’une embauche à la préparation des commandes.',
        },
        {
          rubrique: 'Chiffre d’affaires',
          contenu:
            'Boutique en ligne : 120 k€ en 2025. Hypothèse retenue : + 16 % par an. On note cₙ le chiffre d’affaires de l’année 2025 + n, en k€.',
        },
        {
          rubrique: 'Seuil',
          contenu:
            'L’embauche est décidée l’année où le chiffre d’affaires de la boutique atteint 280 k€.',
        },
        {
          rubrique: 'Coût d’acquisition',
          contenu:
            'Coût publicitaire pour gagner un client : 40 € en 2025. Objectif : − 10 % par an.',
        },
        {
          rubrique: 'Algorithme',
          contenu:
            'n ← 0 ; c ← 120. Tant que c < 280 : n ← n + 1 ; c ← c × 1,16. Fin Tant que. Afficher n.',
        },
        {
          rubrique: 'Barème',
          contenu:
            'Sur 10 points : question tableur, 3 points ; quatre énigmes, 2, 2, 1,5 et 1,5 points.',
        },
      ],
      note: DONNEES_FICTIVES,
    },
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A4-02-TABLEUR-BOUTIQUE',
      titre: 'Question tableur (3 points sur 10) : le plan de la boutique',
      diffusion: 'seance',
      brique: 'fp-sheet',
      dureeMinutes: 14,
      concepts: ['tableur', 'suite-geometrique', 'somme-de-termes'],
      notes: moteur.puces(
        'Temps : réflexion 3 min · travail 11 min',
        'Réflexion : chacun écrit sur papier la nature de la suite, sa raison, puis les trois formules à saisir.',
        'Erreurs à chercher : le taux seul à la place de 1 + taux ; F1 ou H1 sans $ ; « Oui » sans guillemets ; la plage du cumul décalée d’une ligne.',
        'Papier : formules écrites sur la copie, valeurs calculées à la calculatrice ; en CCF, la question se fait devant l’examinateur.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_A_LA_BOUTIQUE,
        plan: PLAN_DE_LA_BOUTIQUE,
        questions: [
          {
            type: 'feuille',
            id: PLAN_DE_LA_BOUTIQUE.id,
            concept: 'tableur',
            noteCompte: true,
            corrige: {
              type: 'feuille',
              plan: PLAN_DE_LA_BOUTIQUE,
              attendus: ATTENDUS_DE_LA_BOUTIQUE,
              seuilReussite: 0.8,
            },
          },
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Projeter la feuille d’un poste volontaire et relire chaque formule.',
        'Transition : « Avec cette feuille, ouvrez le coffre de la mini-situation. »',
      ],
    },
    [
      [
        'C3 à C9',
        `${FORMULE_DE_LA_BOUTIQUE}, recopiée : 139,20 k€ en 2026, jusqu’à environ 339,15 k€ en 2032. Sans les $, la recopie lit des cellules qui ne contiennent pas le taux.`,
      ],
      [
        'D2 à D9',
        `${FORMULE_DU_SEUIL} : >= pour « atteint », textes entre guillemets, seuil figé. « Oui » apparaît pour la première fois sur la ligne de 2031.`,
      ],
      [
        'F3',
        `${FORMULE_DU_CUMUL} : six termes, de 2025 à 2030, environ 1 077,30 k€. =SOMME(C3:C7) oublie 2025 ; =C7 ne donne que l’année 2030.`,
      ],
    ],
  ),
  moteur.corrigeSurPlace(
    {
      screenId: 'B2-04-A4-03-COFFRE-BOUTIQUE',
      titre: 'Mini-situation : conclure le plan de la boutique',
      diffusion: 'seance',
      brique: 'fp-escape',
      dureeMinutes: 12,
      concepts: ['suite-geometrique', 'algorithme-de-seuil', 'somme-de-termes'],
      notes: moteur.puces(
        'Temps : réflexion 2 min · travail 10 min',
        'Réflexion : relire le dossier et noter, pour chaque question, s’il s’agit d’un terme, d’un rang ou d’une somme.',
        'Indices disponibles après 60 s. À 8 min, projeter l’énigme la moins résolue.',
        'Papier : quatre questions rédigées du livret, sans code de coffre.',
      ),
      proprietes: {
        modalite: 'solo',
        renvoi: RENVOI_A_LA_BOUTIQUE,
        parcours: {
          id: PARCOURS_DU_COFFRE,
          intitule:
            'Conclure le plan de la boutique : quatre réponses pour ouvrir le coffre',
          delaiIndiceMs: 60000,
          budgetEnigmeMs: 150000,
          tentativesMax: 10,
          enigmes: [
            {
              id: 'b2-04-a4-e1-cout',
              intitule: 'Le coût d’acquisition (2 points)',
              enonce:
                'Le coût d’acquisition d’un client, 40 € en 2025, baisse de 10 % par an. Combien vaut-il en 2029, en euros, arrondi au centime ?',
              indice:
                'Une baisse répétée au même taux est une suite géométrique : cherchez sa raison, puis le rang de l’année demandée.',
            },
            {
              id: 'b2-04-a4-e2-affichage',
              intitule: 'L’affichage de l’algorithme (2 points)',
              enonce:
                'Quelle valeur de n l’algorithme du dossier affiche-t-il ?',
              indice:
                'Déroulez la boucle passage par passage, ou lisez la colonne « Seuil atteint ? » de votre feuille : on attend le rang, pas l’année.',
            },
            {
              id: 'b2-04-a4-e3-cumul',
              intitule: 'Le cumul du plan (1,5 point)',
              enonce:
                'Quel chiffre d’affaires cumulé la boutique réalise-t-elle de 2026 à 2030 inclus, arrondi au k€ ?',
              indice:
                'Listez les années demandées : l’année de départ n’en fait pas partie.',
            },
            {
              id: 'b2-04-a4-e4-hausse',
              intitule: 'La hausse globale (1,5 point)',
              enonce:
                'De combien de pour cent le chiffre d’affaires de la boutique augmente-t-il entre 2025 et 2030, arrondi à l’unité ?',
              indice:
                'Les coefficients se multiplient ; le taux global se lit sur le coefficient global.',
            },
          ],
        },
        questions: [
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            0,
            'b2-04-a4-e1-cout',
            'suite-geometrique',
            26.24,
            0.01,
            '26,24 euros',
            'R7',
            [
              [24, 'taux-successifs-additionnes'],
              [23.62, 'rang-decale'],
              [58.56, 'sens-de-variation'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            1,
            'b2-04-a4-e2-affichage',
            'algorithme-de-seuil',
            6,
            0,
            '6 passages',
            'S2',
            [
              [5, 'seuil-mal-arrondi'],
              [0, 'condition-tant-que-inversee'],
              [2031, 'rang-confondu-avec-annee'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            2,
            'b2-04-a4-e3-cumul',
            'somme-de-termes',
            957,
            0.5,
            '957 k€',
            'G9',
            [
              [1077, 'nombre-de-termes-decale'],
              [252, 'terme-pris-pour-somme'],
            ],
          ),
          moteur.enigme(
            PARCOURS_DU_COFFRE,
            3,
            'b2-04-a4-e4-hausse',
            'suite-geometrique',
            110,
            0.5,
            '110 %',
            'Q5',
            [
              [80, 'taux-successifs-additionnes'],
              [210, TAUX_POUR_RAISON],
            ],
          ),
        ],
      },
    },
    {
      minutes: 2,
      notes: [
        'Dévoiler énigme par énigme, en s’attardant sur la moins résolue (pupitre).',
        'Finir sur la décision d’Hélène : l’embauche se prépare pour 2031.',
      ],
    },
    [
      [
        'b2-04-a4-e1-cout',
        'Baisse de 10 % : q = 0,90 ; 2029 est le rang 4 : 40 × 0,90⁴ ≈ 26,24 €. Avec 4 × 10 % = 40 % : 24 € ; avec un rang de trop : 23,62 € ; avec 1,10 au lieu de 0,90 : 58,56 €.',
      ],
      [
        'b2-04-a4-e2-affichage',
        'c vaut 139,20 ; 161,47 ; 187,31 ; 217,28 ; 252,04 puis 292,37 : la condition c < 280 devient fausse au sixième passage, l’algorithme affiche 6. C’est le rang ; l’année est 2031.',
      ],
      [
        'b2-04-a4-e3-cumul',
        'Cinq termes, de 2026 à 2030 : 139,20 + 161,47 + 187,31 + 217,28 + 252,04 ≈ 957 k€. Avec 2025 en trop : 1 077 k€ ; le seul terme de 2030 : 252 k€.',
      ],
      [
        'b2-04-a4-e4-hausse',
        'Coefficient global : 1,16⁵ ≈ 2,10, soit une hausse d’environ 110 %. 5 × 16 % = 80 % additionne les taux ; 210 % confond le coefficient et le taux.',
      ],
    ],
  ),
  moteur.ecranDeRappel(
    { screenId: 'B2-04-A4-04-RAPPEL', concepts: [...CONCEPTS_DES_SUITES] },
    'Tous reçoivent les deux questions obligatoires (nature d’une suite, condition du « Tant que »), en plus de leurs points faibles.',
    'b2-04-a4-rappel',
    {
      questions: [
        moteur.rappel(
          'b2-04-r-arithmetique',
          'suite-arithmetique',
          'Un abonnement coûte 30 € et augmente de 2 € par an. Quelle suite modélise son prix ?',
          'Une suite arithmétique de raison 2 €',
          [['Une suite géométrique de raison 2', 'nature-de-suite-confondue']],
        ),
        moteur.rappel(
          'b2-04-r-nature',
          'suite-geometrique',
          'Un effectif vaut 200, puis 220, puis 242. Quelle est la nature de la suite ?',
          'Géométrique : chaque terme est le précédent multiplié par 1,1',
          [
            [
              'Arithmétique : on ajoute 20 à chaque fois',
              'nature-de-suite-confondue',
            ],
          ],
        ),
        moteur.rappel(
          'b2-04-r-baisse',
          'suite-geometrique',
          'Un prix baisse de 20 % par an. Quelle est la raison de la suite ?',
          'q = 0,80, soit 1 − 0,20',
          [
            ['q = 0,20, le taux de la baisse', TAUX_POUR_RAISON],
            ['q = 1,20, soit 1 + 0,20', 'sens-de-variation'],
          ],
        ),
        moteur.rappel(
          'b2-04-r-geometrique',
          'suite-geometrique',
          'Un capital de 1 000 € est placé à 2 % par an. Que vaut-il après deux ans ?',
          '1 040,40 €, soit 1 000 × 1,02 × 1,02',
          [['1 040 €, soit 1 000 + 2 × 20', 'taux-successifs-additionnes']],
        ),
        moteur.rappel(
          'b2-04-r-terme-general',
          'suite-arithmetique',
          'Suite arithmétique : u₀ = 500, raison 12. Comment obtenir u₈ ?',
          'On ajoute huit fois 12 à 500',
          [['On ajoute neuf fois 12 à 500', 'rang-decale']],
        ),
        moteur.rappel(
          'b2-04-r-rang',
          'algorithme-de-seuil',
          'Le rang 0 est l’année 2025. À quelle année correspond le rang 4 ?',
          'À 2029 : quatre années après 2025',
          [['À 2028 : la quatrième année', 'rang-decale']],
        ),
        moteur.rappel(
          'b2-04-r-tant-que',
          'algorithme-de-seuil',
          'On cherche quand un stock s passe sous 50 unités. Quelle condition écrire dans la boucle ?',
          'Tant que s ≥ 50',
          [['Tant que s < 50', 'condition-tant-que-inversee']],
        ),
        moteur.rappel(
          'b2-04-r-affichage',
          'algorithme-de-seuil',
          'u ← 10 ; n ← 0. Tant que u < 25 : n ← n + 1 ; u ← u + 10. Qu’affiche « Afficher n » ?',
          'Il affiche 2 : u vaut alors 30',
          [['Il affiche 1 : u vaut alors 20', 'seuil-mal-arrondi']],
        ),
        moteur.rappel(
          'b2-04-r-nombre-de-termes',
          'somme-de-termes',
          'Combien de termes additionne-t-on du rang 3 au rang 9 inclus ?',
          'Sept termes : 9 − 3 + 1',
          [['Six termes : 9 − 3', 'nombre-de-termes-decale']],
        ),
        moteur.rappel(
          'b2-04-r-somme',
          'somme-de-termes',
          'Des ventes mensuelles valent 10, 12 et 14 k€. Quel est leur cumul ?',
          '36 k€ : la somme des trois mois',
          [['14 k€ : la valeur du dernier mois', 'terme-pris-pour-somme']],
        ),
        moteur.rappel(
          'b2-04-r-dollar',
          'tableur',
          'Terme précédent en C2, raison en G1. Quelle formule recopier vers le bas ?',
          '=C2+$G$1',
          [['=C2+G1', NON_FIGEE]],
        ),
        moteur.rappel(
          'b2-04-r-sens',
          'suite-geometrique',
          'Une suite géométrique a pour raison 0,97 et un premier terme positif. Comment varie-t-elle ?',
          'Elle décroît : chaque terme perd 3 %',
          [['Elle croît : sa raison est positive', 'sens-de-variation']],
        ),
      ],
      obligatoires: ['b2-04-r-nature', 'b2-04-r-tant-que'],
    },
  ),
  moteur.ficheMemo(
    {
      screenId: 'B2-04-A4-05-FICHE-MEMO',
      titre: 'Fiche mémo : modéliser une évolution régulière',
      concepts: [...CONCEPTS_DES_SUITES],
    },
    [
      {
        title: 'Suite arithmétique',
        description: 'On ajoute toujours le même nombre ?',
        back: 'uₙ₊₁ = uₙ + r ; uₙ = u₀ + n × r. Différences égales. Points alignés, de pente r.',
      },
      {
        title: 'Suite géométrique',
        description: 'On multiplie toujours par le même nombre ?',
        back: 'uₙ₊₁ = uₙ × q ; uₙ = u₀ × qⁿ. Quotients égaux.',
      },
      {
        title: 'Taux et raison',
        description: 'Un pourcentage par période ?',
        back: 'Hausse de t % : q = 1 + t ÷ 100. Baisse de t % : q = 1 − t ÷ 100. La raison est le coefficient, jamais le taux.',
      },
      {
        title: 'Rang et année',
        description: 'Quel terme ?',
        back: 'Écrire ce que vaut le rang 0. Année = année de départ + rang. Ne pas compter un rang de trop.',
      },
      {
        title: 'Sens de variation',
        description: 'Ça monte ou ça descend ?',
        back: 'Arithmétique : le signe de r. Géométrique à termes positifs : q > 1 croît, 0 < q < 1 décroît.',
      },
      {
        title: 'Seuil',
        description: 'À partir de quand ?',
        back: 'Boucle « Tant que » : la condition est le contraire de l’objectif. Réponse : le premier rang où la condition devient fausse.',
      },
      {
        title: 'Cumul',
        description: 'Quel total ?',
        back: 'Somme des termes demandés : du rang p au rang n, n − p + 1 termes. Un terme n’est pas une somme.',
      },
      {
        title: 'Tableur',
        description: 'Quelle formule ?',
        back: 'Départ en haut, formule recopiée, raison ou taux figé par des $. SOMME(plage) pour le cumul, SI pour le seuil.',
      },
      {
        title: 'Deux modèles',
        description: 'Montant constant ou taux constant ?',
        back: 'Montant constant : arithmétique. Taux constant : géométrique, qui finit par dépasser.',
      },
      moteur.REFERENTIEL_DU_BTS_CG,
    ],
  ),
  {
    screenId: 'B2-04-A4-06-BILLET-DE-SORTIE',
    titre: 'Billet de sortie : la formule à recopier',
    diffusion: 'seance',
    brique: 'fp-exit',
    dureeMinutes: 4,
    concepts: ['suite-geometrique', 'tableur'],
    notes: moteur.puces(
      '4 min ; clore la séance quand le compteur de billets est complet.',
      'Pièges : taux non figé, addition au lieu de multiplication, taux seul à la place de 1 + taux.',
    ),
    proprietes: {
      modalite: 'solo',
      questions: [
        moteur.vote(
          'b2-04-a4-billet',
          'suite-geometrique',
          true,
          'Hélène prolonge le plan dans un nouveau classeur : chiffre d’affaires de l’année précédente en D2, taux annuel en H1. Quelle formule écrire en D3 pour la recopier vers le bas ?',
          '=D2*(1+$H$1)',
          [
            ['=D2*(1+H1)', NON_FIGEE],
            ['=D2+$H$1', 'nature-de-suite-confondue'],
            ['=D2*$H$1', TAUX_POUR_RAISON],
          ],
        ),
      ],
      invite:
        'En une phrase : pourquoi l’hypothèse B finit-elle par dépasser l’hypothèse A ?',
    },
  },
];

const REMEDIATIONS: ContenuDeCours['remediations'] = {
  'rang-decale': 'B2-04-A1-07-COURS-ARITHMETIQUE',
  'pente-ordonnee-inversees': 'B2-04-A1-08-COURS-RAISON-TABLEUR',
  [NON_FIGEE]: 'B2-04-A1-08-COURS-RAISON-TABLEUR',
  [TAUX_POUR_RAISON]: 'B2-04-A2-02-COURS-GEOMETRIQUE',
  'nature-de-suite-confondue': 'B2-04-A2-02-COURS-GEOMETRIQUE',
  'taux-successifs-additionnes': 'B2-04-A2-02-COURS-GEOMETRIQUE',
  'sens-de-variation': 'B2-04-A2-03-COURS-VARIATION',
  'negation-comparaison': 'B2-04-A3-03-COURS-SEUIL',
  'seuil-mal-arrondi': 'B2-04-A3-03-COURS-SEUIL',
  'condition-tant-que-inversee': 'B2-04-A3-03-COURS-SEUIL',
  'rang-confondu-avec-annee': 'B2-04-A3-03-COURS-SEUIL',
  'critere-sans-guillemets': 'B2-04-A3-03-COURS-SEUIL',
  'nombre-de-termes-decale': 'B2-04-A3-04-COURS-SOMME',
  'terme-pris-pour-somme': 'B2-04-A3-04-COURS-SOMME',
};

export const COURS_B2_04 = moteur.coursB2(
  [ACTE_1, ACTE_2, ACTE_3, ACTE_4],
  REMEDIATIONS,
  [],
  {
    slug: 'b2-04-suites',
    titre: 'Suites : modéliser une évolution régulière',
    gabarit: 'v3',
    dureeMinutes: 180,
    concepts: [...CONCEPTS_DU_COURS],
  },
);
