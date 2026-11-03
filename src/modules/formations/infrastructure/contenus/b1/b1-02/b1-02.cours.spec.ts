import {
  attendreLaFeuille,
  attendreLesNumeriques,
  CATALOGUE_ILLUSTRE_A_SIX_PAGES,
  corrigeDe,
  corrigeDeFeuille,
  decrireLaFicheDuCours,
  FORME_DES_COURS_B1,
  valeursEtPieges,
} from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import {
  attendusDeColonne,
  recopier,
  texteDeLEcran as texteDe,
} from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { valeursAuCatalogue } from '../../../../../../../test/helpers/formations/cours/relecture-de-cours';
import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import {
  arrondi,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import { avecVirgule } from '../../../../../../common/domain/nombres/ecriture-francaise';
import { somme } from '../../../../../../common/domain/nombres/statistiques';
import { corrigerFeuille } from '../../../../domain/cours/correction/CorrectionProduction';
import { COURS_B1_02 } from './b1-02.cours';

const COURS = buildCoursDuContenu(COURS_B1_02);

const PACK_AVANT = 16;
const PACK_APRES = 18;
const MANETTE_TTC = 60;
const TVA = 0.2;
const REMISE = 0.15;
const HAUSSES = [0.1, 0.05] as const;
const BAISSE_DES_CARTES = 0.4;

const CA_2025 = [184, 120, 96, 80];
const CA_2026 = [207, 123, 92, 94];
const PRIX_DE_DEPART = [120, 80, 60, 40];
const HAUSSE_DU_TABLEAU = 0.2;
const SOLDES_DU_TABLEAU = 0.25;
const JEU_DES_SOLDES = 200;
const SANCTIONS = [18, 21, 42, 87] as const;
const [SANCTIONS_2021, SANCTIONS_2022, SANCTIONS_2023, SANCTIONS_2024] =
  SANCTIONS;
const EVOLUTIONS_DE_L_ANNALE = 3;

const APRES_HAUSSE = PRIX_DE_DEPART.map(
  (prix) => prix * (1 + HAUSSE_DU_TABLEAU),
);
const APRES_SOLDES = APRES_HAUSSE.map((prix) => prix * (1 - SOLDES_DU_TABLEAU));

const auDixieme = (valeur: number): number => arrondi(valeur, 1);
const evolution = (depart: number, arrivee: number): number =>
  ((arrivee - depart) / depart) * 100;
const indice = (valeur: number): number => (valeur / SANCTIONS_2021) * 100;

const TAUX_MOYEN =
  ((SANCTIONS_2024 / SANCTIONS_2021) ** (1 / EVOLUTIONS_DE_L_ANNALE) - 1) * 100;

const HAUSSE_DU_FOURNISSEUR = 0.08;
const PRIX_DU_CASQUE_TTC = 36;
const CA_DE_LA_TROISIEME_BOUTIQUE = 96;
const PRIX_AUSSI_ECRITS_AUX_PAGES: readonly number[] = [
  PRIX_DU_CASQUE_TTC,
  CA_DE_LA_TROISIEME_BOUTIQUE,
];
const COEFFICIENT_DES_DEUX_HAUSSES = (1 + HAUSSES[0]) * (1 + HAUSSES[1]);

const REPONSES_DE_L_EXERCICE_4 = [
  arrondi(COEFFICIENT_DES_DEUX_HAUSSES, 3),
  auDixieme((COEFFICIENT_DES_DEUX_HAUSSES - 1) * 100),
  auDixieme((1 / (1 - BAISSE_DES_CARTES) - 1) * 100),
];

const REPONSES_DE_L_EXERCICE_5 = [
  auDixieme(indice(SANCTIONS_2022)),
  auDixieme(indice(SANCTIONS_2023)),
  auDixieme(indice(SANCTIONS_2024)),
  auDixieme(evolution(SANCTIONS_2022, SANCTIONS_2024)),
  auDixieme(evolution(SANCTIONS_2021, SANCTIONS_2024)),
  auDixieme(TAUX_MOYEN),
];

const FORMULES_DE_L_ANNALE = {
  C3: '=ARRONDI(C2/$B$2*100;1)',
  D3: '=ARRONDI(D2/$B$2*100;1)',
  E3: '=ARRONDI(E2/$B$2*100;1)',
  B5: '=ARRONDI((E2-C2)/C2*100;1)',
  B6: '=ARRONDI((E2-B2)/B2*100;1)',
  B7: '=ARRONDI((PUISSANCE(E2/B2;1/3)-1)*100;1)',
};

function verdictDe(
  envoi: Readonly<Record<string, string>>,
  reference: string,
): { readonly juste: boolean; readonly confusion: string | null } | undefined {
  const verdict = corrigerFeuille(
    corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil'),
    envoi,
  ).verdicts.find((candidat) => candidat.reference === reference);
  return (
    verdict && { juste: verdict.juste, confusion: verdict.confusion ?? null }
  );
}

decrireLaFicheDuCours('B1-02', COURS, {
  ...FORME_DES_COURS_B1,
  conception: 'cours-b1-02-conception.md',
  noteesParType: [3, 6, 0, 2, 1],
  enigmes: 0,
  rappels: 12,
  options: 19,
  catalogue: [
    ...CATALOGUE_ILLUSTRE_A_SIX_PAGES.filter((code) => !code.startsWith('A4-')),
    'A4-02',
  ],
  ateliersNotes: ['A1-09 (10)', 'A2-06 (10)'],
  remediations: 18,
  corrigesSurPlace: [
    'B1-02-A1-09-ATELIER-PRIX',
    'B1-02-A1-10-TABLEUR-CA',
    'B1-02-A2-05-TABLEAU-PRIX',
    'B1-02-A2-06-ATELIER-RETOUR',
    'B1-02-A3-05-TABLEUR-CNIL',
  ],
});

describe('B1-02 — textes relus contre les données', () => {
  it('B102-M2 · signale au dossier les données fictives de Partie Libre', () => {
    const dossier = texteDe(COURS_B1_02, 'B1-02-A1-04-DOSSIER');

    expect(dossier).toContain('Partie Libre');
    expect(dossier).toContain('Données fictives');
    for (const ca of [...CA_2025, ...CA_2026]) {
      expect(dossier).toContain(String(ca));
    }
  });

  it('B102-M2 · dit réelles les données de la CNIL, source citée, sans les dire fictives', () => {
    const annale = texteDe(COURS_B1_02, 'B1-02-A3-05-TABLEUR-CNIL');

    expect(annale).toContain('Données réelles');
    expect(annale).toContain('CNIL, rapport annuel 2024');
    expect(annale).toContain('26CGMATPO');
    expect(annale).not.toContain('fictives');
  });

  it('B102-M1 · donne à chaque page une méthode, sans encadré « Au CCF »', () => {
    const pages = COURS_B1_02.ecrans
      .map((ecran) => texteDe(COURS_B1_02, ecran.screenId))
      .filter((texte) => texte.includes('"renderer":"lesson"'));

    expect(pages).toHaveLength(6);
    for (const texte of pages) {
      expect(texte).toContain('"kind":"method"');
      expect(texte).not.toContain('"exam"');
    }
  });

  it('B102-M1 · ne garde ni mini-situation, ni défi, ni billet de sortie', () => {
    expect(
      COURS.ecrans.filter((ecran) =>
        ['fp-escape', 'fp-challenge'].includes(ecran.brique),
      ),
    ).toEqual([]);
    expect(COURS.ecrans.at(-1)?.id).toBe('B1-02-A4-02-FICHE-MEMO');
  });

  it.each([
    ['COEFFICIENT', 'CINEMA', 'A1-06', 'cinema-coefficient'],
    ['HT-TTC', 'CASQUE', 'A1-07', 'casque-ht-ttc'],
    ['SUCCESSIVES', 'LOYER', 'A2-02', 'loyer-successives'],
    ['RECIPROQUE', 'VELO', 'A2-03', 'velo-reciproque'],
    ['INDICE', 'TICKET', 'A3-02', 'ticket-indice'],
    ['TAUX-MOYEN', 'EPARGNE', 'A3-03', 'epargne-taux-moyen'],
  ])(
    'B102-M14 · projette 1 min l’infographie avant la page %s de 2 min',
    (page, sujet, rang, fichier) => {
      const ecrans = COURS_B1_02.ecrans;
      const position = ecrans.findIndex(
        (ecran) => ecran.screenId === `B1-02-${rang}-COURS-${page}`,
      );
      const illustration = ecrans[position - 1];

      expect(illustration?.screenId).toBe(
        `B1-02-${rang}-ILLUSTRATION-${sujet}`,
      );
      expect(illustration?.dureeMinutes).toBe(1);
      expect(ecrans[position]?.dureeMinutes).toBe(2);
      expect(
        texteDe(COURS_B1_02, `B1-02-${rang}-ILLUSTRATION-${sujet}`),
      ).toContain(`/assets/cours/b1-02/v1/${fichier}.webp`);
    },
  );

  it('B102-M10 · ne sert au catalogue aucune réponse d’exercice, seulement les nombres de ses pages', () => {
    const reponses = [
      `${arrondi(MANETTE_TTC / (1 + TVA), 0)} €`,
      arrondi(MANETTE_TTC * (1 - REMISE), 0),
      evolution(PACK_AVANT, PACK_APRES),
      1 + HAUSSE_DU_FOURNISSEUR,
      ...CA_2025.map((ca, rang) => evolution(ca, CA_2026[rang])).map(auDixieme),
      auDixieme(evolution(somme(CA_2025), somme(CA_2026))),
      somme(CA_2025),
      somme(CA_2026),
      ...[...APRES_HAUSSE, ...APRES_SOLDES].filter(
        (prix) => !PRIX_AUSSI_ECRITS_AUX_PAGES.includes(prix),
      ),
      ...REPONSES_DE_L_EXERCICE_4,
      ...REPONSES_DE_L_EXERCICE_5,
    ];

    expect(valeursAuCatalogue(COURS, reponses)).toEqual([]);
    expect(valeursAuCatalogue(COURS, ['32,40 €'])).toHaveLength(2);
  });

  it.each([
    ['A2-06-ATELIER-RETOUR', REPONSES_DE_L_EXERCICE_4],
    ['A3-05-TABLEUR-CNIL', REPONSES_DE_L_EXERCICE_5],
  ])(
    'B102-M10 · ne montre aucune réponse de %s dans un écran antérieur',
    (ecran, reponses) => {
      const ecrans = COURS_B1_02.ecrans.map(({ screenId }) => screenId);
      const anterieurs = ecrans
        .slice(0, ecrans.indexOf(`B1-02-${ecran}`))
        .map((screenId) => texteDe(COURS_B1_02, screenId))
        .join(' ');
      const ecrites = reponses.map((reponse) => avecVirgule(reponse));

      expect(ecrites.filter((ecrite) => anterieurs.includes(ecrite))).toEqual(
        [],
      );
      expect(
        ecrites.filter((ecrite) =>
          texteDe(COURS_B1_02, `B1-02-${ecran}`).includes(ecrite),
        ),
      ).toEqual(ecrites);
    },
  );

  it('B102-M14 · décrit l’encart du ticket avec la formule en C3, comme sa page', () => {
    const illustration = texteDe(
      COURS_B1_02,
      'B1-02-A3-02-ILLUSTRATION-TICKET',
    );

    expect(illustration).toContain('en C3 la formule =B3/$B$2*100');
    expect(texteDe(COURS_B1_02, 'B1-02-A3-02-COURS-INDICE')).toContain(
      'en C3 : =B3/$B$2*100',
    );
  });
});

describe('B1-02 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('B102-M9 · recalcule les solutions et pièges des six questions numériques', () => {
    const ht = MANETTE_TTC / (1 + TVA);
    const [premiere, seconde] = HAUSSES;
    const global = (1 + premiere) * (1 + seconde);

    attendreLesNumeriques(COURS, {
      'b1-02-a1-taux-pack': [
        evolution(PACK_AVANT, PACK_APRES),
        PACK_APRES - PACK_AVANT,
        ((PACK_APRES - PACK_AVANT) / PACK_APRES) * 100,
      ],
      'b1-02-a1-ht': [ht, MANETTE_TTC * (1 - TVA), MANETTE_TTC * (1 + TVA)],
      'b1-02-a1-remise': [
        MANETTE_TTC * (1 - REMISE),
        MANETTE_TTC - REMISE * 100,
        MANETTE_TTC * REMISE,
      ],
      'b1-02-a2-coefficient-global': [
        global,
        1 + premiere + seconde,
        global - 1,
      ],
      'b1-02-a2-taux-global': [
        (global - 1) * 100,
        (premiere + seconde) * 100,
        global * 100,
      ],
      'b1-02-a2-reciproque': [
        (1 / (1 - BAISSE_DES_CARTES) - 1) * 100,
        BAISSE_DES_CARTES * 100,
        (1 - BAISSE_DES_CARTES) * 100,
      ],
    });
  });

  it('B102-M9 · attend au tableau les prix après chaque évolution, et − 10 % au global', () => {
    const corrige = corrigeDe(COURS, 'b1-02-a2-tableau-prix');

    expect(
      corrige.type === 'tableau' ? corrige.attendus.map(valeursEtPieges) : [],
    ).toEqual([
      ...PRIX_DE_DEPART.map((prix, rang) => [
        auMillionieme(APRES_HAUSSE[rang]),
        auMillionieme(prix * HAUSSE_DU_TABLEAU),
      ]),
      ...PRIX_DE_DEPART.map((prix, rang) => [
        auMillionieme(APRES_SOLDES[rang]),
        auMillionieme(prix * 0.95),
        auMillionieme(APRES_HAUSSE[rang] * SOLDES_DU_TABLEAU),
      ]),
    ]);
    expect(
      auMillionieme((somme(APRES_SOLDES) / somme(PRIX_DE_DEPART) - 1) * 100),
    ).toBe(-10);
  });
});

describe('B1-02 — l’évolution du chiffre d’affaires au tableur', () => {
  const TOTAL_2025 = somme(CA_2025);
  const TOTAL_2026 = somme(CA_2026);
  const LIGNES = [...CA_2025, TOTAL_2025];
  const ARRIVEES = [...CA_2026, TOTAL_2026];
  const tauxExact = (rang: number): number =>
    evolution(LIGNES[rang], ARRIVEES[rang]);

  it('B102-M9 · reconnaît juste la feuille entière, totaux et taux arrondis', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-02-a1-tableur-ca');

    attendreLaFeuille(corrige, {
      B6: [TOTAL_2025],
      C6: [TOTAL_2026],
      ...attendusDeColonne('D', 2, LIGNES, (_ca, rang) => {
        const juste = auDixieme(evolution(LIGNES[rang], ARRIVEES[rang]));
        if (rang === 0) {
          return [
            juste,
            auDixieme(((ARRIVEES[0] - LIGNES[0]) / ARRIVEES[0]) * 100),
            ARRIVEES[0] - LIGNES[0],
            auDixieme((ARRIVEES[0] / LIGNES[0]) * 100),
          ];
        }
        return tauxExact(rang) === juste ? [juste] : [juste, tauxExact(rang)];
      }),
    });
    expect(
      corrigerFeuille(corrige, {
        B6: '=SOMME(B2:B5)',
        C6: '=SOMME(C2:C5)',
        ...recopier('=ARRONDI((C2-B2)/B2*100;1)', 'D', 2, 6),
      }).score,
    ).toBe(1);
  });
});

describe('B1-02 — l’exercice 5, le tableau du sujet', () => {
  it('B102-M3 · reprend en ligne les nombres du sujet et impose le premier indice', () => {
    const { plan } = corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil');

    expect([plan.lignes, plan.colonnes]).toEqual([7, 5]);
    expect(
      ['B1', 'C1', 'D1', 'E1'].map((cellule) => plan.cellules[cellule]),
    ).toEqual(['2021', '2022', '2023', '2024']);
    expect(
      ['B2', 'C2', 'D2', 'E2'].map((cellule) => plan.cellules[cellule]),
    ).toEqual(SANCTIONS.map(String));
    expect(plan.cellules['B3']).toBe('100');
    expect(plan.verrouillees).toContain('B3');
  });

  it('B102-M3 · retrouve le sujet : 116,7, 483,3 et une hausse de 383,3 %', () => {
    const corrige = corrigeDeFeuille(COURS, 'b1-02-a3-tableur-cnil');

    expect(
      corrigerFeuille(corrige, FORMULES_DE_L_ANNALE).verdicts.map(
        ({ reference, juste }) => [reference, juste],
      ),
    ).toEqual(
      Object.keys(FORMULES_DE_L_ANNALE).map((cellule) => [cellule, true]),
    );
    expect(
      corrige.attendus.map(({ reference, valeur }) => [reference, valeur]),
    ).toEqual([
      ['C3', auDixieme(indice(SANCTIONS_2022))],
      ['D3', auDixieme(indice(SANCTIONS_2023))],
      ['E3', auDixieme(indice(SANCTIONS_2024))],
      ['B5', auDixieme(evolution(SANCTIONS_2022, SANCTIONS_2024))],
      ['B6', auDixieme(evolution(SANCTIONS_2021, SANCTIONS_2024))],
      ['B7', auDixieme(TAUX_MOYEN)],
    ]);
  });

  it('B102-M3 · nomme la base non figée, qui glisse d’une colonne', () => {
    const envoi = {
      ...FORMULES_DE_L_ANNALE,
      C3: '=ARRONDI(C2/B2*100;1)',
      D3: '=ARRONDI(D2/C2*100;1)',
      E3: '=ARRONDI(E2/D2*100;1)',
    };

    expect(verdictDe(envoi, 'C3')).toEqual({ juste: true, confusion: null });
    for (const cellule of ['D3', 'E3']) {
      expect(verdictDe(envoi, cellule)).toEqual({
        juste: false,
        confusion: 'reference-non-figee-en-ligne',
      });
    }
  });

  it('B102-M3 · nomme l’arrondi oublié, sur chaque cellule, à la même règle', () => {
    const sansArrondi = {
      C3: '=C2/$B$2*100',
      D3: '=D2/$B$2*100',
      E3: '=E2/$B$2*100',
      B5: '=(E2-C2)/C2*100',
      B6: '=(E2-B2)/B2*100',
      B7: '=(PUISSANCE(E2/B2;1/3)-1)*100',
    };

    for (const cellule of Object.keys(sansArrondi)) {
      expect(verdictDe(sansArrondi, cellule)).toEqual({
        juste: false,
        confusion: 'arrondi-oublie',
      });
    }
  });

  it('B102-M3 · nomme le taux moyen divisé, et le taux écrit en décimal', () => {
    const avec = (B7: string) => ({ ...FORMULES_DE_L_ANNALE, B7 });

    expect(verdictDe(avec('=ARRONDI((E2-B2)/B2*100/3;1)'), 'B7')).toEqual({
      juste: false,
      confusion: 'taux-moyen-arithmetique',
    });
    expect(verdictDe(avec('=ARRONDI(PUISSANCE(E2/B2;1/3)-1;1)'), 'B7')).toEqual(
      { juste: false, confusion: 'taux-valeur-facteur-cent' },
    );
  });

  it('B102-M3 · accepte la valeur de 2021 écrite en dur et recopiée : seule la consigne demande B2, décision de Tim du 30/10', () => {
    const envoi = {
      ...FORMULES_DE_L_ANNALE,
      C3: '=ARRONDI(C2/18*100;1)',
      D3: '=ARRONDI(D2/18*100;1)',
      E3: '=ARRONDI(E2/18*100;1)',
    };

    for (const cellule of ['C3', 'D3', 'E3']) {
      expect(verdictDe(envoi, cellule)).toEqual({
        juste: true,
        confusion: null,
      });
    }
  });

  it('B102-M7 · nomme une formule retapée au lieu d’être recopiée', () => {
    const envoi = { ...FORMULES_DE_L_ANNALE, D3: '=ARRONDI(D2/18*100;1)' };

    expect(verdictDe(envoi, 'D3')).toEqual({
      juste: false,
      confusion: 'formule-non-recopiable-en-ligne',
    });
  });
});

describe('B1-02 — les nombres écrits dans les corrections', () => {
  const ecrit = (valeur: number, decimales = 1): string =>
    avecVirgule(arrondi(valeur, decimales)).replace('-', '−');
  const enSerie = (valeurs: readonly number[]): string =>
    valeurs.map((valeur) => ecrit(valeur)).join(' ; ');

  const ecartDuPack = PACK_APRES - PACK_AVANT;
  const [hausse2026, hausse2027] = HAUSSES;
  const coefficient = (1 + hausse2026) * (1 + hausse2027);
  const aller = 1 - BAISSE_DES_CARTES;
  const retour = aller * (1 + BAISSE_DES_CARTES);
  const coefficientDuTableau =
    (1 + HAUSSE_DU_TABLEAU) * (1 - SOLDES_DU_TABLEAU);
  const totaux = [somme(CA_2025), somme(CA_2026)] as const;
  const tauxDuCa = [...CA_2025, totaux[0]].map((depart, rang) =>
    evolution(depart, [...CA_2026, totaux[1]][rang]),
  );
  const hausseDesSanctions = evolution(SANCTIONS_2021, SANCTIONS_2024);
  const dernierIndice = ecrit(indice(SANCTIONS_2024));

  const PHRASES: readonly (readonly [string, readonly string[]])[] = [
    [
      'B1-02-A1-09-ATELIER-PRIX',
      [
        `(${PACK_APRES} − ${PACK_AVANT}) ÷ ${PACK_AVANT} = ${ecrit(ecartDuPack / PACK_AVANT, 3)}, soit + ${ecrit(evolution(PACK_AVANT, PACK_APRES))} %. Diviser par ${PACK_APRES} donnerait ${ecrit((ecartDuPack / PACK_APRES) * 100)} % :`,
        `${MANETTE_TTC} ÷ ${avecVirgule(1 + TVA, 2)} = ${ecrit(MANETTE_TTC / (1 + TVA))} € HT. Retirer 20 % donnerait ${ecrit(MANETTE_TTC * (1 - TVA))} € :`,
        `${MANETTE_TTC} × ${avecVirgule(1 - REMISE, 2)} = ${ecrit(MANETTE_TTC * (1 - REMISE))} €.`,
      ],
    ],
    [
      'B1-02-A1-10-TABLEUR-CA',
      [`: ${totaux[0]} et ${totaux[1]}.`, `recopiée : ${enSerie(tauxDuCa)}.`],
    ],
    [
      'B1-02-A2-01-REFLEXION-SOLDES',
      [
        `sur ${ecrit(JEU_DES_SOLDES * 1.1)} €. ${JEU_DES_SOLDES} × 1,10 × 0,90 = ${ecrit(JEU_DES_SOLDES * 1.1 * 0.9)} € : le prix final a baissé de ${ecrit((1 - 1.1 * 0.9) * 100)} %.`,
      ],
    ],
    [
      'B1-02-A2-05-TABLEAU-PRIX',
      [
        `Après hausse : ${enSerie(APRES_HAUSSE)}.`,
        `Après soldes : ${enSerie(APRES_SOLDES)}.`,
        `C = 1,20 × 0,75 = ${ecrit(coefficientDuTableau)} : − ${ecrit((1 - coefficientDuTableau) * 100)} %, pas − ${ecrit((SOLDES_DU_TABLEAU - HAUSSE_DU_TABLEAU) * 100)} %.`,
      ],
    ],
    [
      'B1-02-A2-06-ATELIER-RETOUR',
      [
        `1,10 × 1,05 = ${ecrit(coefficient, 3)}. Additionner donnerait ${ecrit(1 + hausse2026 + hausse2027, 3)} :`,
        `soit + ${ecrit((coefficient - 1) * 100)} %, pas + ${ecrit((hausse2026 + hausse2027) * 100)} %.`,
        `${avecVirgule(aller, 2)} × ${avecVirgule(1 + BAISSE_DES_CARTES, 2)} = ${ecrit(retour, 2)} : le prix reste ${ecrit((1 - retour) * 100)} % sous le départ.`,
        `1 ÷ ${avecVirgule(aller, 2)} ≈ ${ecrit(1 / aller, 3)}, soit + ${ecrit((1 / aller - 1) * 100)} %.`,
      ],
    ],
    [
      'B1-02-A3-05-TABLEUR-CNIL',
      [
        `recopiée vers la droite : ${enSerie(SANCTIONS.slice(1).map(indice))}.`,
        `: + ${ecrit(evolution(SANCTIONS_2022, SANCTIONS_2024))} %.`,
        `: + ${ecrit(hausseDesSanctions)} %. L’indice ${dernierIndice} le dit aussi : ${dernierIndice} − 100.`,
        `: + ${ecrit(TAUX_MOYEN)} % par an.`,
      ],
    ],
  ];

  it.each(PHRASES)(
    'B102-M9 · recalcule depuis les données les phrases de %s',
    (ecran, phrases) => {
      const texte = texteDe(COURS_B1_02, ecran);

      expect(phrases.filter((phrase) => !texte.includes(phrase))).toEqual([]);
    },
  );
});
