import type { Tolerance } from '../../GradingCore';
import type {
  Cours,
  DefinitionNumerique,
  DefinitionVote,
  Ecran,
} from '../Cours';
import { questionNumerique, questionVote } from '../Cours';
import { SEUIL_PAR_DEFAUT } from '../DeroulePresentateur';
import { REFERENTIEL_B2 } from '../referentiel-b2';

const REFERENTIEL = REFERENTIEL_B2.cours[0];
const TOLERANCE_EUROS: Tolerance = { type: 'decimales', valeur: 2 };
const TOLERANCE_POURCENTAGE: Tolerance = { type: 'absolue', valeur: 0.05 };

interface PartEtTotal {
  readonly partie: number;
  readonly total: number;
  readonly taux: number;
}

interface Evolution {
  readonly depart: number;
  readonly arrivee: number;
  readonly taux: number;
}

function nombre(valeur: number, decimales = 2): string {
  return valeur.toLocaleString('fr-FR', { maximumFractionDigits: decimales });
}

function euros(valeur: number): string {
  return `${nombre(valeur)} €`;
}

function pourcentage(valeur: number): string {
  return `${nombre(valeur)} %`;
}

function numerique<D>(definition: DefinitionNumerique<D>) {
  return questionNumerique(definition);
}

function vote<D>(definition: DefinitionVote<D>) {
  return questionVote(definition);
}

const QUESTION_RAPPEL = vote({
  id: 'B2-01-RAPPEL-PART-TOTAL',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ partie: 18, total: 60 }),
  enonce: ({ partie, total }) =>
    `${partie} dossiers sur ${total} sont complets. Quelle écriture représente la proportion de dossiers complets ?`,
  bonne: ({ partie, total }) => `${partie} ÷ ${total} = 0,3`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ partie, total }) => `${total} − ${partie} = 42`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ partie, total }) => `${partie} ÷ ${total} × 100 = 30`,
    },
  ],
});

const QUESTION_MONTANT = numerique({
  id: 'B2-01-MONTANT-POURCENTAGE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (tirage): PartEtTotal => {
    const total = tirage.entier(20, 80) * 100;
    const taux = tirage.choix([10, 20, 25, 30, 40] as const);
    return { partie: (total * taux) / 100, total, taux };
  },
  enonce: ({ total, taux }) =>
    `Une charge représente ${pourcentage(taux)} d’un total de ${euros(total)}. Quel est son montant ?`,
  unite: '€',
  solution: ({ partie }) => partie,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ total, taux }) => (total * taux) / 10000,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ total, taux }) => (total * (1 + taux / 100)) / 100,
    },
  ],
});

const QUESTION_TOTAL = numerique({
  id: 'B2-01-TOTAL-DEPUIS-PART',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (tirage): PartEtTotal => {
    const taux = tirage.choix([10, 20, 25, 40] as const);
    const total = tirage.entier(20, 80) * 100;
    return { partie: (total * taux) / 100, total, taux };
  },
  enonce: ({ partie, taux }) =>
    `${euros(partie)} représentent ${pourcentage(taux)} d’un budget. Quel est le budget total ?`,
  unite: '€',
  solution: ({ total }) => total,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ partie, taux }) => partie / taux,
    },
    {
      confusion: 'base-arrivee',
      valeur: ({ partie, taux }) => partie / (1 + taux / 100),
    },
  ],
});

const QUESTION_REFERENCE = vote({
  id: 'B2-01-CHOIX-REFERENCE',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ partie: 72, total: 240 }),
  enonce: ({ partie, total }) =>
    `Pour calculer la part de ${partie} dossiers dans une population de ${total}, quelle valeur doit rester au dénominateur ?`,
  bonne: ({ total }) => `${total}, car c’est le total de référence.`,
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: ({ partie }) => `${partie}, car c’est la valeur observée.`,
    },
    {
      confusion: 'raisonnement-additif',
      libelle: ({ partie, total }) =>
        `${partie} + ${total}, car il faut utiliser tous les nombres.`,
    },
  ],
});

const QUESTION_EVOLUTION = numerique({
  id: 'B2-01-TAUX-EVOLUTION',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (tirage): Evolution => {
    const depart = tirage.entier(20, 80) * 100;
    const taux = tirage.choix([10, 20, 25, 30] as const);
    return { depart, taux, arrivee: depart * (1 + taux / 100) };
  },
  enonce: ({ depart, arrivee }) =>
    `Une recette passe de ${euros(depart)} à ${euros(arrivee)}. Quel est son taux d’évolution ?`,
  unite: '%',
  solution: ({ taux }) => taux,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'base-arrivee',
      valeur: ({ depart, arrivee }) => ((arrivee - depart) / arrivee) * 100,
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      valeur: ({ depart, arrivee }) => arrivee - depart,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ taux }) => taux / 100,
    },
  ],
});

const QUESTION_FORMULE = vote({
  id: 'B2-01-FORMULE-TABLEUR',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: () => ({ taux: 25 }),
  enonce: ({ taux }) =>
    `La cellule B2 contient le total. Quelle formule calcule ${pourcentage(taux)} de B2 ?`,
  bonne: ({ taux }) => `=B2*${taux / 100}`,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) => `=B2*${taux}`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) => `=B2*(1+${taux / 100})`,
    },
  ],
});

const QUESTION_CONTROLE = vote({
  id: 'B2-01-CONTROLE-COHERENCE',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ complet: 72, total: 240 }),
  enonce: ({ complet, total }) =>
    `Un tableau annonce ${complet} dossiers complets sur ${total}. Quelle vérification est la plus utile avant de communiquer le pourcentage ?`,
  bonne: () =>
    'Calculer 72 ÷ 240 × 100 = 30 % et vérifier que la base est bien 240.',
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: () => 'Diviser par le nombre de dossiers incomplets.',
    },
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'Ajouter 72 et 240 puis annoncer le résultat.',
    },
  ],
});

const QUESTION_TRANSFERT = vote({
  id: 'B2-01-TRANSFERT-METHODE',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: () => ({ depart: 400, arrivee: 460 }),
  enonce: ({ depart, arrivee }) =>
    `Une recette passe de ${depart} € à ${arrivee} €. Quelle information faut-il donner en premier pour contrôler le calcul ?`,
  bonne: () => 'La base de départ, l’écart de 60 €, puis le taux de 15 %.',
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: () =>
        'La valeur d’arrivée seule, car elle contient le résultat final.',
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: () => 'L’écart de 60 € seulement, sans rapport à la base.',
    },
  ],
});

const QUESTION_SORTIE = vote({
  id: 'B2-01-SORTIE-METHODE',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: () => ({ depart: 400, arrivee: 460 }),
  enonce: ({ depart, arrivee }) =>
    `Pour expliquer le passage de ${depart} à ${arrivee}, quelle conclusion est correcte ?`,
  bonne: () => 'L’écart est 60 et le taux est 60 ÷ 400 × 100 = 15 %.',
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: () =>
        'Le taux est 60 ÷ 460 × 100, car la valeur finale est la référence.',
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: () => 'Le taux est 60 €, car c’est l’écart observé.',
    },
  ],
});

const ECRANS: readonly [Ecran, ...Ecran[]] = [
  {
    id: 'B2-01-OUVERTURE',
    brique: 'fp-recall',
    dureeMinutes: 5,
    concepts: ['proportion'],
    notes:
      '[5 min · minutes 0 à 5 · mode piloté] Faites le rappel sans afficher les options, puis recueillez les votes. Ne corrigez pas encore : cette réponse mesure le point de départ.',
    question: QUESTION_RAPPEL,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-SITUATION',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · minutes 5 à 11 · mode piloté] Présentez le tableau de suivi d’une association. La direction demande une information comparable entre deux antennes : on doit annoncer la base, le calcul, l’unité et une phrase d’interprétation.',
    modalite: 'classe',
    proprietes: {
      metier: 'Assistant de gestion',
      situation:
        'Le tableau comporte 72 dossiers complets sur 240 dans une antenne et 30 sur 100 dans une autre.',
      geste:
        'Pour chaque antenne, diviser la partie par le total, multiplier par 100, conserver le total comme base et contrôler l’ordre de grandeur.',
      consequence:
        'Un même nombre de dossiers ne suffit pas à comparer deux antennes : sans base commune, le pourcentage annoncé peut tromper la décision.',
    },
  },
  {
    id: 'B2-01-REFERENCE',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['proportion'],
    notes:
      '[4 min · minutes 11 à 15 · mode piloté] Faites choisir la population de référence avant de formaliser la proportion. Demandez une justification, pas seulement le nombre.',
    question: QUESTION_REFERENCE,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-CONCEPT',
    brique: 'fp-concept4',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · minutes 15 à 21 · mode libre] Faites varier partie et total. Demandez à chaque étudiant de prédire l’effet d’un doublement du total, puis faites formuler la règle : le dénominateur est la population de référence.',
    proprietes: {
      parametres: [
        {
          cle: 'partie',
          libelle: 'partie',
          min: 10,
          max: 90,
          pas: 10,
          defaut: 30,
        },
        {
          cle: 'total',
          libelle: 'total',
          min: 100,
          max: 900,
          pas: 100,
          defaut: 100,
        },
      ],
      formuleLatexSimplifie: '\\dfrac{partie}{total} \\times 100',
      calcul: '(partie/total)*100',
      phrase: '{partie} représente {resultat} % de {total}.',
    },
  },
  {
    id: 'B2-01-CALCUL-MONTANT',
    brique: 'fp-numeric',
    dureeMinutes: 7,
    concepts: ['pourcentage'],
    notes:
      '[7 min · minutes 21 à 28 · mode piloté, seuil 70 %] Faites calculer le montant d’une part. Si le résultat est sous le seuil, reprenez le passage taux → nombre décimal avant la correction collective.',
    question: QUESTION_MONTANT,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-ATELIER',
    brique: 'questionnaire',
    regime: 'examen',
    dureeMinutes: 20,
    concepts: ['pourcentage', 'taux-evolution'],
    notes:
      '[20 min · minutes 28 à 48 · mode examen] Travail individuel sur trois questions. Autorisez calculatrice et tableur. Relevez séparément les erreurs de base, de facteur 100 et de taux d’évolution.',
    questions: [QUESTION_TOTAL, QUESTION_EVOLUTION, QUESTION_FORMULE],
  },
  {
    id: 'B2-01-GRAPHIQUE',
    brique: 'fp-plot',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · minutes 48 à 54 · mode piloté] Lisez le graphique comme une preuve de cohérence : une même hauteur ne signifie pas une même proportion si les bases diffèrent.',
    proprietes: {
      abscisse: { libelle: 'nombre de dossiers', min: 0, max: 300 },
      ordonnee: 'proportion en %',
      parametres: [],
      series: [
        { id: 'antenne-a', libelle: 'Antenne A', trait: 'plein', calcul: '30' },
        {
          id: 'antenne-b',
          libelle: 'Antenne B',
          trait: 'tirets',
          calcul: 'x/10',
        },
      ],
    },
  },
  {
    id: 'B2-01-CONTROLE-GRAPHIQUE',
    brique: 'fp-vote',
    dureeMinutes: 4,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[4 min · minutes 54 à 58 · mode piloté] Faites contrôler la lecture du graphique par une réponse argumentée. La bonne réponse doit citer la base et le pourcentage.',
    question: QUESTION_CONTROLE,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-REMEDIATION',
    brique: 'fp-worked',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes:
      '[6 min · minutes 58 à 64 · mode piloté] Corrigez l’erreur dominante avec un exemple complet : identifier la base, calculer l’écart, convertir en taux et interpréter. Faites verbaliser le contrôle d’ordre de grandeur.',
    proprietes: {
      enonce:
        'Une antenne compte 72 dossiers complets sur 240. Une recette passe de 400 € à 460 €. Produisez les deux indicateurs demandés par la direction.',
      etapes: [
        {
          id: 'base',
          intitule: 'Identifier la référence',
          raisonnement:
            'La base d’une proportion est le total 240 ; la base d’une évolution est la valeur de départ 400 €.',
          invite: 'Quelle valeur est au dénominateur ?',
        },
        {
          id: 'proportion',
          intitule: 'Calculer la proportion',
          raisonnement: '72 ÷ 240 = 0,30, soit 30 %.',
          invite: 'Le résultat est-il dans l’ordre de grandeur attendu ?',
        },
        {
          id: 'evolution',
          intitule: 'Calculer le taux',
          raisonnement:
            'L’écart vaut 60 €. Le taux vaut 60 ÷ 400 × 100 = 15 %.',
          invite: 'Pourquoi 60 € et 15 % ne sont-ils pas la même information ?',
        },
      ],
    },
  },
  {
    id: 'B2-01-TRANSFERT',
    brique: 'fp-recall',
    dureeMinutes: 8,
    concepts: ['proportion', 'taux-evolution'],
    notes:
      '[8 min · minutes 64 à 72 · mode piloté] Rejouez le rappel avec une situation nouvelle. Demandez la formule avant le nombre et faites comparer la réponse au diagnostic d’ouverture.',
    question: QUESTION_TRANSFERT,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-SORTIE',
    brique: 'fp-exit',
    dureeMinutes: 18,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes:
      '[18 min · minutes 72 à 90 · mode piloté] Faites répondre au billet de sortie, puis demandez une phrase complète avec calcul, unité et interprétation. Conservez les erreurs pour préparer le cours B2-02.',
    invite:
      'Écrivez la méthode que vous réutiliserez dans un tableau de gestion.',
    question: QUESTION_SORTIE,
  },
];

export const B2_01_TRAITEMENT_INFORMATION_CHIFFREE: Cours = {
  slug: REFERENTIEL.slug,
  titre: REFERENTIEL.titre,
  niveau: REFERENTIEL_B2.niveau,
  dureeMinutes: 90,
  concepts: ['proportion', 'pourcentage', 'taux-evolution'],
  ecrans: ECRANS,
  remediations: {
    'raisonnement-additif': 'B2-01-REMEDIATION',
    'taux-valeur-facteur-cent': 'B2-01-REMEDIATION',
    'base-arrivee': 'B2-01-REMEDIATION',
    'ecart-absolu-au-lieu-du-taux': 'B2-01-REMEDIATION',
    'coefficient-confondu-avec-taux': 'B2-01-REMEDIATION',
  },
  derogations: [],
};
