import * as fc from 'fast-check';
import type {
  ContenuDeCoursBrut,
  EcranDeCoursBrut,
} from '../../modules/formations/domain/cours/CoursStocke';
import {
  ContenuDeCoursInvalideError,
  lireCoursStocke,
} from '../../modules/formations/domain/cours/CoursStocke';
import { deroulePresentateur } from '../../modules/formations/domain/cours/DeroulePresentateur';
import {
  ouvrirTirages,
  TiragesInsuffisantsError,
} from '../../modules/formations/domain/cours/OuvertureTirages';
import { tirer } from '../../modules/formations/domain/cours/Tirage';
import { B2_COURS_V3 } from './b2-v3.cours';

const COURS = lireCoursStocke(B2_COURS_V3);
const REFERENCE = tirer(COURS, 0);
const BORNE_GRAINE = 2_147_483_647;
const SEANCES_SIMULEES = 1000;
const graine = fc.integer({ min: 0, max: BORNE_GRAINE });

function brut(): ContenuDeCoursBrut {
  return structuredClone(B2_COURS_V3) as ContenuDeCoursBrut;
}

function sansChamp(
  ecran: EcranDeCoursBrut,
  champ: 'notes' | 'titre' | 'diffusion',
): EcranDeCoursBrut {
  const restant: Record<string, unknown> = Object.fromEntries(
    Object.entries(ecran).filter(([cle]) => cle !== champ),
  );
  return restant as unknown as EcranDeCoursBrut;
}

function optionsParQuestion(
  libelles: (typeof REFERENCE)['libellesOptions'],
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(libelles).map(([question, options]) => [
      question,
      Object.keys(options).sort((a, b) => a.localeCompare(b)),
    ]),
  );
}

describe('B2-01 V3 — simulation du tirage et de l’ouverture', () => {
  it('tire les 52 écrans et les 48 solutions pour toute graine', () => {
    fc.assert(
      fc.property(graine, (valeur) => {
        const tirage = tirer(COURS, valeur);

        expect(tirage.sujet.ecrans).toHaveLength(52);
        expect(Object.keys(tirage.solutions)).toHaveLength(19 + 7 + 13);
        expect(Object.keys(tirage.banque)).toHaveLength(13);
      }),
      { numRuns: 150 },
    );
  });

  it('garde les mêmes solutions et les mêmes identifiants d’options d’une graine à l’autre', () => {
    const optionsAttendues = optionsParQuestion(REFERENCE.libellesOptions);

    fc.assert(
      fc.property(graine, (valeur) => {
        const tirage = tirer(COURS, valeur);

        expect(tirage.solutions).toEqual(REFERENCE.solutions);
        expect(optionsParQuestion(tirage.libellesOptions)).toEqual(
          optionsAttendues,
        );
      }),
      { numRuns: 150 },
    );
  });

  it('ouvre 61 graines distinctes et un barème sans écart pour tout tireur', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(graine, { minLength: 61, maxLength: 120 }),
        (graines) => {
          let appel = 0;
          const bareme = ouvrirTirages(
            COURS,
            () => graines[appel++ % graines.length],
            3,
          );
          if (bareme.version !== 2) {
            throw new Error('un cours en version 3 ouvre un barème v2');
          }
          const seeds = [
            bareme.graineReference,
            ...bareme.tirages.map((tirage) => tirage.seed),
          ];

          expect(new Set(seeds).size).toBe(61);
          expect(Object.keys(bareme.solutionsCommunes)).toHaveLength(
            19 + 7 + 13,
          );
          expect(
            bareme.tirages.filter(
              (tirage) => Object.keys(tirage.ecarts).length > 0,
            ),
          ).toEqual([]);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('refuse d’ouvrir une séance quand le tireur rend moins de 61 graines distinctes', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(graine, { minLength: 1, maxLength: 60 }),
        (graines) => {
          let appel = 0;

          expect(() =>
            ouvrirTirages(COURS, () => graines[appel++ % graines.length], 3),
          ).toThrow(TiragesInsuffisantsError);
        },
      ),
      { numRuns: 10 },
    );
  });

  it('refuse toute clef inconnue ajoutée aux propriétés d’un écran', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 51 }),
        fc.stringMatching(/^[a-z]{1,8}$/),
        (rang, suffixe) => {
          const contenu = brut();
          const proprietes = contenu.ecrans[rang].proprietes as Record<
            string,
            unknown
          >;
          proprietes[`inconnue${suffixe}`] = 'valeur';

          expect(() => lireCoursStocke(contenu)).toThrow(
            ContenuDeCoursInvalideError,
          );
        },
      ),
      { numRuns: 60 },
    );
  });

  it('refuse tout écran privé de ses notes, de son titre ou de sa diffusion', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 51 }),
        fc.constantFrom('notes', 'titre', 'diffusion'),
        (rang, champ) => {
          const contenu = brut();
          const ecrans = contenu.ecrans.map((ecran, position) =>
            position === rang ? sansChamp(ecran, champ) : ecran,
          );

          expect(() => lireCoursStocke({ ...contenu, ecrans })).toThrow(
            ContenuDeCoursInvalideError,
          );
        },
      ),
      { numRuns: 60 },
    );
  });

  it(`simule ${SEANCES_SIMULEES} séances consécutives sans ambiguïté ni fuite`, () => {
    const ordres = new Set<string>();

    for (let valeur = 1; valeur <= SEANCES_SIMULEES; valeur += 1) {
      const tirage = tirer(COURS, valeur);
      const questionnaire = tirage.sujet.ecrans[13].donnees;
      const servi = JSON.stringify(tirage.sujet);
      const premier = tirage.sujet.ecrans[0].donnees as {
        readonly question: { readonly options: readonly { id: string }[] };
      };

      ordres.add(premier.question.options.map((option) => option.id).join('|'));
      expect(servi).not.toContain('Observé :');
      expect(JSON.stringify(questionnaire)).not.toContain('corrige');
    }

    expect(ordres.size).toBeGreaterThan(1);
  });

  it('projette le déroulé formateur sur toute graine simulée', () => {
    fc.assert(
      fc.property(graine, (valeur) => {
        const deroule = deroulePresentateur(COURS, valeur);

        expect(deroule.ecrans).toHaveLength(52);
        expect(deroule.ecrans.flatMap((ecran) => ecran.questions)).toHaveLength(
          48,
        );
        expect(Object.keys(deroule.remediations)).toHaveLength(38);
      }),
      { numRuns: 50 },
    );
  });
});
