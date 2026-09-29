import type { Cours, Ecran } from '../contrats/cours';
import { estInteractif, questionsDe } from './Cours';
import { correctionsDe } from './Corrections';
import type { Manquement } from './GardeConfidentialite';

const ECRANS_MAXIMUM_DU_GABARIT = 40;
const MINUTES_MAXIMUM_DU_GABARIT = 180;
const BRIQUES_HORS_CYCLE: readonly string[] = [
  'fp-recall',
  'fp-exit',
  'fp-spaced',
  'fp-worked',
];
const BRIQUES_D_EXERCICE_OUVERT: readonly string[] = [
  'fp-escape',
  'fp-challenge',
];
const MOTIF_DES_TEMPS =
  /^• Temps : réflexion (\d+) min · travail (\d+) min(?: · correction (\d+) min)?$/m;

type Temps = 'reflechir' | 'comprendre' | 'exercer';

function estLecon(ecran: Ecran): boolean {
  return (
    ecran.brique === 'fp-story' &&
    ecran.proprietes.presentation?.version === 2 &&
    ecran.proprietes.presentation.renderer === 'lesson'
  );
}

function estExercice(ecran: Ecran): boolean {
  if (BRIQUES_D_EXERCICE_OUVERT.includes(ecran.brique)) {
    return true;
  }
  return (
    !BRIQUES_HORS_CYCLE.includes(ecran.brique) &&
    questionsDe(ecran).some((question) => question.noteCompte)
  );
}

function tempsDe(ecran: Ecran): Temps | null {
  if (estLecon(ecran)) {
    return 'comprendre';
  }
  if (estExercice(ecran)) {
    return 'exercer';
  }
  return estInteractif(ecran) && !BRIQUES_HORS_CYCLE.includes(ecran.brique)
    ? 'reflechir'
    : null;
}

export function controlerBudget(cours: Cours): readonly Manquement[] {
  const ecrans = cours.ecrans.length;
  const exces = [
    ...(ecrans > ECRANS_MAXIMUM_DU_GABARIT
      ? [`${ecrans} écrans pour ${ECRANS_MAXIMUM_DU_GABARIT} au plus`]
      : []),
    ...(cours.dureeMinutes > MINUTES_MAXIMUM_DU_GABARIT
      ? [
          `${cours.dureeMinutes} min de travail pour ${MINUTES_MAXIMUM_DU_GABARIT} au plus, pause non comprise`,
        ]
      : []),
  ];
  return exces.map((raison) => ({
    ecran: null,
    raison: `le gabarit v3 tient une séance : ${raison}.`,
  }));
}

interface EtatDuCycle {
  readonly manquements: readonly Manquement[];
  readonly reflexion: boolean;
  readonly leconSansExercice: string | null;
  readonly lecons: number;
}

function etapeDuCycle(etat: EtatDuCycle, ecran: Ecran): EtatDuCycle {
  switch (tempsDe(ecran)) {
    case 'reflechir':
      return { ...etat, reflexion: true };
    case 'exercer':
      return { ...etat, reflexion: false, leconSansExercice: null };
    case 'comprendre':
      return {
        manquements: etat.reflexion
          ? etat.manquements
          : [
              ...etat.manquements,
              {
                ecran: ecran.id,
                raison: `la trace écrite « ${ecran.id} » arrive sans temps de réflexion depuis le dernier exercice : chaque notion s'ouvre sur une question de réflexion.`,
              },
            ],
        reflexion: etat.reflexion,
        leconSansExercice: etat.leconSansExercice ?? ecran.id,
        lecons: etat.lecons + 1,
      };
    default:
      return etat;
  }
}

export function controlerCycle(cours: Cours): readonly Manquement[] {
  const final = cours.ecrans.reduce<EtatDuCycle>(etapeDuCycle, {
    manquements: [],
    reflexion: false,
    leconSansExercice: null,
    lecons: 0,
  });
  if (final.lecons === 0) {
    return [
      {
        ecran: null,
        raison:
          'le cours v3 ne porte aucune trace écrite (rendu « lesson ») : le temps « comprendre » manque.',
      },
    ];
  }
  return final.leconSansExercice === null
    ? final.manquements
    : [
        ...final.manquements,
        {
          ecran: final.leconSansExercice,
          raison: `la trace écrite « ${final.leconSansExercice} » n'est suivie d'aucun exercice : chaque notion se termine par un temps « s'exercer ».`,
        },
      ];
}

function defautDeLAnnonce(ecran: Ecran): readonly string[] {
  const temps = MOTIF_DES_TEMPS.exec(ecran.notes);
  if (temps === null) {
    return [
      'aucune ligne « • Temps : réflexion N min · travail N min » dans les notes',
    ];
  }
  const [, reflexion, travail, correction = '0'] = temps;
  return Number(reflexion) + Number(travail) + Number(correction) ===
    ecran.dureeMinutes
    ? []
    : [
        `réflexion ${reflexion} min, travail ${travail} min et correction ${correction} min ne font pas les ${ecran.dureeMinutes} min de l'écran`,
      ];
}

function defautsDesTemps(cours: Cours, ecran: Ecran): readonly string[] {
  const annonce = defautDeLAnnonce(ecran);
  const correction =
    ecran.correctionSurPlace === undefined &&
    correctionsDe(cours, ecran.id).length === 0
      ? ['aucune correction, ni sur place ni sur un écran qui le suit']
      : [];
  return [...annonce, ...correction];
}

export function controlerTempsDesExercices(
  cours: Cours,
): readonly Manquement[] {
  return cours.ecrans.filter(estExercice).flatMap((ecran) => {
    const defauts = defautsDesTemps(cours, ecran);
    return defauts.length === 0
      ? []
      : [
          {
            ecran: ecran.id,
            raison: `l'exercice « ${ecran.id} » n'a pas ses trois temps : ${defauts.join(' ; ')}.`,
          },
        ];
  });
}

export function controlerMiniSituation(cours: Cours): readonly Manquement[] {
  const rang = cours.ecrans.findLastIndex(
    (ecran) => ecran.brique === 'fp-escape',
  );
  if (rang === -1) {
    return [
      {
        ecran: null,
        raison:
          'le cours v3 ne porte aucune mini-situation CCF (« fp-escape ») avant son billet de sortie.',
      },
    ];
  }
  return cours.ecrans
    .slice(rang + 1)
    .filter(estLecon)
    .map((ecran) => ({
      ecran: ecran.id,
      raison: `la trace écrite « ${ecran.id} » suit la mini-situation CCF : la mini-situation réinvestit, elle n'introduit rien.`,
    }));
}
