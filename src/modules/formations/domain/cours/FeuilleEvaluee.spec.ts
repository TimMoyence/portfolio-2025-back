import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  CONTENUS,
  COURS_B2_03,
} from '../../../../../test/factories/contenus-publies';
import { formulesDuCorrige } from '../../../../../test/helpers/feuille-de-cours';
import type { SheetPlanStocke } from '../contrats/cours';
import { ProductionInvalideError } from '../errors/FormationErrors';
import {
  affichageDeLAttendu,
  evaluerLaFeuilleDuPlan,
  planDeFeuilleServi,
} from './FeuilleEvaluee';
import { LONGUEUR_MAX_FORMULE } from './Formule';
import { ecranDeProduction } from './ProductionSoumise';
import type { EcranDeProduction } from './ProductionSoumise';

const VISA = '=SI(OU(C2>=5000;B2<>"France");"Visa";"Non")';

function feuilleDuCours(
  contenu: (typeof CONTENUS)[number],
  planId: string,
): Extract<EcranDeProduction['ecran'], { readonly brique: 'fp-sheet' }> {
  const cible = ecranDeProduction(buildCoursDuContenu(contenu), planId);
  if (cible?.ecran.brique !== 'fp-sheet') {
    throw new Error(`feuille absente du cours : ${planId}`);
  }
  return cible.ecran;
}

const PLAN_SI_OU: SheetPlanStocke = feuilleDuCours(
  COURS_B2_03,
  'b2-03-a1-tableur-si-ou',
).proprietes.plan;

const FEUILLES_DES_COURS = CONTENUS.flatMap((contenu) =>
  buildCoursDuContenu(contenu).ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-sheet' ? [ecran] : [],
  ),
);

describe('evaluerLaFeuilleDuPlan', () => {
  it('rend la valeur d une formule de l eleve, et la nature de chaque cellule du plan', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_SI_OU, { D2: VISA });

    expect(feuille.saisies).toEqual({ D2: VISA });
    expect(feuille.formules).toEqual(['D2']);
    expect([
      feuille.affichages['D2'],
      feuille.affichages['C2'],
      feuille.affichages['A1'],
    ]).toEqual(['Visa', '6400', 'Facture']);
    expect([
      feuille.natures['D2'],
      feuille.natures['C2'],
      feuille.natures['A1'],
    ]).toEqual(['texte', 'nombre', 'texte']);
    expect(feuille.affichages['D3']).toBeUndefined();
  });

  it('impose les cellules verrouillees du plan a la saisie de l eleve', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_SI_OU, {
      C2: '9999',
      D2: '=C2*2',
    });

    expect(feuille.saisies).toEqual({ D2: '=C2*2' });
    expect(feuille.affichages['C2']).toBe('6400');
    expect(feuille.affichages['D2']).toBe('12800');
  });

  it('ecrit les nombres a la francaise, les valeurs de verite en VRAI ou FAUX, et chaque erreur par son code', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_SI_OU, {
      D2: '=C2/3',
      D3: '=C3>1000',
      D4: '=C4/0',
      D5: '=B5*2',
      D6: '=INCONNUE(C6)',
    });

    const rendus = Object.fromEntries(
      ['D2', 'D3', 'D4', 'D5', 'D6'].map((nom) => [
        nom,
        [feuille.affichages[nom], feuille.natures[nom]],
      ]),
    );
    expect(rendus).toEqual({
      D2: ['2133,333333', 'nombre'],
      D3: ['VRAI', 'logique'],
      D4: ['#DIV/0!', 'erreur'],
      D5: ['#VALEUR!', 'erreur'],
      D6: ['#NOM?', 'erreur'],
    });
  });

  it('lit une saisie a la francaise comme un nombre, sans la prendre pour une formule', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_SI_OU, { D2: '1 200,5' });

    expect(feuille.affichages['D2']).toBe('1 200,5');
    expect(feuille.natures['D2']).toBe('nombre');
    expect(feuille.formules).toEqual([]);
  });

  it('recopie une formule dans la cellule du dessous en decalant ses references', () => {
    const feuille = evaluerLaFeuilleDuPlan(
      PLAN_SI_OU,
      { D2: VISA },
      { de: 'D2' },
    );

    expect(feuille.saisies).toEqual({
      D2: VISA,
      D3: '=SI(OU(C3>=5000;B3<>"France");"Visa";"Non")',
    });
    expect(feuille.affichages['D3']).toBe('Visa');
    expect(feuille.formules).toEqual(['D2', 'D3']);
  });

  it('refuse une recopie vers une cellule verrouillee, hors de la grille ou depuis une cellule inconnue', () => {
    for (const de of ['C2', 'D6', 'Z99', 'D0']) {
      expect(() =>
        evaluerLaFeuilleDuPlan(PLAN_SI_OU, { D2: VISA }, { de }),
      ).toThrow(ProductionInvalideError);
    }
  });

  it('refuse une cellule hors de la grille, et ignore une saisie vide', () => {
    expect(() => evaluerLaFeuilleDuPlan(PLAN_SI_OU, { E1: '1' })).toThrow(
      ProductionInvalideError,
    );
    expect(() =>
      evaluerLaFeuilleDuPlan(PLAN_SI_OU, { 'A1;DROP': '1' }),
    ).toThrow(ProductionInvalideError);
    expect(
      evaluerLaFeuilleDuPlan(PLAN_SI_OU, { D2: '   ' }).affichages['D2'],
    ).toBeUndefined();
  });

  it('borne la saisie a la longueur maximale d une formule', () => {
    const longue = `=${'1+'.repeat(LONGUEUR_MAX_FORMULE)}1`;

    const feuille = evaluerLaFeuilleDuPlan(PLAN_SI_OU, { D2: longue });

    expect(feuille.saisies['D2']).toBe(longue.slice(0, LONGUEUR_MAX_FORMULE));
  });

  it('chaque feuille des cours rend sans erreur ses cellules de depart et les formules de son corrige', () => {
    expect(FEUILLES_DES_COURS.length).toBeGreaterThan(0);
    for (const ecran of FEUILLES_DES_COURS) {
      const corrige = ecran.production.corrige;
      if (corrige.type !== 'feuille') {
        throw new Error(
          `${ecran.id} : une feuille porte un corrige de feuille`,
        );
      }
      const plan = ecran.proprietes.plan;
      const depart = evaluerLaFeuilleDuPlan(plan, {});
      const corrigee = evaluerLaFeuilleDuPlan(plan, formulesDuCorrige(corrige));

      for (const [nom, nature] of Object.entries(depart.natures)) {
        expect({ ecran: ecran.id, nom, nature }).toEqual({
          ecran: ecran.id,
          nom,
          nature: expect.not.stringMatching(/^erreur$/),
        });
      }
      for (const attendu of corrige.attendus) {
        expect({
          ecran: ecran.id,
          reference: attendu.reference,
          formule: corrigee.formules.includes(attendu.reference),
          nature: corrigee.natures[attendu.reference],
        }).toEqual({
          ecran: ecran.id,
          reference: attendu.reference,
          formule: true,
          nature:
            typeof attendu.valeur === 'number' ? 'nombre' : expect.any(String),
        });
      }
    }
  });
});

describe('planDeFeuilleServi', () => {
  it('sert les noms de la grille, la longueur maximale d une saisie et les cellules de depart evaluees', () => {
    const servi = planDeFeuilleServi(PLAN_SI_OU);

    expect(servi.lettres).toEqual(['A', 'B', 'C', 'D']);
    expect(servi.grille).toHaveLength(6);
    expect(servi.grille[0]).toEqual(['A1', 'B1', 'C1', 'D1']);
    expect(servi.grille[5]).toEqual(['A6', 'B6', 'C6', 'D6']);
    expect(servi.longueurMaxSaisie).toBe(LONGUEUR_MAX_FORMULE);
    expect(servi.initiale).toEqual(evaluerLaFeuilleDuPlan(PLAN_SI_OU, {}));
    expect(servi.initiale.saisies).toEqual({});
    expect(servi.cellules).toEqual(PLAN_SI_OU.cellules);
  });
});

describe('affichageDeLAttendu', () => {
  it('arrondit un taux a quatre decimales, un montant a deux, et ecrit a la francaise', () => {
    expect(affichageDeLAttendu(0.45678)).toBe('0,4568');
    expect(affichageDeLAttendu(-0.5)).toBe('-0,5');
    expect(affichageDeLAttendu(1234.567)).toBe('1234,57');
    expect(affichageDeLAttendu(2.675)).toBe('2,68');
    expect(affichageDeLAttendu(12800)).toBe('12800');
    expect(affichageDeLAttendu('Visa')).toBe('Visa');
    expect(affichageDeLAttendu(true)).toBe('VRAI');
    expect(affichageDeLAttendu(false)).toBe('FAUX');
  });
});
