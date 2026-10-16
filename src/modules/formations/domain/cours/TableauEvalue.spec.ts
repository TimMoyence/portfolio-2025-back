import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  CONTENUS,
  COURS_B2_01,
  COURS_B2_03,
  COURS_B2_05,
} from '../../../../../test/factories/contenus-publies';
import { ESPACE_INSECABLE as INSECABLE } from '../../../../common/domain/texte/sans-espaces-typographiques';
import type { Ecran } from '../contrats/cours';
import type { TableauEvalue } from '../contrats/donnees-publiques';
import { ProductionInvalideError } from '../errors/FormationErrors';
import {
  evaluerLeTableauDuPlan,
  planDeTableauDuCours,
  tableauDuCorrige,
} from './TableauEvalue';
import { tirer } from './Tirage';

type EcranDeTableau = Extract<Ecran, { readonly brique: 'fp-table-build' }>;

const TABLEAUX_DES_COURS: readonly EcranDeTableau[] = CONTENUS.flatMap(
  (contenu) =>
    buildCoursDuContenu(contenu).ecrans.flatMap((ecran) =>
      ecran.brique === 'fp-table-build' ? [ecran] : [],
    ),
);

function tableauDu(
  contenu: (typeof CONTENUS)[number],
  planId: string,
): EcranDeTableau {
  const ecran = buildCoursDuContenu(contenu).ecrans.find(
    (candidat) =>
      candidat.brique === 'fp-table-build' &&
      candidat.proprietes.plan.id === planId,
  );
  if (ecran?.brique !== 'fp-table-build') {
    throw new Error(`tableau absent du cours : ${planId}`);
  }
  return ecran;
}

function attendusDu(ecran: EcranDeTableau) {
  const corrige = ecran.production.corrige;
  if (corrige.type !== 'tableau') {
    throw new Error(`${ecran.id} : un tableau porte un corrigé de tableau`);
  }
  return corrige.attendus;
}

function affichagesDe(tableau: TableauEvalue, cle: string): string[] {
  return tableau.lignes.map(({ valeurs }) => valeurs[cle].affichage);
}

const INDICE_TOILE = tableauDu(COURS_B2_01, 'b2-01-a4-indice-toile');
const PLAN_TOILE = INDICE_TOILE.proprietes.plan;

describe('tableauDuCorrige', () => {
  it('remplit le tableau de la toile avec les prix attendus, et calcule coefficients, indices, synthèse comme le contrôle du formateur', () => {
    const corrige = tableauDuCorrige(PLAN_TOILE, attendusDu(INDICE_TOILE));

    expect({
      prix: affichagesDe(corrige, 'prix'),
      coef: affichagesDe(corrige, 'coef'),
      evolution: affichagesDe(corrige, 'evolution'),
      totaux: corrige.totaux,
      synthese: corrige.synthese.map(({ affichage }) => affichage),
      soldeFinal: corrige.soldeFinal,
    }).toEqual({
      prix: ['21,60', '20,52', '21,34', '20,70'],
      coef: ['1,0800', '0,9500', '1,0400', '0,9700'],
      evolution: ['8,00', '2,60', '6,70', '3,50'],
      totaux: { taux: { valeur: 4, affichage: '4' } },
      synthese: [`4,00${INSECABLE}%`, `3,50${INSECABLE}%`],
      soldeFinal: null,
    });
  });

  it('chaque tableau des cours se remplit de son corrigé sans cellule ni synthèse incalculable', () => {
    expect(TABLEAUX_DES_COURS.length).toBeGreaterThan(0);
    for (const ecran of TABLEAUX_DES_COURS) {
      const corrige = tableauDuCorrige(
        ecran.proprietes.plan,
        attendusDu(ecran),
      );
      const incalculables = [
        ...corrige.lignes.flatMap(({ rang, valeurs }) =>
          Object.entries(valeurs).flatMap(([cle, { valeur }]) =>
            valeur === null ? [`${rang}:${cle}`] : [],
          ),
        ),
        ...corrige.synthese.flatMap(({ valeur }, rang) =>
          valeur === null ? [`synthese ${rang}`] : [],
        ),
      ];

      expect({ ecran: ecran.id, incalculables }).toEqual({
        ecran: ecran.id,
        incalculables: [],
      });
    }
  });
});

describe('evaluerLeTableauDuPlan', () => {
  it('lit la saisie de l élève à la française, et en déduit le coefficient de la ligne et celui de la suivante', () => {
    const tableau = evaluerLeTableauDuPlan(PLAN_TOILE, [
      { rang: 0, cle: 'prix', saisie: '21,6' },
      { rang: 1, cle: 'prix', saisie: ' 20,80 ' },
    ]);

    expect({
      prix: affichagesDe(tableau, 'prix'),
      coef: affichagesDe(tableau, 'coef'),
      valeur: tableau.lignes[1].valeurs.prix.valeur,
    }).toEqual({
      prix: ['21,60', '20,80', '—', '—'],
      coef: ['1,0800', '0,9630', '—', '—'],
      valeur: 20.8,
    });
  });

  it('rend un tiret pour une saisie illisible, sans rien refuser', () => {
    const tableau = evaluerLeTableauDuPlan(PLAN_TOILE, [
      { rang: 0, cle: 'prix', saisie: 'vingt' },
    ]);

    expect(tableau.lignes[0].valeurs.prix).toEqual({
      valeur: null,
      affichage: '—',
    });
  });

  it.each([
    ['une colonne déduite', { rang: 0, cle: 'coef', saisie: '1' }],
    ['une colonne de donnée', { rang: 0, cle: 'taux', saisie: '1' }],
    ['une colonne absente', { rang: 0, cle: 'constructor', saisie: '1' }],
    ['une ligne au-delà du tableau', { rang: 4, cle: 'prix', saisie: '1' }],
    ['une ligne fractionnaire', { rang: 0.5, cle: 'prix', saisie: '1' }],
  ])('refuse une saisie sur %s', (_cas, saisie) => {
    expect(() => evaluerLeTableauDuPlan(PLAN_TOILE, [saisie])).toThrow(
      ProductionInvalideError,
    );
  });

  it('ne retient dans une colonne de vérité que 1 (vrai) ou 0 (faux)', () => {
    const plan = tableauDu(COURS_B2_03, 'b2-03-a1-table-verite').proprietes
      .plan;
    const colonne = plan.colonnes.find(({ role }) => role === 'saisie');
    if (colonne === undefined) {
      throw new Error('colonne de vérité à saisir attendue');
    }

    const tableau = evaluerLeTableauDuPlan(plan, [
      { rang: 0, cle: colonne.cle, saisie: '1' },
      { rang: 1, cle: colonne.cle, saisie: '5' },
    ]);

    expect(
      tableau.lignes.slice(0, 2).map(({ valeurs }) => valeurs[colonne.cle]),
    ).toEqual([
      { valeur: 1, affichage: '1' },
      { valeur: null, affichage: '—' },
    ]);
  });
});

interface PlanDeTableauServi {
  readonly id: string;
  readonly tableauInitial?: TableauEvalue;
}

function plansServisDu(
  contenu: (typeof CONTENUS)[number],
): PlanDeTableauServi[] {
  return tirer(buildCoursDuContenu(contenu), 1).sujet.ecrans.flatMap((ecran) =>
    ecran.type === 'fp-table-build'
      ? [(ecran.donnees as { readonly plan: PlanDeTableauServi }).plan]
      : [],
  );
}

function tableauInitialServi(
  contenu: (typeof CONTENUS)[number],
  planId: string,
): TableauEvalue | undefined {
  return plansServisDu(contenu).find(({ id }) => id === planId)?.tableauInitial;
}

describe('le plan de tableau servi au sujet', () => {
  it('porte dans chaque tableau des cours le tableau évalué sans saisie', () => {
    const servis = CONTENUS.flatMap(plansServisDu);

    expect(servis.map(({ id }) => id)).toEqual(
      TABLEAUX_DES_COURS.map((ecran) => ecran.proprietes.plan.id),
    );
    for (const [rang, ecran] of TABLEAUX_DES_COURS.entries()) {
      expect({
        plan: servis[rang].id,
        tableauInitial: servis[rang].tableauInitial,
      }).toEqual({
        plan: ecran.proprietes.plan.id,
        tableauInitial: evaluerLeTableauDuPlan(ecran.proprietes.plan, []),
      });
    }
  });

  it('calcule sans saisie la somme des taux de la toile et le capital emprunté de l amortissement, et rien de ce qui dépend d une saisie', () => {
    const toile = tableauInitialServi(COURS_B2_01, 'b2-01-a4-indice-toile');
    const amortissement = tableauInitialServi(
      COURS_B2_05,
      'b2-05-a3-tableau-amortissement',
    );

    expect({
      taux: toile?.totaux,
      sommeDesTaux: toile?.synthese[0].affichage,
      prix: toile === undefined ? [] : affichagesDe(toile, 'prix'),
      capital: amortissement?.lignes.map(
        ({ valeurs }) => valeurs.capital.valeur,
      ),
      annuites: amortissement?.totaux.annuite.valeur,
    }).toEqual({
      taux: { taux: { valeur: 4, affichage: '4' } },
      sommeDesTaux: `4,00${INSECABLE}%`,
      prix: ['—', '—', '—', '—'],
      capital: [60000, null, null, null, null],
      annuites: 67388.15,
    });
  });
});

describe('planDeTableauDuCours', () => {
  it('trouve le tableau du cours par son plan, et rien pour une feuille', () => {
    const cours = buildCoursDuContenu(COURS_B2_01);

    expect([
      planDeTableauDuCours(cours, 'b2-01-a4-indice-toile')?.id,
      planDeTableauDuCours(cours, 'b2-01-a4-feuille-canaux'),
    ]).toEqual(['b2-01-a4-indice-toile', null]);
  });
});
