const PLANCHER_MS = 300;
const ALEA_MAX_MS = 50;

const RETENUE_JUSQU_AU_PLANCHER = {
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

export function promesseSuspendue<T>(): {
  readonly promesse: Promise<T>;
  readonly liberer: (valeur: T) => void;
  readonly rompre: (erreur: Error) => void;
} {
  let liberer: (valeur: T) => void = () => undefined;
  let rompre: (erreur: Error) => void = () => undefined;
  const promesse = new Promise<T>((resolve, reject) => {
    liberer = resolve;
    rompre = reject;
  });
  return { promesse, liberer, rompre };
}

export async function rendueAuPlancher<T>(promesse: Promise<T>): Promise<T> {
  let reglee = false;
  const marquer = () => {
    reglee = true;
  };
  void promesse.then(marquer, marquer);
  await jest.advanceTimersByTimeAsync(PLANCHER_MS - 1);
  const avantLePlancher = reglee;
  await jest.advanceTimersByTimeAsync(ALEA_MAX_MS + 1);
  expect({ avantLePlancher, apresLePlancher: reglee }).toEqual(
    RETENUE_JUSQU_AU_PLANCHER,
  );
  return promesse;
}
