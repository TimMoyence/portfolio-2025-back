import { estObjet } from '../../../../src/common/domain/objets/est-objet';
import type { CorrigeFeuille } from '../../../../src/modules/formations/domain/cours/correction/Corrige';
import { corrigerFeuille } from '../../../../src/modules/formations/domain/cours/correction/CorrectionProduction';
import type { ContenuDeCours } from '../../../../src/modules/formations/domain/cours/stockage/CoursStocke';
import { presentationDe } from '../../../../src/modules/formations/domain/cours/structure/Cours';
import {
  decalerFormule,
  type ValeurFormule,
} from '../../../../src/modules/formations/domain/cours/formule/Formule';
import { ecranDuContenu, rangDuContenu } from './fiche-de-cours';

export const rangsDe = (premier: number, dernier: number): number[] =>
  Array.from({ length: dernier - premier + 1 }, (_, rang) => premier + rang);

export function attendusDeColonne<T>(
  colonne: string,
  premiereLigne: number,
  elements: readonly T[],
  valeurs: (element: T, index: number) => readonly ValeurFormule[],
): Record<string, readonly ValeurFormule[]> {
  return Object.fromEntries(
    elements.map((element, index) => [
      `${colonne}${premiereLigne + index}`,
      valeurs(element, index),
    ]),
  );
}

export function formulesDuCorrige(
  corrige: Pick<CorrigeFeuille, 'attendus'>,
): Record<string, string> {
  return Object.fromEntries(
    corrige.attendus.map((attendu) => [
      attendu.reference,
      attendu.formuleReference,
    ]),
  );
}

export function recopier(
  modele: string,
  colonne: string,
  premiere: number,
  derniere: number,
): Record<string, string> {
  return Object.fromEntries(
    rangsDe(premiere, derniere).map((ligne) => [
      `${colonne}${ligne}`,
      decalerFormule(modele, ligne - premiere, 0),
    ]),
  );
}

export function confusionsDe(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
): (string | null)[] {
  return corrigerFeuille(corrige, envoi)
    .verdicts.filter((verdict) => verdict.reference.startsWith(colonne))
    .map((verdict) => verdict.confusion);
}

export function attendreUneRecopieNonFigee(
  corrige: CorrigeFeuille,
  envoi: Readonly<Record<string, string>>,
  colonne: string,
  lignesDecalees: number,
): void {
  expect(confusionsDe(corrige, envoi, colonne)).toEqual([
    null,
    ...Array.from(
      { length: lignesDecalees },
      () => 'reference-relative-non-figee',
    ),
  ]);
}

export const texteDeLEcran = (
  contenu: ContenuDeCours,
  screenId: string,
): string => JSON.stringify(ecranDuContenu(contenu, screenId));

export function reponsesDejaMontrees(
  contenu: ContenuDeCours,
  screenId: string,
  ecrites: readonly string[],
): string[] {
  const ecrans = contenu.ecrans.map((ecran) => ecran.screenId);
  const anterieurs = ecrans
    .slice(0, ecrans.indexOf(screenId))
    .map((anterieur) => texteDeLEcran(contenu, anterieur))
    .join(' ');
  return ecrites.filter((ecrite) => anterieurs.includes(ecrite));
}

export function proprietesV2(
  contenu: ContenuDeCours,
  screenId: string,
): Readonly<Record<string, unknown>> {
  const presentation = presentationDe(ecranDuContenu(contenu, screenId));
  if (presentation === null || !estObjet(presentation.props)) {
    throw new Error(`l’écran ${screenId} n’a pas de présentation`);
  }
  return { ...presentation.props };
}

const textes = (valeur: unknown): string[] =>
  Array.isArray(valeur) ? valeur.map(String) : [];

export function texteDeLImage(
  contenu: ContenuDeCours,
  screenId: string,
): { readonly paragraphes: string[]; readonly correspondances: string[] } {
  const { paragraphs, items } = proprietesV2(contenu, screenId);
  return { paragraphes: textes(paragraphs), correspondances: textes(items) };
}

type EcranPourComprendre = readonly [
  rang: string,
  sujet: string,
  page: string,
  fichier: string,
  notions: readonly string[],
];

const paragraphe = (
  props: Readonly<Record<string, unknown>>,
  rang: number,
): string =>
  Array.isArray(props.paragraphs) ? String(props.paragraphs[rang]) : '';

export function decrireLesEcransPourComprendre(
  code: string,
  contenu: ContenuDeCours,
  ecransPourComprendre: readonly EcranPourComprendre[],
  motsDuCours: RegExp,
): void {
  const reference = `${code.replace('-', '')}-M2`;
  const enfantDe = (rang: string, sujet: string) =>
    `${code}-${rang}-ENFANT-${sujet}`;

  it.each(ecransPourComprendre)(
    `${reference} · nomme dans la règle de l’écran %s-ENFANT-%s la notion de la page suivante`,
    (rang, sujet, _page, _fichier, notions) => {
      const regle = paragraphe(proprietesV2(contenu, enfantDe(rang, sujet)), 1);

      expect(notions.filter((notion) => !regle.includes(notion))).toEqual([]);
    },
  );

  it.each(ecransPourComprendre)(
    `${reference} · ouvre la page %s par 1 min d’une image du quotidien, titre et phrase sans un mot du cours`,
    (rang, sujet, page, fichier) => {
      const position = rangDuContenu(contenu, `${code}-${rang}-COURS-${page}`);
      const enfant = contenu.ecrans[position - 1];
      const props = proprietesV2(contenu, enfantDe(rang, sujet));
      const phrase = paragraphe(props, 0);
      const presentation = enfant ? presentationDe(enfant) : null;

      expect(enfant?.screenId).toBe(enfantDe(rang, sujet));
      expect(enfant?.dureeMinutes).toBe(1);
      expect(contenu.ecrans[position]?.dureeMinutes).toBe(2);
      expect(presentation?.version === 2 && presentation.renderer).toBe(
        'image-left',
      );
      expect(props.image).toBe(
        `/assets/cours/${code.toLowerCase()}/v1/${fichier}.webp`,
      );
      expect(
        [enfant?.titre ?? '', phrase].filter((texte) =>
          motsDuCours.test(texte),
        ),
      ).toEqual([]);
    },
  );
}
