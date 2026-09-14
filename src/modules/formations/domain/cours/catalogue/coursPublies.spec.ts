import { NE_SAIT_PAS } from '../../GradingCore';
import type { Cours } from '../Cours';
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

    it('ouvre soixante tirages', () => {
      expect(ouvrirTirages(cours).tirages).toHaveLength(60);
    });
  },
);
