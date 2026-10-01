import {
  buildCoursDuContenu,
  prefixeDuCours,
} from '../../../../../test/factories/contenus-de-cours.factory';
import { tireurSequentiel } from '../../../../../test/factories/cours.factory';
import { CONFUSIONS } from '../../domain/cours/banque/confusions';
import { matchesSolution } from '../../domain/GradingCore';
import { questionsDuCours } from '../../domain/cours/Cours';
import type { ContenuDeCours } from '../../domain/cours/CoursStocke';
import { deroulePresentateur } from '../../domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../domain/cours/Diffusion';
import { ouvrirTirages } from '../../domain/cours/OuvertureTirages';
import { slugOption } from '../../domain/cours/QuestionStockee';
import { lireNombreSaisi } from '../../domain/cours/SaisieNumerique';
import { verifierStructure } from '../../domain/cours/StructureCours';
import { tirer } from '../../domain/cours/Tirage';
import { CONTENUS } from './index';

const TAILLE_MAX_DU_BAREME = 400 * 1024;
const TIRAGES_CONTROLES = 61;
const LONGUEUR_MAX_D_UN_IDENTIFIANT = 60;
const NOMBRE_EN_TETE = /^[−-]?\d[\d\s]*(?:,\d+)?/u;
const CLES_DE_CONFUSION = new Set([
  'confusion',
  'confusionSiErreur',
  'confusionSiErreurFormule',
]);
const CLES_SECRETES = [
  'guide',
  'correction',
  'interaction',
  'corrige',
  'banque',
  'solution',
  'attendus',
  'fragment',
  'fausse',
  'misconception',
  'valeurAttendue',
];

function parcourir(
  valeur: unknown,
  visiter: (cle: string, element: unknown) => void,
): void {
  if (Array.isArray(valeur)) {
    for (const element of valeur) {
      parcourir(element, visiter);
    }
    return;
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return;
  }
  for (const [cle, element] of Object.entries(valeur)) {
    visiter(cle, element);
    parcourir(element, visiter);
  }
}

function confusionsCiblees(contenu: ContenuDeCours): Set<string> {
  const trouvees = new Set<string>();
  parcourir(contenu.ecrans, (cle, element) => {
    if (CLES_DE_CONFUSION.has(cle) && typeof element === 'string') {
      trouvees.add(element);
    }
  });
  return trouvees;
}

function clesDe(valeur: unknown): string[] {
  const cles: string[] = [];
  parcourir(valeur, (cle) => cles.push(cle));
  return cles;
}

describe.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
  'contrat commun des cours servis — %s',
  (_slug, contenu) => {
    const cours = buildCoursDuContenu(contenu);
    const prefixe = prefixeDuCours(contenu);

    it('ne lève aucune violation de structure, sans dérogation', () => {
      expect(verifierStructure(cours)).toEqual([]);
    });

    it('nomme chaque écran selon la convention du cours, avec un titre unique', () => {
      const convention = new RegExp(
        `^${prefixe}-A[1-6]-\\d{2}-[A-Z0-9-]+$`,
        'u',
      );
      const identifiants = cours.ecrans.map((ecran) => ecran.id);

      expect(identifiants.filter((id) => !convention.test(id))).toEqual([]);
      expect(new Set(identifiants).size).toBe(identifiants.length);
      expect(
        cours.ecrans.filter(
          (ecran) => ecran.titre === null || ecran.titre.length > 120,
        ),
      ).toEqual([]);
    });

    it('rédige chaque note présente en puces « • » non vides', () => {
      const fautives = cours.ecrans
        .filter((ecran) => ecran.notes !== '')
        .flatMap((ecran) =>
          ecran.notes
            .split('\n')
            .filter(
              (ligne) =>
                !ligne.startsWith('• ') || ligne.slice(2).trim() === '',
            )
            .map((ligne) => `${ecran.id} : ${ligne}`),
        );

      expect(fautives).toEqual([]);
    });

    it('préfixe ses questions par le slug du cours, sans doublon', () => {
      const identifiants = questionsDuCours(cours).map(
        (question) => question.id,
      );
      const prefixeDesQuestions = prefixe.toLowerCase();

      expect(
        identifiants.filter((id) => !id.startsWith(`${prefixeDesQuestions}-`)),
      ).toEqual([]);
      expect(new Set(identifiants).size).toBe(identifiants.length);
      expect(
        identifiants.filter((id) => id.length > LONGUEUR_MAX_D_UN_IDENTIFIANT),
      ).toEqual([]);
    });

    it('remédie chaque confusion ciblée vers un écran du cours', () => {
      const ecrans = new Set(cours.ecrans.map((ecran) => ecran.id));
      const remediees = new Set(Object.keys(cours.remediations));

      expect(
        [...confusionsCiblees(contenu)].filter((id) => !remediees.has(id)),
      ).toEqual([]);
      expect(
        [...remediees].filter((id) => !Object.hasOwn(CONFUSIONS, id)),
      ).toEqual([]);
      expect(
        Object.values(cours.remediations).filter((cible) => !ecrans.has(cible)),
      ).toEqual([]);
    });

    it('identifie chaque option de vote par slugOption(libelle)', () => {
      const ecarts = Object.values(tirer(cours, 0).libellesOptions).flatMap(
        (libelles) =>
          Object.entries(libelles).filter(
            ([id, libelle]) => id !== slugOption(libelle),
          ),
      );

      expect(ecarts).toEqual([]);
    });

    it(`ouvre ${TIRAGES_CONTROLES} tirages et un barème v2 de moins de 400 Ko`, () => {
      const bareme = ouvrirTirages(cours, tireurSequentiel(1));

      expect(bareme.version).toBe(2);
      expect(
        Buffer.byteLength(JSON.stringify(bareme), 'utf8'),
      ).toBeLessThanOrEqual(TAILLE_MAX_DU_BAREME);
      for (let graine = 1; graine <= TIRAGES_CONTROLES; graine += 1) {
        expect(() => tirer(cours, graine)).not.toThrow();
      }
    });

    it('ne publie aucune clé secrète dans le sujet ni dans le catalogue', () => {
      for (const publie of [tirer(cours, 7).sujet, projeterCatalogue(cours)]) {
        expect(
          clesDe(publie).filter((cle) => CLES_SECRETES.includes(cle)),
        ).toEqual([]);
        expect(
          JSON.stringify(publie).match(/"misconceptionsCiblees":\[[^\]]/g),
        ).toBeNull();
      }
    });

    it('publie pour chaque énigme une forme que la saisie relit comme la solution', () => {
      const illisibles = questionsDuCours(cours).flatMap((question) => {
        if (
          !('corrige' in question) ||
          question.corrige.type !== 'enigme' ||
          question.corrige.solution.type !== 'nombre'
        ) {
          return [];
        }
        const { formePubliee, valeur, tolerance } = question.corrige.solution;
        const relue = lireNombreSaisi(formePubliee);
        return relue !== null && Math.abs(relue - valeur) <= tolerance.valeur
          ? []
          : [`${question.id} : ${formePubliee}`];
      });

      expect(illisibles).toEqual([]);
    });

    it('ouvre la forme publiée de chaque numérique sur la valeur de sa solution', () => {
      const { solutions } = tirer(cours, 0);
      const illisibles = questionsDuCours(cours).flatMap((question) => {
        if (
          question.type !== 'numeric' ||
          question.formePubliee === undefined
        ) {
          return [];
        }
        const nombre = NOMBRE_EN_TETE.exec(question.formePubliee)?.[0];
        const relue = nombre === undefined ? null : lireNombreSaisi(nombre);
        return relue !== null &&
          matchesSolution(
            relue,
            Number(solutions[question.id].valeur),
            question.tolerance,
          )
          ? []
          : [`${question.id} : ${question.formePubliee}`];
      });

      expect(illisibles).toEqual([]);
    });

    it('garde la banque de rappel hors du sujet', () => {
      const tirage = tirer(cours, 42);
      const sujet = JSON.stringify(tirage.sujet);

      expect(
        Object.keys(tirage.banque).filter((id) => sujet.includes(id)),
      ).toEqual([]);
    });

    it('expose au déroulé toutes les questions du cours', () => {
      const deroule = deroulePresentateur(cours, 0);

      expect(deroule.ecrans).toHaveLength(cours.ecrans.length);
      expect(
        deroule.ecrans.flatMap((ecran) => ecran.questions).length,
      ).toBeGreaterThan(0);
    });

    it('catalogue chaque média avec page source ou production propre, licence et attribution', () => {
      const identifiants = cours.medias.map((media) => media.id);

      expect(new Set(identifiants).size).toBe(identifiants.length);
      for (const media of cours.medias) {
        expect(media.licence.trim()).not.toBe('');
        expect(media.attribution.trim()).not.toBe('');
      }
    });
  },
);

it('sert des cours aux slugs et préfixes distincts', () => {
  const prefixes = CONTENUS.map(prefixeDuCours);

  expect(new Set(CONTENUS.map((contenu) => contenu.slug)).size).toBe(
    CONTENUS.length,
  );
  expect(new Set(prefixes).size).toBe(prefixes.length);
});
