import { z } from 'zod';
import { valeursAmbigues, type Tolerance } from '../GradingCore';
import type { ConfusionId } from './banque/confusions';
import type {
  CorrigeClassement,
  CorrigeDefi,
  CorrigeEnigme,
  CorrigeFeuille,
  CorrigeProduction,
  CorrigeRevelation,
  CorrigeTableau,
} from './Corrige';
import {
  estDansLaGrille,
  planFeuille,
  referenceDeCellule,
} from './PlansStockes';
import {
  auMoinsUn,
  confusion,
  identifiantDeQuestion,
  signaleurDe,
  texte,
  tolerance,
  type Signaleur,
} from './SchemasCommuns';

const piegeNumerique = z.object({ valeur: z.number(), confusion }).strict();
const seuilReussite = z.number().gt(0).lte(1);

function signalerDoublons(
  valeurs: readonly string[],
  chemin: readonly (string | number)[],
  signaler: Signaleur,
): void {
  const vues = new Set<string>();
  for (const valeur of valeurs) {
    if (vues.has(valeur)) {
      signaler(chemin, `« ${valeur} » apparaît deux fois`);
    }
    vues.add(valeur);
  }
}

function signalerAmbiguite(
  valeur: number,
  pieges: readonly { readonly valeur: number }[],
  tolerance: Tolerance,
  chemin: readonly (string | number)[],
  signaler: Signaleur,
): void {
  if (
    valeursAmbigues([valeur, ...pieges.map((piege) => piege.valeur)], tolerance)
  ) {
    signaler(
      chemin,
      `un piège se confond avec la valeur attendue ${valeur} ou avec un autre piège`,
    );
  }
}

const formeFormule = z.union([
  z.literal('references'),
  z.object({ memeQue: referenceDeCellule }).strict(),
]);

const attenduDeFeuille = z
  .object({
    reference: referenceDeCellule,
    formuleReference: z.string().startsWith('='),
    valeur: z.number(),
    tolerance,
    forme: formeFormule,
    confusionSiErreurFormule: confusion.nullable(),
    pieges: z.array(piegeNumerique),
  })
  .strict();

export const corrigeFeuille = z
  .object({
    type: z.literal('feuille'),
    plan: planFeuille,
    attendus: auMoinsUn(attenduDeFeuille),
    seuilReussite,
  })
  .strict()
  .superRefine((corrige, contexte) => {
    const signaler = signaleurDe(contexte);
    const references = corrige.attendus.map((attendu) => attendu.reference);
    signalerDoublons(references, ['attendus'], signaler);
    corrige.attendus.forEach((attendu, rang) => {
      const chemin = ['attendus', rang];
      if (
        !estDansLaGrille(corrige.plan, attendu.reference) ||
        corrige.plan.verrouillees.includes(attendu.reference)
      ) {
        signaler(
          chemin,
          `${attendu.reference} n'est pas une cellule à remplir`,
        );
      }
      if (
        attendu.forme !== 'references' &&
        !references.includes(attendu.forme.memeQue)
      ) {
        signaler(chemin, `${attendu.forme.memeQue} n'a pas d'attendu`);
      }
      signalerAmbiguite(
        attendu.valeur,
        attendu.pieges,
        attendu.tolerance,
        chemin,
        signaler,
      );
    });
  }) satisfies z.ZodType<CorrigeFeuille>;

export const corrigeTableau = z
  .object({
    type: z.literal('tableau'),
    attendus: auMoinsUn(
      z
        .object({
          rang: z.number().int().nonnegative(),
          cle: texte,
          valeur: z.number(),
          pieges: z.array(piegeNumerique),
        })
        .strict(),
    ),
    tolerance,
    seuilReussite,
  })
  .strict()
  .superRefine((corrige, contexte) => {
    const signaler = signaleurDe(contexte);
    signalerDoublons(
      corrige.attendus.map((attendu) => `${attendu.rang}:${attendu.cle}`),
      ['attendus'],
      signaler,
    );
    corrige.attendus.forEach((attendu, rang) => {
      signalerAmbiguite(
        attendu.valeur,
        attendu.pieges,
        corrige.tolerance,
        ['attendus', rang],
        signaler,
      );
    });
  }) satisfies z.ZodType<CorrigeTableau>;

export const corrigeClassement = z
  .object({
    type: z.literal('classement'),
    attendus: auMoinsUn(
      z
        .object({
          carteId: texte,
          categorieId: texte,
          confusionSiErreur: confusion,
          justification: texte,
        })
        .strict(),
    ),
    seuilReussite,
  })
  .strict()
  .superRefine((corrige, contexte) => {
    signalerDoublons(
      corrige.attendus.map((attendu) => attendu.carteId),
      ['attendus'],
      signaleurDe(contexte),
    );
  }) satisfies z.ZodType<CorrigeClassement>;

const solutionDEnigme = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('nombre'),
      valeur: z.number(),
      tolerance,
      formePubliee: texte,
    })
    .strict(),
  z.object({ type: z.literal('texte'), acceptees: auMoinsUn(texte) }).strict(),
]);

export const corrigeEnigme = z
  .object({
    type: z.literal('enigme'),
    parcoursId: texte,
    enigmeId: identifiantDeQuestion,
    rang: z.number().int().nonnegative(),
    solution: solutionDEnigme,
    fragment: texte,
    pieges: z.array(piegeNumerique),
  })
  .strict()
  .superRefine((corrige, contexte) => {
    if (corrige.solution.type === 'nombre') {
      signalerAmbiguite(
        corrige.solution.valeur,
        corrige.pieges,
        corrige.solution.tolerance,
        ['pieges'],
        signaleurDe(contexte),
      );
    }
  }) satisfies z.ZodType<CorrigeEnigme>;

export const corrigeDefi = z
  .object({
    type: z.literal('defi'),
    strategies: auMoinsUn(
      z.object({ id: texte, libelle: texte, fausse: z.boolean() }).strict(),
    ),
  })
  .strict()
  .superRefine((corrige, contexte) => {
    const signaler = signaleurDe(contexte);
    signalerDoublons(
      corrige.strategies.map((strategie) => strategie.id),
      ['strategies'],
      signaler,
    );
    const fausses = corrige.strategies.filter((strategie) => strategie.fausse);
    if (fausses.length !== 1) {
      signaler(
        ['strategies'],
        `une seule stratégie fausse est attendue, ${fausses.length} lue(s)`,
      );
    }
  }) satisfies z.ZodType<CorrigeDefi>;

export const corrigeRevelation = z
  .object({
    type: z.literal('revelation'),
    titre: texte,
    lignes: auMoinsUn(texte),
  })
  .strict() satisfies z.ZodType<CorrigeRevelation>;

function confusionsDuCorrigeBrutes(
  corrige: CorrigeProduction,
): readonly ConfusionId[] {
  switch (corrige.type) {
    case 'feuille':
      return corrige.attendus.flatMap((attendu) => [
        ...attendu.pieges.map((piege) => piege.confusion),
        ...(attendu.confusionSiErreurFormule === null
          ? []
          : [attendu.confusionSiErreurFormule]),
        attendu.forme === 'references'
          ? 'valeur-saisie-sans-formule'
          : 'formule-non-recopiable',
      ]);
    case 'tableau':
      return corrige.attendus.flatMap((attendu) =>
        attendu.pieges.map((piege) => piege.confusion),
      );
    case 'classement':
      return corrige.attendus.map((attendu) => attendu.confusionSiErreur);
    case 'enigme':
      return corrige.pieges.map((piege) => piege.confusion);
    default:
      return corrige satisfies never;
  }
}

export function confusionsDuCorrige(
  corrige: CorrigeProduction,
): readonly ConfusionId[] {
  return [...new Set(confusionsDuCorrigeBrutes(corrige))];
}
