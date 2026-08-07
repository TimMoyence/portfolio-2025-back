/* eslint-disable @typescript-eslint/unbound-method */
import { CreateCookieConsentsUseCase } from './CreateCookieConsents.useCase';
import type { ICookieConsentsRepository } from '../domain/ICookieConsents.repository';
import {
  buildCookieConsentCommand,
  buildCookieConsentResponse,
  createMockCookieConsentsRepo,
} from '../../../../test/factories/cookie-consents.factory';

describe('CreateCookieConsentsUseCase', () => {
  let useCase: CreateCookieConsentsUseCase;
  let repo: jest.Mocked<ICookieConsentsRepository>;

  beforeEach(() => {
    repo = createMockCookieConsentsRepo();
    useCase = new CreateCookieConsentsUseCase(repo);
  });

  it('devrait creer un consentement cookies et le persister via le repository', async () => {
    const command = buildCookieConsentCommand();
    const expectedResponse = buildCookieConsentResponse();
    repo.create.mockResolvedValue(expectedResponse);

    await useCase.execute(command);

    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner la reponse du repository', async () => {
    const command = buildCookieConsentCommand({ action: 'essential_only' });
    const expectedResponse = buildCookieConsentResponse({
      message: 'Consentement minimal enregistre',
    });
    repo.create.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(command);

    expect(result).toEqual(expectedResponse);
  });
});
