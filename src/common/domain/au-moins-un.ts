export type AuMoinsUn<T> = readonly [T, ...T[]];

export type AuMoinsUnModifiable<T> = [...AuMoinsUn<T>];

export function estAuMoinsUn<T>(liste: readonly T[]): liste is AuMoinsUn<T> {
  return liste.length > 0;
}

export function exigerAuMoinsUn<T>(
  liste: readonly T[],
  messageSiVide: string,
): AuMoinsUnModifiable<T> {
  if (!estAuMoinsUn(liste)) {
    throw new RangeError(messageSiVide);
  }
  return [...liste];
}

export function mapperAuMoinsUn<T, U>(
  liste: AuMoinsUn<T>,
  transformer: (element: T, rang: number) => U,
): AuMoinsUnModifiable<U> {
  const [premier, ...suite] = liste;
  return [
    transformer(premier, 0),
    ...suite.map((element, rang) => transformer(element, rang + 1)),
  ];
}
