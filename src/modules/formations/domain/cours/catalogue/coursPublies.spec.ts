import { buildCoursDeTest } from '../../../../../../test/factories/cours.factory';
import { clesDuCorrigeDans } from '../../../../../../test/helpers/cles-du-corrige';
import { NE_SAIT_PAS } from '../../GradingCore';
import type { Cours, Ecran } from '../Cours';
import { questionsDuCours } from '../Cours';
import { ouvrirTirages } from '../OuvertureTirages';
import { verifierStructure } from '../StructureCours';
import { tirer, TirageAmbiguError } from '../Tirage';
import { COURS_PUBLIES } from './index';

const GRAINES = 500;
const REJETS_MAX = 5;
const FONCTIONS = new Set(['SI', 'ARRONDI', 'PUISSANCE', 'SOMME', 'MOYENNE']);

function identifiantsDeFormule(formule: string): string[] {
  return [...formule.matchAll(/\b[A-Za-z]+\b(?!\s*\()/g)]
    .map((trouve) => trouve[0])
    .filter((nom) => !FONCTIONS.has(nom));
}

function identifiantsDeGabarit(gabarit: string): string[] {
  return [...gabarit.matchAll(/\{([^{}]+)\}/g)].map((trouve) => trouve[1]);
}

interface NomRefuse {
  readonly ecran: string;
  readonly nom: string;
}

const NOM_EN_REFERENCE_DE_CELLULE = /\b[A-Za-z]+\d+\b/g;
const VARIABLE_D_ABSCISSE = 'x';

function nomsEnReferenceDeCellule(textes: readonly string[]): string[] {
  return [
    ...new Set(
      textes.flatMap((texte) =>
        [...texte.matchAll(NOM_EN_REFERENCE_DE_CELLULE)].map(
          (trouve) => trouve[0],
        ),
      ),
    ),
  ];
}

function nomsRefusesDe(ecran: Ecran): string[] {
  if (ecran.brique === 'fp-concept4') {
    return nomsEnReferenceDeCellule([
      ...ecran.proprietes.parametres.map((parametre) => parametre.cle),
      ecran.proprietes.calcul,
    ]);
  }
  if (ecran.brique === 'fp-plot') {
    const cles = ecran.proprietes.parametres.map((parametre) => parametre.cle);
    return [
      ...nomsEnReferenceDeCellule([
        ...cles,
        ...ecran.proprietes.series.map((serie) => serie.calcul),
      ]),
      ...cles.filter((cle) => cle === VARIABLE_D_ABSCISSE),
    ];
  }
  return [];
}

function nomsDeFormuleRefuses(cours: Cours): NomRefuse[] {
  return cours.ecrans.flatMap((ecran) =>
    nomsRefusesDe(ecran).map((nom) => ({ ecran: ecran.id, nom })),
  );
}

function sujetTire(cours: Cours, graine: number): unknown {
  try {
    return tirer(cours, graine).sujet;
  } catch (erreur) {
    if (erreur instanceof TirageAmbiguError) {
      return null;
    }
    throw erreur;
  }
}

describe.each(COURS_PUBLIES.map((cours) => [cours.slug, cours] as const))(
  'cours publie %s',
  (_slug, cours: Cours) => {
    it('respecte la structure pedagogique', () => {
      expect(verifierStructure(cours)).toEqual([]);
    });

    it('ecarte moins d une graine sur cent et ne produit que des valeurs finies', () => {
      let rejets = 0;
      for (let graine = 0; graine < GRAINES; graine += 1) {
        try {
          const { solutions } = tirer(cours, graine);
          for (const solution of Object.values(solutions)) {
            for (const valeur of [
              solution.valeur,
              ...solution.pieges.map((piege) => piege.valeur),
            ]) {
              expect(
                typeof valeur === 'number'
                  ? Number.isFinite(valeur)
                  : valeur !== NE_SAIT_PAS,
              ).toBe(true);
            }
          }
        } catch (erreur) {
          if (!(erreur instanceof TirageAmbiguError)) throw erreur;
          rejets += 1;
        }
      }
      expect(rejets).toBeLessThanOrEqual(REJETS_MAX);
    });

    it('ne livre aucune cle du corrige dans le sujet, a aucune profondeur, sur cinq cents graines', () => {
      const fuites: { graine: number; cles: string[] }[] = [];
      for (let graine = 0; graine < GRAINES; graine += 1) {
        const sujet = sujetTire(cours, graine);
        const cles = clesDuCorrigeDans(sujet);
        if (cles.length > 0) {
          fuites.push({ graine, cles });
        }
      }
      expect(fuites).toEqual([]);
    });

    it('declare des identifiants uniques', () => {
      const ids = [
        ...cours.ecrans.map((ecran) => ecran.id),
        ...questionsDuCours(cours).map((question) => question.id),
      ];
      expect(ids).toHaveLength(new Set(ids).size);
    });

    it('rattache chaque confusion citee a un ecran de remediation existant', () => {
      const ecrans = new Set(cours.ecrans.map((ecran) => ecran.id));
      for (const question of questionsDuCours(cours)) {
        for (const confusion of question.confusions) {
          const cible = cours.remediations[confusion];
          expect({
            confusion,
            cible: cible !== undefined && ecrans.has(cible),
          }).toEqual({ confusion, cible: true });
        }
      }
    });

    it('ne nomme dans les formules que des parametres declares', () => {
      for (const ecran of cours.ecrans) {
        if (ecran.brique === 'fp-concept4') {
          const cles = new Set(
            ecran.proprietes.parametres.map((parametre) => parametre.cle),
          );
          expect(
            identifiantsDeFormule(ecran.proprietes.calcul).filter(
              (nom) => !cles.has(nom),
            ),
          ).toEqual([]);
          expect(
            identifiantsDeGabarit(ecran.proprietes.phrase).filter(
              (nom) => !cles.has(nom) && nom !== 'resultat',
            ),
          ).toEqual([]);
        }
        if (ecran.brique === 'fp-plot') {
          const cles = new Set([
            ...ecran.proprietes.parametres.map((parametre) => parametre.cle),
            'x',
          ]);
          for (const serie of ecran.proprietes.series) {
            expect(
              identifiantsDeFormule(serie.calcul).filter(
                (nom) => !cles.has(nom),
              ),
            ).toEqual([]);
          }
        }
      }
    });

    it('ne nomme aucune variable de formule en reference de cellule, ni un parametre de graphique x', () => {
      expect(nomsDeFormuleRefuses(cours)).toEqual([]);
    });

    it('ouvre soixante tirages', () => {
      expect(ouvrirTirages(cours).tirages).toHaveLength(60);
    });
  },
);

describe('garde des noms de formule lus par le front', () => {
  const curseur = (cle: string) => ({
    cle,
    libelle: cle,
    min: 0,
    max: 10,
    pas: 1,
    defaut: 1,
  });

  it('signale une variable en reference de cellule et un parametre de graphique x', () => {
    const fautif = buildCoursDeTest({
      ecrans: [
        {
          id: 'E-CONCEPT-CELLULE',
          brique: 'fp-concept4',
          dureeMinutes: 5,
          concepts: ['proportion'],
          notes: '',
          proprietes: {
            parametres: [curseur('ca1'), curseur('taux')],
            formuleLatexSimplifie: 'ca \\times taux',
            calcul: 'ca1*taux+B2',
            phrase: '{ca1} donne {resultat}.',
          },
        },
        {
          id: 'E-PLOT-X',
          brique: 'fp-plot',
          dureeMinutes: 5,
          concepts: ['proportion'],
          notes: '',
          proprietes: {
            abscisse: { libelle: 'x', min: 0, max: 10 },
            ordonnee: 'y',
            parametres: [curseur('x')],
            series: [
              { id: 's', libelle: 's', trait: 'plein', calcul: 'x*coef2' },
            ],
          },
        },
      ],
    });

    expect(nomsDeFormuleRefuses(fautif)).toEqual([
      { ecran: 'E-CONCEPT-CELLULE', nom: 'ca1' },
      { ecran: 'E-CONCEPT-CELLULE', nom: 'B2' },
      { ecran: 'E-PLOT-X', nom: 'coef2' },
      { ecran: 'E-PLOT-X', nom: 'x' },
    ]);
  });
});
