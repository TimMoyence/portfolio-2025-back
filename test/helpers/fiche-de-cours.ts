import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type {
  CorrigeProduction,
  CorrigeFeuille,
} from '../../src/modules/formations/domain/cours/Corrige';
import { questionsDuCours } from '../../src/modules/formations/domain/cours/Cours';
import { projeterCatalogue } from '../../src/modules/formations/domain/cours/Diffusion';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import { fuitesDeConfidentialite } from '../factories/structure.factory';
import {
  lireConception,
  mediasDuDocument,
  remediationsDuDocument,
  titresPublics,
  vueDEnsemble,
} from './conception-de-cours';
import {
  alignees,
  ateliersNotes,
  minutesParActe,
  rythmeDuCours,
  solutionsDesEnigmes,
  solutionsNumeriques,
  vueDuCours,
} from './lecture-de-cours';

const TYPES_NOTES = ['vote', 'numeric', 'classement', 'feuille', 'tableau'];

export interface FicheAttendue {
  readonly conception: string;
  readonly ecrans: number;
  readonly dureeMinutes: number;
  readonly minutesParActe: readonly number[];
  readonly rythme: ReturnType<typeof rythmeDuCours>;
  readonly ateliersNotes: readonly string[];
  readonly noteesParType: readonly number[];
  readonly enigmes: number;
  readonly rappels: number;
  readonly remediations: number;
  readonly options: number;
  readonly catalogue: readonly string[];
}

export function decrireLaFicheDuCours(
  code: string,
  cours: Cours,
  attendu: FicheAttendue,
): void {
  const document = lireConception(attendu.conception);

  describe(`${code} — fiche du cours face à son document de conception`, () => {
    it(`suit ligne à ligne les ${attendu.ecrans} écrans du tableau du § 3.1`, () => {
      const lues = vueDuCours(cours);

      expect(lues).toEqual(vueDEnsemble(document));
      expect(lues).toHaveLength(attendu.ecrans);
    });

    it('reprend pour chaque écran le titre public du § 3', () => {
      const titres = titresPublics(document);

      expect(
        cours.ecrans.filter(
          (ecran) => ecran.titre !== (titres.get(ecran.id) ?? null),
        ),
      ).toEqual([]);
    });

    it(`dure ${attendu.dureeMinutes} min, réparties par acte comme le déroulé`, () => {
      expect(cours.dureeMinutes).toBe(attendu.dureeMinutes);
      expect(minutesParActe(cours)).toEqual(attendu.minutesParActe);
    });

    it('ne laisse fuiter aucune réponse dans un texte public', () => {
      expect(fuitesDeConfidentialite(cours)).toEqual([]);
    });

    it('borne l’exposition continue et tient la part interactive', () => {
      expect(rythmeDuCours(cours)).toEqual(attendu.rythme);
    });

    it('porte les questions fermées notées sur les écrans d’atelier prévus', () => {
      expect(ateliersNotes(cours)).toEqual(attendu.ateliersNotes);
    });

    it('compte ses questions notées par type, ses énigmes et ses rappels', () => {
      const questions = questionsDuCours(cours);
      const notees = questions.filter((question) => question.noteCompte);

      expect(
        TYPES_NOTES.map(
          (type) => notees.filter((question) => question.type === type).length,
        ),
      ).toEqual(attendu.noteesParType);
      expect(
        questions.filter((question) => question.type === 'enigme'),
      ).toHaveLength(attendu.enigmes);
      expect(
        cours.ecrans.flatMap((ecran) =>
          ecran.brique === 'fp-spaced' ? ecran.banque : [],
        ),
      ).toHaveLength(attendu.rappels);
    });

    it(`remédie ses ${attendu.remediations} confusions vers l’écran du § 5.9`, () => {
      expect(cours.remediations).toEqual(remediationsDuDocument(document));
      expect(Object.keys(cours.remediations)).toHaveLength(
        attendu.remediations,
      );
    });

    it(`libelle les options de ses ${attendu.options} votes et rappels`, () => {
      expect(Object.keys(tirer(cours, 0).libellesOptions)).toHaveLength(
        attendu.options,
      );
    });

    it('sert au catalogue les écrans catalogue et verrouille les autres', () => {
      const { ecrans } = projeterCatalogue(cours);

      expect(
        ecrans
          .filter((ecran) => ecran.type !== 'ecran-verrouille')
          .map((ecran) => ecran.id.slice(6, 11)),
      ).toEqual(attendu.catalogue);
      expect(
        ecrans.filter((ecran) => ecran.type === 'ecran-verrouille'),
      ).toHaveLength(attendu.ecrans - attendu.catalogue.length);
    });

    it('catalogue les médias du § 8.2 avec page source, licence et attribution', () => {
      expect(
        cours.medias.map((media) => ({
          id: media.id,
          pageSource:
            media.pageSource ?? 'capsule produite pour le cours (annexe A)',
          licence: media.licence,
          fichiers: media.chemins.map((chemin) => chemin.split('/').at(-1)),
          attribution: media.attribution,
        })),
      ).toEqual(mediasDuDocument(document));
    });
  });
}

export function corrigeDe(cours: Cours, id: string): CorrigeProduction {
  const question = questionsDuCours(cours).find(
    (candidate) => candidate.id === id,
  );
  if (question === undefined || !('corrige' in question)) {
    throw new Error(`production ${id} absente du cours`);
  }
  return question.corrige;
}

export function valeursEtPieges(attendu: {
  readonly valeur: number;
  readonly pieges: readonly { readonly valeur: number }[];
}): number[] {
  return [attendu.valeur, ...attendu.pieges.map((piege) => piege.valeur)];
}

function attendreAlignees(
  lues: Readonly<Record<string, readonly number[]>>,
  calculees: Readonly<Record<string, readonly number[]>>,
): void {
  expect(new Set(Object.keys(lues))).toEqual(new Set(Object.keys(calculees)));
  for (const [id, valeurs] of Object.entries(calculees)) {
    expect(lues[id]).toEqual(alignees(lues[id], valeurs));
  }
}

export function attendreLesNumeriques(
  cours: Cours,
  calculees: Readonly<Record<string, readonly number[]>>,
): void {
  attendreAlignees(solutionsNumeriques(cours), calculees);
}

export function attendreLesEnigmes(
  cours: Cours,
  calculees: Readonly<Record<string, readonly number[]>>,
): void {
  attendreAlignees(solutionsDesEnigmes(cours), calculees);
}

export function attendreLaFeuille(
  corrige: CorrigeFeuille,
  calculees: Readonly<Record<string, readonly number[]>>,
): void {
  expect(new Set(corrige.attendus.map((attendu) => attendu.reference))).toEqual(
    new Set(Object.keys(calculees)),
  );
  attendreAlignees(
    Object.fromEntries(
      corrige.attendus.map((attendu) => [
        attendu.reference,
        valeursEtPieges(attendu),
      ]),
    ),
    calculees,
  );
}
