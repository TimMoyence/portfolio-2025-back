import {
  withDeterministicCost,
  type DeterministicCostInput,
} from './langchain-fallback-report.builder';

type Lot =
  | 'invoiceScope'
  | 'implementationBacklog'
  | 'implementationTodo'
  | 'priorities'
  | 'fastImplementationPlan';

const config = {
  rateCurrency: 'EUR',
  rateHourlyMin: 47.335,
  rateHourlyMax: 129.995,
};

const rapportEnHeures = (
  heures: Partial<Record<Lot, readonly number[]>>,
): DeterministicCostInput => {
  const lot = (cle: Lot) =>
    (heures[cle] ?? []).map((estimatedHours) => ({ estimatedHours }));
  return {
    invoiceScope: lot('invoiceScope'),
    implementationBacklog: lot('implementationBacklog'),
    implementationTodo: lot('implementationTodo'),
    priorities: lot('priorities'),
    fastImplementationPlan: lot('fastImplementationPlan'),
  };
};

const chiffrage = (heures: Partial<Record<Lot, readonly number[]>>) =>
  withDeterministicCost(rapportEnHeures(heures), 'fr', config)[
    'costEstimate'
  ] as Record<string, unknown>;

describe('withDeterministicCost', () => {
  it('chiffre au centime les heures finies et positives, sommées au dixième', () => {
    expect(
      chiffrage({
        invoiceScope: [1.25, 2.04, Number.NaN, -3, Number.POSITIVE_INFINITY],
        fastImplementationPlan: [0.35, 0.33],
      }),
    ).toMatchObject({
      currency: 'EUR',
      totalEstimatedHours: 3.3,
      estimatedCostMin: 156.21,
      estimatedCostMax: 428.98,
      fastTrackHours: 0.7,
      fastTrackCostMin: 33.13,
      fastTrackCostMax: 91,
    });
  });

  it.each([
    ['le backlog', { implementationBacklog: [2.25] }, 2.3],
    ['la todo', { implementationTodo: [4] }, 4],
    ['les priorités', { priorities: [1, -2] }, 1],
  ] as const)(
    'retombe sur %s quand les lots précédents sont vides',
    (_lot, heures, total) => {
      expect(chiffrage(heures)['totalEstimatedHours']).toBe(total);
    },
  );

  it('arrondit au centime supérieur un coût qui tombe sur un demi-centime', () => {
    const coutDe = withDeterministicCost(
      rapportEnHeures({ invoiceScope: [1.5] }),
      'fr',
      { ...config, rateHourlyMin: 80.35 },
    )['costEstimate'];

    expect(coutDe).toMatchObject({ estimatedCostMin: 120.53 });
  });
});
