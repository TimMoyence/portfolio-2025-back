import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import { TokenHash } from '../../../common/domain/crypto/TokenHash';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { ConfirmAuditRequestUseCase } from './ConfirmAuditRequest.useCase';

describe('ConfirmAuditRequestUseCase', () => {
  function construire(confirme: string | null) {
    const confirmer = jest.fn().mockResolvedValue(confirme);
    const enqueue = jest.fn().mockResolvedValue(undefined);
    const useCase = new ConfirmAuditRequestUseCase(
      { confirmer } as unknown as IAuditRequestsRepository,
      { enqueue } as unknown as IAuditQueuePort,
    );
    return { confirmer, enqueue, useCase };
  }

  it('confirme par l empreinte du jeton, jamais par sa valeur brute, puis lance l audit', async () => {
    const { confirmer, enqueue, useCase } = construire('audit-1');

    await expect(useCase.execute('jeton-brut')).resolves.toEqual({
      auditId: 'audit-1',
    });

    expect(confirmer).toHaveBeenCalledWith(
      TokenHash.fromRaw('jeton-brut').value,
    );
    expect(enqueue).toHaveBeenCalledWith('audit-1');
  });

  it('refuse un lien inconnu, expiré ou déjà utilisé sans lancer d audit', async () => {
    const { enqueue, useCase } = construire(null);

    await expect(useCase.execute('jeton-brut')).rejects.toBeInstanceOf(
      LienInvalideError,
    );
    expect(enqueue).not.toHaveBeenCalled();
  });
});
