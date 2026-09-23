import { B2_COURS, notes } from './b2-v3.cours';

type CoursB2 = typeof B2_COURS;
type EcranB2 = CoursB2['ecrans'][number];
type EcranDeTri = Extract<EcranB2, { readonly brique: 'fp-cardsort' }>;
type EcranDeCas = Extract<EcranB2, { readonly brique: 'fp-pro' }>;
type EcranDeTrace = Extract<EcranB2, { readonly brique: 'fp-plot' }>;
type EcranDExemple = Extract<EcranB2, { readonly brique: 'fp-worked' }>;

const MISSION = 'B2-01-A1-03-MISSION';
const TRI = 'B2-01-A1-05-ANATOMIE';
const CORRECTION_DU_TRI = 'B2-01-A1-05-CORRECTION';
const DIAPOSITIVE = 'B2-01-A1-09-DIAPOSITIVE';
const AUDIT = 'B2-01-A1-10-AUDIT-DIAPOSITIVE';
const ORIGINE_AXE = 'B2-01-A2-02-ORIGINE-AXE';
const POINTS = 'B2-01-A2-06-POINTS';
const EXERCICE_POINTS = 'B2-01-A2-06-POINTS-EXERCICE';
const EXERCICE_ID = 'b2-01-a2-points-exercice';
const MINUTES_DE_L_EXERCICE = 3;
const MINUTES_DE_LA_MISSION = 4;
const MINUTES_DE_LA_CORRECTION = 1;

function missionAQuestionsLibres(mission: EcranDeCas): EcranDeCas {
  return {
    ...mission,
    diffusion: 'seance',
    dureeMinutes: MINUTES_DE_LA_MISSION,
    notes: notes(
      'lecture à voix haute, classe entière, en 90 secondes, puis 2 min d’écriture individuelle : une réponse par question sur son poste.',
      'la demande d’Hélène (« gagner plus ») et la proposition de Samir (investir).',
      'repérer que « gagner » peut désigner un montant ou un taux, et le noter dès la première question.',
      'lire au pupitre deux réponses à la première question, l’une sur un montant, l’autre sur un taux.',
      '« Regardons le tableau de bord tel qu’il a été envoyé. »',
    ),
    proprietes: {
      ...mission.proprietes,
      geste:
        'Avant de recommander un investissement, répondez par écrit aux trois questions ci-dessous.',
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
          question: 'Le recalcul confirme-t-il la recommandation ?',
          placeholder: 'Ce qu’il faudrait recalculer avant de décider…',
        },
      ],
    },
  };
}

function correctionDuTri(tri: EcranDeTri): EcranB2 {
  const { plan, questions } = tri.proprietes;
  const [{ corrige }] = questions;
  const justifications = new Map(
    corrige.attendus.map((attendu) => [attendu.carteId, attendu]),
  );
  return {
    screenId: CORRECTION_DU_TRI,
    titre: 'Correction : ce que dit chaque chiffre du tableau de bord',
    diffusion: 'seance',
    brique: 'fp-story',
    dureeMinutes: MINUTES_DE_LA_CORRECTION,
    concepts: ['contrat-de-lecture'],
    notes: notes(
      'projeter le plateau corrigé, carte par carte, en partant des deux cartes qui concentrent les erreurs.',
      'sur chaque poste, les cartes mal placées au tri sont bordées de rouge.',
      '« −2,3 % » est un écart de deux taux, en points ; « +1 200 » et « 4,9 » restent ambigus sans unité, base ni période.',
      'faire dire à un binôme pourquoi sa carte bordée de rouge change de colonne.',
      '« Un taux n’est une information que si l’on connaît sa fiche d’identité. »',
    ),
    proprietes: {
      presentation: {
        version: 2,
        screenId: CORRECTION_DU_TRI,
        renderer: 'sort-review',
        props: {
          title: 'Correction du tri',
          subtitle: 'Chaque carte à sa place, avec la raison qui l’y range.',
          source: { screenId: tri.screenId, sortId: plan.id },
          categories: plan.categories.map(({ id, libelle }) => ({
            id,
            label: libelle,
          })),
          cards: plan.cartes.map(({ id, libelle }) => ({
            id,
            label: libelle,
            category: justifications.get(id)?.categorieId,
            justification: justifications.get(id)?.justification,
          })),
        },
      },
    },
  };
}

function origineEnBarres(origineAxe: EcranDeTrace): EcranDeTrace {
  const [origine] = origineAxe.proprietes.parametres;
  return {
    ...origineAxe,
    notes: notes(
      'chaque étudiant fait glisser l’origine de l’axe de 284 000 € à 0 €, ou bascule d’un préréglage à l’autre.',
      'les montants ne bougent pas ; seul le rapport des hauteurs change, de ×7 sur l’axe de Samir à presque ×1 sur l’axe à zéro.',
      '« l’échelle change l’impression, pas la donnée » : l’évolution réelle reste +2,1 %.',
      'faire lire la barre 2025 dans les deux positions (291 000 €) et comparer le rapport des hauteurs au réel.',
      '« Atelier 1 : lire, rapporter, estimer. »',
    ),
    proprietes: {
      ...origineAxe.proprietes,
      forme: 'barres',
      unite: 'euros',
      abscisse: { libelle: 'Année', min: 0, max: 3 },
      etiquettes: ['2022', '2023', '2024', '2025'],
      bornesOrdonnee: { minParametre: origine.cle, max: 292000 },
      parametres: [origine],
      prereglages: [
        { libelle: 'Axe de Samir', valeurs: { [origine.cle]: origine.max } },
        { libelle: 'Axe à zéro', valeurs: { [origine.cle]: origine.min } },
      ],
      description:
        'Faites glisser l’origine de l’axe : les montants restent les mêmes, le rapport des hauteurs change.',
    },
  };
}

function exerciceDePoints(points: EcranDExemple): EcranDeCas {
  const { exemple } = points.proprietes;
  const [premiere, ...suivantes] = exemple.etapes.map((etape) => ({
    id: `${EXERCICE_ID}:${etape.id}`,
    question: etape.invite,
    placeholder: etape.intitule,
  }));
  return {
    screenId: EXERCICE_POINTS,
    titre: 'Points ou pourcentage : à vous de rédiger',
    diffusion: 'seance',
    brique: 'fp-pro',
    dureeMinutes: MINUTES_DE_L_EXERCICE,
    concepts: points.concepts,
    notes: notes(
      '3 min d’écriture individuelle, sans correction affichée : une réponse par étape sur son poste.',
      'ceux qui écrivent « −2,3 % » à l’étape de l’écart.',
      'aucune correction à ce stade ; l’écran suivant la déroule étape par étape.',
      'lire au pupitre une réponse en points et une réponse en pourcentage à la première étape.',
      '« Corrigeons ensemble, étape par étape. »',
    ),
    proprietes: {
      modalite: 'solo',
      metier: 'Assistant·e de gestion — Atelier Rivage',
      situation: exemple.enonce,
      geste: 'Rédigez chaque étape sur votre poste, avant la correction.',
      consequence: null,
      questionsLibres: [premiere, ...suivantes],
    },
  };
}

function pointsEnCorrection(points: EcranDExemple): EcranDExemple {
  return {
    ...points,
    titre: 'Correction : points ou pourcentage',
    dureeMinutes: points.dureeMinutes - MINUTES_DE_L_EXERCICE,
    notes: notes(
      'dérouler la correction depuis le pupitre, une étape à la fois (« Montrer une étape de plus »).',
      'les réponses de l’exercice précédent, relues au pupitre avant chaque étape.',
      '−2,30 points ; −8,3 % en relatif ; une phrase qui contient les deux taux.',
      '27,6 × 0,917 = 25,31 (écart d’arrondi assumé).',
      '« Mini-jeu : tout n’est pas comparable. »',
    ),
    proprietes: {
      ...points.proprietes,
      etayage: 0,
      pilote: true,
      renvoi: EXERCICE_POINTS,
    },
  };
}

function enrichir(ecran: EcranB2): EcranB2[] {
  if (ecran.brique === 'fp-pro' && ecran.screenId === MISSION) {
    return [missionAQuestionsLibres(ecran)];
  }
  if (ecran.brique === 'fp-challenge' && ecran.screenId === AUDIT) {
    return [
      { ...ecran, proprietes: { ...ecran.proprietes, renvoi: DIAPOSITIVE } },
    ];
  }
  if (ecran.brique === 'fp-plot' && ecran.screenId === ORIGINE_AXE) {
    return [origineEnBarres(ecran)];
  }
  if (ecran.brique === 'fp-worked' && ecran.screenId === POINTS) {
    return [exerciceDePoints(ecran), pointsEnCorrection(ecran)];
  }
  if (ecran.brique === 'fp-cardsort' && ecran.screenId === TRI) {
    return [ecran, correctionDuTri(ecran)];
  }
  return [ecran];
}

const [PREMIER_ECRAN, ...ECRANS_SUIVANTS] = B2_COURS.ecrans.flatMap(enrichir);
const MINUTES_AJOUTEES =
  MINUTES_DE_LA_MISSION -
  (B2_COURS.ecrans.find(({ screenId }) => screenId === MISSION)?.dureeMinutes ??
    MINUTES_DE_LA_MISSION) +
  MINUTES_DE_LA_CORRECTION;

export const B2_COURS_ENRICHI: CoursB2 = {
  ...B2_COURS,
  version: 3,
  dureeMinutes: B2_COURS.dureeMinutes + MINUTES_AJOUTEES,
  ecrans: [PREMIER_ECRAN, ...ECRANS_SUIVANTS],
};
