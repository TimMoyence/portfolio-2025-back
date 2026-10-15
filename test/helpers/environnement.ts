type Variables = Readonly<Record<string, string | undefined>>;

export function appliquer(variables: Variables): void {
  for (const [nom, valeur] of Object.entries(variables)) {
    if (valeur === undefined) {
      delete process.env[nom];
    } else {
      process.env[nom] = valeur;
    }
  }
}

export function poserVariables(variables: Variables): () => void {
  const precedentes: Variables = Object.fromEntries(
    Object.keys(variables).map((nom) => [nom, process.env[nom]]),
  );
  appliquer(variables);
  return () => appliquer(precedentes);
}

export function installerVariables(
  variables: Variables,
  portee: 'chaque-test' | 'tout-le-bloc' = 'tout-le-bloc',
): void {
  const [avant, apres] =
    portee === 'chaque-test' ? [beforeEach, afterEach] : [beforeAll, afterAll];
  let restaurer = (): void => undefined;

  avant(() => {
    restaurer = poserVariables(variables);
  });

  apres(() => {
    restaurer();
  });
}

export async function sousEnvironnement<T>(
  variables: Variables,
  action: () => Promise<T>,
): Promise<T> {
  const restaurer = poserVariables(variables);
  try {
    return await action();
  } finally {
    restaurer();
  }
}
