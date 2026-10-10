import { somme } from '../../src/common/domain/nombres/statistiques';
import type { Cours } from '../../src/modules/formations/domain/contrats/cours';
import type {
  CorrigeProduction,
  CorrigeFeuille,
} from '../../src/modules/formations/domain/cours/Corrige';
import {
  questionsDuCours,
  type Gabarit,
} from '../../src/modules/formations/domain/cours/Cours';
import type { ContenuDeCours } from '../../src/modules/formations/domain/cours/CoursStocke';
import { projeterCatalogue } from '../../src/modules/formations/domain/cours/Diffusion';
import type { ValeurFormule } from '../../src/modules/formations/domain/cours/Formule';
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
  ecransCorrigesSurPlace,
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
  readonly corrigesSurPlace?: readonly string[];
  readonly gabarit?: Gabarit;
}

export const FICHE_DU_GABARIT_V3 = {
  ecrans: 34,
  dureeMinutes: 180,
  minutesParActe: [49, 39, 47, 45, 0, 0],
  rythme: { expositionContinueMax: 6, interactives: 147, exposition: 33 },
  noteesParType: [8, 6, 0, 3, 1],
  enigmes: 4,
  rappels: 12,
  options: 8 + 4 + 12,
  catalogue: [
    'A1-02',
    'A1-04',
    'A1-05',
    'A1-07',
    'A1-08',
    'A2-02',
    'A2-03',
    'A3-01',
    'A3-03',
    'A3-04',
    'A4-01',
    'A4-05',
  ],
} as const satisfies Partial<FicheAttendue>;

export function pointsImprimes(texte: string): number[] {
  return [...texte.matchAll(/\((\d+(?:,\d+)?) points?\)/g)].map(([, valeur]) =>
    Number(valeur.replace(',', '.')),
  );
}

function decrireLeGabarit(
  code: string,
  cours: Cours,
  gabarit: Gabarit,
  corrigesSurPlace: readonly string[],
): void {
  describe(`${code} — gabarit ${gabarit}`, () => {
    it(`déclare le gabarit ${gabarit}, dont contrat-des-cours contrôle les règles`, () => {
      expect(cours.gabarit).toBe(gabarit);
    });

    it('corrige chaque exercice sur son propre écran, sans écran de correction qui le suive', () => {
      expect(ecransCorrigesSurPlace(cours)).toEqual(corrigesSurPlace);
      expect(
        cours.ecrans.filter((ecran) => ecran.id.endsWith('-CORRECTION')),
      ).toEqual([]);
    });
  });
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

    it(`remédie ses ${attendu.remediations} confusions vers l’écran de son tableau des remédiations`, () => {
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
          pageSource: media.pageSource ?? 'production propre du cours',
          licence: media.licence,
          fichiers: media.chemins.map((chemin) => chemin.split('/').at(-1)),
          attribution: media.attribution,
        })),
      ).toEqual(mediasDuDocument(document));
    });
  });

  if (attendu.corrigesSurPlace !== undefined) {
    decrireLeGabarit(
      code,
      cours,
      attendu.gabarit ?? 'v3',
      attendu.corrigesSurPlace,
    );
  }
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

export function corrigeDeFeuille(cours: Cours, id: string): CorrigeFeuille {
  const corrige = corrigeDe(cours, id);
  if (corrige.type !== 'feuille') {
    throw new Error(`la production ${id} n’a pas de corrigé de feuille`);
  }
  return corrige;
}

export function ecranDuContenu(contenu: ContenuDeCours, screenId: string) {
  const ecran = contenu.ecrans.find(
    (candidat) => candidat.screenId === screenId,
  );
  if (ecran === undefined) {
    throw new Error(`écran ${screenId} absent de ${contenu.slug}`);
  }
  return ecran;
}

export interface MiniSituationAttendue {
  readonly donneesFictives: readonly string[];
  readonly coffre: string;
  readonly tableur: string;
}

export function decrireLaMiniSituation(
  code: string,
  contenu: ContenuDeCours,
  attendu: MiniSituationAttendue,
): void {
  const texteDe = (screenId: string): string =>
    JSON.stringify(ecranDuContenu(contenu, screenId));

  describe(`${code} — mentions imprimées de la mini-situation`, () => {
    it('marque les données d’Atelier Rivage comme fictives sur les écrans qui les montrent', () => {
      for (const ecran of attendu.donneesFictives) {
        expect(texteDe(ecran)).toContain('Données fictives');
      }
    });

    it('note la mini-situation sur dix points, tableur compris', () => {
      const enigmes = pointsImprimes(texteDe(attendu.coffre));
      const tableur = pointsImprimes(texteDe(attendu.tableur));

      expect(enigmes).toHaveLength(4);
      expect(new Set(tableur)).toEqual(new Set([3]));
      expect(somme(enigmes) + 3).toBe(10);
    });
  });
}

export function valeursEtPieges(attendu: {
  readonly valeur: ValeurFormule;
  readonly pieges: readonly { readonly valeur: number }[];
}): ValeurFormule[] {
  return [attendu.valeur, ...attendu.pieges.map((piege) => piege.valeur)];
}

function nombres(valeurs: readonly ValeurFormule[]): number[] {
  return valeurs.filter((valeur) => typeof valeur === 'number');
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
  calculees: Readonly<Record<string, readonly ValeurFormule[]>>,
): void {
  expect(new Set(corrige.attendus.map((attendu) => attendu.reference))).toEqual(
    new Set(Object.keys(calculees)),
  );
  const numeriques = corrige.attendus.filter(
    (attendu) => typeof attendu.valeur === 'number',
  );
  attendreAlignees(
    Object.fromEntries(
      numeriques.map((attendu) => [
        attendu.reference,
        nombres(valeursEtPieges(attendu)),
      ]),
    ),
    Object.fromEntries(
      numeriques.map((attendu) => [
        attendu.reference,
        nombres(calculees[attendu.reference] ?? []),
      ]),
    ),
  );
  for (const attendu of corrige.attendus) {
    if (typeof attendu.valeur !== 'number') {
      expect(calculees[attendu.reference]).toEqual([attendu.valeur]);
    }
  }
}
