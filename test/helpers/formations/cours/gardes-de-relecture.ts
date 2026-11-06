import type { Cours } from '../../../../src/modules/formations/domain/contrats/cours';
import {
  estReservee,
  questionsDuCours,
} from '../../../../src/modules/formations/domain/cours/structure/Cours';
import type { ContenuDeCours } from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { piecesJointesDuDocument } from './conception-de-cours';
import {
  formulesAltereesALaPublication,
  type PiegesParQuestion,
  piegesDesQuestionsSuivantesDevoilesParLesExplications,
  piegesPartagesDevoilesParLesExplications,
  valeursAuCatalogue,
  valeursDevoileesAvantLeurEcran,
  valeursDevoileesParLesExplications,
} from './relecture-de-cours';

export interface PieceJointeDuCours {
  readonly ecran: string;
  readonly diffusion: string;
  readonly reservee: boolean;
  readonly fichier: string;
}

export function piecesJointesDuCours(cours: Cours): PieceJointeDuCours[] {
  return cours.ecrans.flatMap((ecran) =>
    ecran.pieceJointe === undefined
      ? []
      : [
          {
            ecran: ecran.id.slice(6, 11),
            diffusion: ecran.diffusion,
            reservee: estReservee(ecran.pieceJointe),
            fichier: estReservee(ecran.pieceJointe)
              ? ecran.pieceJointe.classeur
              : ecran.pieceJointe.fichier,
          },
        ],
  );
}

export function attendreLesPiecesJointesDuDocument(
  cours: Cours,
  document: string,
  fichiers: readonly string[],
): void {
  const jointes = piecesJointesDuCours(cours);
  const attendues = piecesJointesDuDocument(document);

  expect(jointes.map(({ fichier }) => fichier)).toEqual(fichiers);
  expect(jointes.map(({ ecran, diffusion }) => ({ ecran, diffusion }))).toEqual(
    attendues.map(({ ecran, diffusion }) => ({ ecran, diffusion })),
  );
  attendues.forEach(({ motif }, rang) => {
    expect(jointes[rang].fichier.split('/').at(-1)).toMatch(motif);
  });
}

export function tolerancesDuCours(cours: Cours): Record<string, unknown> {
  return Object.fromEntries(
    questionsDuCours(cours).flatMap((question) =>
      question.type === 'numeric' ? [[question.id, question.tolerance]] : [],
    ),
  );
}

const SEUIL_D_UNE_VALEUR_RECONNAISSABLE = 10;

export interface ValeursARelire {
  readonly contenu: ContenuDeCours;
  readonly cours: Cours;
  readonly valeurs: Readonly<Record<string, number | string>>;
  readonly pieges: PiegesParQuestion;
  readonly mustDeConfidentialite?: string;
}

function reconnaissablesParmi(
  valeurs: Readonly<Record<string, number | string>>,
): (number | string)[] {
  return Object.values(valeurs).filter(
    (valeur) =>
      typeof valeur === 'string' ||
      valeur >= SEUIL_D_UNE_VALEUR_RECONNAISSABLE ||
      !Number.isInteger(valeur),
  );
}

export function decrireLesGardesDeRelecture(
  prefixe: string,
  { contenu, cours, valeurs, pieges, mustDeConfidentialite }: ValeursARelire,
): void {
  const reconnaissables = reconnaissablesParmi(valeurs);
  const confidentialite = (titre: string): string =>
    mustDeConfidentialite === undefined
      ? titre
      : `${mustDeConfidentialite} · ${titre}`;

  describe(`${prefixe} — gardes de la relecture`, () => {
    it('sert chaque formule telle qu’Excel l’accepte, sans espace ajoutée par la typographie', () => {
      expect(formulesAltereesALaPublication(contenu)).toEqual([]);
    });

    it(
      confidentialite(
        'ne sert au catalogue aucune valeur attendue reconnaissable',
      ),
      () => {
        expect(valeursAuCatalogue(cours, reconnaissables)).toEqual([]);
      },
    );

    it(
      confidentialite(
        'ne dévoile dans aucune explication la valeur d’une question encore ouverte',
      ),
      () => {
        expect(valeursDevoileesParLesExplications(cours, valeurs)).toEqual([]);
      },
    );

    it(
      confidentialite(
        'réserve à la dernière correction la valeur-piège d’une confusion qu’une question suivante du même écran partage',
      ),
      () => {
        expect(piegesPartagesDevoilesParLesExplications(cours, pieges)).toEqual(
          [],
        );
      },
    );

    it(
      confidentialite(
        'ne dévoile dans aucune explication un piège reconnaissable d’une question suivante, du même écran ou d’un écran suivant',
      ),
      () => {
        expect(
          piegesDesQuestionsSuivantesDevoilesParLesExplications(cours, pieges),
        ).toEqual([]);
      },
    );

    it(
      confidentialite(
        'ne dévoile dans aucune correction sur place une valeur décimale d’un écran suivant',
      ),
      () => {
        expect(valeursDevoileesAvantLeurEcran(cours)).toEqual([]);
      },
    );
  });
}
