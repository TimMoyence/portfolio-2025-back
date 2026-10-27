import { lireNombreSaisiAvecUnite } from '../../domain/cours/Formule';
import { sansEspacesTypographiques } from '../../../../common/domain/texte/sans-espaces-typographiques';
import {
  buildContenuDuCours,
  buildCoursDuContenu,
  prefixeDuCours,
} from '../../../../../test/factories/contenus-de-cours.factory';
import { tireurSequentiel } from '../../../../../test/factories/cours.factory';
import { clesDe } from '../../../../../test/helpers/lecture-de-cours';
import { cueillirDansArbre } from '../../domain/cours/ArbreDeValeurs';
import { CONFUSIONS } from '../../domain/cours/banque/confusions';
import { matchesSolution } from '../../domain/GradingCore';
import { questionsDuCours } from '../../domain/cours/Cours';
import type { PiegeDeClassement } from '../../domain/cours/Corrige';
import { confusionsDuCorrige } from '../../domain/cours/CorrigeStocke';
import {
  lireCoursStocke,
  type ContenuDeCours,
  type ContenuDeCoursBrut,
} from '../../domain/cours/CoursStocke';
import { deroulePresentateur } from '../../domain/cours/DeroulePresentateur';
import { projeterCatalogue } from '../../domain/cours/Diffusion';
import { ouvrirTirages } from '../../domain/cours/OuvertureTirages';
import { ligneDeLaReference } from '../../domain/cours/PlansStockes';
import { slugOption } from '../../domain/cours/QuestionStockee';
import { verifierStructure } from '../../domain/cours/StructureCours';
import { tirer } from '../../domain/cours/Tirage';
import { clicsDeRecopie } from './feuilles';
import { CONTENUS } from './index';

const TAILLE_MAX_DU_BAREME = 400 * 1024;
const TIRAGES_CONTROLES = 61;
const LONGUEUR_MAX_D_UN_IDENTIFIANT = 60;
const NOMBRE_EN_TETE = /^[−-]?\d[\d\s]*(?:,\d+)?/u;
const DECIMAL_A_POINT = /\d\.\d/u;
const CLES_DE_CONFUSION = new Set(['confusion', 'confusionSiErreurFormule']);
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

function recopiesDeLaFeuille(
  ecran: ContenuDeCours['ecrans'][number],
): Map<string, number> {
  const dernieres = new Map<string, number>();
  if (ecran.brique !== 'fp-sheet') {
    return dernieres;
  }
  for (const { reference, forme } of ecran.proprietes.questions[0].corrige
    .attendus) {
    if (forme !== 'references') {
      dernieres.set(
        forme.memeQue,
        Math.max(
          dernieres.get(forme.memeQue) ?? 0,
          ligneDeLaReference(reference),
        ),
      );
    }
  }
  return dernieres;
}

function consignesDeRecopieFautives(contenu: ContenuDeCours): string[] {
  return contenu.ecrans.flatMap((ecran) => {
    if (ecran.brique !== 'fp-sheet') {
      return [];
    }
    const consignes = ecran.proprietes.plan.consignes.map(
      sansEspacesTypographiques,
    );
    const sansGeste = consignes
      .filter(
        (consigne) =>
          /recopiez/iu.test(consigne) &&
          !/cliquez \S+ fois sur « Recopier vers le bas »/u.test(consigne),
      )
      .map((consigne) => `${ecran.screenId} : ${consigne}`);
    const malComptees = [...recopiesDeLaFeuille(ecran)]
      .filter(
        ([source, derniere]) =>
          !consignes.some(
            (consigne) =>
              new RegExp(`(?<![$A-Z])${source}(?!\\d)`, 'u').test(consigne) &&
              consigne.includes(
                clicsDeRecopie(derniere - ligneDeLaReference(source)),
              ),
          ),
      )
      .map(
        ([source, derniere]) =>
          `${ecran.screenId} : ${source} recopiée jusqu’à la ligne ${derniere}`,
      );
    return [...sansGeste, ...malComptees];
  });
}

function confusionsCiblees(contenu: ContenuDeCours): Set<string> {
  return new Set(
    cueillirDansArbre(contenu.ecrans, (cle, element) =>
      CLES_DE_CONFUSION.has(cle) && typeof element === 'string'
        ? [element]
        : null,
    ),
  );
}

function trisDu(contenu: ContenuDeCours) {
  return contenu.ecrans.flatMap((ecran) =>
    ecran.brique === 'fp-cardsort' ? [ecran] : [],
  );
}

function couplesSansConfusion(contenu: ContenuDeCours): string[] {
  return trisDu(contenu).flatMap(({ screenId, proprietes }) =>
    proprietes.questions[0].corrige.attendus.flatMap(
      ({ carteId, categorieId, pieges }) => {
        const expliquees = new Set([
          categorieId,
          ...pieges.map((piege) => piege.categorieId),
        ]);
        return proprietes.plan.categories
          .filter(({ id }) => !expliquees.has(id))
          .map(({ id }) => `${screenId} : ${carteId} rangée en ${id}`);
      },
    ),
  );
}

function erreurDeLecture(contenu: ContenuDeCoursBrut): string {
  try {
    lireCoursStocke(contenu);
    return '';
  } catch (erreur) {
    return erreur instanceof Error ? erreur.message : String(erreur);
  }
}

function attendusDuTri(
  contenu: ContenuDeCoursBrut,
  screenId: string,
): { carteId: string; pieges: PiegeDeClassement[] }[] {
  const tri = contenu.ecrans.find((ecran) => ecran.screenId === screenId);
  const [question] = tri?.proprietes.questions as {
    corrige: {
      attendus: { carteId: string; pieges: PiegeDeClassement[] }[];
    };
  }[];
  return question.corrige.attendus;
}

function ecritParUneVersionPassee(
  contenu: ContenuDeCoursBrut,
  screenId: string,
): void {
  for (const attendu of attendusDuTri(contenu, screenId)) {
    const { pieges } = attendu;
    Object.assign(attendu, { confusionSiErreur: pieges[0].confusion });
    Reflect.deleteProperty(attendu, 'pieges');
  }
}

function sansLaDerniereConfusionDeChaqueCarte(
  contenu: ContenuDeCoursBrut,
  screenId: string,
): string[] {
  return attendusDuTri(contenu, screenId).map(
    ({ carteId, pieges }) =>
      `la carte ${carteId} rangée en ${String(pieges.pop()?.categorieId)} n'a pas de confusion`,
  );
}

describe.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
  'contrat commun des cours servis — %s',
  (_slug, contenu) => {
    const cours = buildCoursDuContenu(contenu);
    const prefixe = prefixeDuCours(contenu);

    it('ne lève aucune violation de structure, sans dérogation', () => {
      expect(verifierStructure(cours)).toEqual([]);
    });

    it('M10 · ne garde aucune remédiation dont aucune question restante ne porte la confusion', () => {
      const proprietes = JSON.stringify(
        contenu.ecrans.map(({ proprietes: deLEcran }) => deLEcran),
      );
      const duMoteur = new Set<string>(
        questionsDuCours(cours).flatMap((question) =>
          'corrige' in question ? confusionsDuCorrige(question.corrige) : [],
        ),
      );
      const confusions = Object.keys(contenu.remediations ?? {});

      expect(confusions.length).toBeGreaterThan(0);
      expect(
        confusions.filter(
          (confusion) =>
            !proprietes.includes(`"${confusion}"`) && !duMoteur.has(confusion),
        ),
      ).toEqual([]);
    });

    it('QP-15 · donne à chaque couple carte × mauvaise case de ses tris sa confusion, et ne publie pas un tri qui en perd une', () => {
      expect(couplesSansConfusion(contenu)).toEqual([]);
      for (const { screenId } of trisDu(contenu)) {
        const ampute = buildContenuDuCours(contenu);
        const retires = sansLaDerniereConfusionDeChaqueCarte(ampute, screenId);
        const erreur = erreurDeLecture(ampute);

        expect(retires.filter((couple) => !erreur.includes(couple))).toEqual(
          [],
        );
      }
    });

    it('QP-15 · relit chacun de ses tris écrit par une version passée, sa confusion unique valant pour chaque mauvaise case', () => {
      for (const { screenId, proprietes } of trisDu(contenu)) {
        const ancienne = buildContenuDuCours(contenu);
        ecritParUneVersionPassee(ancienne, screenId);
        const relu = lireCoursStocke(ancienne).ecrans.find(
          (ecran) => ecran.id === screenId,
        );

        expect(
          relu?.brique === 'fp-cardsort' && relu.production.corrige,
        ).toEqual({
          ...proprietes.questions[0].corrige,
          attendus: proprietes.questions[0].corrige.attendus.map((attendu) => ({
            ...attendu,
            pieges: proprietes.plan.categories
              .filter(({ id }) => id !== attendu.categorieId)
              .map(({ id }) => ({
                categorieId: id,
                confusion: attendu.pieges[0].confusion,
              })),
          })),
        });
      }
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

    it('numérote ses exercices de 1 à n dans l’ordre servi, sans renvoi à un exercice absent ni transition vers un autre', () => {
      const numeroDe = (titre: string | null): number | null => {
        const numero = /^Exercice\s(\d+)\s—/u.exec(titre ?? '');
        return numero === null ? null : Number(numero[1]);
      };
      const exercices = cours.ecrans.flatMap((ecran) => {
        const numero = numeroDe(ecran.titre);
        return numero === null ? [] : [{ ecran, numero }];
      });
      const numeros = exercices.map(({ numero }) => numero);
      const renvois = cours.ecrans.flatMap((ecran) =>
        [...JSON.stringify(ecran).matchAll(/exercice\s(\d{1,2})(?!\d)/giu)]
          .map(([, numero]) => Number(numero))
          .filter((numero) => numero < 1 || numero > numeros.length)
          .map((numero) => `${ecran.id} : exercice ${numero}`),
      );
      const livretsDecales = exercices.flatMap(({ ecran, numero }) =>
        [
          ...JSON.stringify(ecran).matchAll(
            /Papier\s:\sexercice\s(\d+)\sdu\slivret/gu,
          ),
        ]
          .filter(([, papier]) => Number(papier) !== numero)
          .map(([renvoi]) => `${ecran.id} : ${renvoi}`),
      );
      const transitions = cours.ecrans.flatMap((ecran, rang) => {
        const suivant = cours.ecrans
          .slice(rang + 1)
          .find((candidat) => numeroDe(candidat.titre) !== null);
        return [...ecran.notes.matchAll(/exercice\s(\d+)\.\s*»/giu)]
          .filter(
            ([, annonce]) =>
              numeroDe(suivant?.titre ?? null) !== Number(annonce),
          )
          .map(([, annonce]) => `${ecran.id} annonce l’exercice ${annonce}`);
      });

      expect(numeros).toEqual(numeros.map((_, rang) => rang + 1));
      expect(renvois).toEqual([]);
      expect(livretsDecales).toEqual([]);
      expect(transitions).toEqual([]);
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

    it('QA-11 · dit, pour chaque colonne recopiée d’un atelier tableur, le geste « Recopier vers le bas » et son nombre de clics, une ligne par clic', () => {
      expect(consignesDeRecopieFautives(contenu)).toEqual([]);
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

    it('publie pour chaque énigme une forme à la française que la saisie relit comme la solution', () => {
      const illisibles = questionsDuCours(cours).flatMap((question) => {
        if (
          !('corrige' in question) ||
          question.corrige.type !== 'enigme' ||
          question.corrige.solution.type !== 'nombre'
        ) {
          return [];
        }
        const { formePubliee, valeur, tolerance } = question.corrige.solution;
        const relue = lireNombreSaisiAvecUnite(formePubliee);
        return !DECIMAL_A_POINT.test(formePubliee) &&
          relue !== null &&
          Math.abs(relue - valeur) <= tolerance.valeur
          ? []
          : [`${question.id} : ${formePubliee}`];
      });

      expect(illisibles).toEqual([]);
    });

    it('ouvre la forme publiée de chaque numérique, à la française, sur la valeur de sa solution', () => {
      const { solutions } = tirer(cours, 0);
      const illisibles = questionsDuCours(cours).flatMap((question) => {
        if (
          question.type !== 'numeric' ||
          question.formePubliee === undefined
        ) {
          return [];
        }
        const nombre = NOMBRE_EN_TETE.exec(question.formePubliee)?.[0];
        const relue =
          nombre === undefined ? null : lireNombreSaisiAvecUnite(nombre);
        return !DECIMAL_A_POINT.test(question.formePubliee) &&
          relue !== null &&
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

    it('écrit à la française chaque bonne réponse et chaque option de vote servies', () => {
      const servis = [
        ...deroulePresentateur(cours, 0).ecrans.flatMap((ecran) =>
          ecran.corriges.map(
            ({ questionId, bonneReponse }) => `${questionId} : ${bonneReponse}`,
          ),
        ),
        ...Object.entries(tirer(cours, 0).libellesOptions).flatMap(
          ([questionId, libelles]) =>
            Object.values(libelles).map(
              (libelle) => `${questionId} : ${libelle}`,
            ),
        ),
      ];

      expect(servis.filter((texte) => DECIMAL_A_POINT.test(texte))).toEqual([]);
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
