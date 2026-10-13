import {
  ESPACE_FINE_INSECABLE as FINE,
  ESPACE_INSECABLE as INSECABLE,
  sansEspacesNiMoinsTypographiques,
  sansEspacesTypographiques,
} from './sans-espaces-typographiques';

describe('sansEspacesTypographiques', () => {
  it('ramène l espace insécable et l espace fine insécable à une espace simple', () => {
    expect(
      sansEspacesTypographiques(`1${FINE}200${INSECABLE}k€ ; 3${INSECABLE}%`),
    ).toBe('1 200 k€ ; 3 %');
  });

  it('garde le signe moins typographique', () => {
    expect(sansEspacesTypographiques(`−1${FINE}200${INSECABLE}k€`)).toBe(
      '−1 200 k€',
    );
  });
});

describe('sansEspacesNiMoinsTypographiques', () => {
  it('ramène aussi chaque signe moins typographique au tiret', () => {
    expect(
      sansEspacesNiMoinsTypographiques(`−1${FINE}200${INSECABLE}k€ et −3`),
    ).toBe('-1 200 k€ et -3');
  });
});
