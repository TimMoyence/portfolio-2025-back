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

function valeursActuelles(variables: Variables): Variables {
  return Object.fromEntries(
    Object.keys(variables).map((nom) => [nom, process.env[nom]]),
  );
}

export function installerVariables(
  variables: Variables,
  portee: 'chaque-test' | 'tout-le-bloc' = 'tout-le-bloc',
): void {
  const [avant, apres] =
    portee === 'chaque-test' ? [beforeEach, afterEach] : [beforeAll, afterAll];
  let precedentes: Variables = {};

  avant(() => {
    precedentes = valeursActuelles(variables);
    appliquer(variables);
  });

  apres(() => {
    appliquer(precedentes);
  });
}

export async function sousEnvironnement<T>(
  variables: Variables,
  action: () => Promise<T>,
): Promise<T> {
  const precedentes = valeursActuelles(variables);
  appliquer(variables);
  try {
    return await action();
  } finally {
    appliquer(precedentes);
  }
}
