import { estDependanceInjoignable } from './dependency-outage';

describe('estDependanceInjoignable', () => {
  it('reconnait un refus de connexion reseau', () => {
    expect(
      estDependanceInjoignable(
        Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
          code: 'ECONNREFUSED',
        }),
      ),
    ).toBe(true);
  });

  it('reconnait la classe SQLSTATE 08 des ruptures de connexion', () => {
    expect(
      estDependanceInjoignable(
        Object.assign(new Error('connection failure'), { code: '08006' }),
      ),
    ).toBe(true);
  });

  it('reconnait un arret administrateur du serveur postgres', () => {
    expect(
      estDependanceInjoignable(
        Object.assign(new Error('admin shutdown'), { code: '57P01' }),
      ),
    ).toBe(true);
  });

  it('reconnait la coupure signalee par le seul message du pilote', () => {
    expect(
      estDependanceInjoignable(new Error('Connection terminated unexpectedly')),
    ).toBe(true);
  });

  it('descend dans l erreur du pilote portee par une erreur de requete', () => {
    expect(
      estDependanceInjoignable({
        message: 'query failed',
        driverError: { code: 'ECONNRESET' },
      }),
    ).toBe(true);
  });

  it('descend dans la cause chainee', () => {
    expect(
      estDependanceInjoignable(
        Object.assign(new Error('echec'), {
          cause: Object.assign(new Error('socket'), { code: 'EPIPE' }),
        }),
      ),
    ).toBe(true);
  });

  it('ne prend pas une violation de contrainte pour une panne', () => {
    expect(
      estDependanceInjoignable(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      ),
    ).toBe(false);
  });

  it('ne prend pas une valeur non objet pour une panne', () => {
    expect(estDependanceInjoignable('ECONNREFUSED')).toBe(false);
    expect(estDependanceInjoignable(null)).toBe(false);
  });

  it('ne descend pas indefiniment dans une chaine de causes', () => {
    const profonde = {
      cause: {
        cause: {
          cause: { cause: { cause: { cause: { code: 'ECONNREFUSED' } } } },
        },
      },
    };
    expect(estDependanceInjoignable(profonde)).toBe(false);
  });

  it('ignore un code qui n est pas une chaine', () => {
    expect(estDependanceInjoignable({ code: 42, message: 42 })).toBe(false);
  });
});
