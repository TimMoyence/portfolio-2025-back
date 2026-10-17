import { buildCoursDuContenu } from '../../../../../test/factories/contenus-de-cours.factory';
import {
  CONTENUS,
  COURS_B2_03,
  FORMULE_VISA_B2_03 as VISA,
  PLAN_VISA_B2_03,
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

const PLAN_CONTROLE: SheetPlanStocke = feuilleDuCours(
  COURS_B2_03,
  PLAN_VISA_B2_03,
).proprietes.plan;

const LETTRES_DU_CONTROLE = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
];

const FEUILLES_DES_COURS = CONTENUS.flatMap((contenu) =>
  buildCoursDuContenu(contenu).ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-sheet' ? [ecran] : [],
  ),
);

describe('evaluerLaFeuilleDuPlan', () => {
  it('rend la valeur d une formule de l eleve, et la nature de chaque cellule du plan', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { I3: VISA });

    expect(feuille.saisies).toEqual({ I3: VISA });
    expect(feuille.formules).toEqual(['I3']);
    expect([
      feuille.affichages['I3'],
      feuille.affichages['D3'],
      feuille.affichages['A1'],
    ]).toEqual(['Visa', '6400', 'Facture']);
    expect([
      feuille.natures['I3'],
      feuille.natures['D3'],
      feuille.natures['A1'],
    ]).toEqual(['texte', 'nombre', 'texte']);
    expect(feuille.affichages['I4']).toBeUndefined();
  });

  it('impose les cellules verrouillees du plan a la saisie de l eleve', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, {
      D3: '9999',
      I3: '=D3*2',
    });

    expect(feuille.saisies).toEqual({ I3: '=D3*2' });
    expect(feuille.affichages['D3']).toBe('6400');
    expect(feuille.affichages['I3']).toBe('12800');
  });

  it('ecrit les nombres a la francaise, les valeurs de verite en VRAI ou FAUX, et chaque erreur par son code', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, {
      I3: '=D3/3',
      I4: '=D4>1000',
      I5: '=D5/0',
      I6: '=B6*2',
      I7: '=INCONNUE(D7)',
    });

    const rendus = Object.fromEntries(
      ['I3', 'I4', 'I5', 'I6', 'I7'].map((nom) => [
        nom,
        [feuille.affichages[nom], feuille.natures[nom]],
      ]),
    );
    expect(rendus).toEqual({
      I3: ['2133,333333', 'nombre'],
      I4: ['VRAI', 'logique'],
      I5: ['#DIV/0!', 'erreur'],
      I6: ['#VALEUR!', 'erreur'],
      I7: ['#NOM?', 'erreur'],
    });
  });

  it('lit une saisie a la francaise comme un nombre, sans la prendre pour une formule', () => {
    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { I3: '1 200,5' });

    expect(feuille.affichages['I3']).toBe('1 200,5');
    expect(feuille.natures['I3']).toBe('nombre');
    expect(feuille.formules).toEqual([]);
  });

  it('recopie une formule dans la cellule du dessous en decalant ses references', () => {
    const feuille = evaluerLaFeuilleDuPlan(
      PLAN_CONTROLE,
      { I3: VISA },
      { de: 'I3' },
    );

    expect(feuille.saisies).toEqual({
      I3: VISA,
      I4: '=SI(OU(D4>=5000;C4<>"France");"Visa";"Non")',
    });
    expect(feuille.affichages['I4']).toBe('Visa');
    expect(feuille.formules).toEqual(['I3', 'I4']);
  });

  it('refuse une recopie vers une cellule verrouillee, hors de la grille ou depuis une cellule inconnue', () => {
    for (const de of ['D2', 'I17', 'Z99', 'I0']) {
      expect(() =>
        evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { I3: VISA }, { de }),
      ).toThrow(ProductionInvalideError);
    }
  });

  it('refuse une cellule hors de la grille, et ignore une saisie vide', () => {
    expect(() => evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { L1: '1' })).toThrow(
      ProductionInvalideError,
    );
    expect(() =>
      evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { 'A1;DROP': '1' }),
    ).toThrow(ProductionInvalideError);
    expect(
      evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { I3: '   ' }).affichages['I3'],
    ).toBeUndefined();
  });

  it('borne la saisie a la longueur maximale d une formule', () => {
    const longue = `=${'1+'.repeat(LONGUEUR_MAX_FORMULE)}1`;

    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, { I3: longue });

    expect(feuille.saisies['I3']).toBe(longue.slice(0, LONGUEUR_MAX_FORMULE));
  });

  it('borne la saisie en points de code, sans couper un caractere hors du plan de base', () => {
    const sourire = String.fromCodePoint(0x1f600);

    const feuille = evaluerLaFeuilleDuPlan(PLAN_CONTROLE, {
      I3: sourire.repeat(LONGUEUR_MAX_FORMULE + 1),
    });

    expect(feuille.saisies['I3']).toBe(sourire.repeat(LONGUEUR_MAX_FORMULE));
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
    const servi = planDeFeuilleServi(PLAN_CONTROLE);

    expect(servi.lettres).toEqual(LETTRES_DU_CONTROLE);
    expect(servi.grille).toHaveLength(17);
    expect(servi.grille[0]).toEqual(
      LETTRES_DU_CONTROLE.map((lettre) => `${lettre}1`),
    );
    expect(servi.grille[16]).toEqual(
      LETTRES_DU_CONTROLE.map((lettre) => `${lettre}17`),
    );
    expect(servi.longueurMaxSaisie).toBe(LONGUEUR_MAX_FORMULE);
    expect(servi.initiale).toEqual(evaluerLaFeuilleDuPlan(PLAN_CONTROLE, {}));
    expect(servi.initiale.saisies).toEqual({});
    expect(servi.cellules).toEqual(PLAN_CONTROLE.cellules);
  });
});

describe('affichageDeLAttendu', () => {
  it('arrondit un taux a quatre decimales, un montant a deux, et ecrit a la francaise, milliers separes par une espace fine insecable (F-11)', () => {
    expect(affichageDeLAttendu(0.45678)).toBe('0,4568');
    expect(affichageDeLAttendu(-0.5)).toBe('-0,5');
    expect(affichageDeLAttendu(1234.567)).toBe('1 234,57');
    expect(affichageDeLAttendu(2.675)).toBe('2,68');
    expect(affichageDeLAttendu(12800)).toBe('12 800');
    expect(affichageDeLAttendu('Visa')).toBe('Visa');
    expect(affichageDeLAttendu(true)).toBe('VRAI');
    expect(affichageDeLAttendu(false)).toBe('FAUX');
  });
});
