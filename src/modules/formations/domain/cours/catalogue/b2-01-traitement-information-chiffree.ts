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

const QUESTION_COMPARAISON = vote({
  id: 'B2-01-COMPARAISON-BASE',
  concept: 'proportion',
  noteCompte: true,
  donnees: () => ({ a: '45 ÷ 150', b: '30 ÷ 100' }),
  enonce: ({ a, b }) =>
    `Quelle conclusion est correcte quand on compare ${a} et ${b} ?`,
  bonne: () =>
    'Les deux proportions valent 30 % : les bases différentes sont prises en compte.',
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'La première est meilleure car 45 est supérieur à 30.',
    },
    {
      confusion: 'base-arrivee',
      libelle: () =>
        'Il faut comparer uniquement les nombres de dossiers complets.',
    },
  ],
});

const QUESTION_BUDGET = numerique({
  id: 'B2-01-BUDGET-POURCENTAGE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 1680, total: 4800, taux: 35 }),
  enonce: ({ total, taux }) =>
    `${pourcentage(taux)} d’un budget de ${euros(total)} correspondent à quel montant ?`,
  unite: '€',
  solution: ({ partie }) => partie,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ total, taux }) => total * taux,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ total, taux }) => total * (1 + taux / 100),
    },
  ],
});

const QUESTION_COEFFICIENT = vote({
  id: 'B2-01-COEFFICIENT-MULTIPLICATEUR',
  concept: 'coefficient-multiplicateur',
  noteCompte: true,
  donnees: () => ({ taux: 15 }),
  enonce: ({ taux }) =>
    `Quel coefficient multiplicateur correspond à une hausse de ${taux} % ?`,
  bonne: ({ taux }) => `1 + ${taux / 100} = 1,15`,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) => `${taux} % = 0,15`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) => `${taux} au lieu de 1,15`,
    },
  ],
});

const QUESTION_VERIFICATION = numerique({
  id: 'B2-01-VERIFICATION-COHERENCE',
  concept: 'proportion',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 84, total: 280, taux: 30 }),
  enonce: ({ partie, total }) =>
    `${partie} dossiers sur ${total} sont conformes. Quel pourcentage faut-il annoncer ?`,
  unite: '%',
  solution: ({ taux }) => taux,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ partie, total }) => partie / total,
    },
    {
      confusion: 'raisonnement-additif',
      valeur: ({ partie, total }) => ((partie + total) / total) * 100,
    },
  ],
});

const QUESTION_LIGNE_TABLEUR = vote({
  id: 'B2-01-LIGNE-TABLEUR',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: () => ({ partie: 'C2', total: 'D2' }),
  enonce: ({ partie, total }) =>
    `Dans un tableur, quelle formule calcule la proportion de ${partie} sur ${total} en pourcentage ?`,
  bonne: ({ partie, total }) => `=${partie}/${total}*100`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ partie, total }) => `=${partie}+${total}`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ partie, total }) => `=${partie}/${total}`,
    },
  ],
});

const QUESTION_TOTAL_2 = numerique({
  id: 'B2-01-TOTAL-REFERENCE-2',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 540, total: 1800, taux: 30 }),
  enonce: ({ partie, taux }) =>
    `${euros(partie)} représentent ${pourcentage(taux)}. Quel est le total de référence ?`,
  unite: '€',
  solution: ({ total }) => total,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ partie, taux }) => partie / (taux / 10000),
    },
    {
      confusion: 'base-arrivee',
      valeur: ({ partie, taux }) => partie * (taux / 100),
    },
  ],
});

const QUESTION_INTERPRETATION = vote({
  id: 'B2-01-INTERPRETATION-RESULTAT',
  concept: 'pourcentage',
  noteCompte: false,
  donnees: () => ({ taux: 30 }),
  enonce: ({ taux }) => `Comment interpréter un résultat de ${taux} % ?`,
  bonne: ({ taux }) =>
    `En moyenne, ${taux} dossiers sur 100 appartiennent à la partie étudiée.`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ taux }) =>
        `${taux} dossiers exactement, quelle que soit la base.`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) =>
        `Le nombre ${taux} est le coefficient à multiplier au total.`,
    },
  ],
});

const QUESTION_MIX = numerique({
  id: 'B2-01-MIX-EVOLUTION',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (): Evolution => ({ depart: 1200, arrivee: 1380, taux: 15 }),
  enonce: ({ depart, arrivee }) =>
    `Un chiffre passe de ${euros(depart)} à ${euros(arrivee)}. Quel est le taux d’évolution ?`,
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
  ],
});

const QUESTION_PARTIE = numerique({
  id: 'B2-01-PARTIE-DEPUIS-TOTAL',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 720, total: 2400, taux: 30 }),
  enonce: ({ total, taux }) =>
    `Quel montant représente ${pourcentage(taux)} d’un total de ${euros(total)} ?`,
  unite: '€',
  solution: ({ partie }) => partie,
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ total, taux }) => total * taux,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      valeur: ({ total, taux }) => total * (1 + taux / 100),
    },
  ],
});

const QUESTION_TOTAL_3 = numerique({
  id: 'B2-01-TOTAL-REFERENCE-3',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 450, total: 1500, taux: 30 }),
  enonce: ({ partie, taux }) =>
    `${euros(partie)} représentent ${pourcentage(taux)}. Quel est le total ?`,
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
      valeur: ({ partie, taux }) => partie * (taux / 100),
    },
  ],
});

const QUESTION_VERIFICATION_2 = numerique({
  id: 'B2-01-VERIFICATION-COHERENCE-2',
  concept: 'proportion',
  noteCompte: true,
  donnees: (): PartEtTotal => ({ partie: 45, total: 150, taux: 30 }),
  enonce: ({ partie, total }) =>
    `${partie} dossiers sur ${total} sont conformes. Quel pourcentage faut-il annoncer ?`,
  unite: '%',
  solution: ({ taux }) => taux,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: ({ partie, total }) => partie / total,
    },
    {
      confusion: 'raisonnement-additif',
      valeur: ({ partie, total }) => ((partie + total) / total) * 100,
    },
  ],
});

const QUESTION_TRANSFERT_2 = vote({
  id: 'B2-01-TRANSFERT-METHODE-2',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: () => ({ depart: 800, arrivee: 920 }),
  enonce: ({ depart, arrivee }) =>
    `Une recette passe de ${depart} € à ${arrivee} €. Quelle base utiliser pour le taux ?`,
  bonne: ({ depart }) =>
    `La valeur de départ ${depart} €, puis l’écart de 120 € rapporté à cette base.`,
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: ({ arrivee }) => `La valeur d’arrivée ${arrivee} €.`,
    },
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: () => 'L’écart de 120 € sans le rapport à la base.',
    },
  ],
});

const QUESTION_EVOLUTION_2 = numerique({
  id: 'B2-01-TAUX-EVOLUTION-2',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (): Evolution => ({ depart: 800, arrivee: 920, taux: 15 }),
  enonce: ({ depart, arrivee }) =>
    `Un chiffre passe de ${euros(depart)} à ${euros(arrivee)}. Quel est le taux ?`,
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
  ],
});

const QUESTION_FORMULE_2 = vote({
  id: 'B2-01-FORMULE-TABLEUR-2',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: () => ({ partie: 'C4', total: 'D4' }),
  enonce: ({ partie, total }) =>
    `Quelle formule calcule ${partie} sur ${total} en pourcentage ?`,
  bonne: ({ partie, total }) => `=${partie}/${total}*100`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ partie, total }) => `=${partie}+${total}`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ partie, total }) => `=${partie}/${total}`,
    },
  ],
});

const QUESTION_CONTROLE_2 = vote({
  id: 'B2-01-CONTROLE-COHERENCE-2',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ complet: 45, total: 150 }),
  enonce: ({ complet, total }) =>
    `Quel contrôle sécurise le résultat ${complet} sur ${total} ?`,
  bonne: ({ complet, total }) =>
    `Calculer ${complet} ÷ ${total} × 100 et vérifier la base ${total}.`,
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: () => 'Diviser par le nombre de dossiers incomplets.',
    },
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'Additionner la partie et le total.',
    },
  ],
});

const QUESTION_CORRECTION_2 = vote({
  id: 'B2-01-CORRECTION-COHERENCE',
  concept: 'proportion',
  noteCompte: true,
  donnees: () => ({ partie: 84, total: 280 }),
  enonce: ({ partie, total }) =>
    `Quelle phrase valide le calcul ${partie} sur ${total} ?`,
  bonne: () =>
    '84 ÷ 280 × 100 = 30 %, donc 30 dossiers sur 100 seraient conformes.',
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: () => '84 ÷ 280 = 0,3 %, sans conversion.',
    },
    {
      confusion: 'raisonnement-additif',
      libelle: () =>
        '84 + 280 = 364 %, car les deux nombres doivent être utilisés.',
    },
  ],
});

const ECRANS_BASE: readonly [Ecran, ...Ecran[]] = [
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

const ECRANS_EXTENSION: readonly [Ecran, ...Ecran[]] = [
  {
    id: 'B2-01-JEU-CLASSEMENT',
    brique: 'fp-cardsort',
    dureeMinutes: 7,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[7 min · mini-jeu] Classer les gestes de contrôle au clavier ou à la souris. Correction orale : calcul, conversion, ordre de grandeur, unité.',
    modalite: 'binome',
    proprietes: {
      id: 'B2-01-JEU-CLASSEMENT',
      intitule: 'Classez les gestes de contrôle dans l’ordre utile',
      cartes: [
        { id: 'c1', libelle: 'Identifier la partie et le total' },
        { id: 'c2', libelle: 'Calculer la partie ÷ total' },
        { id: 'c3', libelle: 'Multiplier par 100 si nécessaire' },
        { id: 'c4', libelle: 'Contrôler l’ordre de grandeur et l’unité' },
      ],
      categories: [{ id: 'etape', libelle: 'Méthode de contrôle' }],
    },
  },
  {
    id: 'B2-01-SITUATION-IMAGE',
    brique: 'fp-story',
    dureeMinutes: 5,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[5 min · image] Lire le tableau visuel et faire verbaliser ce qui est comparable. Vérification : un volume ne remplace jamais une proportion.',
    proprietes: {
      titre: 'Une même couleur, deux réalités',
      paragraphes: [
        'Le tableau de bord montre les volumes avant les pourcentages. La classe doit repérer ce que les volumes masquent.',
        'Le formateur révèle ensuite la base de chaque antenne et demande une interprétation en une phrase.',
      ],
      visuel: {
        src: '/assets/images/chart.png',
        alt: 'Graphique en barres comparant des volumes',
        legende: 'Support visuel : lire la donnée avant de la calculer.',
      },
    },
  },
  {
    id: 'B2-01-COMPARAISON',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[5 min · vérification] Comparer deux antennes. Calcul attendu : 45 ÷ 150 = 30 % et 30 ÷ 100 = 30 %.',
    question: QUESTION_COMPARAISON,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-COEFFICIENT',
    brique: 'fp-concept4',
    dureeMinutes: 5,
    concepts: ['pourcentage', 'coefficient-multiplicateur'],
    notes:
      '[5 min · curseur] Faire varier le taux de hausse et observer le coefficient. Vérification : une hausse de 15 % donne 1,15, pas 0,15.',
    proprietes: {
      parametres: [
        { cle: 'taux', libelle: 'taux', min: -50, max: 50, pas: 5, defaut: 15 },
      ],
      formuleLatexSimplifie: 'coefficient = 1 + taux/100',
      calcul: '1+taux/100',
      phrase: 'Le coefficient correspondant à {taux} % est {resultat}.',
    },
  },
  {
    id: 'B2-01-COEFFICIENT-QUIZ',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['coefficient-multiplicateur'],
    notes:
      '[5 min · quiz] Choisir le coefficient puis demander une justification orale.',
    question: QUESTION_COEFFICIENT,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-BUDGET',
    brique: 'fp-numeric',
    dureeMinutes: 6,
    concepts: ['pourcentage'],
    notes:
      '[6 min · calcul] Calculer 35 % de 4 800 €. Vérification : 4 800 × 0,35 = 1 680 €.',
    question: QUESTION_BUDGET,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-ATELIER-2',
    brique: 'questionnaire',
    regime: 'examen',
    dureeMinutes: 8,
    concepts: ['pourcentage', 'coefficient-multiplicateur'],
    notes:
      '[8 min · atelier 2] Trois questions : retrouver un total, écrire une formule et contrôler un taux. Correction après soumission.',
    questions: [
      QUESTION_TOTAL_2,
      QUESTION_LIGNE_TABLEUR,
      QUESTION_VERIFICATION,
    ],
  },
  {
    id: 'B2-01-TABLEUR',
    brique: 'fp-story',
    dureeMinutes: 5,
    concepts: ['pourcentage'],
    notes:
      '[5 min · image] Montrer la feuille de calcul et distinguer cellule de résultat et cellule de référence. Vérification : format, unité et traçabilité.',
    proprietes: {
      titre: 'Du tableau au tableur',
      paragraphes: [
        'Une formule fiable garde la partie et le total visibles. Le résultat doit rester traçable dans la feuille.',
        'Avant de communiquer, le groupe contrôle le format, l’unité et l’ordre de grandeur.',
      ],
      visuel: {
        src: '/assets/images/business_center.png',
        alt: 'Illustration d’un espace de travail avec données',
        legende:
          'Le calcul devient une preuve quand ses cellules restent lisibles.',
      },
    },
  },
  {
    id: 'B2-01-CORRECTION-2',
    brique: 'fp-vote',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · correction guidée] Choisir la formulation qui restitue le calcul, l’unité et l’interprétation.',
    question: QUESTION_CORRECTION_2,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-VERIFICATION-NUMERIQUE',
    brique: 'fp-numeric',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · calcul] Contrôler 84 sur 280. Vérification : 84 ÷ 280 × 100 = 30 %.',
    question: QUESTION_VERIFICATION_2,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-GRAPHIQUE-2',
    brique: 'fp-plot',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage'],
    notes:
      '[6 min · graphique] Manipuler la base de référence et lire la stabilité d’une proportion.',
    proprietes: {
      abscisse: { libelle: 'base de référence', min: 0, max: 300 },
      ordonnee: 'part en %',
      parametres: [],
      series: [
        { id: 'a', libelle: 'Antenne A', trait: 'plein', calcul: '30' },
        { id: 'b', libelle: 'Antenne B', trait: 'tirets', calcul: '30' },
      ],
    },
  },
  {
    id: 'B2-01-TRANSFERT-2',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['taux-evolution'],
    notes:
      '[5 min · transfert] Dire ce qui doit être contrôlé avant d’annoncer une évolution.',
    question: QUESTION_TRANSFERT_2,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-JEU-STRATEGIE',
    brique: 'fp-challenge',
    dureeMinutes: 6,
    concepts: ['taux-evolution', 'pourcentage'],
    notes:
      '[6 min · mini-jeu] Produire une règle en binôme pour expliquer la différence entre écart et taux.',
    modalite: 'binome',
    proprietes: {
      id: 'B2-01-JEU-STRATEGIE',
      enonce:
        'Le chiffre d’affaires passe de 400 € à 460 €. Le comité hésite entre 60 € et 15 %.',
      invite:
        'Écrivez la réponse qui garde les deux informations sans les confondre.',
      strategies: [
        { id: 'ecart', libelle: 'L’écart est 60 € et le taux est 15 %.' },
        { id: 'seul', libelle: 'Il suffit d’annoncer 60 €.' },
        { id: 'arrivee', libelle: 'Le taux se calcule sur 460 €.' },
      ],
    },
  },
  {
    id: 'B2-01-EVOLUTION',
    brique: 'fp-pro',
    dureeMinutes: 6,
    concepts: ['taux-evolution', 'coefficient-multiplicateur'],
    notes:
      '[6 min · situation métier] Distinguer départ, écart, taux et coefficient. Calcul affiché : 60 ÷ 400 × 100 = 15 %.',
    proprietes: {
      metier: 'Assistant comptable',
      situation:
        'Une recette passe de 400 € à 460 € et doit être commentée dans un tableau de gestion.',
      geste:
        'Calculer l’écart, le rapporter à la base de départ puis formuler le taux.',
      consequence:
        'Une valeur isolée ne permet pas de comparer deux évolutions.',
    },
  },
  {
    id: 'B2-01-TOTAL-2',
    brique: 'fp-numeric',
    dureeMinutes: 6,
    concepts: ['pourcentage'],
    notes:
      '[6 min · calcul inverse] Retrouver le total. Vérification : 540 ÷ 0,30 = 1 800 €.',
    question: QUESTION_TOTAL_3,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-PARTIE',
    brique: 'fp-numeric',
    dureeMinutes: 6,
    concepts: ['pourcentage'],
    notes:
      '[6 min · calcul] Retrouver une partie depuis un total et un taux. Vérification : 2 400 × 0,30 = 720 €.',
    question: QUESTION_PARTIE,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-ATELIER-3',
    brique: 'questionnaire',
    regime: 'examen',
    dureeMinutes: 8,
    concepts: ['proportion', 'taux-evolution', 'coefficient-multiplicateur'],
    notes:
      '[8 min · atelier 3] Trois questions intégrées : total, évolution et formule de tableur. Comparer les méthodes après soumission.',
    questions: [QUESTION_EVOLUTION_2, QUESTION_FORMULE_2, QUESTION_CONTROLE_2],
  },
  {
    id: 'B2-01-MODELE-EVOLUTION',
    brique: 'fp-concept4',
    dureeMinutes: 5,
    concepts: ['taux-evolution', 'coefficient-multiplicateur'],
    notes:
      '[5 min · modèle] Faire varier le départ et le taux. Graphique attendu : l’arrivée suit le coefficient multiplicateur.',
    proprietes: {
      parametres: [
        {
          cle: 'depart',
          libelle: 'départ',
          min: 100,
          max: 900,
          pas: 100,
          defaut: 400,
        },
        { cle: 'taux', libelle: 'taux', min: -50, max: 50, pas: 5, defaut: 15 },
      ],
      formuleLatexSimplifie: 'arrivee = depart \\times (1 + taux/100)',
      calcul: 'depart*(1+taux/100)',
      phrase: '{depart} évolue de {taux} % vers {resultat}.',
    },
  },
  {
    id: 'B2-01-INTERPRETATION',
    brique: 'fp-vote',
    dureeMinutes: 5,
    concepts: ['pourcentage'],
    notes:
      '[5 min · verbalisation] Choisir une interprétation correcte et la relier à une base de 100.',
    question: QUESTION_INTERPRETATION,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-LECTURE-IMAGE',
    brique: 'fp-story',
    dureeMinutes: 5,
    concepts: ['taux-evolution', 'pourcentage'],
    notes:
      '[5 min · image] Lire une carte de résultat. Vérification : ne pas confondre montant et pourcentage.',
    proprietes: {
      titre: 'Une carte de résultat doit raconter son calcul',
      paragraphes: [
        'Le lecteur doit pouvoir retrouver la base, le résultat, l’unité et la phrase d’interprétation.',
        'Le groupe repère ensuite la donnée qui manque et propose une reformulation.',
      ],
      visuel: {
        src: '/assets/images/auto_graph.png',
        alt: 'Illustration de tendance graphique et indicateurs',
        legende: 'Un graphique vérifie un raisonnement, il ne le remplace pas.',
      },
    },
  },
  {
    id: 'B2-01-MIX',
    brique: 'fp-numeric',
    dureeMinutes: 8,
    concepts: ['taux-evolution'],
    notes:
      '[8 min · calcul métier] Calculer le taux et comparer au coefficient. Vérification : 1 380 ÷ 1 200 = 1,15.',
    question: QUESTION_MIX,
    seuil: SEUIL_PAR_DEFAUT,
  },
  {
    id: 'B2-01-CORRECTION-FINALE',
    brique: 'fp-worked',
    dureeMinutes: 6,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes:
      '[6 min · correction finale] Rejouer la méthode complète et expliciter le contrôle d’ordre de grandeur.',
    proprietes: {
      enonce:
        'Une antenne compte 72 dossiers complets sur 240. Une recette passe de 400 € à 460 €.',
      etapes: [
        {
          id: 'base-finale',
          intitule: 'Identifier les bases',
          raisonnement: 'Le total 240 et le départ 400 € sont les références.',
          invite: 'Quelles valeurs gardez-vous ?',
        },
        {
          id: 'calcul-final',
          intitule: 'Calculer les indicateurs',
          raisonnement: '72 ÷ 240 = 30 % et 60 ÷ 400 × 100 = 15 %.',
          invite: 'Quel contrôle confirme vos résultats ?',
        },
      ],
    },
  },
  {
    id: 'B2-01-SORTIE-210',
    brique: 'fp-exit',
    dureeMinutes: 8,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes:
      '[7 min · billet de sortie] Réponse argumentée, calcul, unité et interprétation. Le bilan prépare B2-02.',
    invite:
      'Écrivez la méthode que vous réutiliserez dans un tableau de gestion, avec calcul, unité et interprétation.',
    question: QUESTION_SORTIE,
  },
];

const ECRANS: readonly [Ecran, ...Ecran[]] = [
  ECRANS_BASE[0],
  ...ECRANS_BASE.slice(1, -1),
  ...ECRANS_EXTENSION,
];

export const B2_01_TRAITEMENT_INFORMATION_CHIFFREE: Cours = {
  slug: REFERENTIEL.slug,
  titre: REFERENTIEL.titre,
  niveau: REFERENTIEL_B2.niveau,
  dureeMinutes: 210,
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
