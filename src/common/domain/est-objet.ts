export function estObjet(
  valeur: unknown,
): valeur is Readonly<Record<string, unknown>> {
  return (
    typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
  );
}
