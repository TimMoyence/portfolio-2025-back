import { buildCoursDuContenu } from '../../../../../../../test/factories/formations/cours/contenus-de-cours.factory';
import * as fiche from '../../../../../../../test/helpers/formations/cours/fiche-de-cours';
import * as feuille from '../../../../../../../test/helpers/formations/cours/feuille-de-cours';
import { motsHorsProgramme } from '../../../../../../../test/helpers/formations/cours/lecture-de-cours';
import * as recit from '../../../../../../../test/helpers/formations/cours/recit-en-images';
import { auMillionieme } from '../../../../../../common/domain/nombres/arrondi';
import { projeterCatalogue } from '../../../../domain/cours/diffusion/Diffusion';
import { COURS_B2_09 } from './b2-09.cours';

const COURS = buildCoursDuContenu(COURS_B2_09);

const lettre = { p: 0.4, achat: 0.55, achatSinon: 0.2 };
const commandes = { total: 1000, lettre: 300, sac: 0.35, sacSinon: 0.2 };
const ateliers = { rochelle: 0.7, defautRochelle: 0.04, defautRochefort: 0.09 };
const DEFAUT =
  ateliers.rochelle * ateliers.defautRochelle +
  (1 - ateliers.rochelle) * ateliers.defautRochefort;
const independance = { lettre: 0.3, sac: 0.2, mobile: 0.45, mobileSac: 0.12 };
const paiement = { troisFois: 0.3, retard: 0.16, retardSinon: 0.05 };
const RETARD =
  paiement.troisFois * paiement.retard +
  (1 - paiement.troisFois) * paiement.retardSinon;

const ARBRE = /^B2-09-A\d-\d{2}-ARBRE-/u;

interface Branche {
  readonly evenement: string;
  readonly probabilite: number | '?';
  readonly produit?: number | '?';
  readonly branches?: readonly Branche[];
}

const arbres = (): string[] =>
  COURS.ecrans.map(({ id }) => id).filter((id) => ARBRE.test(id));

const branchesDe = (screenId: string): readonly Branche[] =>
  feuille.proprietesV2(COURS_B2_09, screenId).branches as readonly Branche[];

const lignesDe = (screenId: string): readonly Record<string, string>[] =>
  feuille.proprietesV2(COURS_B2_09, screenId).rows as readonly Record<
    string,
    string
  >[];

const corrigeDuTableau = () => {
  const corrige = fiche.corrigeDe(COURS, 'b2-09-a2-tableau-croise');
  if (corrige.type !== 'tableau') {
    throw new Error('le tableau croisé n’a pas de corrigé de tableau');
  }
  return corrige;
};

fiche.decrireLaFicheDuCours('B2-09', COURS, {
  conception: 'b2/cours-b2-09-conception.md',
  ...recit.TRAME_DE_135_MINUTES,
  ateliersNotes: [
    'A2-07 (10)',
    'A3-05 (8)',
    'A3-09 (8)',
    'A4-07 (8)',
    'A4-08 (8)',
  ],
  noteesParType: [7, 9, 0, 0, 1],
  enigmes: 0,
  rappels: 12,
  remediations: 11,
  options: 29,
  catalogue: [
    'A1-01',
    'A1-02',
    'A1-03',
    'A1-04',
    'A1-06',
    'A1-07',
    'A2-01',
    'A2-03',
    'A2-04',
    'A2-05',
    'A2-09',
    'A2-10',
    'A3-02',
    'A3-03',
    'A3-07',
    'A3-08',
    'A4-02',
    'A4-03',
    'A4-04',
    'A4-05',
    'A5-02',
  ],
  corrigesSurPlace: [
    'B2-09-A2-07-ATELIER-ARBRE',
    'B2-09-A2-11-TABLEAU-CROISE',
    'B2-09-A3-05-ATELIER-TOTALES',
    'B2-09-A3-09-ATELIER-REMONTER',
    'B2-09-A4-07-ATELIER-INDEPENDANCE',
    'B2-09-A4-08-ATELIER-SYNTHESE',
  ],
});

describe('B2-09 — le récapitulatif des probabilités du lycée, en images', () => {
  recit.decrireLeRecapitulatifEnImages(COURS, COURS_B2_09, {
    acte: 'B2-09-A1-',
    minutes: 12,
    images: [
      '/assets/cours/b2-09/v1/part-du-gateau.webp',
      '/assets/cours/b2-09/v1/sac-de-billes.webp',
      '/assets/cours/b2-09/v1/deux-cerceaux.webp',
      '/assets/cours/b2-09/v1/cerceaux-reunis.webp',
      '/assets/cours/b2-09/v1/commode-a-tiroirs.webp',
    ],
    references: ['B209-01', 'IMG-01'],
  });

  it('IMG-01 · sert huit écrans d’image, cinq au récapitulatif et trois dans les notions', () => {
    expect(
      COURS.ecrans.filter(({ id }) => recit.estUnEcranDImage(id)),
    ).toHaveLength(8);
  });
});

describe('B2-09 — les arbres pondérés, dessinés par le code', () => {
  it('B209-02 · sert au catalogue quatre arbres à deux générations, chaque chemin portant son produit calculé', () => {
    const { ecrans } = projeterCatalogue(COURS);

    expect(arbres()).toEqual([
      'B2-09-A2-04-ARBRE-EXEMPLE',
      'B2-09-A3-02-ARBRE-TOTALES',
      'B2-09-A3-07-ARBRE-REMONTER',
      'B2-09-A4-02-ARBRE-INDEPENDANT',
    ]);
    expect(
      ecrans.filter((ecran) => ARBRE.test(ecran.id)).map((ecran) => ecran.type),
    ).not.toContain('ecran-verrouille');
    for (const screenId of arbres()) {
      const branches = branchesDe(screenId);

      expect(branches).toHaveLength(2);
      expect(
        branches.flatMap((branche) =>
          (branche.branches ?? []).map((feuilleDeLArbre) =>
            feuilleDeLArbre.produit ===
            auMillionieme(
              Number(branche.probabilite) * Number(feuilleDeLArbre.probabilite),
            )
              ? 'juste'
              : `${screenId} : ${branche.evenement} → ${feuilleDeLArbre.evenement}`,
          ),
        ),
      ).toEqual(['juste', 'juste', 'juste', 'juste']);
    }
  });

  it('B209-05 · dessine l’arbre indépendant avec la même probabilité sous chaque branche', () => {
    const [premiere, seconde] = branchesDe('B2-09-A4-02-ARBRE-INDEPENDANT');

    expect(premiere.branches?.[0].probabilite).toBe(
      seconde.branches?.[0].probabilite,
    );
  });

  it('CONF-01 · ne sert dans aucun arbre un nombre égal, au centième, à une réponse ou à un piège d’exercice', () => {
    const notees = recit.reponsesEtPiegesNotables(
      COURS,
      corrigeDuTableau().attendus,
    );
    const servis = projeterCatalogue(COURS).ecrans.filter((ecran) =>
      ARBRE.test(ecran.id),
    );

    expect(servis).toHaveLength(4);
    expect(recit.nombresServisEgauxAuCentieme(servis, notees)).toEqual([]);
  });

  it('CONF-03 · n’écrit au catalogue aucune réponse ni aucun piège d’exercice, effectifs du tableau croisé compris', () => {
    expect(
      recit.reponsesAuCatalogue(COURS, corrigeDuTableau().attendus),
    ).toEqual([]);
  });
});

describe('B2-09 — chaque notion porte sa règle', () => {
  it('B209-02 · multiplie le long d’un chemin et lit P_A(B) sur une branche', () => {
    const lecon = feuille.texteDeLEcran(COURS_B2_09, 'B2-09-A2-05-COURS-ARBRE');

    expect(lecon).toContain('P(A ∩ B) = P(A) × P_A(B)');
    expect(lecon).toContain('somment à 1');
  });

  it('B209-03 · lit P_A(B) dans un tableau croisé, en divisant par l’effectif de A', () => {
    const lecon = feuille.texteDeLEcran(
      COURS_B2_09,
      'B2-09-A2-10-COURS-TABLEAU',
    );

    expect(lecon).toContain('P_A(B) = P(A ∩ B) ÷ P(A)');
    expect(lecon).toContain('100 ÷ 250 = 0,4');
  });

  it('B209-04 · somme les chemins d’une partition, puis remonte l’arbre', () => {
    expect(
      feuille.texteDeLEcran(COURS_B2_09, 'B2-09-A3-03-COURS-TOTALES'),
    ).toContain('P(B) = P(A) × P_A(B) + P(Ā) × P_Ā(B)');
    expect(
      feuille.texteDeLEcran(COURS_B2_09, 'B2-09-A3-08-COURS-REMONTER'),
    ).toContain('P_B(A) = P(A ∩ B) ÷ P(B)');
  });

  it('B209-05 · justifie l’indépendance par le calcul et la distingue de l’incompatibilité', () => {
    const lecon = feuille.texteDeLEcran(
      COURS_B2_09,
      'B2-09-A4-05-COURS-INDEPENDANCE',
    );

    expect(lecon).toContain('P(A ∩ B) = P(A) × P(B)');
    expect(lecon).toContain('incompatibles');
  });

  it('B209-05 · sert un tableau d’exemple aux lignes proportionnelles', () => {
    const lignes = lignesDe('B2-09-A4-03-TABLEAU-INDEPENDANT');
    const parts = lignes.map(
      (ligne) => Number(ligne.avecSac) / Number(ligne.total),
    );

    expect(lignes).toHaveLength(3);
    expect(new Set(parts)).toEqual(new Set([0.5]));
  });
});

describe('B2-09 — recalcul des corrigés depuis les seuls paramètres', () => {
  it('B209-06 · recalcule les solutions et pièges des neuf questions numériques', () => {
    fiche.attendreLesNumeriques(COURS, {
      'b2-09-a2-intersection': [
        lettre.p * lettre.achat,
        lettre.p + lettre.achat,
        lettre.achat,
      ],
      'b2-09-a2-chemin': [
        (1 - lettre.p) * (1 - lettre.achatSinon),
        (1 - lettre.p) * lettre.achatSinon,
        1 - lettre.p + (1 - lettre.achatSinon),
      ],
      'b2-09-a3-defaut': [
        DEFAUT,
        ateliers.defautRochelle + ateliers.defautRochefort,
        ateliers.rochelle * ateliers.defautRochelle,
      ],
      'b2-09-a3-sans-defaut': [
        1 - DEFAUT,
        1 - (ateliers.defautRochelle + ateliers.defautRochefort),
      ],
      'b2-09-a3-rochefort': [
        ((1 - ateliers.rochelle) * ateliers.defautRochefort) / DEFAUT,
        ateliers.defautRochefort,
        (1 - ateliers.rochelle) * ateliers.defautRochefort,
        1 - ateliers.rochelle,
      ],
      'b2-09-a3-la-rochelle': [
        (ateliers.rochelle * ateliers.defautRochelle) / DEFAUT,
        ateliers.defautRochelle,
        ateliers.rochelle,
      ],
      'b2-09-a4-mobile': [
        independance.mobileSac / independance.mobile,
        independance.mobileSac,
        independance.mobileSac / independance.sac,
      ],
      'b2-09-a4-retard': [
        RETARD,
        paiement.retard + paiement.retardSinon,
        paiement.troisFois * paiement.retard,
      ],
      'b2-09-a4-trois-fois': [
        (paiement.troisFois * paiement.retard) / RETARD,
        paiement.retard,
        paiement.troisFois,
      ],
    });
  });

  it('B209-06 · recalcule les quatre effectifs du tableau croisé, chacun avec son piège du mauvais total', () => {
    const autres = commandes.total - commandes.lettre;
    const sac = Math.round(commandes.lettre * commandes.sac);
    const sacSinon = Math.round(autres * commandes.sacSinon);
    const surLeTotal = (part: number) => [
      [Math.round(commandes.total * part), 'mauvais-total-du-tableau'],
    ];

    expect(
      corrigeDuTableau().attendus.map(({ rang, cle, valeur, pieges }) => [
        rang,
        cle,
        valeur,
        pieges.map((piege) => [piege.valeur, piege.confusion]),
      ]),
    ).toEqual([
      [0, 'sac', sac, surLeTotal(commandes.sac)],
      [0, 'sansSac', commandes.lettre - sac, surLeTotal(1 - commandes.sac)],
      [1, 'sac', sacSinon, surLeTotal(commandes.sacSinon)],
      [1, 'sansSac', autres - sacSinon, surLeTotal(1 - commandes.sacSinon)],
    ]);
  });
});

describe('B2-09 — retours de relecture', () => {
  it('écrit la probabilité conditionnelle P_A(B), jamais P(B|A)', () => {
    const texte = JSON.stringify(COURS_B2_09);

    expect(texte).toContain('P_A(B)');
    expect(texte).not.toMatch(/P\([^)]*\|/u);
    expect(motsHorsProgramme(COURS_B2_09)).toEqual([]);
  });
});
