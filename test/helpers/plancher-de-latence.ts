const PLANCHER_MS = 300;
const ALEA_MAX_MS = 50;

export const RETENUE_JUSQU_AU_PLANCHER = {
  avantLePlancher: false,
  apresLePlancher: true,
};

export function simulerLHorlogeAChaqueTest(): void {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
}

export async function reglementAuPlancher(
  promesse: Promise<unknown>,
): Promise<typeof RETENUE_JUSQU_AU_PLANCHER> {
  let reglee = false;
  const marquer = () => {
    reglee = true;
  };
  void promesse.then(marquer, marquer);
  await jest.advanceTimersByTimeAsync(PLANCHER_MS - 1);
  const avantLePlancher = reglee;
  await jest.advanceTimersByTimeAsync(ALEA_MAX_MS + 1);
  return { avantLePlancher, apresLePlancher: reglee };
}
