import type { EntityManager, Repository } from 'typeorm';
import {
  enTransactionSousVerrou,
  enTransactionSurLaCle,
  verrouillerJusquALaFinDeLaTransaction,
} from './verrou-de-transaction';

const VERROU = 'SELECT pg_advisory_xact_lock(hashtext($1))';

function transactionTracee() {
  const journal: string[] = [];
  const depotDeLaTransaction = { lie: 'a la transaction' };
  const transaction = {
    query: jest.fn((_sql: string, [cle]: string[]) => {
      journal.push(`verrou ${cle}`);
      return Promise.resolve([]);
    }),
    withRepository: jest.fn(() => depotDeLaTransaction),
  };
  const manager = {
    transaction: jest.fn(
      async (travail: (m: typeof transaction) => Promise<unknown>) => {
        journal.push('debut');
        const resultat = await travail(transaction);
        journal.push('fin');
        return resultat;
      },
    ),
  };
  return {
    journal,
    transaction,
    depotDeLaTransaction,
    manager: manager as unknown as EntityManager,
  };
}

describe('verrouillerJusquALaFinDeLaTransaction', () => {
  it('prend le verrou consultatif de la transaction sur l empreinte de la cle', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await verrouillerJusquALaFinDeLaTransaction(
      { query } as unknown as EntityManager,
      'password_reset_tokens:user-1',
    );

    expect(query).toHaveBeenCalledWith(VERROU, [
      'password_reset_tokens:user-1',
    ]);
  });
});

describe('enTransactionSousVerrou', () => {
  it('prend le verrou au debut de la transaction et y joue le travail jusqu a sa fin', async () => {
    const { journal, transaction, manager } = transactionTracee();

    const resultat = await enTransactionSousVerrou(
      manager,
      'ia-solopreneurs',
      (dansLaTransaction) => {
        journal.push(
          dansLaTransaction === (transaction as unknown as EntityManager)
            ? 'travail dans la transaction'
            : 'travail hors de la transaction',
        );
        return Promise.resolve(42);
      },
    );

    expect(resultat).toBe(42);
    expect(transaction.query).toHaveBeenCalledWith(VERROU, ['ia-solopreneurs']);
    expect(journal).toEqual([
      'debut',
      'verrou ia-solopreneurs',
      'travail dans la transaction',
      'fin',
    ]);
  });
});

describe('enTransactionSurLaCle', () => {
  it('verrouille la cle prefixee par la table et donne au travail le depot lie a la transaction', async () => {
    const { journal, transaction, depotDeLaTransaction, manager } =
      transactionTracee();
    const repo = {
      manager,
      metadata: { tableName: 'audit_requests' },
    } as unknown as Repository<{ id: string }>;

    const resultat = await enTransactionSurLaCle(
      repo,
      'lea@gmail.com',
      (depot) => {
        journal.push('travail');
        return Promise.resolve(depot);
      },
    );

    expect(resultat).toBe(depotDeLaTransaction);
    expect(transaction.withRepository).toHaveBeenCalledWith(repo);
    expect(journal).toEqual([
      'debut',
      'verrou audit_requests:lea@gmail.com',
      'travail',
      'fin',
    ]);
  });
});
