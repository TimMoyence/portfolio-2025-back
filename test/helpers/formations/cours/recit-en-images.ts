import { arrondi } from '../../../../src/common/domain/nombres/arrondi';
import type { Cours } from '../../../../src/modules/formations/domain/contrats/cours';
import type { ContenuDeCours } from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { questionsDe } from '../../../../src/modules/formations/domain/cours/structure/Cours';
import { proprietesV2 } from './feuille-de-cours';
import { valeursEtPieges } from './fiche-de-cours';
import { solutionsNumeriques } from './lecture-de-cours';
import { valeursAuCatalogue } from './relecture-de-cours';

const estNotable = (valeur: number): boolean =>
  !Number.isInteger(valeur) || Math.abs(valeur) >= 100;

type AttenduDeProduction = Parameters<typeof valeursEtPieges>[0];

export function reponsesEtPiegesNotables(
  cours: Cours,
  production: readonly AttenduDeProduction[] = [],
): number[] {
  return [
    ...Object.values(solutionsNumeriques(cours)).flat(),
    ...production.flatMap(valeursEtPieges),
  ]
    .filter((valeur) => typeof valeur === 'number')
    .filter(estNotable);
}

export function reponsesAuCatalogue(
  cours: Cours,
  production: readonly AttenduDeProduction[] = [],
): string[] {
  return valeursAuCatalogue(cours, reponsesEtPiegesNotables(cours, production));
}

export const estUnEcranDImage = (id: string): boolean =>
  id.includes('-ENFANT-');

export function recapitulatifDe(
  cours: Cours,
  contenu: ContenuDeCours,
  acte: string,
) {
  const ecrans = cours.ecrans.filter(({ id }) => id.startsWith(acte));
  const ecransDImage = ecrans.map(({ id }) => id).filter(estUnEcranDImage);
  return {
    minutes: ecrans.reduce((total, ecran) => total + ecran.dureeMinutes, 0),
    ecransDImage,
    images: ecransDImage.map((id) => proprietesV2(contenu, id).image),
    briques: ecrans.map(({ brique }) => brique),
    notees: ecrans
      .flatMap((ecran) => questionsDe(ecran))
      .filter((question) => question.noteCompte),
  };
}

export const TRAME_DE_135_MINUTES = {
  ecrans: 40,
  dureeMinutes: 135,
  minutesParActe: [12, 45, 38, 32, 8, 0],
  rythme: { expositionContinueMax: 5, interactives: 104, exposition: 31 },
};

interface RecapitulatifAttendu {
  readonly acte: string;
  readonly minutes: number;
  readonly images: readonly string[];
  readonly references: readonly [string, string];
}

export function decrireLeRecapitulatifEnImages(
  cours: Cours,
  contenu: ContenuDeCours,
  {
    acte,
    minutes,
    images,
    references: [recap, illustrations],
  }: RecapitulatifAttendu,
): void {
  it(`${recap} · récapitule en ${minutes} minutes, ${images.length} écrans d’image et un vote, sans aucune question notée`, () => {
    const servi = recapitulatifDe(cours, contenu, acte);

    expect(servi.minutes).toBe(minutes);
    expect(servi.images).toEqual(images);
    expect(servi.briques).toContain('fp-vote');
    expect(servi.notees).toEqual([]);
  });

  it(`${illustrations} · montre sur chaque écran d’image une image du cours, décrite pour qui ne la voit pas`, () => {
    expect(imagesMalDecrites(cours, contenu)).toEqual([]);
  });
}

const LONGUEUR_MINIMALE_D_UNE_DESCRIPTION = 40;

export function imagesMalDecrites(
  cours: Cours,
  contenu: ContenuDeCours,
): string[] {
  const servies = cours.medias.map(({ chemins }) => chemins[0]);
  return cours.ecrans
    .map(({ id }) => id)
    .filter(estUnEcranDImage)
    .filter((id) => {
      const { image, imageAlt } = proprietesV2(contenu, id);
      return (
        !servies.includes(String(image)) ||
        String(imageAlt).length <= LONGUEUR_MINIMALE_D_UNE_DESCRIPTION
      );
    });
}

const POURCENT = 100;
const NOMBRE_ECRIT = /[−-]?(?:\d{1,3}(?:\s\d{3})+|\d+)(?:,\d+)?(?:\s?%)?/gu;
const MOINS_DETACHE = /[−-]\s/gu;

function nombreEcrit([ecrit]: RegExpExecArray | RegExpMatchArray): number {
  const valeur = Number(
    ecrit.replace(/[\s%]/gu, '').replace('−', '-').replace(',', '.'),
  );
  return ecrit.endsWith('%') ? valeur / POURCENT : valeur;
}

function nombresDe(valeur: unknown): number[] {
  if (typeof valeur === 'number') {
    return [valeur];
  }
  if (typeof valeur === 'string') {
    const lectures = [valeur, valeur.replaceAll(MOINS_DETACHE, '−')];
    return [
      ...new Set(
        lectures.flatMap((lecture) =>
          Array.from(lecture.matchAll(NOMBRE_ECRIT), nombreEcrit),
        ),
      ),
    ];
  }
  if (Array.isArray(valeur)) {
    return valeur.flatMap(nombresDe);
  }
  if (typeof valeur === 'object' && valeur !== null) {
    return Object.values(valeur).flatMap(nombresDe);
  }
  return [];
}

const centiemes = (valeur: number): number => arrondi(Math.abs(valeur), 2);

export function nombresServisEgauxAuCentieme(
  ecrans: readonly { readonly id: string }[],
  notees: readonly number[],
): string[] {
  return ecrans.flatMap((ecran) =>
    nombresDe(ecran)
      .filter((servi) =>
        notees.some((notee) => centiemes(notee) === centiemes(servi)),
      )
      .map((servi) => `${servi} dans ${ecran.id}`),
  );
}
