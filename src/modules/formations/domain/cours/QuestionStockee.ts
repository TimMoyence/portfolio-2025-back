import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { NumeriqueStockee, VoteStockee } from '../contrats/cours';
import type { ConfusionId } from './banque/confusions';
import {
  questionNumerique,
  questionVote,
  type QuestionNumerique,
  type QuestionVote,
} from './Cours';
import {
  auMoinsUn,
  concept,
  confusion,
  identifiantDeQuestion,
  texte,
  tolerance,
} from './SchemasCommuns';

const LONGUEUR_MAX_DU_SLUG = 40;
const LONGUEUR_DE_L_EMPREINTE = 8;
const DIACRITIQUES = /\p{M}/gu;
const HORS_ALPHANUMERIQUE = /[^a-z0-9]+/g;
const SYMBOLES_NOMMES: readonly (readonly [RegExp, string])[] = [
  [/\+/g, ' plus '],
  [/−/g, ' moins '],
  [/%/g, ' pct '],
  [/€/g, ' eur '],
];

function sansTiretsAuxBords(slug: string): string {
  let debut = 0;
  let fin = slug.length;
  while (debut < fin && slug[debut] === '-') debut += 1;
  while (fin > debut && slug[fin - 1] === '-') fin -= 1;
  return slug.slice(debut, fin);
}

export function slugOption(libelle: string): string {
  const lisible = SYMBOLES_NOMMES.reduce(
    (courant, [symbole, mot]) => courant.replace(symbole, mot),
    libelle.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase(),
  ).replace(HORS_ALPHANUMERIQUE, '-');
  const tronque = sansTiretsAuxBords(
    sansTiretsAuxBords(lisible).slice(0, LONGUEUR_MAX_DU_SLUG),
  );
  const empreinte = createHash('sha256')
    .update(libelle.normalize('NFC'), 'utf8')
    .digest('hex')
    .slice(0, LONGUEUR_DE_L_EMPREINTE);
  return `${tronque}-${empreinte}`;
}

const optionStockee = z
  .object({ id: texte, libelle: texte, confusion: confusion.nullable() })
  .strict();

function sontDistincts(valeurs: readonly string[]): boolean {
  return new Set(valeurs).size === valeurs.length;
}

export const voteStocke = z
  .object({
    type: z.literal('vote'),
    id: identifiantDeQuestion,
    concept,
    noteCompte: z.boolean(),
    enonce: texte,
    options: z.tuple([optionStockee, optionStockee], optionStockee),
    segments: z.array(texte),
  })
  .strict()
  .superRefine((vote, contexte) => {
    const signaler = (message: string): void => {
      contexte.addIssue({ code: 'custom', path: ['options'], message });
    };
    const bonnes = vote.options.filter((option) => option.confusion === null);
    if (bonnes.length !== 1) {
      signaler(`une seule bonne option est attendue, ${bonnes.length} lue(s)`);
    }
    if (!sontDistincts(vote.options.map((option) => option.id))) {
      signaler('deux options portent le même identifiant');
    }
    if (!sontDistincts(vote.options.map((option) => option.libelle))) {
      signaler('deux options portent le même libellé');
    }
  });

const piegeNumerique = z.object({ valeur: z.number(), confusion }).strict();

export const numeriqueStockee = z
  .object({
    type: z.literal('numeric'),
    id: identifiantDeQuestion,
    concept,
    noteCompte: z.boolean(),
    enonce: texte,
    unite: texte.nullable(),
    solution: z.number(),
    tolerance,
    formePubliee: texte,
    pieges: auMoinsUn(piegeNumerique),
  })
  .strict();

interface OptionPiege {
  readonly id: string;
  readonly libelle: string;
  readonly confusion: ConfusionId;
}

function estPiege(
  option: VoteStockee['options'][number],
): option is OptionPiege {
  return option.confusion !== null;
}

function definitionFixe(stockee: VoteStockee | NumeriqueStockee) {
  return {
    id: stockee.id,
    concept: stockee.concept,
    noteCompte: stockee.noteCompte,
    donnees: () => undefined,
    enonce: () => stockee.enonce,
  };
}

export function questionDeVote(stockee: VoteStockee): QuestionVote {
  const bonne = stockee.options.find((option) => option.confusion === null);
  const pieges = stockee.options.filter(estPiege);
  const [premier, ...suite] = pieges;
  if (bonne === undefined || pieges.length === 0) {
    throw new RangeError(
      `Vote ${stockee.id} sans bonne option ou sans piège : il n'a pas été validé à la lecture`,
    );
  }
  const versPiege = (piege: OptionPiege) => ({
    confusion: piege.confusion,
    libelle: () => piege.libelle,
    optionId: () => piege.id,
  });
  return {
    ...questionVote({
      ...definitionFixe(stockee),
      bonne: () => bonne.id,
      bonneLibelle: () => bonne.libelle,
      pieges: [versPiege(premier), ...suite.map(versPiege)],
    }),
    segments: stockee.segments,
  };
}

export function questionDeNumerique(
  stockee: NumeriqueStockee,
): QuestionNumerique {
  const [premier, ...suite] = stockee.pieges;
  return {
    ...questionNumerique({
      ...definitionFixe(stockee),
      unite: stockee.unite,
      solution: () => stockee.solution,
      tolerance: stockee.tolerance,
      pieges: [
        { confusion: premier.confusion, valeur: () => premier.valeur },
        ...suite.map((piege) => ({
          confusion: piege.confusion,
          valeur: () => piege.valeur,
        })),
      ],
    }),
    formePubliee: stockee.formePubliee,
  };
}
