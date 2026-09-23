import { B2_COURS, notes } from './b2-v3.cours';

type CoursB2 = typeof B2_COURS;
type EcranB2 = CoursB2['ecrans'][number];
type EcranDeTri = Extract<EcranB2, { readonly brique: 'fp-cardsort' }>;
type EcranDeCas = Extract<EcranB2, { readonly brique: 'fp-pro' }>;
type EcranDExemple = Extract<EcranB2, { readonly brique: 'fp-worked' }>;
type EtapeDExemple = EcranDExemple['proprietes']['exemple']['etapes'][number];
type EcranDeMachine = Extract<EcranB2, { readonly brique: 'fp-concept4' }>;

const MISSION = 'B2-01-A1-03-MISSION';
const TRI = 'B2-01-A1-05-ANATOMIE';
const CORRECTION_DU_TRI = 'B2-01-A1-05-CORRECTION';
const JEU = 'B2-01-A2-07-JEU-COMPARABLE';
const CORRECTION_DU_JEU = 'B2-01-A2-07-CORRECTION';
const MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
const DIAPOSITIVE = 'B2-01-A1-09-DIAPOSITIVE';
const AUDIT = 'B2-01-A1-10-AUDIT-DIAPOSITIVE';
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

interface Correction {
  readonly screenId: string;
  readonly titre: string;
  readonly intitule: string;
  readonly notes: string;
}

const CORRECTION_DU_TRI_DU_TABLEAU: Correction = {
  screenId: CORRECTION_DU_TRI,
  titre: 'Correction : ce que dit chaque chiffre du tableau de bord',
  intitule: 'Correction du tri',
  notes: notes(
    'projeter le plateau corrigé, carte par carte, en partant des deux cartes qui concentrent les erreurs.',
    'sur chaque poste, les cartes mal placées au tri sont bordées de rouge.',
    '« −2,3 % » est un écart de deux taux, en points ; « +1 200 » et « 4,9 » restent ambigus sans unité, base ni période.',
    'faire dire à un binôme pourquoi sa carte bordée de rouge change de colonne.',
    '« Un taux n’est une information que si l’on connaît sa fiche d’identité. »',
  ),
};

const CORRECTION_DU_MINI_JEU: Correction = {
  screenId: CORRECTION_DU_JEU,
  titre: 'Correction : comparable ou pas ?',
  intitule: 'Correction du mini-jeu',
  notes: notes(
    'projeter le plateau corrigé, en commençant par les deux cartes les plus ratées de la classe.',
    'sur chaque poste, les cartes mal placées pendant le jeu sont bordées de rouge.',
    'directes : mars/mars, taux 2024/2025, CA par salarié ; après retraitement : HT/TTC, m²/rouleau, périmètre ; impossibles sans nouvelle donnée : taux sectoriel, inflation de 2023, semestre/année.',
    'pour chaque retraitement, faire dire l’opération (÷ 1,2 ; ÷ 50 ; − 523 000 €).',
    'jalon de confiance, puis acte 3.',
  ),
};

function correctionDuTri(tri: EcranDeTri, correction: Correction): EcranB2 {
  const { plan, questions } = tri.proprietes;
  const [{ corrige }] = questions;
  const justifications = new Map(
    corrige.attendus.map((attendu) => [attendu.carteId, attendu]),
  );
  return {
    screenId: correction.screenId,
    titre: correction.titre,
    diffusion: 'seance',
    brique: 'fp-story',
    dureeMinutes: MINUTES_DE_LA_CORRECTION,
    concepts: ['contrat-de-lecture'],
    notes: correction.notes,
    proprietes: {
      presentation: {
        version: 2,
        screenId: correction.screenId,
        renderer: 'sort-review',
        props: {
          title: correction.intitule,
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

const QUESTIONS_DES_ETAPES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  'b2-01-a2-points': {
    ecart:
      'Quel est l’écart entre les deux taux, et dans quelle unité s’exprime-t-il ?',
    relatif:
      'De quel pourcentage le taux lui-même a-t-il baissé par rapport à celui de 2024 ?',
    phrase:
      'Quelle phrase écrivez-vous pour le comité, sans utiliser « −2,3 % » ?',
    controle:
      'En appliquant cette baisse relative à 27,60 %, retrouvez-vous le taux de 2025 ?',
  },
  'b2-01-a3-fil': {
    coefficients:
      'Par quel nombre multiplie-t-on le prix pour appliquer +10 % ? Et pour appliquer −8 % ?',
    global:
      'Quelle est l’évolution globale du prix sur l’année, en % ? Le « +2 % » annoncé est-il juste ?',
    prix: 'Combien coûte la bobine après les deux changements de prix, en € HT ?',
    base: 'La bobine coûte 13,75 € après la hausse d’avril : quel était son prix avant cette hausse ?',
    reciproque:
      'De quel pourcentage faut-il baisser 13,75 € pour revenir à 12,50 € ?',
    tva: 'Une facture affiche 3 600 € TTC (TVA 20 %) : quel est son montant HT, et de quel pourcentage baisse-t-on en passant du TTC au HT ?',
  },
  'b2-01-a3-indice-taux-moyen': {
    indice:
      'Quel est l’indice du loyer en 2022, en 2023 et en 2024, base 100 en 2021 ?',
    lire: 'Que signifie l’indice 119,10 de 2024, traduit en taux d’évolution depuis 2021 ?',
    chainer:
      'Comment retrouvez-vous l’indice 2024 à partir des coefficients annuels ?',
    'taux-moyen':
      'Quel taux annuel constant, appliqué trois années de suite, donne +19,10 % ?',
    piege:
      'En appliquant +6,37 % trois années de suite, obtient-on bien +19,10 % ?',
  },
  'b2-01-a5-ponderee': {
    poids:
      'Quelle part du CA total représente chaque canal, en 2024 puis en 2025 ?',
    'taux-2024':
      'Quel taux global de 2024 obtenez-vous en pondérant le taux de chaque canal par son poids ?',
    'taux-2025':
      'Quel taux global de 2025 obtenez-vous avec les poids de 2025 ?',
    'moyenne-simple':
      'Pourquoi la moyenne simple des trois taux ne donne-t-elle le taux global d’aucune année ?',
    effet:
      'Combien de marge le changement de répartition fait-il perdre en 2025, en euros ?',
    logique:
      'Comment s’écrit la négation de « si chaque canal garde son taux, alors le taux global est inchangé », et quel contre-exemple la prouve ?',
  },
};

function exempleACorrigerEnSeance(ecran: EcranDExemple): EcranDExemple {
  const { exemple } = ecran.proprietes;
  const questions = QUESTIONS_DES_ETAPES[exemple.id] ?? {};
  const enQuestion = (etape: EtapeDExemple): EtapeDExemple => ({
    ...etape,
    invite: questions[etape.id] ?? etape.invite,
  });
  const [premiere, ...suivantes] = exemple.etapes;
  return {
    ...ecran,
    proprietes: {
      ...ecran.proprietes,
      etayage: 0,
      exemple: {
        ...exemple,
        etapes: [enQuestion(premiere), ...suivantes.map(enQuestion)],
      },
    },
  };
}

function machineAEtapes(machine: EcranDeMachine): EcranB2 {
  return {
    ...machine,
    proprietes: {
      ...machine.proprietes,
      etapes: [
        { libelle: 'Départ', calcul: 'depart' },
        { libelle: 'Après t₁', calcul: 'depart * (1 + tauxUn / 100)' },
        { libelle: 'Arrivée', calcul: machine.proprietes.calcul },
      ],
    },
  };
}

function enrichir(ecran: EcranB2): EcranB2[] {
  if (ecran.brique === 'fp-concept4' && ecran.screenId === MACHINE) {
    return [machineAEtapes(ecran)];
  }
  if (ecran.brique === 'fp-pro' && ecran.screenId === MISSION) {
    return [missionAQuestionsLibres(ecran)];
  }
  if (ecran.brique === 'fp-challenge' && ecran.screenId === AUDIT) {
    return [
      { ...ecran, proprietes: { ...ecran.proprietes, renvoi: DIAPOSITIVE } },
    ];
  }
  if (ecran.brique === 'fp-cardsort' && ecran.screenId === TRI) {
    return [ecran, correctionDuTri(ecran, CORRECTION_DU_TRI_DU_TABLEAU)];
  }
  if (ecran.brique === 'fp-cardsort' && ecran.screenId === JEU) {
    return [ecran, correctionDuTri(ecran, CORRECTION_DU_MINI_JEU)];
  }
  if (ecran.brique === 'fp-worked') {
    return [exempleACorrigerEnSeance(ecran)];
  }
  return [ecran];
}

const [PREMIER_ECRAN, ...ECRANS_SUIVANTS] = B2_COURS.ecrans.flatMap(enrichir);
const MINUTES_AJOUTEES =
  MINUTES_DE_LA_MISSION -
  (B2_COURS.ecrans.find(({ screenId }) => screenId === MISSION)?.dureeMinutes ??
    MINUTES_DE_LA_MISSION) +
  MINUTES_DE_LA_CORRECTION *
    [CORRECTION_DU_TRI_DU_TABLEAU, CORRECTION_DU_MINI_JEU].length;

export const B2_COURS_ENRICHI: CoursB2 = {
  ...B2_COURS,
  version: 3,
  dureeMinutes: B2_COURS.dureeMinutes + MINUTES_AJOUTEES,
  ecrans: [PREMIER_ECRAN, ...ECRANS_SUIVANTS],
};
