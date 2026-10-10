import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  decrireLaFicheDuCours,
  decrireLaMiniSituation,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import {
  exigerAuMoinsUn,
  type AuMoinsUn,
} from '../../../../common/domain/au-moins-un';
import {
  ecartTypePopulation,
  mediane,
  moyenne,
  somme,
} from '../../../../common/domain/nombres/statistiques';
import { COURS_B2_02 } from './b2-02.cours';

const COURS = buildCoursDuContenu(COURS_B2_02);

const DELAIS: AuMoinsUn<number> = [
  42, 25, 58, 31, 146, 38, 47, 18, 62, 44, 35, 52, 28, 75, 40, 30, 55, 34, 50,
  45,
];
const RANGS_RIVAGE: AuMoinsUn<number> = [1, 2, 3, 4, 5, 6];
const CA_RIVAGE: AuMoinsUn<number> = [610, 652, 694, 736, 790, 826];
const RANGS_FIBRE: AuMoinsUn<number> = [1, 2, 3, 4, 5];
const FIBRE: AuMoinsUn<number> = [10.3, 14.5, 18.1, 21.4, 24.4];
const FIBRE_FIN_2025 = 27.1;
const ANNEE_DU_RANG_1 = 2020;

const trie = (valeurs: readonly number[]): number[] =>
  [...valeurs].sort((a, b) => a - b);
const milieu = (valeurs: readonly number[]): number =>
  (valeurs[valeurs.length / 2 - 1] + valeurs[valeurs.length / 2]) / 2;
const variance = (valeurs: AuMoinsUn<number>, diviseur: number): number =>
  somme(valeurs.map((valeur) => (valeur - moyenne(valeurs)) ** 2)) / diviseur;
const ecartTypeEchantillon = (valeurs: AuMoinsUn<number>): number =>
  Math.sqrt(variance(valeurs, valeurs.length - 1));

function ajustement(x: AuMoinsUn<number>, y: AuMoinsUn<number>) {
  const covariance =
    somme(x.map((xi, rang) => (xi - moyenne(x)) * (y[rang] - moyenne(y)))) /
    x.length;
  const varianceX = variance(x, x.length);
  const varianceY = variance(y, y.length);
  const pente = covariance / varianceX;
  const penteInversee = covariance / varianceY;
  return {
    pente,
    ordonnee: moyenne(y) - pente * moyenne(x),
    r: covariance / Math.sqrt(varianceX * varianceY),
    penteInversee,
    ordonneeInversee: moyenne(x) - penteInversee * moyenne(y),
  };
}

const premierRangAtteignant = (
  seuil: number,
  { pente, ordonnee }: { pente: number; ordonnee: number },
): number => Math.ceil((seuil - ordonnee) / pente);

decrireLaFicheDuCours('B2-02', COURS, {
  conception: 'cours-b2-02-conception.md',
  ecrans: 37,
  dureeMinutes: 180,
  minutesParActe: [44, 47, 41, 48, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 149, exposition: 31 },
  ateliersNotes: ['A1-08 (12)', 'A2-05 (11)', 'A3-04 (11)'],
  noteesParType: [4, 10, 0, 1, 1],
  enigmes: 4,
  rappels: 12,
  remediations: 16,
  options: 6 + 12,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-06',
    'A1-06',
    'A1-06',
    'A1-06',
    'A2-01',
    'A2-03',
    'A2-03',
    'A2-03',
    'A2-03',
    'A3-02',
    'A3-02',
    'A3-02',
    'A3-02',
    'A4-01',
    'A4-05',
  ],
  corrigesSurPlace: [
    'B2-02-A1-08-ATELIER-RESUME',
    'B2-02-A2-05-ATELIER-NUAGE',
    'B2-02-A2-06-ECARTS-POINT-MOYEN',
    'B2-02-A3-04-ATELIER-DROITE',
    'B2-02-A3-05-DEFI-IA',
    'B2-02-A4-02-TABLEUR-FIBRE',
    'B2-02-A4-03-COFFRE-FIBRE',
  ],
});

const FACTURES_DE_SEPTEMBRE: AuMoinsUn<number> = [
  28, 41, 35, 90, 33, 39, 44, 30,
];

function texteDeLEcran(screenId: string): string {
  const ecran = COURS_B2_02.ecrans.find(
    (candidat) => candidat.screenId === screenId,
  );
  if (ecran === undefined) {
    throw new Error(`écran ${screenId} absent du B2-02`);
  }
  return JSON.stringify(ecran);
}

const enFrancais = (valeur: number): string =>
  valeur.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

const ILLUSTRATION_DE_CHAQUE_TRACE_ECRITE: Readonly<Record<string, string>> = {
  'B2-02-A1-06-COURS-RESUMER': 'cinq-factures.webp',
  'B2-02-A1-06-COURS-ECART': 'deux-clients-meme-moyenne.webp',
  'B2-02-A2-03-COURS-NUAGE': 'boutique-nuage-point-moyen.webp',
  'B2-02-A2-03-COURS-CORRELATION': 'boutique-coefficient-r.webp',
  'B2-02-A3-02-COURS-DROITE': 'boutique-droite-moindres-carres.webp',
  'B2-02-A3-02-COURS-PREVOIR': 'boutique-prevision-seuil.webp',
};

function proprietesDeLEcranQuiSuit(screenId: string): unknown {
  const rang = COURS_B2_02.ecrans.findIndex(
    (ecran) => ecran.screenId === screenId,
  );
  return COURS_B2_02.ecrans[rang + 1]?.proprietes;
}

describe('B2-02 — illustration de l’exemple de chaque trace écrite', () => {
  it.each(Object.entries(ILLUSTRATION_DE_CHAQUE_TRACE_ECRITE))(
    'fait suivre %s d’un écran qui ne montre que l’image %s',
    (screenId, fichier) => {
      expect(proprietesDeLEcranQuiSuit(screenId)).toMatchObject({
        presentation: {
          renderer: 'illustration',
          props: { image: `/assets/cours/b2-02/v2/${fichier}` },
        },
      });
    },
  );
});

describe('B2-02 — textes relus contre les données et le programme', () => {
  it('chiffre l’écart entre moyenne et médiane de l’exemple A1-07', () => {
    const ecart =
      moyenne(FACTURES_DE_SEPTEMBRE) - mediane(FACTURES_DE_SEPTEMBRE);

    expect(texteDeLEcran('B2-02-A1-07-EXEMPLE-RESUME')).toContain(
      `${enFrancais(ecart)} jours au-dessus de la médiane`,
    );
  });

  it('nomme l’écart interquartile dans la trace écrite de la dispersion', () => {
    expect(texteDeLEcran('B2-02-A1-06-COURS-ECART')).toContain(
      'écart interquartile',
    );
  });

  it('ne propose pas en rappel le point du milieu du tableau que l’exemple A2-04 récuse', () => {
    expect(texteDeLEcran('B2-02-A2-04-EXEMPLE-NUAGE')).toContain(
      'point du milieu du tableau n’existe pas',
    );
    expect(texteDeLEcran('B2-02-A4-04-RAPPEL')).not.toContain(
      'point du milieu du tableau',
    );
  });

  it('intitule « Année » les lignes du tableau des écarts, qui portent les années 2020 à 2025', () => {
    expect(texteDeLEcran('B2-02-A2-06-ECARTS-POINT-MOYEN')).toContain(
      '"intituleDesLignes":"Année"',
    );
  });
});

decrireLaMiniSituation('B2-02', COURS_B2_02, {
  donneesFictives: ['B2-02-A1-04-FACTURES', 'B2-02-A2-01-NUAGE-RIVAGE'],
  coffre: 'B2-02-A4-03-COFFRE-FIBRE',
  tableur: 'B2-02-A4-02-TABLEUR-FIBRE',
});

describe('B2-02 — recalcul des corrigés depuis les données brutes', () => {
  const rivage = ajustement(RANGS_RIVAGE, CA_RIVAGE);
  const fibre = ajustement(RANGS_FIBRE, FIBRE);
  const rangDe = (annee: number): number => annee - ANNEE_DU_RANG_1 + 1;
  const prevoir = (
    { pente, ordonnee }: { pente: number; ordonnee: number },
    x: number,
  ): number => pente * x + ordonnee;

  it('recalcule les solutions et pièges des dix questions numériques', () => {
    const sansLitige = exigerAuMoinsUn(
      DELAIS.filter((delai) => delai !== 146),
      'aucun délai sans litige',
    );
    const seuilRivage = premierRangAtteignant(1000, rivage);
    attendreLesNumeriques(COURS, {
      'b2-02-a1-mediane': [
        mediane(DELAIS),
        milieu(DELAIS),
        trie(DELAIS)[9],
        moyenne(DELAIS),
      ],
      'b2-02-a1-moyenne': [
        moyenne(DELAIS),
        moyenne(sansLitige),
        mediane(DELAIS),
      ],
      'b2-02-a1-ecart-type': [
        ecartTypePopulation(DELAIS),
        ecartTypeEchantillon(DELAIS),
        variance(DELAIS, DELAIS.length),
      ],
      'b2-02-a2-x-moyen': [moyenne(RANGS_RIVAGE), somme(RANGS_RIVAGE)],
      'b2-02-a2-y-moyen': [
        moyenne(CA_RIVAGE),
        mediane(CA_RIVAGE),
        somme(CA_RIVAGE),
      ],
      'b2-02-a2-r': [rivage.r, rivage.pente],
      'b2-02-a3-pente': [rivage.pente, rivage.penteInversee, rivage.ordonnee],
      'b2-02-a3-ordonnee': [rivage.ordonnee, rivage.pente],
      'b2-02-a3-prevision': [
        prevoir(rivage, rangDe(2028)),
        prevoir(rivage, 2028),
      ],
      'b2-02-a3-seuil': [
        ANNEE_DU_RANG_1 + seuilRivage - 1,
        ANNEE_DU_RANG_1 + seuilRivage - 2,
      ],
    });
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const seuilFibre = premierRangAtteignant(35, fibre);
    attendreLesEnigmes(COURS, {
      'b2-02-a4-e1-prevision': [
        prevoir(fibre, rangDe(2025)),
        prevoir(fibre, 2025),
        fibre.ordonnee * rangDe(2025) + fibre.pente,
      ],
      'b2-02-a4-e2-seuil': [
        ANNEE_DU_RANG_1 + seuilFibre - 1,
        ANNEE_DU_RANG_1 + seuilFibre - 2,
      ],
      'b2-02-a4-e3-lointaine': [
        prevoir(fibre, rangDe(2030)),
        prevoir(fibre, 2030),
      ],
      'b2-02-a4-e4-ralentissement': [
        fibre.pente - (FIBRE_FIN_2025 - FIBRE[FIBRE.length - 1]),
        FIBRE_FIN_2025 - FIBRE[FIBRE.length - 1],
      ],
    });
  });

  it('recalcule les six cellules attendues de la feuille A4-02 et leurs pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-02-a4-feuille-fibre');
    if (corrige.type !== 'feuille') {
      throw new Error('la feuille A4-02 n’a pas de corrigé de feuille');
    }
    attendreLaFeuille(corrige, {
      E2: [fibre.r],
      E3: [fibre.pente, fibre.penteInversee],
      E4: [fibre.ordonnee, fibre.ordonneeInversee],
      E5: [moyenne(RANGS_FIBRE)],
      E6: [moyenne(FIBRE), moyenne(RANGS_FIBRE)],
      E7: [1],
    });
  });

  it('recalcule les écarts au point moyen du tableau A2-06 et leurs pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-02-a2-ecarts-point-moyen');
    if (corrige.type !== 'tableau') {
      throw new Error('le tableau A2-06 n’a pas de corrigé de tableau');
    }
    const rangDuMilieu = RANGS_RIVAGE[RANGS_RIVAGE.length / 2 - 1];
    const attendus = RANGS_RIVAGE.flatMap((rang, ligne) => [
      [rang - moyenne(RANGS_RIVAGE), rang - rangDuMilieu],
      [CA_RIVAGE[ligne] - moyenne(CA_RIVAGE)],
    ]);

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(attendus);
  });
});
