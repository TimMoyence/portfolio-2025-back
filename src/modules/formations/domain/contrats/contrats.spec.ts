import type {
  CorrigeClassement,
  CorrigeDefi,
  CorrigeEnigme,
  CorrigeFeuille,
  CorrigeProduction,
  CorrigeRevelation,
  CorrigeTableau,
  FormeFormule,
  PiegeNumerique,
} from '../cours/Corrige';
import type { Bareme, BaremeQuestionV2, BaremeV1, BaremeV2 } from './bareme';
import type {
  CardsortPlanStocke,
  Cours,
  Diffusion,
  Ecran,
  EscapeParcoursStocke,
  MediaCatalogue,
  NumeriqueStockee,
  OptionStockee,
  OrdreQuestions,
  ProblemeStocke,
  ProprietesExposition,
  Question,
  QuestionProduction,
  SheetPlanStocke,
  TableBuildPlanStocke,
  TypeQuestion,
  VoteStockee,
} from './cours';
import type {
  CorrigeEcranPresentateur,
  DerouleCours,
  EcranDeroule,
} from './deroule';
import type {
  CardsortPlanPublic,
  Concept4Definition,
  DonneesParBrique,
  EscapeParcoursPublic,
  ExitBilletPublic,
  MetadonneesBrique,
  NumeriquePublic,
  OptionPublique,
  PlotDefinition,
  PulseSondage,
  SheetPlanPublic,
  SpacedQuestionPublique,
  StoryRecit,
  TableBuildPlanPublic,
  TableColonneServie,
  VotePublic,
  WorkedExemple,
} from './donnees-publiques';
import type { RegleDeNotation } from './notation';
import type {
  ControlSessionChanges,
  EtatParticipant,
  EtatPulse,
  LiveSessionState,
  PilotageEcran,
  VotePhase,
} from './pilotage';
import type {
  AnswerRecord,
  ComptesJalon,
  DetailProduction,
  ProgressionEnigme,
  RapportQuestion,
  ResultatQuestion,
  ResultatsDeSeance,
  ResultatsEnDirect,
  ResultatsSeance,
  ResumeBareme,
  ValeurProduction,
  ValeurReponse,
} from './resultats';
import type {
  CoursPublic,
  CoursPublicCatalogue,
  EcranPublic,
  TirageDuCours,
} from './tirage';
import { ATTENDU_PRIX_REVISE } from '../../../../../test/factories/corriges.factory';
import { PLAN_TABLEAU } from '../../../../../test/factories/ecrans-stockes.factory';
import { REGLE_DE_NOTATION } from '../RegleDeNotation';

const METADONNEES = {
  concepts: ['evolutions-successives'],
  misconceptionsCiblees: [],
  dureeMinutes: 11,
  modalite: 'solo',
  regime: 'focus',
} satisfies MetadonneesBrique;

const OPTIONS_BAISSE = [
  { id: 'plus-bas-que-le-depart-1a2b3c4d', libelle: 'Plus bas que le départ' },
  { id: 'egal-au-depart-5e6f7a8b', libelle: 'Égal au départ' },
] satisfies OptionPublique[];

const VOTE_PUBLIC = {
  id: 'b2-01-a3-vote-hausse-baisse',
  enonce: 'Le prix monte de 20 %, puis baisse de 20 %. Où arrive-t-il ?',
  options: OPTIONS_BAISSE,
} satisfies VotePublic;

const TOLERANCE_RELATIVE = { type: 'relative', valeur: 0.0001 } as const;
const TOLERANCE_ABSOLUE = { type: 'absolue', valeur: 0.01 } as const;

const PLAN_FEUILLE = {
  id: 'b2-01-a4-feuille-canaux',
  intitule: 'Tâche de tableur 1 — Le tableau de bord par canal',
  lignes: 7,
  colonnes: 7,
  cellules: { A1: 'Canal', B2: '483000', C2: '397000', F2: '0,36' },
  verrouillees: ['A1', 'B2', 'C2', 'F2'],
  consignes: ['En B5 et C5, calculez les totaux avec SOMME.'],
} satisfies SheetPlanStocke;

const [COLONNE_TAUX, , COLONNE_COEF] = PLAN_TABLEAU.colonnes;

const PLAN_TABLEAU_ANNUEL = {
  ...PLAN_TABLEAU,
  echeances: 4,
  libellesLignes: [
    '1er mars : +8 %',
    '1er juin : −5 %',
    '1er septembre : +4 %',
    '1er décembre : −3 %',
  ],
  colonnes: [{ ...COLONNE_TAUX, valeurs: [8, -5, 4, -3] }, COLONNE_COEF],
  synthese: [
    {
      libelle: 'Évolution réelle sur l’année',
      formule: 'dernierEvolution',
      unite: '%',
      decimales: 2,
    },
  ],
} satisfies TableBuildPlanStocke;

const PLAN_CARTES = {
  id: 'b2-01-a2-jeu-comparable',
  intitule: 'Comparable ou pas ?',
  cartes: [{ id: 'carte-ca-2024-2025', libelle: 'CA 2024 et CA 2025' }],
  categories: [{ id: 'comparable', libelle: 'Comparable' }],
  dureeJeuMs: 240000,
} satisfies CardsortPlanStocke;

const PARCOURS = {
  id: 'b2-01-a6-coffre',
  intitule: 'Le coffre du comité',
  delaiIndiceMs: 60000,
  budgetEnigmeMs: 150000,
  tentativesMax: 10,
  enigmes: [
    {
      id: 'enigme-1',
      intitule: 'La marge du sur-mesure',
      enonce: 'Retrouvez la marge brute du canal sur-mesure.',
      indice: 'Multipliez le CA par le taux de marge brute.',
    },
  ],
} satisfies EscapeParcoursStocke;

const CORRIGE_FEUILLE = {
  type: 'feuille',
  plan: PLAN_FEUILLE,
  attendus: [
    {
      reference: 'E2',
      formuleReference: '=C2/$C$5',
      valeur: 0.345217,
      tolerance: TOLERANCE_RELATIVE,
      forme: 'references',
      confusionSiErreurFormule: null,
      pieges: [{ valeur: 34.521739, confusion: 'taux-valeur-facteur-cent' }],
    },
    {
      reference: 'E3',
      formuleReference: '=C3/$C$5',
      valeur: 0.2,
      tolerance: TOLERANCE_RELATIVE,
      forme: { memeQue: 'E2' },
      confusionSiErreurFormule: null,
      pieges: [],
    },
  ],
  seuilReussite: 0.8,
} satisfies CorrigeFeuille;

const CORRIGE_TABLEAU = {
  type: 'tableau',
  attendus: [ATTENDU_PRIX_REVISE],
  tolerance: TOLERANCE_ABSOLUE,
  seuilReussite: 0.75,
} satisfies CorrigeTableau;

const CORRIGE_CLASSEMENT = {
  type: 'classement',
  attendus: [
    {
      carteId: 'carte-ca-2024-2025',
      categorieId: 'comparable',
      confusionSiErreur: 'raisonnement-additif',
      justification: 'Même périmètre, même unité, même durée.',
    },
  ],
  seuilReussite: 0.75,
} satisfies CorrigeClassement;

const CORRIGE_ENIGME = {
  type: 'enigme',
  parcoursId: 'b2-01-a6-coffre',
  enigmeId: 'enigme-1',
  rang: 0,
  solution: {
    type: 'nombre',
    valeur: 142920,
    tolerance: TOLERANCE_ABSOLUE,
    formePubliee: '142 920',
  },
  fragment: '7',
  pieges: [],
} satisfies CorrigeEnigme;

const CORRIGE_DEFI = {
  type: 'defi',
  strategies: [
    {
      id: 'coefficients',
      libelle: 'Multiplier les coefficients',
      fausse: false,
    },
    { id: 'somme-des-taux', libelle: 'Additionner les taux', fausse: true },
  ],
} satisfies CorrigeDefi;

const REVELATION = {
  type: 'revelation',
  titre: 'Une hausse puis une baisse de 20 %',
  lignes: ['1,2 × 0,8 = 0,96 : le prix finit 4 % plus bas.'],
} satisfies CorrigeRevelation;

const QUESTION_FEUILLE = {
  id: 'b2-01-a4-feuille-canaux',
  type: 'feuille',
  concept: 'proportion',
  noteCompte: true,
  confusions: ['taux-valeur-facteur-cent'],
  corrige: CORRIGE_FEUILLE,
} satisfies QuestionProduction;

const QUESTION_NUMERIQUE = {
  id: 'b2-01-a2-marge-g1',
  type: 'numeric' as const,
  concept: 'taux-evolution' as const,
  noteCompte: true,
  confusions: ['base-arrivee'] as const,
  tolerance: TOLERANCE_ABSOLUE,
  generer: () => ({
    type: 'numeric' as const,
    enonce: 'Taux d’évolution de la marge brute entre 2022 et 2025 ?',
    unite: '%',
    solution: 2.1,
    pieges: [{ confusion: 'base-arrivee' as const, valeur: 2.06 }],
  }),
} satisfies Question;

const QUESTION_VOTE = {
  id: 'b2-01-a3-vote-hausse-baisse',
  type: 'vote' as const,
  concept: 'evolutions-successives' as const,
  noteCompte: true,
  confusions: ['hausse-baisse-symetriques'] as const,
  generer: () => ({
    type: 'vote' as const,
    enonce: VOTE_PUBLIC.enonce,
    bonne: 'plus-bas-que-le-depart-1a2b3c4d',
    pieges: [
      {
        confusion: 'hausse-baisse-symetriques' as const,
        libelle: 'Égal au départ',
      },
    ],
  }),
} satisfies Question;

const ECRAN_COMMUN = {
  titre: 'Le prix de la toile',
  diffusion: 'seance',
  dureeMinutes: 11,
  concepts: ['evolutions-successives'],
  notes: 'Action · Observé · Attendu · Contrôle · Transition',
} satisfies Partial<Ecran>;

const EXPOSITION = {
  ...ECRAN_COMMUN,
  id: 'B2-01-A1-11-JALON-1',
  brique: 'fp-pulse',
  proprietes: {
    sondage: { id: 'b2-01-jalon-1', invite: 'Où en êtes-vous ?' },
  },
} satisfies Ecran;

const RESULTAT_QUESTION = {
  questionId: 'b2-01-a3-vote-hausse-baisse',
  ecranId: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
  type: 'vote',
  noteCompte: true,
  total: 24,
  correctes: 15,
  neSaitPas: 2,
  confusions: [
    {
      id: 'hausse-baisse-symetriques',
      libelle: 'Croire qu’une hausse puis une baisse ramènent au départ.',
      nombre: 7,
    },
  ],
  parOption: {
    'plus-bas-que-le-depart-1a2b3c4d': 15,
    __je_ne_sais_pas__: 2,
  },
  scoreMoyen: null,
  parCle: null,
} satisfies ResultatQuestion;

const RESULTATS = {
  participants: 24,
  questions: [RESULTAT_QUESTION],
} satisfies ResultatsSeance;

const JALONS = {
  'b2-01-jalon-1': { perdu: 3, 'ca-va': 12, clair: 9, total: 24 },
} satisfies Record<string, ComptesJalon>;

const ENIGMES = [
  {
    parcoursId: 'b2-01-a6-coffre',
    enigmeId: 'enigme-1',
    ouvertes: 20,
    resolues: 17,
    tentativesMoyennes: 1.6,
    epuisees: 1,
  },
] satisfies ProgressionEnigme[];

const RESUME_BAREME = {
  questionsNotees: 31,
  parType: {
    vote: { notees: 19, nonNotees: 13 },
    numeric: { notees: 7, nonNotees: 0 },
    classement: { notees: 3, nonNotees: 0 },
    feuille: { notees: 1, nonNotees: 0 },
    tableau: { notees: 1, nonNotees: 0 },
    enigme: { notees: 0, nonNotees: 4 },
  },
} satisfies ResumeBareme;

const STATISTIQUES = {
  moyenne: 14.5,
  mediane: 15,
  dispersion: 2.4,
  tauxParticipation: 0.9,
  tauxReussite: 0.64,
  questionsProblemes: [],
};

const NOTATION = { ...REGLE_DE_NOTATION } satisfies RegleDeNotation;

const PRODUCTION_FEUILLE = {
  type: 'feuille',
  cellules: { B5: '=SOMME(B2:B4)', E2: '=C2/$C$5' },
} satisfies ValeurProduction;

const DETAIL = {
  cle: 'E3',
  juste: false,
  confusion: 'taux-valeur-facteur-cent',
} satisfies DetailProduction;

const PILOTAGE_VOTE = { phase: 'revote' } satisfies PilotageEcran;

const ECRAN_PUBLIC = {
  id: 'B2-01-A4-02-FEUILLE-CANAUX',
  type: 'fp-sheet',
  titre: 'Le tableau de bord par canal',
  duree: 13,
  interactif: true,
  donnees: { plan: { ...PLAN_FEUILLE, metadonnees: METADONNEES } },
} satisfies EcranPublic;

const COURS_PUBLIC = {
  id: 'b2-01-traitement-information-chiffree',
  titre: 'Traitement de l’information chiffrée',
  niveau: 'B2',
  duree: 210,
  concepts: ['evolutions-successives'],
  ecrans: [ECRAN_PUBLIC],
} satisfies CoursPublic;

describe('Contrats figés du cours B2-01 V3 (§ 9, lot 0)', () => {
  describe('§ 9.3.1 et § 9.3.2 — écrans, cours et questions', () => {
    it('accepte chaque famille d’écran de l’union finale', () => {
      const ecrans = [
        EXPOSITION,
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
          brique: 'fp-worked',
          proprietes: {
            exemple: {
              id: 'b2-01-a3-worked-indice',
              enonce: 'Du prix à l’indice, base 100 au 1er janvier.',
              etapes: [
                {
                  id: 'etape-1',
                  intitule: 'Choisir la base',
                  raisonnement: 'Le prix du 1er janvier vaut 100.',
                  invite: 'Quel prix sert de base ?',
                },
              ],
            },
            etayage: 2,
          },
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A2-02-ORIGINE-AXE',
          brique: 'fp-plot',
          proprietes: {
            abscisse: { libelle: 'Origine de l’axe', min: 0, max: 280000 },
            ordonnee: 'Marge brute (€)',
            parametres: [],
            series: [
              {
                id: 'marge',
                libelle: 'Marge brute',
                trait: 'plein',
                calcul: 'origine',
              },
            ],
            bornesOrdonnee: { minParametre: 'origine' },
            sourceUrl: 'https://www.insee.fr/fr/statistiques/serie/001759970',
            description: 'La même marge, deux origines d’axe.',
          },
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A2-05-MARGE',
          brique: 'fp-numeric',
          question: QUESTION_NUMERIQUE,
          seuil: 0.7,
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
          brique: 'fp-vote',
          question: QUESTION_VOTE,
          questionJumelle: QUESTION_VOTE,
          revelation: REVELATION,
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A1-01-DIAGNOSTIC',
          brique: 'fp-recall',
          question: QUESTION_VOTE,
          delaiMs: 45000,
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A6-08-BILLET-DE-SORTIE',
          brique: 'fp-exit',
          question: QUESTION_VOTE,
          invite: 'Justifiez votre choix en une phrase.',
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A2-03-ATELIER-1',
          brique: 'questionnaire',
          intitule: 'Atelier 1 — Comparer sans tromper',
          consigne: 'Répondez seul, sans vos notes.',
          regime: 'focus',
          ordre: 'fixe',
          questions: [QUESTION_VOTE, QUESTION_NUMERIQUE],
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A4-02-FEUILLE-CANAUX',
          brique: 'fp-sheet',
          proprietes: { plan: PLAN_FEUILLE },
          production: QUESTION_FEUILLE,
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A4-05-INDICE-TOILE',
          brique: 'fp-table-build',
          proprietes: { plan: PLAN_TABLEAU_ANNUEL },
          production: {
            ...QUESTION_FEUILLE,
            id: 'b2-01-a4-indice-toile',
            type: 'tableau',
            corrige: CORRIGE_TABLEAU,
          },
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A2-07-JEU-COMPARABLE',
          brique: 'fp-cardsort',
          proprietes: { plan: PLAN_CARTES },
          production: {
            ...QUESTION_FEUILLE,
            id: 'b2-01-a2-jeu-comparable',
            type: 'classement',
            corrige: CORRIGE_CLASSEMENT,
          },
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A6-02-COFFRE',
          brique: 'fp-escape',
          proprietes: { parcours: PARCOURS },
          enigmes: [
            {
              ...QUESTION_FEUILLE,
              id: 'enigme-1',
              type: 'enigme',
              noteCompte: false,
              corrige: CORRIGE_ENIGME,
            },
          ],
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A5-08-RECOMMANDATION',
          brique: 'fp-challenge',
          proprietes: {
            probleme: {
              id: 'b2-01-a5-defi-recommandation',
              enonce: 'Quel canal le comité doit-il renforcer ?',
              invite: 'Écrivez votre stratégie avant de voir les autres.',
            } satisfies ProblemeStocke,
          },
          defi: CORRIGE_DEFI,
        },
        {
          ...ECRAN_COMMUN,
          id: 'B2-01-A6-05-RAPPEL',
          brique: 'fp-spaced',
          proprietes: {
            rappel: { id: 'b2-01-rappel', intitule: 'Rappel espacé' },
          },
          banque: [QUESTION_VOTE],
          obligatoires: ['b2-01-r-compensation', 'b2-01-r-multiple-neuf'],
        },
      ] satisfies Ecran[];

      expect(ecrans.map((ecran) => ecran.brique)).toHaveLength(14);
    });

    it('décrit un cours avec ses remédiations et son catalogue de médias', () => {
      const media = {
        id: 'M1',
        chemins: ['/assets/cours/b2-01/v3/playfair-1786.webp'],
        pageSource:
          'https://commons.wikimedia.org/wiki/File:Playfair_TimeSeries-2.png',
        auteur: 'William Playfair',
        date: '1786',
        licence: 'domaine public',
        attribution: 'William Playfair, 1786, domaine public',
      } satisfies MediaCatalogue;
      const cours = {
        slug: 'b2-01-traitement-information-chiffree',
        titre: 'Traitement de l’information chiffrée',
        niveau: 'B2',
        dureeMinutes: 210,
        concepts: ['evolutions-successives'],
        ecrans: [EXPOSITION],
        remediations: { 'base-arrivee': 'B2-01-A3-04-FIL-TECHNIQUE' },
        medias: [media],
      } satisfies Cours;
      const diffusions: Diffusion[] = ['catalogue', 'seance'];
      const ordres: OrdreQuestions[] = ['fixe', 'melange'];

      expect(cours.medias[0].licence).toBe('domaine public');
      expect([...diffusions, ...ordres]).toHaveLength(4);
    });

    it('stocke les questions notées sans rien révéler au sujet', () => {
      const option = {
        id: 'plus-25-pct-ecd953a1',
        libelle: '+25 %',
        confusion: null,
      } satisfies OptionStockee;
      const vote = {
        type: 'vote',
        id: 'b2-01-r-compensation',
        concept: 'evolution-reciproque',
        noteCompte: false,
        enonce: 'Après −20 %, quelle hausse ramène au départ ?',
        options: [option],
        segments: [],
      } satisfies VoteStockee;
      const numerique = {
        type: 'numeric',
        id: 'b2-01-a2-marge-g1',
        concept: 'taux-evolution',
        noteCompte: true,
        enonce: 'Taux d’évolution de la marge brute entre 2022 et 2025 ?',
        unite: '%',
        solution: 45.5,
        tolerance: TOLERANCE_ABSOLUE,
        formePubliee: '45,5',
        pieges: [{ valeur: 31.27, confusion: 'base-arrivee' }],
      } satisfies NumeriqueStockee;
      const types: TypeQuestion[] = [
        'numeric',
        'vote',
        'feuille',
        'tableau',
        'classement',
        'enigme',
      ];

      expect(vote.options[0].confusion).toBeNull();
      expect(numerique.formePubliee).toBe('45,5');
      expect(types).toHaveLength(6);
    });

    it('retire les métadonnées des plans stockés', () => {
      const probleme = {
        id: 'b2-01-a1-defi-diapositive',
        enonce: 'Qu’est-ce qui trompe dans cette diapositive ?',
        invite: 'Listez tout ce que vous contrôleriez.',
      } satisfies ProblemeStocke;
      const pulse = {
        sondage: { id: 'b2-01-jalon-2', invite: 'Où en êtes-vous ?' },
      } satisfies ProprietesExposition['fp-pulse'];

      expect('metadonnees' in PLAN_FEUILLE).toBe(false);
      expect([probleme.id, pulse.sondage.id]).toHaveLength(2);
    });
  });

  describe('§ 9.3.3 — corrigés', () => {
    it('couvre les quatre corrigés de production, le défi et la révélation', () => {
      const pieges: PiegeNumerique[] = [
        { valeur: -17.805383, confusion: 'taux-valeur-facteur-cent' },
      ];
      const formes: FormeFormule[] = ['references', { memeQue: 'D2' }];
      const productions = [
        CORRIGE_FEUILLE,
        CORRIGE_TABLEAU,
        CORRIGE_CLASSEMENT,
        CORRIGE_ENIGME,
        {
          ...CORRIGE_ENIGME,
          solution: { type: 'texte', acceptees: ['CA2025'] },
        },
      ] satisfies CorrigeProduction[];

      expect(productions.map((corrige) => corrige.type)).toEqual([
        'feuille',
        'tableau',
        'classement',
        'enigme',
        'enigme',
      ]);
      expect(
        CORRIGE_DEFI.strategies.filter((strategie) => strategie.fausse),
      ).toHaveLength(1);
      expect(REVELATION.lignes).toHaveLength(1);
      expect([...pieges, ...formes]).toHaveLength(3);
    });
  });

  describe('§ 9.3.4 — barème', () => {
    it('accepte un barème v1 inchangé et un barème v2 à solutions communes', () => {
      const v1 = {
        version: 1,
        graineReference: 0,
        questions: [
          {
            id: 'b2-01-a3-vote-hausse-baisse',
            type: 'vote',
            concept: 'evolutions-successives',
            noteCompte: true,
          },
        ],
        tirages: [{ seed: 0, solutions: {} }],
      } satisfies BaremeV1;
      const question = {
        id: 'enigme-1',
        type: 'enigme',
        concept: 'proportion',
        noteCompte: false,
        ecranId: 'B2-01-A6-02-COFFRE',
        rangEcran: 45,
        parcoursId: 'b2-01-a6-coffre',
        rangEnigme: 0,
      } satisfies BaremeQuestionV2;
      const v2 = {
        version: 2,
        graineReference: 0,
        questions: [
          question,
          {
            id: 'b2-01-a5-vote-paradoxe-jumelle',
            type: 'vote',
            concept: 'proportion',
            noteCompte: true,
            ecranId: 'B2-01-A5-02-VOTE-PARADOXE',
            rangEcran: 39,
            ouverture: 'jumelle',
          },
          {
            id: 'b2-01-r-compensation',
            type: 'vote',
            concept: 'evolution-reciproque',
            noteCompte: false,
            ecranId: 'B2-01-A6-05-RAPPEL',
            rangEcran: 48,
            origine: 'banque',
          },
        ],
        solutionsCommunes: { 'b2-01-a2-marge-g1': { valeur: 2.1, pieges: [] } },
        tirages: [{ seed: 0, ecarts: {} }],
        corriges: { 'b2-01-a4-feuille-canaux': CORRIGE_FEUILLE },
      } satisfies BaremeV2;
      const baremes = [v1, v2] satisfies Bareme[];

      expect(baremes.map((bareme) => bareme.version)).toEqual([1, 2]);
    });
  });

  describe('§ 9.3.5 — tirage et projection publique', () => {
    it('tient la banque de rappel hors du sujet', () => {
      const tirage = {
        sujet: COURS_PUBLIC,
        solutions: {},
        corriges: {
          'b2-01-a3-vote-hausse-baisse': {
            bonneReponse: 'Plus bas que le départ',
            confusions: ['hausse-baisse-symetriques'],
          },
        },
        libellesOptions: {},
        banque: { 'b2-01-r-compensation': VOTE_PUBLIC },
      } satisfies TirageDuCours;
      const catalogue = {
        ...COURS_PUBLIC,
        ecrans: [
          {
            id: 'B2-01-A4-02-FEUILLE-CANAUX',
            type: 'ecran-verrouille',
            titre: 'Le tableau de bord par canal',
            duree: 13,
            interactif: true,
            donnees: {},
          },
        ],
        version: 3,
        publieLe: '2026-10-05T07:00:00.000Z',
      } satisfies CoursPublicCatalogue;

      expect(Object.keys(tirage.banque)).toEqual(['b2-01-r-compensation']);
      expect(catalogue.ecrans[0].donnees).toEqual({});
    });
  });

  describe('§ 9.3.6 — déroulé formateur', () => {
    it('sert au pupitre le corrigé de chaque famille d’écran', () => {
      const corriges = [
        {
          type: 'feuille',
          attendus: [
            {
              reference: 'E2',
              formuleReference: '=C2/$C$5',
              valeur: 0.345217,
              tolerance: TOLERANCE_RELATIVE,
              forme: 'references',
            },
          ],
          seuilReussite: 0.8,
        },
        {
          type: 'tableau',
          attendus: [{ rang: 0, cle: 'prix', valeur: 21.6 }],
          tolerance: TOLERANCE_ABSOLUE,
          seuilReussite: 0.75,
        },
        {
          type: 'classement',
          attendus: [
            {
              carteId: 'carte-ca-2024-2025',
              categorieId: 'comparable',
              justification: 'Même périmètre, même unité, même durée.',
            },
          ],
          seuilReussite: 0.75,
        },
        {
          type: 'enigmes',
          enigmes: [
            { enigmeId: 'enigme-1', solution: '142 920', fragment: '7' },
          ],
          codeFinal: '7-3-1-9',
        },
        {
          type: 'defi',
          strategies: CORRIGE_DEFI.strategies,
        },
        {
          type: 'revelation',
          titre: REVELATION.titre,
          lignes: REVELATION.lignes,
        },
      ] satisfies CorrigeEcranPresentateur[];
      const ecran = {
        ...ECRAN_PUBLIC,
        notes: 'Action · Observé · Attendu · Contrôle · Transition',
        diffusion: 'seance',
        seuil: null,
        corriges: [],
        questions: [
          { id: 'b2-01-a4-feuille-canaux', enonce: 'Feuille', options: null },
        ],
        corrigeEcran: corriges[0],
        guide: { aDire: 'Rappelez le rôle du $.' },
      } satisfies EcranDeroule;
      const deroule = {
        ...COURS_PUBLIC,
        ecrans: [ecran],
        remediations: { 'base-arrivee': 'B2-01-A3-04-FIL-TECHNIQUE' },
      } satisfies DerouleCours;

      expect(corriges.map((corrige) => corrige.type)).toHaveLength(6);
      expect(deroule.ecrans[0].corrigeEcran?.type).toBe('feuille');
    });
  });

  describe('§ 9.3.7 — réponses, productions et résultats', () => {
    it('distingue les quatre formes de production et « je ne sais pas »', () => {
      const valeurs = [
        PRODUCTION_FEUILLE,
        {
          type: 'tableau',
          saisies: [{ rang: 0, cle: 'prix', valeur: 21.6 }],
        },
        {
          type: 'classement',
          classement: { 'carte-ca-2024-2025': 'comparable' },
        },
        { type: 'classement', neSaitPas: true },
      ] satisfies ValeurProduction[];
      const reponses = [
        1300,
        '__je_ne_sais_pas__',
        PRODUCTION_FEUILLE,
      ] satisfies ValeurReponse[];

      expect(valeurs).toHaveLength(4);
      expect(reponses).toHaveLength(3);
    });

    it('enregistre le score et le détail d’une production', () => {
      const reponse = {
        id: '4f9a6b0e-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        sessionId: '0f6c1e02-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        participantId: '9b1d0c3e-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        questionId: 'b2-01-a4-feuille-canaux',
        concept: 'proportion',
        valeur: PRODUCTION_FEUILLE,
        seed: 12,
        correcte: false,
        misconception: 'taux-valeur-facteur-cent',
        score: 13 / 17,
        details: [DETAIL],
        dureeMs: 600000,
        soumisLe: new Date('2026-10-05T09:12:00.000Z'),
      } satisfies AnswerRecord;
      const rapport = {
        questionId: 'b2-01-a4-feuille-canaux',
        concept: 'proportion',
        valeur: 'production',
        reponse: 'Feuille : 13/17 cellules justes',
        correcte: false,
        misconception: 'taux-valeur-facteur-cent',
        libelleConfusion: 'Confondre le taux 70 % et la valeur 0,7.',
        dureeMs: 600000,
        type: 'feuille',
        score: 13 / 17,
      } satisfies RapportQuestion;

      expect(reponse.score).toBeLessThan(0.8);
      expect(rapport.reponse).toContain('13/17');
    });

    it('agrège les résultats en direct et ceux de fin de séance', () => {
      const enDirect = {
        ...RESULTATS,
        statistiques: STATISTIQUES,
        jalons: JALONS,
        enigmes: ENIGMES,
        bareme: RESUME_BAREME,
      } satisfies ResultatsEnDirect;
      const deSeance = {
        courseSlug: 'b2-01-traitement-information-chiffree',
        code: '4271',
        ouverteLe: new Date('2026-10-05T07:00:00.000Z'),
        fermeeLe: new Date('2026-10-05T10:30:00.000Z'),
        participants: [],
        conceptsFragiles: ['evolutions-successives'],
        resultats: RESULTATS,
        statistiques: STATISTIQUES,
        notation: NOTATION,
        bareme: RESUME_BAREME,
        jalons: JALONS,
        enigmes: ENIGMES,
      } satisfies ResultatsDeSeance;

      expect(enDirect.bareme.questionsNotees).toBe(31);
      expect(deSeance.notation.typesNotables).not.toContain('enigme');
    });
  });

  describe('§ 9.3.8 — contrat notation final', () => {
    it('étend la règle servie de trois champs sans en retirer', () => {
      expect(Object.keys(NOTATION)).toHaveLength(12);
      expect(NOTATION.productionCompteSi).toBe('au-moins-une-saisie');
    });
  });

  describe('§ 9.3.9 — pilotage, état en direct et état du participant', () => {
    it('persiste le pilotage par écran et sa révision', () => {
      const phases: VotePhase[] = ['vote', 'discussion', 'revote', 'revele'];
      const etat = {
        etat: 'en_cours',
        modeRythme: 'pilote',
        ecranCourant: 30,
        intervalleLibre: null,
        participants: 24,
        majLe: new Date('2026-10-05T08:00:00.000Z'),
        revision: 7,
        pilotage: {
          'B2-01-A3-01-VOTE-HAUSSE-BAISSE': PILOTAGE_VOTE,
          'B2-01-A5-08-RECOMMANDATION': { revele: true },
          'B2-01-A3-06-INDICE-ET-TAUX-MOYEN': { etayage: 1 },
        },
      } satisfies LiveSessionState;
      const commande = {
        pilotage: {
          screenId: 'B2-01-A3-01-VOTE-HAUSSE-BAISSE',
          phase: 'revele',
        },
      } satisfies ControlSessionChanges;

      expect(phases).toHaveLength(4);
      expect(Object.keys(etat.pilotage)).toHaveLength(3);
      expect(commande.pilotage.phase).toBe('revele');
    });

    it('rend à l’appelant ses seules données de séance', () => {
      const etats: EtatPulse[] = ['perdu', 'ca-va', 'clair'];
      const moi = {
        sessionId: '0f6c1e02-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        participantId: '9b1d0c3e-6d0f-4a4b-8f6e-0c2f1e5b7a10',
        revision: 7,
        reponses: [
          {
            questionId: 'b2-01-a4-feuille-canaux',
            valeur: PRODUCTION_FEUILLE,
            correcte: false,
            score: 13 / 17,
            details: [
              {
                cle: 'E3',
                juste: false,
                libelleConfusion: 'Confondre le taux et la valeur.',
              },
            ],
            libelleConfusion: 'Confondre le taux et la valeur.',
          },
        ],
        reponsesLibres: [
          {
            activityId: 'b2-01-a1-diagnostic:rappel',
            response: 'Un taux se calcule sur la valeur de départ.',
          },
        ],
        jalons: [{ sondageId: 'b2-01-jalon-1', etat: 'ca-va' }],
        enigmes: [
          {
            parcoursId: 'b2-01-a6-coffre',
            resolues: [{ enigmeId: 'enigme-1', fragment: '7' }],
            tentativesRestantes: { 'enigme-2': 9 },
          },
        ],
        defis: [
          {
            defiId: 'b2-01-a5-defi-recommandation',
            premiereTentative: 'Renforcer la marketplace.',
          },
        ],
        rappels: { questionIds: ['b2-01-r-compensation'] },
      } satisfies EtatParticipant;

      expect(etats).toContain(moi.jalons[0].etat);
      expect(moi.reponses[0].details).toHaveLength(1);
    });
  });

  describe('§ 9.4 — données publiques par brique', () => {
    it('sert chaque brique sans solution, fragment ni stratégie', () => {
      const exemple = {
        id: 'b2-01-a2-worked-points',
        enonce: 'Écart en points ou en pourcentage ?',
        etapes: [
          {
            id: 'etape-1',
            intitule: 'Lire les deux taux',
            raisonnement: '12 % puis 15 %.',
            invite: 'Quel est l’écart ?',
          },
        ],
        metadonnees: METADONNEES,
      } satisfies WorkedExemple;
      const recit = {
        id: 'b2-01-a4-capsule',
        titre: 'Une formule qui se recopie, un tableau qui se contrôle',
        paragraphes: ['Une capsule de trois minutes.'],
        video: {
          src: '/assets/cours/b2-01/v3/capsule-720.webm',
          srcPoste: '/assets/cours/b2-01/v3/capsule-480.webm',
          type: 'video/webm',
          titre: 'Capsule tableur',
          transcript: 'Transcription intégrale.',
          source: '/formations/b2-01-traitement-information-chiffree',
          licence: 'CC BY-SA 4.0',
          sousTitres: {
            src: '/assets/cours/b2-01/v3/capsule.vtt',
            srclang: 'fr',
            libelle: 'Français',
          },
          preload: 'none',
        },
        metadonnees: METADONNEES,
      } satisfies StoryRecit;
      const plan = {
        ...PLAN_TABLEAU_ANNUEL,
        metadonnees: METADONNEES,
      } satisfies TableBuildPlanPublic;
      const colonne = plan.colonnes[1] satisfies TableColonneServie;
      const numerique = {
        id: 'b2-01-a2-marge-g1',
        enonce: 'Taux d’évolution de la marge brute ?',
        unite: '%',
        metadonnees: METADONNEES,
      } satisfies NumeriquePublic;
      const billet = {
        id: 'b2-01-a6-billet',
        question: 'Quelle vérification ferez-vous d’abord ?',
        invite: 'Justifiez en une phrase.',
        options: OPTIONS_BAISSE,
        metadonnees: METADONNEES,
      } satisfies ExitBilletPublic;
      const concept4 = {
        id: 'B2-01-A3-02-MACHINE-COEFFICIENTS',
        parametres: [
          {
            cle: 't',
            libelle: 'Taux',
            min: -50,
            max: 50,
            pas: 1,
            defaut: 20,
          },
        ],
        formuleLatexSimplifie: 'CM = 1 + t / 100',
        calcul: '1 + t / 100',
        phrase: 'Le coefficient vaut {resultat}.',
        metadonnees: METADONNEES,
      } satisfies Concept4Definition;
      const plot = {
        id: 'B2-01-A5-04-SIMULATEUR-MIX',
        abscisse: { libelle: 'Part du sur-mesure', min: 0, max: 1 },
        ordonnee: 'Taux de marge global',
        parametres: [],
        series: [
          { id: 'mix', libelle: 'Taux global', trait: 'plein', calcul: 'x' },
        ],
        description: 'Le taux global suit la part de chaque canal.',
        metadonnees: METADONNEES,
      } satisfies PlotDefinition;
      const spaced = {
        questionId: 'b2-01-r-compensation',
        concept: 'evolution-reciproque',
        boite: 1,
        cours: 'B2-01 · Traitement de l’information chiffrée',
        enonce: 'Après −20 %, quelle hausse ramène au départ ?',
        options: OPTIONS_BAISSE,
      } satisfies SpacedQuestionPublique;
      const sondage = {
        id: 'b2-01-jalon-1',
        invite: 'Où en êtes-vous ?',
        metadonnees: METADONNEES,
      } satisfies PulseSondage;
      const donnees = {
        'fp-story': { recit },
        'fp-pro': {
          cas: {
            id: 'b2-01-a1-mission',
            metier: 'Assistant de gestion',
            situation: 'Le tableau de bord du lundi.',
            geste: 'Vérifier la base de chaque taux.',
            consequence: null,
            metadonnees: METADONNEES,
          },
        },
        'fp-worked': { exemple, etayage: 3 },
        'fp-concept4': { definition: concept4 },
        'fp-plot': { definition: plot },
        'fp-challenge': {
          probleme: {
            id: 'b2-01-a5-defi-recommandation',
            enonce: 'Quel canal renforcer ?',
            invite: 'Écrivez votre stratégie.',
            strategies: [],
            metadonnees: METADONNEES,
          },
        },
        'fp-cardsort': {
          plan: { ...PLAN_CARTES, metadonnees: METADONNEES },
        },
        'fp-sheet': { plan: { ...PLAN_FEUILLE, metadonnees: METADONNEES } },
        'fp-table-build': { plan },
        'fp-escape': { parcours: { ...PARCOURS, metadonnees: METADONNEES } },
        'fp-pulse': { sondage },
        'fp-spaced': {
          rappel: {
            id: 'b2-01-rappel',
            intitule: 'Rappel espacé',
            metadonnees: METADONNEES,
          },
        },
        'fp-numeric': { question: numerique },
        'fp-vote': { question: VOTE_PUBLIC, questionJumelle: VOTE_PUBLIC },
        'fp-recall': {
          question: { ...VOTE_PUBLIC, metadonnees: METADONNEES },
          delaiMs: 45000,
        },
        'fp-exit': { billet },
        questionnaire: {
          intitule: 'Atelier 1 — Comparer sans tromper',
          consigne: 'Répondez seul, sans vos notes.',
          regime: 'focus',
          ordre: 'fixe',
          questions: [
            { brique: 'fp-vote', donnees: { question: VOTE_PUBLIC } },
            { brique: 'fp-numeric', donnees: { question: numerique } },
          ],
        },
        'ecran-verrouille': {},
      } satisfies DonneesParBrique;
      const plans = [
        donnees['fp-cardsort'].plan satisfies CardsortPlanPublic,
        donnees['fp-sheet'].plan satisfies SheetPlanPublic,
        donnees['fp-escape'].parcours satisfies EscapeParcoursPublic,
      ];

      expect(Object.keys(donnees)).toHaveLength(18);
      expect(colonne.role).toBe('deduite');
      expect(spaced.boite).toBe(1);
      expect(plans.map((entree) => entree.id)).toHaveLength(3);
      expect(JSON.stringify(donnees['fp-escape'])).not.toContain('fragment');
    });
  });

  describe('formes refusées à la compilation', () => {
    it('ne laisse passer ni secret au poste ni forme hors contrat', () => {
      const refusees = [
        {
          ...PARCOURS,
          metadonnees: METADONNEES,
          enigmes: [
            // @ts-expect-error une énigme publique ne porte aucun fragment
            { ...PARCOURS.enigmes[0], fragment: '7' },
          ],
        } satisfies EscapeParcoursPublic,
        // @ts-expect-error un plan stocké ne porte pas les métadonnées du tirage
        { ...PLAN_FEUILLE, metadonnees: METADONNEES } satisfies SheetPlanStocke,
        // @ts-expect-error « je ne sais pas » ne s’envoie qu’à vrai
        { type: 'feuille', neSaitPas: false } satisfies ValeurProduction,
        // @ts-expect-error une commande de pilotage désigne toujours son écran
        { pilotage: { phase: 'vote' } } satisfies ControlSessionChanges,
        {
          ...RESUME_BAREME,
          // @ts-expect-error le résumé du barème couvre les six types de question
          parType: { vote: { notees: 19, nonNotees: 13 } },
        } satisfies ResumeBareme,
      ];

      expect(refusees).toHaveLength(5);
    });
  });
});
