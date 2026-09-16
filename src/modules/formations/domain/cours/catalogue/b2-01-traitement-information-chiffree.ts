import type { Tolerance } from '../../GradingCore';
import type {
  Cours,
  DefinitionNumerique,
  DefinitionVote,
  Ecran,
  Question,
  QuestionNumerique,
  QuestionVote,
} from '../Cours';
import { questionNumerique, questionVote } from '../Cours';
import type { ConceptId } from '../banque/concepts';
import { SEUIL_PAR_DEFAUT } from '../DeroulePresentateur';
import { REFERENTIEL_B2 } from '../referentiel-b2';

const REFERENTIEL = REFERENTIEL_B2.cours[0];
const TOLERANCE_EUROS: Tolerance = { type: 'decimales', valeur: 2 };
const TOLERANCE_POURCENTAGE: Tolerance = { type: 'absolue', valeur: 0.05 };
const VIDEO_POURCENTAGES = {
  src: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Mathematrix_Prozentrechnung_Vertiefend.webm',
  type: 'video/webm' as const,
  titre: 'Rappel vidéo : lire un pourcentage',
  poster: '/assets/images/percent.png',
  transcript:
    'Cette capsule rappelle le passage entre partie, total, taux et pourcentage. Elle doit être regardée avec la feuille de données Atelier Rivage, puis arrêtée pour vérifier chaque étape.',
  source:
    'https://commons.wikimedia.org/wiki/File:Mathematrix_Prozentrechnung_Vertiefend.webm',
  licence: 'CC BY-SA 4.0 — Yomomo',
};

interface PartTotal {
  readonly partie: number;
  readonly total: number;
  readonly taux: number;
}

interface Evolution {
  readonly depart: number;
  readonly arrivee: number;
  readonly taux: number;
}

interface DeuxEvolutions {
  readonly valeur: number;
  readonly hausse: number;
  readonly baisse: number;
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

const QUESTION_DIAGNOSTIC = vote({
  id: 'B2-01-V2-DIAGNOSTIC',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ partie: 72, total: 240 }),
  enonce: ({ partie, total }) =>
    `Le tableau indique ${partie} dossiers complets sur ${total}. Quelle phrase est prête à être dite au comité ?`,
  bonne: ({ partie, total }) =>
    `${partie} ÷ ${total} × 100 = 30 % : trois dossiers sur dix sont complets.`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: ({ partie, total }) =>
        `${partie} + ${total} = ${partie + total} %`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: () => '72 ÷ 240 = 0,3 %, sans convertir en pourcentage.',
    },
  ],
});

const QUESTION_BASE = vote({
  id: 'B2-01-V2-BASE',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ antenne: 2, complets: 45, total: 150 }),
  enonce: ({ antenne, complets, total }) =>
    `Dans l’antenne ${antenne}, ${complets} dossiers sur ${total} sont complets. Quelle valeur est la base de référence ?`,
  bonne: ({ total }) =>
    `${total} : la base est la population totale à laquelle on rapporte la partie.`,
  pieges: [
    {
      confusion: 'base-arrivee',
      libelle: ({ complets }) =>
        `${complets}, parce que c’est le nombre observé.`,
    },
    {
      confusion: 'raisonnement-additif',
      libelle: ({ complets, total }) =>
        `${complets} + ${total}, pour utiliser les deux nombres.`,
    },
  ],
});

const QUESTION_PARTIE = numerique({
  id: 'B2-01-V2-PARTIE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (tirage): PartTotal => {
    const total = tirage.entier(30, 80) * 100;
    const taux = tirage.choix([15, 20, 25, 30] as const);
    return { total, taux, partie: (total * taux) / 100 };
  },
  enonce: ({ total, taux }) =>
    `Le service achats consacre ${pourcentage(taux)} d’un budget de ${euros(total)}. Quel montant cela représente-t-il ?`,
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

const QUESTION_COMPARAISON = vote({
  id: 'B2-01-V2-COMPARAISON',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ aPart: 72, aTotal: 240, bPart: 45, bTotal: 150 }),
  enonce: ({ aPart, aTotal, bPart, bTotal }) =>
    `Quelle conclusion respecte les bases : ${aPart}/${aTotal} pour A et ${bPart}/${bTotal} pour B ?`,
  bonne: () =>
    'Les deux antennes sont à 30 % : les volumes diffèrent, la proportion est identique.',
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: () =>
        'A est meilleure car elle compte davantage de dossiers complets.',
    },
    {
      confusion: 'base-arrivee',
      libelle: () =>
        'B est meilleure car 45 est plus proche de 150 que 72 de 240.',
    },
  ],
});

const QUESTION_TOTAL = numerique({
  id: 'B2-01-V2-TOTAL',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: (tirage): PartTotal => {
    const taux = tirage.choix([20, 25, 30, 40] as const);
    const total = tirage.entier(12, 36) * 100;
    return { taux, total, partie: (total * taux) / 100 };
  },
  enonce: ({ partie, taux }) =>
    `${euros(partie)} représentent ${pourcentage(taux)} des achats du mois. Quel est le total ?`,
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

const QUESTION_TAUX = numerique({
  id: 'B2-01-V2-TAUX',
  concept: 'taux-evolution',
  noteCompte: true,
  donnees: (tirage): Evolution => {
    const depart = tirage.entier(20, 60) * 100;
    const taux = tirage.choix([10, 15, 20, 25] as const);
    return { depart, taux, arrivee: depart * (1 + taux / 100) };
  },
  enonce: ({ depart, arrivee }) =>
    `Le chiffre d’affaires passe de ${euros(depart)} à ${euros(arrivee)}. Quel est le taux d’évolution ?`,
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

const QUESTION_COEFFICIENT = vote({
  id: 'B2-01-V2-COEFFICIENT',
  concept: 'coefficient-multiplicateur',
  noteCompte: true,
  donnees: () => ({ taux: 15 }),
  enonce: ({ taux }) =>
    `Une hausse de ${taux} % s’écrit avec quel coefficient multiplicateur ?`,
  bonne: ({ taux }) =>
    `1 + ${taux}/100 = 1,${taux.toString().padStart(2, '0')}`,
  pieges: [
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ taux }) => `${taux}/100 = 0,15`,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ taux }) => `1 + ${taux} = 16`,
    },
  ],
});

const QUESTION_FORMULE = vote({
  id: 'B2-01-V2-FORMULE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: () => ({ total: 'B2', taux: 25 }),
  enonce: ({ total, taux }) =>
    `La cellule ${total} contient le total. Quelle formule calcule ${taux} % ?`,
  bonne: ({ total, taux }) => `=${total}*${taux / 100}`,
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: ({ total, taux }) => `=${total}*${taux}`,
    },
    {
      confusion: 'coefficient-confondu-avec-taux',
      libelle: ({ total, taux }) => `=${total}*(1+${taux / 100})`,
    },
  ],
});

const QUESTION_CONTROLE = vote({
  id: 'B2-01-V2-CONTROLE',
  concept: 'proportion',
  noteCompte: false,
  donnees: () => ({ partie: 84, total: 280 }),
  enonce: ({ partie, total }) =>
    `Quelle vérification sécurise ${partie} dossiers sur ${total} ?`,
  bonne: ({ partie, total }) =>
    `Calculer ${partie} ÷ ${total} × 100 = 30 %, puis vérifier l’unité et la base.`,
  pieges: [
    {
      confusion: 'raisonnement-additif',
      libelle: () => 'Additionner 84 et 280 puis annoncer le résultat.',
    },
    {
      confusion: 'base-arrivee',
      libelle: () => 'Diviser par les 196 dossiers incomplets.',
    },
  ],
});

const QUESTION_EVOLUTIONS = numerique({
  id: 'B2-01-V2-EVOLUTIONS',
  concept: 'evolutions-successives',
  noteCompte: true,
  donnees: (): DeuxEvolutions => ({ valeur: 1000, hausse: 20, baisse: 10 }),
  enonce: ({ valeur, hausse, baisse }) =>
    `Un budget de ${euros(valeur)} augmente de ${hausse} %, puis baisse de ${baisse} %. Quelle valeur finale obtient-on ?`,
  unite: '€',
  solution: ({ valeur, hausse, baisse }) =>
    valeur * (1 + hausse / 100) * (1 - baisse / 100),
  tolerance: TOLERANCE_EUROS,
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: ({ valeur, hausse, baisse }) =>
        valeur * (1 + (hausse - baisse) / 100),
    },
    {
      confusion: 'hausse-baisse-symetriques',
      valeur: ({ valeur }) => valeur,
    },
  ],
});

const QUESTION_RECIPROQUE = numerique({
  id: 'B2-01-V2-RECIPROQUE',
  concept: 'evolution-reciproque',
  noteCompte: true,
  donnees: (): Evolution => ({ depart: 800, arrivee: 920, taux: 15 }),
  enonce: ({ depart, arrivee }) =>
    `Une dépense passe de ${euros(depart)} à ${euros(arrivee)}. Quel taux faut-il appliquer à ${euros(arrivee)} pour revenir au départ ?`,
  unite: '%',
  solution: ({ depart, arrivee }) => ((depart - arrivee) / arrivee) * 100,
  tolerance: TOLERANCE_POURCENTAGE,
  pieges: [
    {
      confusion: 'reciproque-meme-taux',
      valeur: ({ taux }) => taux,
    },
    {
      confusion: 'base-arrivee',
      valeur: ({ depart, arrivee }) => ((depart - arrivee) / depart) * 100,
    },
  ],
});

const QUESTION_TAUX_MOYEN = numerique({
  id: 'B2-01-V2-TAUX-MOYEN',
  concept: 'taux-moyen',
  noteCompte: true,
  donnees: (): Evolution => ({ depart: 1000, arrivee: 1210, taux: 10 }),
  enonce: ({ depart, arrivee }) =>
    `Un indicateur passe de ${euros(depart)} à ${euros(arrivee)} en deux périodes au même rythme. Quel taux moyen par période ?`,
  unite: '%',
  solution: ({ depart, arrivee }) => (Math.sqrt(arrivee / depart) - 1) * 100,
  tolerance: { type: 'absolue', valeur: 0.1 },
  pieges: [
    {
      confusion: 'taux-successifs-additionnes',
      valeur: () => 10.5,
    },
    {
      confusion: 'taux-valeur-facteur-cent',
      valeur: () => 0.1,
    },
  ],
});

const QUESTION_DECISION = vote({
  id: 'B2-01-V2-DECISION',
  concept: 'taux-evolution',
  noteCompte: false,
  donnees: () => ({ depart: 1200, arrivee: 1380 }),
  enonce: ({ depart, arrivee }) =>
    `Quel commentaire peut être signé dans le compte rendu (${depart} € → ${arrivee} €) ?`,
  bonne: () =>
    'La recette augmente de 180 €, soit 15 % par rapport à la base de départ de 1 200 €.',
  pieges: [
    {
      confusion: 'ecart-absolu-au-lieu-du-taux',
      libelle: () => 'La recette progresse de 180 %.',
    },
    {
      confusion: 'base-arrivee',
      libelle: () => 'La recette progresse de 13,04 %, calculé sur 1 380 €.',
    },
  ],
});

const QUESTION_SORTIE = vote({
  id: 'B2-01-V2-SORTIE',
  concept: 'pourcentage',
  noteCompte: true,
  donnees: () => ({ partie: 96, total: 320 }),
  enonce: ({ partie, total }) =>
    `Pour ${partie} dossiers complets sur ${total}, quelle réponse professionnelle donne le calcul et son interprétation ?`,
  bonne: () => '96 ÷ 320 × 100 = 30 % : trois dossiers sur dix sont complets.',
  pieges: [
    {
      confusion: 'taux-valeur-facteur-cent',
      libelle: () => '96 ÷ 320 = 0,3 %, sans unité ni interprétation.',
    },
    {
      confusion: 'raisonnement-additif',
      libelle: () => '96 + 320 = 416 %, donc la qualité dépasse 100 %.',
    },
  ],
});

const QUESTION_BASE_TRANSFERT = {
  ...QUESTION_BASE,
  id: 'B2-01-V2-BASE-TRANSFERT',
};
const QUESTION_PARTIE_TABLEUR = {
  ...QUESTION_PARTIE,
  id: 'B2-01-V2-PARTIE-TABLEUR',
};
const QUESTION_PARTIE_COMITE = {
  ...QUESTION_PARTIE,
  id: 'B2-01-V2-PARTIE-COMITE',
};
const QUESTION_TOTAL_COMITE = {
  ...QUESTION_TOTAL,
  id: 'B2-01-V2-TOTAL-COMITE-QUESTION',
};
const QUESTION_TAUX_COMITE = { ...QUESTION_TAUX, id: 'B2-01-V2-TAUX-COMITE' };
const QUESTION_FORMULE_TABLEUR = {
  ...QUESTION_FORMULE,
  id: 'B2-01-V2-FORMULE-TABLEUR',
};
const QUESTION_FORMULE_COMITE = {
  ...QUESTION_FORMULE,
  id: 'B2-01-V2-FORMULE-COMITE',
};
const QUESTION_CONTROLE_VALIDATION = {
  ...QUESTION_CONTROLE,
  id: 'B2-01-V2-CONTROLE-VALIDATION',
};
const QUESTION_EVOLUTIONS_EVALUATION = {
  ...QUESTION_EVOLUTIONS,
  id: 'B2-01-V2-EVOLUTIONS-EVALUATION',
};
const QUESTION_RECIPROQUE_EVALUATION = {
  ...QUESTION_RECIPROQUE,
  id: 'B2-01-V2-RECIPROQUE-EVALUATION',
};
const QUESTION_DECISION_RAPPEL = {
  ...QUESTION_DECISION,
  id: 'B2-01-V2-DECISION-RAPPEL',
};
const QUESTION_DECISION_INTERPRETATION = {
  ...QUESTION_DECISION,
  id: 'B2-01-V2-DECISION-INTERPRETATION',
};

type Concepts = readonly [ConceptId, ...ConceptId[]];

function note(
  acte: number,
  action: string,
  preuve: string,
  controle: string,
  suite: string,
): string {
  return `[Acte ${acte}] Action : ${action} Preuve attendue : ${preuve} Vérification : ${controle} Suite : ${suite}`;
}

function story(
  id: string,
  dureeMinutes: number,
  titre: string,
  paragraphes: [string, ...string[]],
  concepts: Concepts,
  notes: string,
): Ecran {
  return {
    id,
    brique: 'fp-story',
    dureeMinutes,
    concepts,
    notes,
    proprietes: { titre, paragraphes },
  };
}

function storyWithMedia(
  id: string,
  dureeMinutes: number,
  titre: string,
  paragraphes: [string, ...string[]],
  concepts: Concepts,
  notes: string,
  media: {
    readonly visuel?: {
      readonly src: string;
      readonly alt: string;
      readonly legende: string;
    };
    readonly video?: typeof VIDEO_POURCENTAGES;
  },
): Ecran {
  return {
    id,
    brique: 'fp-story',
    dureeMinutes,
    concepts,
    notes,
    proprietes: { titre, paragraphes, ...media },
  };
}

function pro(
  id: string,
  dureeMinutes: number,
  metier: string,
  situation: string,
  geste: string,
  consequence: string,
  concepts: Concepts,
): Ecran {
  return {
    id,
    brique: 'fp-pro',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Faire lire la situation puis reformuler la demande du métier.',
      'Une phrase de décision avec base, valeur et unité.',
      'Comparer la phrase au tableau source et contrôler la vraisemblance.',
      'Reporter le résultat dans le dossier Atelier Rivage.',
    ),
    modalite: 'classe',
    proprietes: { metier, situation, geste, consequence },
  };
}

function worked(
  id: string,
  dureeMinutes: number,
  enonce: string,
  concepts: Concepts,
  etapes: [
    { id: string; intitule: string; raisonnement: string; invite: string },
    ...{ id: string; intitule: string; raisonnement: string; invite: string }[],
  ],
): Ecran {
  return {
    id,
    brique: 'fp-worked',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Dérouler une étape à la fois et demander une prédiction avant de révéler le raisonnement.',
      'Le calcul écrit avec les unités et la phrase métier.',
      'Recalculer avec une estimation mentale et vérifier le signe du résultat.',
      'Réutiliser la même méthode dans l’atelier suivant.',
    ),
    proprietes: { enonce, etapes },
  };
}

function plot(
  id: string,
  dureeMinutes: number,
  titre: string,
  source: string,
  abscisse: {
    readonly libelle: string;
    readonly min: number;
    readonly max: number;
  },
  ordonnee: string,
  series: [
    { id: string; libelle: string; trait: 'plein' | 'tirets'; calcul: string },
    ...{
      id: string;
      libelle: string;
      trait: 'plein' | 'tirets';
      calcul: string;
    }[],
  ],
  concepts: Concepts,
): Ecran {
  return {
    id,
    brique: 'fp-plot',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Faire décrire le graphique avant de donner la formule.',
      'Un titre, une unité, une lecture de tendance et une valeur repérée.',
      'Vérifier les axes, l’échelle et la cohérence avec le tableau.',
      'Utiliser le graphique pour défendre ou refuser la décision proposée.',
    ),
    modalite: 'binome',
    proprietes: { titre, source, abscisse, ordonnee, parametres: [], series },
  };
}

function challenge(
  id: string,
  dureeMinutes: number,
  enonce: string,
  invite: string,
  concepts: Concepts,
): Ecran {
  return {
    id,
    brique: 'fp-challenge',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Laisser le binôme construire une réponse avant la mise en commun.',
      'Une justification rédigée et une stratégie identifiable.',
      'Comparer la réponse au calcul de référence, pas seulement au résultat.',
      'Conserver la formulation qui pourra être dite au comité.',
    ),
    modalite: 'binome',
    proprietes: {
      id,
      enonce,
      invite,
      strategies: [
        {
          id: 'preuve',
          libelle: 'Je donne la base, le calcul, l’unité et l’interprétation.',
        },
        {
          id: 'volume',
          libelle: 'Je choisis le plus grand volume sans vérifier la base.',
        },
        {
          id: 'taux',
          libelle: 'Je donne un taux sans préciser la valeur de référence.',
        },
      ],
    },
  };
}

function cardsort(
  id: string,
  dureeMinutes: number,
  intitule: string,
  concepts: Concepts,
  cartes: [
    { id: string; libelle: string },
    ...{ id: string; libelle: string }[],
  ],
): Ecran {
  return {
    id,
    brique: 'fp-cardsort',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Faire classer les cartes puis demander au groupe de défendre l’ordre choisi.',
      'Une séquence complète : référence, calcul, contrôle, communication.',
      'Vérifier qu’aucune carte ne remplace une unité ou une phrase d’interprétation.',
      'Passer du geste mathématique au geste professionnel.',
    ),
    modalite: 'groupe',
    proprietes: {
      id,
      intitule,
      cartes,
      categories: [{ id: 'methode', libelle: 'Méthode fiable' }],
    },
  };
}

function questionnaire(
  id: string,
  dureeMinutes: number,
  regime: 'focus' | 'examen',
  concepts: Concepts,
  questions: [Question, ...Question[]],
): Ecran {
  return {
    id,
    brique: 'questionnaire',
    regime,
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Donner le temps annoncé pour produire une réponse complète, puis corriger les méthodes en groupe.',
      'Les étapes de calcul, la formule ou la phrase de décision, pas une suite de clics.',
      'Faire annoter l’erreur : base, conversion, coefficient, signe ou unité.',
      'Utiliser les erreurs pour choisir la remédiation avant l’acte suivant.',
    ),
    modalite: 'solo',
    questions,
  };
}

function numeriqueScreen(
  id: string,
  dureeMinutes: number,
  question: QuestionNumerique,
  concepts: Concepts,
): Ecran {
  return {
    id,
    brique: 'fp-numeric',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Laisser poser le calcul puis demander la ligne de contrôle avant de valider.',
      'Un nombre avec son unité et un ordre de grandeur.',
      'Comparer le résultat à une estimation et identifier la base.',
      'Réinvestir le geste dans le dossier suivant.',
    ),
    question,
    seuil: SEUIL_PAR_DEFAUT,
  };
}

function voteScreen(
  id: string,
  dureeMinutes: number,
  question: QuestionVote,
  concepts: Concepts,
): Ecran {
  return {
    id,
    brique: 'fp-vote',
    dureeMinutes,
    concepts,
    notes: note(
      1,
      'Faire choisir puis exiger une justification orale ou écrite.',
      'L’option choisie accompagnée de la valeur de référence.',
      'Révéler le corrigé seulement après le raisonnement collectif.',
      'Faire reformuler la règle dans un contexte de gestion.',
    ),
    question,
    seuil: SEUIL_PAR_DEFAUT,
  };
}

const ECRANS_ACTE_1: readonly Ecran[] = [
  {
    id: 'B2-01-V2-01-DIAGNOSTIC',
    brique: 'fp-recall',
    dureeMinutes: 4,
    concepts: ['proportion'],
    notes: note(
      1,
      'Recueillir les conceptions initiales sans corriger immédiatement.',
      'Le choix et la justification du dénominateur.',
      'Comparer la réponse à la base métier du tableau.',
      'Lancer la mission Atelier Rivage.',
    ),
    question: QUESTION_DIAGNOSTIC,
    seuil: SEUIL_PAR_DEFAUT,
  },
  story(
    'B2-01-V2-02-MISSION',
    4,
    '08:42 — le tableau qui bloque la réunion',
    [
      'Atelier Rivage fabrique et répare du mobilier pour des entreprises. Chaque lundi, Lina prépare le tableau de bord destiné à la direction.',
      'Ce matin, deux antennes annoncent des volumes différents. La direction demande : « laquelle maîtrise vraiment ses dossiers ? » Le chiffre brut ne suffit pas ; il faut rendre la comparaison défendable.',
    ],
    ['proportion', 'pourcentage'],
    note(
      1,
      'Lire la scène comme le début d’une enquête.',
      'La question de gestion reformulée en indicateur comparable.',
      'Vérifier que la comparaison ne confond pas volume et qualité.',
      'Ouvrir la première pièce du dossier.',
    ),
  ),
  voteScreen('B2-01-V2-03-REFERENCE', 3, QUESTION_BASE, ['proportion']),
  pro(
    'B2-01-V2-04-COLLECTE',
    4,
    'Assistante de gestion',
    'Le fichier affiche 72 dossiers complets sur 240 à Nantes et 45 sur 150 à Rennes, mais la colonne « performance » mélange les volumes et les taux.',
    'Nommer partie, total, unité et question avant de calculer.',
    'Sans base explicite, le comité peut prendre une décision opposée aux données.',
    ['proportion', 'pourcentage'],
  ),
  cardsort(
    'B2-01-V2-05-ORDRE',
    3,
    'Remettre l’enquête dans l’ordre',
    ['proportion'],
    [
      { id: 'partie', libelle: 'Identifier la partie observée' },
      { id: 'base', libelle: 'Identifier le total de référence' },
      { id: 'calcul', libelle: 'Calculer partie ÷ total × 100' },
      { id: 'phrase', libelle: 'Écrire la phrase et l’unité' },
    ],
  ),
  storyWithMedia(
    'B2-01-V2-06-VIDEO',
    5,
    VIDEO_POURCENTAGES.titre,
    [
      'Regardez la capsule par segments. À chaque passage partie → total → pourcentage, mettez pause et reliez le geste au tableau Atelier Rivage.',
      'La vidéo apporte un rappel ; la compétence évaluée reste la capacité à contrôler et communiquer une donnée réelle.',
    ],
    ['proportion', 'pourcentage'],
    note(
      1,
      'Faire regarder la vidéo avec la fiche entreprise et arrêter sur les étapes clés.',
      'Un lien explicite entre l’exemple vidéo et une ligne du tableau.',
      'Contrôler le facteur 100 et l’unité.',
      'Revenir au cas d’Atelier Rivage.',
    ),
    { video: VIDEO_POURCENTAGES },
  ),
  challenge(
    'B2-01-V2-07-QUESTION-COMITE',
    2,
    'Le directeur veut classer les antennes avec les seuls nombres 72 et 45.',
    'Rédigez une réponse qui explique pourquoi cette décision serait fragile.',
    ['proportion'],
  ),
  storyWithMedia(
    'B2-01-V2-08-DEBRIEF',
    4,
    'La pièce n°1 : une donnée n’est pas encore un indicateur',
    [
      '72 et 45 sont des parties. Elles deviennent comparables quand chaque partie est rapportée à sa base : 72/240 et 45/150.',
      'Ce détour n’est pas une formalité scolaire : il protège la décision contre l’effet de taille des antennes.',
    ],
    ['proportion', 'pourcentage'],
    note(
      1,
      'Faire verbaliser le passage de la donnée brute à l’indicateur.',
      'Les deux proportions formulées avec leurs bases.',
      'Vérifier que les deux résultats sont comparés sur la même échelle.',
      'Préparer le calcul détaillé de l’acte 2.',
    ),
    {
      visuel: {
        src: '/assets/images/table_chart.png',
        alt: 'Tableau de données et graphique de comparaison',
        legende:
          'Le tableau reste la pièce source ; le graphique aide à le lire.',
      },
    },
  ),
  pro(
    'B2-01-V2-09-CONTRAT',
    1,
    'Lina, contrôleuse du tableau de bord',
    'Lina accepte de présenter les indicateurs seulement si chaque résultat comporte sa base, son unité et une phrase de lecture.',
    'Adopter le contrat de preuve : calcul, contrôle, communication.',
    'Le contrat servira de grille au comité final.',
    ['proportion', 'pourcentage'],
  ),
];

const ECRANS_ACTE_2: readonly Ecran[] = [
  numeriqueScreen('B2-01-V2-10-MONTANT', 3, QUESTION_PARTIE, ['pourcentage']),
  storyWithMedia(
    'B2-01-V2-11-BASE-100',
    5,
    'Pourquoi ramener à 100 ?',
    [
      'Un pourcentage est une proportion exprimée sur une base commune de 100. Il permet de comparer des antennes de tailles différentes sans effacer leurs volumes.',
      'Pour Atelier Rivage, 30 % signifie « 30 dossiers pour 100 dans les mêmes conditions », pas « 30 dossiers tout court ».',
    ],
    ['proportion', 'pourcentage'],
    note(
      2,
      'Faire dessiner deux groupes de 100 puis replacer les données réelles.',
      'Une représentation sur 100 et la phrase associée.',
      'Vérifier que la base 100 ne remplace pas la base réelle du tableau.',
      'Passer à la comparaison des antennes.',
    ),
    {
      visuel: {
        src: '/assets/images/percent.png',
        alt: 'Icône de pourcentage appliquée à un tableau de gestion',
        legende:
          'Le pourcentage traduit une relation, il ne décrit pas un volume isolé.',
      },
    },
  ),
  voteScreen('B2-01-V2-12-COMPARER', 3, QUESTION_COMPARAISON, [
    'proportion',
    'pourcentage',
  ]),
  worked(
    'B2-01-V2-13-CALCUL-GUIDE',
    6,
    'Comparer Nantes et Rennes à partir de 72/240 et 45/150.',
    ['proportion', 'pourcentage'],
    [
      {
        id: 'reference',
        intitule: 'Poser les bases',
        raisonnement:
          'Nantes se rapporte à 240 et Rennes à 150 : chaque total est la population de référence.',
        invite: 'Quels nombres vont au dénominateur ?',
      },
      {
        id: 'nantes',
        intitule: 'Calculer Nantes',
        raisonnement: '72 ÷ 240 = 0,30, soit 30 %.',
        invite: 'Quel contrôle d’ordre de grandeur confirme 30 % ?',
      },
      {
        id: 'rennes',
        intitule: 'Calculer Rennes',
        raisonnement: '45 ÷ 150 = 0,30, soit 30 %.',
        invite: 'Quelle différence reste entre les deux antennes ?',
      },
      {
        id: 'decision',
        intitule: 'Conclure',
        raisonnement:
          'Les proportions sont égales ; les volumes ne permettent pas de déclarer une antenne meilleure.',
        invite: 'Quelle phrase peut être communiquée ?',
      },
    ],
  ),
  cardsort(
    'B2-01-V2-15-CONTROLE',
    4,
    'Classer les contrôles avant publication',
    ['proportion', 'pourcentage'],
    [
      { id: 'c1', libelle: 'Recalculer sur la ligne source' },
      { id: 'c2', libelle: 'Vérifier la base et l’unité' },
      { id: 'c3', libelle: 'Comparer les ordres de grandeur' },
      { id: 'c4', libelle: 'Rédiger une phrase sans surinterpréter' },
    ],
  ),
  plot(
    'B2-01-V2-14-GRAPHIQUE-VOLUMES',
    3,
    'Volumes observés et proportion comparable',
    'Source : tableau pédagogique Atelier Rivage, données fictives',
    { libelle: 'dossiers traités', min: 0, max: 300 },
    'dossiers complets',
    [
      { id: 'nantes', libelle: 'Nantes', trait: 'plein', calcul: '0.3*x' },
      { id: 'rennes', libelle: 'Rennes', trait: 'tirets', calcul: '0.3*x' },
    ],
    ['proportion', 'pourcentage'],
  ),
  questionnaire(
    'B2-01-V2-16-ATELIER-PARTS',
    3,
    'focus',
    ['proportion', 'pourcentage'],
    [QUESTION_TOTAL, QUESTION_FORMULE],
  ),
  pro(
    'B2-01-V2-17-DASHBOARD',
    4,
    'Responsable qualité',
    'Le responsable qualité veut afficher « 30 % de dossiers complets » dans le dashboard, mais il doit pouvoir remonter à la ligne source en audit.',
    'Conserver le numérateur, le dénominateur, la formule et la date de mesure.',
    'Un indicateur non traçable devient une opinion dès que la réunion conteste le résultat.',
    ['proportion', 'pourcentage'],
  ),
  challenge(
    'B2-01-V2-19-PHRASE',
    2,
    'Le tableau annonce 30 % mais aucune base n’est visible dans le dashboard.',
    'Écrivez la question à poser avant de valider l’indicateur.',
    ['proportion', 'pourcentage'],
  ),
  storyWithMedia(
    'B2-01-V2-18-LECTURE',
    3,
    'Lire un graphique comme une phrase',
    [
      'Commencez par le titre : que mesure-t-on ? Puis lisez l’axe horizontal, l’axe vertical et la série. Une courbe n’est pas une décoration.',
      'La phrase « à 200 dossiers, les deux antennes atteignent 60 dossiers complets » est vérifiable. « Nantes est meilleure » ne l’est pas sans base.',
    ],
    ['proportion', 'pourcentage'],
    note(
      2,
      'Faire annoter titre, unités, séries et conclusion sur le graphique.',
      'Une phrase de lecture qui cite une valeur.',
      'Vérifier qu’elle ne transforme pas un volume en jugement de performance.',
      'Préparer le mini-jeu de communication.',
    ),
    {
      visuel: {
        src: '/assets/images/chart.png',
        alt: 'Graphique de données annoté',
        legende: 'Titre, unités et source rendent un graphique exploitable.',
      },
    },
  ),
];

const ECRANS_ACTE_3: readonly Ecran[] = [
  voteScreen('B2-01-V2-20-ECART-TAUX', 3, QUESTION_COEFFICIENT, [
    'coefficient-multiplicateur',
  ]),
  storyWithMedia(
    'B2-01-V2-21-ALERTE-CA',
    5,
    'Le chiffre d’affaires monte — mais de combien ?',
    [
      'Lina constate que les ventes passent de 1 200 € à 1 380 €. Le directeur lit « +180 » ; la responsable commerciale demande « + combien en proportion ? ».',
      'L’écart répond à une question en euros. Le taux répond à une question de comparaison avec la base de départ.',
    ],
    ['taux-evolution', 'coefficient-multiplicateur'],
    note(
      3,
      'Faire distinguer les deux questions avant toute formule.',
      'Deux réponses séparées : +180 € et +15 %.',
      'Vérifier que le taux utilise 1 200 € comme base.',
      'Formaliser l’évolution et le coefficient.',
    ),
    {
      visuel: {
        src: '/assets/images/trending_up.png',
        alt: 'Flèche de tendance vers le haut pour une recette',
        legende:
          'Une hausse doit être rapportée à sa base pour être comparable.',
      },
    },
  ),
  numeriqueScreen('B2-01-V2-25-TAUX', 4, QUESTION_TAUX, ['taux-evolution']),
  worked(
    'B2-01-V2-22-TAUX-GUIDE',
    5,
    'Passer de 1 200 € à 1 380 € et préparer la phrase de compte rendu.',
    ['taux-evolution', 'coefficient-multiplicateur'],
    [
      {
        id: 'ecart',
        intitule: 'Calculer l’écart',
        raisonnement: '1 380 − 1 200 = 180 €.',
        invite: 'L’écart est-il déjà un taux ?',
      },
      {
        id: 'base',
        intitule: 'Choisir la base',
        raisonnement:
          'La valeur de départ 1 200 € est la référence de l’évolution.',
        invite: 'Pourquoi ne pas diviser par 1 380 ?',
      },
      {
        id: 'taux',
        intitule: 'Calculer le taux',
        raisonnement: '180 ÷ 1 200 × 100 = 15 %.',
        invite: 'Quel contrôle mental confirme le résultat ?',
      },
      {
        id: 'coefficient',
        intitule: 'Construire le coefficient',
        raisonnement: '1 + 15/100 = 1,15 ; 1 200 × 1,15 = 1 380.',
        invite: 'Quelle valeur porte le coefficient ?',
      },
    ],
  ),
  questionnaire(
    'B2-01-V2-26-ATELIER-EVOLUTIONS',
    3,
    'examen',
    ['taux-evolution', 'coefficient-multiplicateur'],
    [QUESTION_RECIPROQUE, QUESTION_EVOLUTIONS],
  ),
  {
    id: 'B2-01-V2-23-COEFFICIENT',
    brique: 'fp-concept4',
    dureeMinutes: 4,
    concepts: ['taux-evolution', 'coefficient-multiplicateur'],
    notes: note(
      3,
      'Faire varier le taux et demander une prédiction avant chaque déplacement.',
      'La relation taux ↔ coefficient dans les deux sens.',
      'Vérifier une hausse et une baisse avec le signe.',
      'Choisir la formule adaptée au dossier suivant.',
    ),
    proprietes: {
      parametres: [
        {
          cle: 'taux',
          libelle: 'taux d’évolution',
          min: -50,
          max: 50,
          pas: 5,
          defaut: 15,
        },
      ],
      formuleLatexSimplifie: 'coefficient = 1 + taux/100',
      calcul: '1+taux/100',
      phrase: 'Pour {taux} %, le coefficient est {resultat}.',
    },
  },
  challenge(
    'B2-01-V2-28-SUCCESSIVES',
    3,
    'Une remise de 10 % suit une hausse de 20 %. Le comité écrit +10 %.',
    'Rédigez la correction en coefficients et expliquez pourquoi les pourcentages ne s’additionnent pas.',
    ['evolutions-successives', 'coefficient-multiplicateur'],
  ),
  plot(
    'B2-01-V2-24-COURBE-CA',
    3,
    'Une même hausse en euros n’a pas le même sens',
    'Source : scénario pédagogique Atelier Rivage, données fictives',
    { libelle: 'base de départ (€)', min: 0, max: 2000 },
    'recette d’arrivée (€)',
    [
      {
        id: 'quinze',
        libelle: 'Hausse de 15 %',
        trait: 'plein',
        calcul: '1.15*x',
      },
      {
        id: 'vingt',
        libelle: 'Hausse de 20 %',
        trait: 'tirets',
        calcul: '1.2*x',
      },
    ],
    ['taux-evolution', 'coefficient-multiplicateur'],
  ),
  challenge(
    'B2-01-V2-27-COMMUNICATION',
    3,
    'La direction veut comparer la croissance des ventes et des réparations, dont les montants de départ sont très différents.',
    'Rédigez une phrase qui donne l’écart, le taux et la valeur de départ.',
    ['taux-evolution', 'coefficient-multiplicateur'],
  ),
  storyWithMedia(
    'B2-01-V2-29-DEBRIEF-EVOL',
    3,
    'Deux taux successifs racontent une trajectoire',
    [
      'Une hausse de 20 % multiplie par 1,20. Une baisse de 10 % multiplie ensuite par 0,90. Le résultat est 1,08 fois le départ, donc +8 %, pas +10 %.',
      'Le coefficient conserve la chaîne du calcul et évite de faire porter au dernier taux une base qui a changé.',
    ],
    ['evolutions-successives', 'coefficient-multiplicateur'],
    note(
      3,
      'Faire représenter les deux coefficients sur une ligne du temps.',
      'La chaîne 1,20 × 0,90 = 1,08.',
      'Recalculer la valeur finale et vérifier l’interprétation.',
      'Passer du calcul isolé au tableur contrôlable.',
    ),
    {
      visuel: {
        src: '/assets/images/history.png',
        alt: 'Historique de valeurs et évolution successive',
        legende:
          'Une trajectoire conserve les étapes et les bases qui changent.',
      },
    },
  ),
];

const ECRANS_ACTE_4: readonly Ecran[] = [
  voteScreen('B2-01-V2-30-FORMULE', 3, QUESTION_FORMULE_TABLEUR, [
    'pourcentage',
  ]),
  pro(
    'B2-01-V2-31-TABLEUR',
    4,
    'Assistante comptable',
    'La feuille de suivi contient un total en B2, une partie en C2 et un taux en D2. Une formule copiée sur 40 lignes doit rester contrôlable.',
    'Séparer les cellules sources, écrire la formule et vérifier le format du résultat.',
    'Une formule compacte mais opaque coûte plus cher à auditer qu’une formule lisible.',
    ['pourcentage', 'proportion'],
  ),
  questionnaire(
    'B2-01-V2-37-ATELIER-TABLEUR',
    3,
    'examen',
    ['pourcentage', 'proportion'],
    [QUESTION_CONTROLE, QUESTION_PARTIE_TABLEUR],
  ),
  storyWithMedia(
    'B2-01-V2-32-CHECKLIST',
    3,
    'La feuille qui résiste à la relecture',
    [
      'Une bonne feuille montre la source, la formule, l’unité, la date et le contrôle. Elle ne cache pas le total dans une constante impossible à retrouver.',
      'Le groupe doit repérer les cellules qui permettent à une autre personne de recalculer le résultat sans demander d’explication orale.',
    ],
    ['pourcentage'],
    note(
      4,
      'Faire inspecter une ligne de tableur fictive et relever les preuves manquantes.',
      'Une checklist de traçabilité remplie.',
      'Recalculer une ligne sans faire confiance au résultat affiché.',
      'Construire le calcul pas à pas.',
    ),
    {
      visuel: {
        src: '/assets/images/business_center.png',
        alt: 'Espace de travail et tableau de gestion',
        legende:
          'La traçabilité est une fonctionnalité métier, pas une décoration.',
      },
    },
  ),
  challenge(
    'B2-01-V2-38-GRAPHIQUE',
    3,
    'Le graphique affiche 82 %, mais la ligne source donne 82 dossiers sur 1000.',
    'Écrivez les deux contrôles prioritaires avant de corriger le graphique.',
    ['proportion', 'pourcentage'],
  ),
  worked(
    'B2-01-V2-33-TABLEUR-GUIDE',
    5,
    'Construire une ligne de contrôle pour 84 dossiers sur 280.',
    ['proportion', 'pourcentage'],
    [
      {
        id: 'partie',
        intitule: 'Saisir la partie',
        raisonnement: 'La cellule C2 contient 84 dossiers complets.',
        invite: 'Quelle donnée observée entre dans la formule ?',
      },
      {
        id: 'total',
        intitule: 'Saisir la base',
        raisonnement: 'La cellule B2 contient 280 dossiers au total.',
        invite: 'Quelle cellule est le dénominateur ?',
      },
      {
        id: 'formule',
        intitule: 'Écrire la formule',
        raisonnement: '=C2/B2 donne 0,30 ; le format pourcentage affiche 30 %.',
        invite: 'Que change le format, et que ne change-t-il pas ?',
      },
      {
        id: 'controle',
        intitule: 'Contrôler',
        raisonnement:
          '84 est inférieur à 280 et 30 % est plausible ; la phrase est « 3 dossiers sur 10 ».',
        invite: 'Quelle vérification indépendante ajoutez-vous ?',
      },
    ],
  ),
  cardsort(
    'B2-01-V2-36-ANOMALIE',
    3,
    'Repérer l’anomalie avant la réunion',
    ['proportion', 'pourcentage'],
    [
      { id: 'titre', libelle: 'Lire le titre et l’unité' },
      { id: 'axe', libelle: 'Vérifier les axes et leur échelle' },
      { id: 'source', libelle: 'Retrouver la ligne source' },
      { id: 'decision', libelle: 'Formuler la conséquence métier' },
    ],
  ),
  storyWithMedia(
    'B2-01-V2-34-VIDEO-TABLEUR',
    3,
    'Une démonstration se regarde avec une question',
    [
      'La capsule vidéo sert de support de rappel, jamais de preuve finale. Pendant la lecture, notez le moment où le taux devient une valeur décimale.',
      'À la fin, comparez la ligne de la vidéo à la ligne Atelier Rivage et signalez une différence de base ou d’unité.',
    ],
    ['pourcentage', 'proportion'],
    note(
      4,
      'Projeter la vidéo en grand écran et faire annoter une feuille de suivi.',
      'Une annotation qui distingue taux affiché et valeur décimale.',
      'Vérifier la formule sur une donnée de l’entreprise.',
      'Tester le graphique de contrôle.',
    ),
    { video: VIDEO_POURCENTAGES },
  ),
  voteScreen('B2-01-V2-39-VALIDATION', 3, QUESTION_CONTROLE_VALIDATION, [
    'proportion',
  ]),
  plot(
    'B2-01-V2-35-GRAPHIQUE-CONTROLE',
    4,
    'Le graphique comme contrôle de cohérence',
    'Source : simulation pédagogique Atelier Rivage, formule explicitée dans le tableau',
    { libelle: 'mois', min: 1, max: 12 },
    'taux de dossiers complets (%)',
    [
      {
        id: 'objectif',
        libelle: 'Objectif 70 %',
        trait: 'tirets',
        calcul: '70',
      },
      {
        id: 'mesure',
        libelle: 'Mesure observée',
        trait: 'plein',
        calcul: '54+2*x',
      },
    ],
    ['proportion', 'pourcentage'],
  ),
  challenge(
    'B2-01-V2-40-TRANSMISSION',
    4,
    'Le fichier est juste, mais le directeur ne comprend pas le message.',
    'Rédigez la phrase de transmission en citant mesure, base, unité et conséquence.',
    ['pourcentage', 'proportion'],
  ),
];

const ECRANS_ACTE_5: readonly Ecran[] = [
  {
    id: 'B2-01-V2-41-RAPPEL-COMITE',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['proportion', 'taux-evolution'],
    notes: note(
      5,
      'Réactiver les deux méthodes avant le dossier complet.',
      'Une formule de proportion et une formule de taux.',
      'Faire préciser les deux bases.',
      'Distribuer le cas du comité.',
    ),
    question: QUESTION_DECISION_RAPPEL,
    seuil: SEUIL_PAR_DEFAUT,
  },
  storyWithMedia(
    'B2-01-V2-42-DOSSIER',
    3,
    'Acte 5 — le comité ouvre le dossier',
    [
      'Le comité doit décider s’il finance une seconde équipe de réparation. Trois pièces arrivent ensemble : volumes, taux de dossiers complets et chiffre d’affaires.',
      'La décision n’est pas « trouver un nombre ». Il faut construire une conclusion qui supporte la contradiction et qui indique ce que la donnée ne permet pas d’affirmer.',
    ],
    ['proportion', 'pourcentage', 'taux-evolution'],
    note(
      5,
      'Distribuer le dossier et faire surligner les données nécessaires.',
      'Les parties, bases, départs, arrivées et unités identifiés.',
      'Vérifier qu’aucune comparaison ne mélange des bases différentes.',
      'Entrer dans le calcul de décision.',
    ),
    {
      visuel: {
        src: '/assets/images/receipt.png',
        alt: 'Pièce comptable utilisée comme document source',
        legende:
          'Une décision commence par des pièces, pas par un graphique isolé.',
      },
    },
  ),
  numeriqueScreen('B2-01-V2-43-TOTAL-COMITE', 4, QUESTION_TOTAL_COMITE, [
    'pourcentage',
  ]),
  worked(
    'B2-01-V2-44-DOSSIER-GUIDE',
    5,
    'Préparer la recommandation à partir de 30 % de dossiers complets et +15 % de recette.',
    ['proportion', 'pourcentage', 'taux-evolution'],
    [
      {
        id: 'qualite',
        intitule: 'Mesurer la qualité',
        raisonnement: '72 ÷ 240 × 100 = 30 % de dossiers complets.',
        invite: 'Quelle est la base de cet indicateur ?',
      },
      {
        id: 'recette',
        intitule: 'Mesurer l’évolution',
        raisonnement: '(1 380 − 1 200) ÷ 1 200 × 100 = 15 %.',
        invite: 'Quel est le départ de l’évolution ?',
      },
      {
        id: 'limite',
        intitule: 'Nommer la limite',
        raisonnement:
          'Ces indicateurs ne prouvent pas à eux seuls la rentabilité : il manque les coûts.',
        invite: 'Que refusez-vous de conclure ?',
      },
      {
        id: 'recommandation',
        intitule: 'Recommander',
        raisonnement:
          'Proposer un financement conditionné à la collecte des coûts et au suivi du taux.',
        invite: 'Quelle décision est proportionnée aux preuves ?',
      },
    ],
  ),
  questionnaire(
    'B2-01-V2-47-DOSSIER-COMPLET',
    6,
    'examen',
    ['proportion', 'pourcentage', 'taux-evolution'],
    [QUESTION_PARTIE_COMITE, QUESTION_TAUX_COMITE, QUESTION_FORMULE_COMITE],
  ),
  plot(
    'B2-01-V2-45-COMITE',
    4,
    'La qualité et la recette ne racontent pas la même chose',
    'Source : cas fictif Atelier Rivage, comité mensuel',
    { libelle: 'mois', min: 1, max: 6 },
    'indicateur indexé base 100',
    [
      {
        id: 'qualite',
        libelle: 'Dossiers complets',
        trait: 'plein',
        calcul: '100+4*x',
      },
      { id: 'recette', libelle: 'Recette', trait: 'tirets', calcul: '100+7*x' },
    ],
    ['proportion', 'taux-evolution'],
  ),
  voteScreen('B2-01-V2-46-LECTURE-COMITE', 3, QUESTION_DECISION, [
    'taux-evolution',
  ]),
  challenge(
    'B2-01-V2-48-OBJECTION',
    3,
    'Un dirigeant affirme : « +15 % de recette signifie +15 % de marge ».',
    'Répondez avec ce que les données permettent et ne permettent pas de conclure.',
    ['taux-evolution', 'pourcentage'],
  ),
  pro(
    'B2-01-V2-49-RECOMMANDATION',
    3,
    'Assistante de gestion en comité',
    'Le groupe doit proposer une décision sans surinterpréter : financer, différer ou demander une mesure complémentaire.',
    'Relier chaque recommandation à une preuve chiffrée et nommer la donnée manquante.',
    'La qualité d’un indicateur se mesure aussi à la décision qu’il empêche de prendre trop vite.',
    ['proportion', 'taux-evolution'],
  ),
  storyWithMedia(
    'B2-01-V2-50-RETOUR',
    2,
    'Le bon indicateur rend la discussion plus précise',
    [
      'Le comité ne cherche pas le chiffre le plus impressionnant. Il cherche une comparaison juste, une évolution référencée et une limite clairement annoncée.',
    ],
    ['proportion', 'taux-evolution'],
    note(
      5,
      'Faire reformuler la décision en une phrase courte.',
      'Une recommandation accompagnée de sa preuve et de sa limite.',
      'Vérifier la cohérence entre le sens du taux et la décision.',
      'Passer à la défense collective.',
    ),
    {
      visuel: {
        src: '/assets/images/business_center.png',
        alt: 'Équipe réunie autour d’un poste de travail',
        legende: 'Le calcul devient utile lorsqu’il améliore une décision.',
      },
    },
  ),
  cardsort(
    'B2-01-V2-51-DEFENSE',
    3,
    'Préparer la prise de parole du comité',
    ['proportion', 'pourcentage', 'taux-evolution'],
    [
      { id: 'constat', libelle: 'Constat chiffré' },
      { id: 'calcul', libelle: 'Calcul vérifiable' },
      { id: 'limite', libelle: 'Limite de la donnée' },
      { id: 'action', libelle: 'Décision proposée' },
    ],
  ),
  worked(
    'B2-01-V2-52-CORRECTION-COMITE',
    3,
    'Corriger une recommandation trop ambitieuse sans perdre le signal utile.',
    ['proportion', 'taux-evolution'],
    [
      {
        id: 'erreur',
        intitule: 'Nommer l’erreur',
        raisonnement:
          'Le groupe a confondu progression de recette et rentabilité.',
        invite: 'Quelle affirmation dépasse la donnée ?',
      },
      {
        id: 'preuve',
        intitule: 'Conserver la preuve',
        raisonnement:
          'La recette progresse de 15 % et les dossiers complets représentent 30 %.',
        invite: 'Quels faits restent valides ?',
      },
      {
        id: 'action',
        intitule: 'Reformuler',
        raisonnement: 'Demander les coûts avant un engagement définitif.',
        invite: 'Quelle action réduit le risque ?',
      },
    ],
  ),
];

const ECRANS_ACTE_6: readonly Ecran[] = [
  {
    id: 'B2-01-V2-53-RAPPEL-TRANSFERT',
    brique: 'fp-recall',
    dureeMinutes: 3,
    concepts: ['proportion', 'taux-evolution'],
    notes: note(
      6,
      'Rejouer les méthodes sans le contexte initial.',
      'Une distinction correcte entre proportion et taux d’évolution.',
      'Vérifier la base dans chaque formule.',
      'Lancer le cas de transfert.',
    ),
    question: QUESTION_BASE_TRANSFERT,
    seuil: SEUIL_PAR_DEFAUT,
  },
  storyWithMedia(
    'B2-01-V2-54-TRANSFERT',
    4,
    'Nouveau contexte : les retours clients',
    [
      'Une autre équipe compte 18 retours traités sur 60 et passe de 400 à 460 € de coûts de traitement. Les nombres changent, la méthode doit rester stable.',
      'Le transfert est réussi si l’étudiant choisit seul la bonne base, calcule, contrôle et explique ce que le résultat signifie.',
    ],
    ['proportion', 'taux-evolution'],
    note(
      6,
      'Laisser le groupe résoudre avant toute reprise de méthode.',
      'Un brouillon complet : données, calculs, unités et conclusion.',
      'Comparer au contrat de preuve d’Atelier Rivage.',
      'Valider par un dernier atelier.',
    ),
    {
      visuel: {
        src: '/assets/images/auto_graph.png',
        alt: 'Graphique de tendance utilisé pour un nouveau contexte',
        legende: 'La méthode doit survivre à un changement de contexte.',
      },
    },
  ),
  questionnaire(
    'B2-01-V2-56-EVALUATION',
    5,
    'examen',
    ['evolutions-successives', 'evolution-reciproque', 'taux-moyen'],
    [
      QUESTION_EVOLUTIONS_EVALUATION,
      QUESTION_RECIPROQUE_EVALUATION,
      QUESTION_TAUX_MOYEN,
    ],
  ),
  worked(
    'B2-01-V2-55-TRANSFERT-GUIDE',
    5,
    'Produire un compte rendu sur 18 retours traités sur 60 et une évolution de 400 à 460 €.',
    ['proportion', 'taux-evolution'],
    [
      {
        id: 'part',
        intitule: 'Proportion',
        raisonnement: '18 ÷ 60 = 0,30, soit 30 %.',
        invite: 'Que représente 30 % ici ?',
      },
      {
        id: 'ecart',
        intitule: 'Écart',
        raisonnement: '460 − 400 = 60 €.',
        invite: 'Quelle information donne l’écart ?',
      },
      {
        id: 'taux',
        intitule: 'Taux',
        raisonnement: '60 ÷ 400 × 100 = 15 %.',
        invite: 'Pourquoi la base est-elle 400 ?',
      },
      {
        id: 'phrase',
        intitule: 'Compte rendu',
        raisonnement:
          '30 % des retours sont traités ; le coût augmente de 60 €, soit 15 %.',
        invite: 'Quelle décision cette phrase autorise-t-elle ?',
      },
    ],
  ),
  challenge(
    'B2-01-V2-58-ERREUR',
    3,
    'Un collègue écrit 18 ÷ 60 = 0,3 % et 460 − 400 = 60 %.',
    'Corrigez les deux erreurs et expliquez le rôle de l’unité.',
    ['proportion', 'pourcentage', 'taux-evolution'],
  ),
  plot(
    'B2-01-V2-57-SYNTHESE',
    3,
    'Trois questions, trois bases',
    'Source : synthèse pédagogique des cas Atelier Rivage',
    { libelle: 'étape', min: 0, max: 3 },
    'valeur normalisée',
    [
      {
        id: 'proportion',
        libelle: 'Partie / total',
        trait: 'plein',
        calcul: '0.3',
      },
      {
        id: 'evolution',
        libelle: 'Arrivée / départ',
        trait: 'tirets',
        calcul: '1+0.15*x',
      },
    ],
    ['proportion', 'taux-evolution', 'coefficient-multiplicateur'],
  ),
  voteScreen(
    'B2-01-V2-59-INTERPRETATION',
    3,
    QUESTION_DECISION_INTERPRETATION,
    ['taux-evolution'],
  ),
  {
    id: 'B2-01-V2-60-SORTIE',
    brique: 'fp-exit',
    dureeMinutes: 2,
    concepts: ['proportion', 'pourcentage', 'taux-evolution'],
    notes: note(
      6,
      'Faire rédiger le billet de sortie sans afficher la correction.',
      'Un calcul, une unité, une phrase d’interprétation et une limite.',
      'Corriger avec le contrat de preuve et conserver les confusions pour B2-02.',
      'Clore la séance et annoncer le cours sur proportions et indices.',
    ),
    invite:
      'Écrivez la méthode que vous réutiliserez dans un tableau de gestion : données, base, calcul, contrôle, unité, interprétation.',
    question: QUESTION_SORTIE,
  },
];

const ECRANS: readonly [Ecran, ...Ecran[]] = [
  ...ECRANS_ACTE_1,
  ...ECRANS_ACTE_2,
  ...ECRANS_ACTE_3,
  ...ECRANS_ACTE_4,
  ...ECRANS_ACTE_5,
  ...ECRANS_ACTE_6,
] as unknown as readonly [Ecran, ...Ecran[]];

export const B2_01_TRAITEMENT_INFORMATION_CHIFFREE: Cours = {
  slug: REFERENTIEL.slug,
  titre: "Lire et contrôler l'information chiffrée",
  niveau: 'B2',
  dureeMinutes: 210,
  concepts: ['proportion', 'pourcentage', 'taux-evolution'],
  ecrans: ECRANS,
  remediations: {
    'raisonnement-additif': 'B2-01-V2-13-CALCUL-GUIDE',
    'taux-valeur-facteur-cent': 'B2-01-V2-33-TABLEUR-GUIDE',
    'base-arrivee': 'B2-01-V2-22-TAUX-GUIDE',
    'ecart-absolu-au-lieu-du-taux': 'B2-01-V2-22-TAUX-GUIDE',
    'coefficient-confondu-avec-taux': 'B2-01-V2-23-COEFFICIENT',
    'taux-successifs-additionnes': 'B2-01-V2-29-DEBRIEF-EVOL',
    'hausse-baisse-symetriques': 'B2-01-V2-29-DEBRIEF-EVOL',
    'reciproque-meme-taux': 'B2-01-V2-55-TRANSFERT-GUIDE',
  },
  derogations: [],
};
