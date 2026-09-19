type Variables = Readonly<Record<string, string | undefined>>;

function appliquer(variables: Variables): void {
  for (const [nom, valeur] of Object.entries(variables)) {
    if (valeur === undefined) {
      delete process.env[nom];
    } else {
      process.env[nom] = valeur;
    }
  }
}

export async function sousEnvironnement<T>(
  variables: Variables,
  action: () => Promise<T>,
): Promise<T> {
  const precedentes = Object.fromEntries(
    Object.keys(variables).map((nom) => [nom, process.env[nom]]),
  );
  appliquer(variables);
  try {
    return await action();
  } finally {
    appliquer(precedentes);
  }
}
