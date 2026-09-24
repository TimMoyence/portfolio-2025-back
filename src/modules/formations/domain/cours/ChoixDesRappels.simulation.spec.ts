import * as fc from 'fast-check';
import { buildAnswerRecord } from '../../../../../test/factories/formation.factory';
import type { AnswerRecord } from '../IAnswers.repository';
import {
  choisirRappels,
  CONCEPTS_MAX,
  DELAI_MIN_RAPPEL_MS,
  type ContexteDeChoix,
  type EcranDeRappel,
} from './ChoixDesRappels';

const CONCEPTS = [
  'proportion',
  'taux-evolution',
  'capitalisation',
  'indice',
  'controle-coherence',
] as const;
const MAINTENANT = new Date('2026-09-20T10:00:00.000Z');
const QUESTIONS_PAR_CONCEPT = 3;

function banque(): EcranDeRappel['banque'] {
  return CONCEPTS.flatMap((concept) =>
    Array.from({ length: QUESTIONS_PAR_CONCEPT }, (_, rang) => ({
      id: `${concept}-${String(rang)}`,
      concept,
    })),
  );
}

function cible(obligatoires: readonly string[]): EcranDeRappel {
  return {
    screenId: 'E-SPACED',
    rang: 7,
    obligatoires,
    banque: banque(),
  };
}

function reponse(
  questionId: string,
  correcte: boolean,
  ageMs: number,
): AnswerRecord {
  const question = banque().find((candidate) => candidate.id === questionId);
  return buildAnswerRecord({
    questionId,
    concept: question?.concept ?? 'proportion',
    correcte,
    soumisLe: new Date(MAINTENANT.getTime() - ageMs),
  });
}

function contexte(
  obligatoires: readonly string[],
  reponses: readonly AnswerRecord[],
): ContexteDeChoix {
  return {
    cible: cible(obligatoires),
    reponses,
    maitrise: [],
    maintenant: MAINTENANT,
  };
}

const idsDeLaBanque = banque().map((question) => question.id);

describe('choisirRappels sur des historiques tires au sort', () => {
  const historique = fc
    .array(
      fc.tuple(
        fc.constantFrom(...idsDeLaBanque),
        fc.boolean(),
        fc.integer({ min: 0, max: 4 * DELAI_MIN_RAPPEL_MS }),
      ),
      { maxLength: 12 },
    )
    .map((couples) =>
      couples.map(([id, correcte, age]) => reponse(id, correcte, age)),
    );
  const obligatoires = fc.uniqueArray(fc.constantFrom(...idsDeLaBanque), {
    maxLength: 3,
  });
  const questionsRepondues = (reponses: readonly { questionId: string }[]) =>
    new Set(reponses.map((item) => item.questionId));

  it('ne sert jamais une question deja repondue, ni le concept exclu en complement', () => {
    fc.assert(
      fc.property(obligatoires, historique, (imposees, reponses) => {
        const servis = choisirRappels(contexte(imposees, reponses));

        const repondues = questionsRepondues(reponses);
        const complement = servis.filter((id) => !imposees.includes(id));
        expect(servis.filter((id) => repondues.has(id))).toEqual([]);
        expect(
          complement.filter((id) => id.startsWith('controle-coherence')),
        ).toEqual([]);
      }),
    );
  });

  it('sert les obligatoires non repondus puis au plus deux concepts de plus', () => {
    fc.assert(
      fc.property(obligatoires, historique, (imposees, reponses) => {
        const servis = choisirRappels(contexte(imposees, reponses));

        const repondues = questionsRepondues(reponses);
        const attendues = imposees.filter((id) => !repondues.has(id));
        expect(servis.slice(0, attendues.length)).toEqual(attendues);
        expect(servis.length).toBeLessThanOrEqual(
          attendues.length + CONCEPTS_MAX,
        );
      }),
    );
  });

  it('rend deux fois la meme liste pour le meme historique', () => {
    fc.assert(
      fc.property(obligatoires, historique, (imposees, reponses) => {
        expect(choisirRappels(contexte(imposees, reponses))).toEqual(
          choisirRappels(contexte(imposees, reponses)),
        );
      }),
    );
  });

  it('ne sert jamais deux questions du meme concept en complement', () => {
    fc.assert(
      fc.property(historique, (reponses) => {
        const servis = choisirRappels(contexte([], reponses));
        const concepts = servis.map((id) => id.slice(0, id.lastIndexOf('-')));

        expect(new Set(concepts).size).toBe(servis.length);
      }),
    );
  });
});
