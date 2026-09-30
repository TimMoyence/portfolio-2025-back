import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  attendreLaFeuille,
  attendreLesEnigmes,
  attendreLesNumeriques,
  corrigeDe,
  corrigeDeFeuille,
  decrireLaFicheDuCours,
  decrireLaMiniSituation,
  ecranDuContenu,
  valeursEtPieges,
} from '../../../../../test/helpers/fiche-de-cours';
import type { CorrigeFeuille } from '../../domain/cours/Corrige';
import { corrigerFeuille } from '../../domain/cours/CorrectionProduction';
import { COURS_B2_04 } from './b2-04.cours';

const COURS = buildCoursDuContenu(COURS_B2_04);

const CA_OBSERVE = [610, 652, 694, 736, 790, 826];
const ANNEE_DE_DEPART = 2025;
const CA_DE_DEPART = 826;
const RAISON_A = 44;
const TAUX_B = 0.06;
const SEUIL_DU_PLAN = 1200;
const SEUIL_DE_L_EXERCICE_5 = 1000;
const DERNIER_RANG_DU_PLAN = 5;

const CA_DE_LA_BOUTIQUE = 120;
const TAUX_DE_LA_BOUTIQUE = 0.16;
const SEUIL_DE_LA_BOUTIQUE = 280;
const DERNIER_RANG_DE_LA_FEUILLE = 7;
const COUT_D_ACQUISITION = 40;
const BAISSE_DU_COUT = 0.1;
const RANG_DU_COUT = 4;

const hypotheseA = (rang: number): number => CA_DE_DEPART + RAISON_A * rang;
const hypotheseB = (rang: number): number =>
  CA_DE_DEPART * (1 + TAUX_B) ** rang;
const boutique = (rang: number): number =>
  CA_DE_LA_BOUTIQUE * (1 + TAUX_DE_LA_BOUTIQUE) ** rang;

const rangsDe = (premier: number, dernier: number): number[] =>
  Array.from({ length: dernier - premier + 1 }, (_, rang) => premier + rang);

function cumul(
  suite: (rang: number) => number,
  premier: number,
  dernier: number,
): number {
  return rangsDe(premier, dernier).reduce(
    (total, rang) => total + suite(rang),
    0,
  );
}

function rangDuSeuil(suite: (rang: number) => number, seuil: number): number {
  let rang = 0;
  while (suite(rang) < seuil) {
    rang += 1;
  }
  return rang;
}

function enFrancais(valeur: number, decimales: number): string {
  return valeur.toFixed(decimales).replace('.', ',');
}

decrireLaFicheDuCours('B2-04', COURS, {
  conception: 'cours-b2-04-conception.md',
  ecrans: 34,
  dureeMinutes: 180,
  minutesParActe: [49, 39, 47, 45, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 147, exposition: 33 },
  ateliersNotes: ['A1-10 (10)', 'A2-05 (11)', 'A3-07 (11)'],
  noteesParType: [8, 6, 0, 3, 1],
  enigmes: 4,
  rappels: 12,
  remediations: 14,
  options: 8 + 4 + 12,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-08',
    'A2-02',
    'A2-03',
    'A3-01',
    'A3-03',
    'A3-04',
    'A4-01',
    'A4-05',
  ],
  corrigesSurPlace: [
    'B2-04-A1-10-ATELIER-ARITHMETIQUE',
    'B2-04-A1-11-TABLEUR-ARITHMETIQUE',
    'B2-04-A2-05-ATELIER-GEOMETRIQUE',
    'B2-04-A2-06-TABLEUR-GEOMETRIQUE',
    'B2-04-A3-06-TABLEAU-ALGORITHME',
    'B2-04-A3-07-ATELIER-SEUIL',
    'B2-04-A3-08-DEFI-IA',
    'B2-04-A4-02-TABLEUR-BOUTIQUE',
    'B2-04-A4-03-COFFRE-BOUTIQUE',
  ],
});

function recopier(
  modele: string,
  colonne: string,
  premiere: number,
  derniere: number,
): Record<string, string> {
  return Object.fromEntries(
    rangsDe(premiere, derniere).map((ligne) => [
      `${colonne}${ligne}`,
      modele.replaceAll(
        /(?<![$A-Z])([A-H])(\d+)\b/g,
        (_, lettre: string, numero: string) =>
          `${lettre}${Number(numero) + ligne - premiere}`,
      ),
    ]),
  );
}

function confusionsDe(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
): (string | null)[] {
  return corrigerFeuille(corrige, envoi)
    .verdicts.filter((verdict) => verdict.reference.startsWith(colonne))
    .map((verdict) => verdict.confusion);
}

function attendreUneRecopieNonFigee(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
  lignesDecalees: number,
): void {
  expect(confusionsDe(corrige, envoi, colonne)).toEqual([
    null,
    ...Array.from(
      { length: lignesDecalees },
      () => 'reference-relative-non-figee',
    ),
  ]);
}

const texteDeLEcran = (screenId: string): string =>
  JSON.stringify(ecranDuContenu(COURS_B2_04, screenId));

function proprietesV2(screenId: string): Readonly<Record<string, unknown>> {
  const ecran = ecranDuContenu(COURS_B2_04, screenId);
  if (ecran.brique !== 'fp-story') {
    throw new Error(`l’écran ${screenId} n’est pas un écran v2`);
  }
  const { presentation } = ecran.proprietes;
  if (presentation?.version !== 2) {
    throw new Error(`l’écran ${screenId} n’a pas de présentation v2`);
  }
  const { props } = presentation;
  if (typeof props !== 'object' || props === null) {
    throw new Error(`l’écran ${screenId} n’a pas de propriétés v2`);
  }
  return { ...props };
}

decrireLaMiniSituation('B2-04', COURS_B2_04, {
  donneesFictives: ['B2-04-A1-05-HISTORIQUE', 'B2-04-A4-01-SITUATION-BOUTIQUE'],
  coffre: 'B2-04-A4-03-COFFRE-BOUTIQUE',
  tableur: 'B2-04-A4-02-TABLEUR-BOUTIQUE',
});

describe('B2-04 — textes relus contre les données', () => {
  it('recalcule les hausses en k€ et en % de l’historique 2020-2025', () => {
    const { rows } = proprietesV2('B2-04-A1-05-HISTORIQUE');

    expect(rows).toEqual(
      CA_OBSERVE.map((ca, rang) => {
        const precedent = CA_OBSERVE[rang - 1];
        return {
          annee: String(ANNEE_DE_DEPART - CA_OBSERVE.length + 1 + rang),
          ca: String(ca),
          hausse: rang === 0 ? '—' : `+${ca - precedent}`,
          taux:
            rang === 0
              ? '—'
              : `+${enFrancais((ca / precedent - 1) * 100, 1)} %`,
        };
      }),
    );
  });

  it('tire l’hypothèse B du taux moyen 2020-2025, annoncé dans l’historique', () => {
    const [premier] = CA_OBSERVE;
    const tauxMoyen =
      ((CA_DE_DEPART / premier) ** (1 / (CA_OBSERVE.length - 1)) - 1) * 100;

    expect(texteDeLEcran('B2-04-A1-05-HISTORIQUE')).toContain(
      `${enFrancais(tauxMoyen, 2)} %`,
    );
    expect(enFrancais(tauxMoyen, 0)).toBe(enFrancais(TAUX_B * 100, 0));
  });

  it('trace les deux hypothèses de 2025 à 2030 sur le graphique', () => {
    const { labels, series } = proprietesV2('B2-04-A3-01-GRAPHIQUE');
    const rangs = rangsDe(0, DERNIER_RANG_DU_PLAN);

    expect(labels).toEqual(rangs.map((rang) => String(ANNEE_DE_DEPART + rang)));
    expect(series).toMatchObject([
      { values: rangs.map(hypotheseA) },
      { values: rangs.map((rang) => Number(hypotheseB(rang).toFixed(2))) },
    ]);
  });
});

describe('B2-04 — recalcul des corrigés depuis les deux hypothèses et la boutique', () => {
  it('recalcule les solutions et pièges des six questions numériques', () => {
    const rangDe1090 = (1090 - CA_DE_DEPART) / RAISON_A;
    const rangDeB = rangDuSeuil(hypotheseB, SEUIL_DU_PLAN);
    const additif = (rang: number): number =>
      CA_DE_DEPART * (1 + TAUX_B * rang);

    attendreLesNumeriques(COURS, {
      'b2-04-a1-u3': [hypotheseA(3), hypotheseA(4)],
      'b2-04-a1-rang': [
        rangDe1090,
        ANNEE_DE_DEPART + rangDe1090,
        rangDe1090 + 1,
      ],
      'b2-04-a2-v3': [hypotheseB(3), additif(3), hypotheseB(4)],
      'b2-04-a2-ecart': [
        hypotheseB(DERNIER_RANG_DU_PLAN) - hypotheseA(DERNIER_RANG_DU_PLAN),
        additif(DERNIER_RANG_DU_PLAN) - hypotheseA(DERNIER_RANG_DU_PLAN),
      ],
      'b2-04-a3-seuil-b': [rangDeB, rangDeB - 1, ANNEE_DE_DEPART + rangDeB],
      'b2-04-a3-cumul-a': [
        cumul(hypotheseA, 1, DERNIER_RANG_DU_PLAN),
        hypotheseA(DERNIER_RANG_DU_PLAN),
        cumul(hypotheseA, 0, DERNIER_RANG_DU_PLAN),
      ],
    });
  });

  it('place le seuil de 1 200 k€ deux ans plus tôt sous l’hypothèse B que sous l’hypothèse A', () => {
    expect(rangDuSeuil(hypotheseB, SEUIL_DU_PLAN)).toBe(7);
    expect(rangDuSeuil(hypotheseA, SEUIL_DU_PLAN)).toBe(9);
  });

  it('recalcule les solutions et pièges des quatre énigmes de la mini-situation', () => {
    const cout = (rang: number, taux: number): number =>
      COUT_D_ACQUISITION * (1 + taux) ** rang;
    const rangDeLaBoutique = rangDuSeuil(boutique, SEUIL_DE_LA_BOUTIQUE);
    const coefficient = (1 + TAUX_DE_LA_BOUTIQUE) ** DERNIER_RANG_DU_PLAN;

    attendreLesEnigmes(COURS, {
      'b2-04-a4-e1-cout': [
        cout(RANG_DU_COUT, -BAISSE_DU_COUT),
        COUT_D_ACQUISITION * (1 - BAISSE_DU_COUT * RANG_DU_COUT),
        cout(RANG_DU_COUT + 1, -BAISSE_DU_COUT),
        cout(RANG_DU_COUT, BAISSE_DU_COUT),
      ],
      'b2-04-a4-e2-affichage': [
        rangDeLaBoutique,
        rangDeLaBoutique - 1,
        0,
        ANNEE_DE_DEPART + rangDeLaBoutique,
      ],
      'b2-04-a4-e3-cumul': [
        cumul(boutique, 1, DERNIER_RANG_DU_PLAN),
        cumul(boutique, 0, DERNIER_RANG_DU_PLAN),
        boutique(DERNIER_RANG_DU_PLAN),
      ],
      'b2-04-a4-e4-hausse': [
        (coefficient - 1) * 100,
        TAUX_DE_LA_BOUTIQUE * DERNIER_RANG_DU_PLAN * 100,
        coefficient * 100,
      ],
    });
  });

  it('déroule la boucle « Tant que » de l’exercice 5 passage par passage, avec ses pièges', () => {
    const corrige = corrigeDe(COURS, 'b2-04-a3-tableau-algorithme');
    if (corrige.type !== 'tableau') {
      throw new Error('l’exercice 5 n’a pas de corrigé de tableau');
    }
    const passages: number[][] = [];
    let u = CA_DE_DEPART;
    while (u < SEUIL_DE_L_EXERCICE_5) {
      const avant = u;
      u += RAISON_A;
      const continuer = u < SEUIL_DE_L_EXERCICE_5 ? 1 : 0;
      passages.push([u, avant], [continuer, 1 - continuer]);
    }

    expect(corrige.attendus.map(valeursEtPieges)).toEqual(passages);
    expect(passages).toHaveLength(8);
  });
});

describe('B2-04 — les trois feuilles corrigées par le moteur de formules', () => {
  it('reconnaît juste la formule de l’hypothèse A recopiée jusqu’en C7', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a1-tableur-arithmetique');

    attendreLaFeuille(
      corrige,
      Object.fromEntries(
        rangsDe(1, DERNIER_RANG_DU_PLAN).map((rang) => [
          `C${rang + 2}`,
          rang === 1 ? [hypotheseA(rang)] : [hypotheseA(rang), hypotheseA(1)],
        ]),
      ),
    );
    expect(
      corrigerFeuille(corrige, recopier('=C2+$F$1', 'C', 3, 7)).score,
    ).toBe(1);
  });

  it('nomme la raison non figée quand la formule est recopiée sans $', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a1-tableur-arithmetique');

    attendreUneRecopieNonFigee(corrige, recopier('=C2+F1', 'C', 3, 7), 'C', 4);
  });

  it('reconnaît justes l’hypothèse B et l’écart B − A de l’exercice 4', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a2-tableur-geometrique');
    const rangs = rangsDe(1, DERNIER_RANG_DU_PLAN);

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        rangs.map((rang) => [
          `D${rang + 2}`,
          [
            hypotheseB(rang),
            rang === 1 ? CA_DE_DEPART * TAUX_B : hypotheseB(1),
          ],
        ]),
      ),
      ...Object.fromEntries(
        rangs.map((rang) => [
          `E${rang + 2}`,
          [hypotheseB(rang) - hypotheseA(rang)],
        ]),
      ),
    });
    expect(
      corrigerFeuille(corrige, {
        ...recopier('=D2*(1+$G$2)', 'D', 3, 7),
        ...recopier('=D3-C3', 'E', 3, 7),
      }).score,
    ).toBe(1);
  });

  it('nomme le taux pris pour la raison, puis le taux non figé, dans l’exercice 4', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a2-tableur-geometrique');

    expect(confusionsDe(corrige, { D3: '=D2*$G$2' }, 'D3')).toEqual([
      'coefficient-confondu-avec-taux',
    ]);
    attendreUneRecopieNonFigee(
      corrige,
      recopier('=D2*(1+G2)', 'D', 3, 7),
      'D',
      4,
    );
  });

  it('reconnaît juste le plan de la boutique et recalcule ses seize cellules', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a4-feuille-boutique');
    const rangs = rangsDe(0, DERNIER_RANG_DE_LA_FEUILLE);

    attendreLaFeuille(corrige, {
      ...Object.fromEntries(
        rangs
          .slice(1)
          .map((rang) => [
            `C${rang + 2}`,
            [
              boutique(rang),
              rang === 1
                ? CA_DE_LA_BOUTIQUE * TAUX_DE_LA_BOUTIQUE
                : boutique(1),
            ],
          ]),
      ),
      ...Object.fromEntries(
        rangs.map((rang) => [
          `D${rang + 2}`,
          [boutique(rang) >= SEUIL_DE_LA_BOUTIQUE ? 'Oui' : 'Non'],
        ]),
      ),
      F3: [
        cumul(boutique, 0, DERNIER_RANG_DU_PLAN),
        cumul(boutique, 1, DERNIER_RANG_DU_PLAN),
        boutique(DERNIER_RANG_DU_PLAN),
      ],
    });
    expect(corrige.attendus).toHaveLength(16);
    expect(
      corrigerFeuille(corrige, {
        ...recopier('=C2*(1+$F$1)', 'C', 3, 9),
        ...recopier('=SI(C2>=$H$1;"Oui";"Non")', 'D', 2, 9),
        F3: '=SOMME(C2:C7)',
      }).score,
    ).toBe(1);
  });

  it('nomme dans le plan de la boutique le taux non figé, le texte sans guillemets et le cumul décalé', () => {
    const corrige = corrigeDeFeuille(COURS, 'b2-04-a4-feuille-boutique');
    const envoi = {
      ...recopier('=C2*(1+F1)', 'C', 3, 9),
      ...recopier('=SI(C2>=$H$1;Oui;Non)', 'D', 2, 9),
    };

    attendreUneRecopieNonFigee(corrige, envoi, 'C', 6);
    expect(confusionsDe(corrige, envoi, 'D')).toEqual(
      Array.from({ length: 8 }, () => 'critere-sans-guillemets'),
    );
    expect(
      confusionsDe(
        corrige,
        { ...recopier('=C2*(1+$F$1)', 'C', 3, 9), F3: '=SOMME(C3:C7)' },
        'F3',
      ),
    ).toEqual(['nombre-de-termes-decale']);
    expect(
      confusionsDe(
        corrige,
        { ...recopier('=C2*(1+$F$1)', 'C', 3, 9), F3: '=C7' },
        'F3',
      ),
    ).toEqual(['terme-pris-pour-somme']);
  });
});
