import { auCentime } from '../../../../../../common/domain/nombres/arrondi';

export interface FonctionDerivable {
  readonly f: (x: number) => number;
  readonly derivee: (x: number) => number;
}

export interface PointDeCourbe {
  readonly x: number;
  readonly y: number;
}

export interface Tangente extends PointDeCourbe {
  readonly slope: number;
  readonly label?: string;
}

export function tracer(
  { f }: FonctionDerivable,
  [debut, fin]: readonly [number, number],
  pas: number,
): PointDeCourbe[] {
  return Array.from(
    { length: Math.round((fin - debut) / pas) + 1 },
    (_, rang) => {
      const x = auCentime(debut + rang * pas);
      return { x, y: auCentime(f(x)) };
    },
  );
}

export function tangenteEn(
  { f, derivee }: FonctionDerivable,
  x: number,
  label?: string,
): Tangente {
  return {
    x,
    y: auCentime(f(x)),
    slope: auCentime(derivee(x)),
    ...(label === undefined ? {} : { label }),
  };
}
