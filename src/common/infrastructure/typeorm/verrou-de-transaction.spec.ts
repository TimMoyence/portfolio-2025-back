import type { EntityManager } from 'typeorm';
import { verrouillerJusquALaFinDeLaTransaction } from './verrou-de-transaction';

describe('verrouillerJusquALaFinDeLaTransaction', () => {
  it('prend le verrou consultatif de la transaction sur l empreinte de la cle', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await verrouillerJusquALaFinDeLaTransaction(
      { query } as unknown as EntityManager,
      'password_reset_tokens:user-1',
    );

    expect(query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      ['password_reset_tokens:user-1'],
    );
  });
});
