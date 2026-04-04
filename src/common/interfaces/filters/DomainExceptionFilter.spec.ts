import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './DomainExceptionFilter';
import { DomainError } from '../../domain/errors/DomainError';
import { ResourceNotFoundError } from '../../domain/errors/ResourceNotFoundError';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';
import { InvalidCredentialsError } from '../../domain/errors/InvalidCredentialsError';
import { InsufficientPermissionsError } from '../../domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../domain/errors/InvalidInputError';
import { TokenExpiredError } from '../../domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../domain/errors/TokenReuseDetectedError';
import { ResourceConflictError } from '../../domain/errors/ResourceConflictError';
import { DomainValidationError } from '../../domain/errors/DomainValidationError';

/** Sous-classe concrete de DomainError pour tester le fallback 500. */
class UnknownDomainError extends DomainError {
  constructor() {
    super('Erreur domaine inconnue');
  }
}

/** Cree un mock ArgumentsHost pour les tests HTTP. */
function createMockHost(url = '/test'): {
  host: ArgumentsHost;
  jsonFn: jest.Mock;
  statusFn: jest.Mock;
} {
  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status: statusFn }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, jsonFn, statusFn };
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
  });

  it('mappe ResourceNotFoundError vers 404', () => {
    const { host, statusFn, jsonFn } = createMockHost('/api/resource');
    const error = new ResourceNotFoundError('Ressource introuvable');

    filter.catch(error, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        detail: 'Ressource introuvable',
        instance: '/api/resource',
      }),
    );
  });

  it('mappe UserNotFoundError vers 404', () => {
    const { host, statusFn, jsonFn } = createMockHost();
    const error = new UserNotFoundError('Utilisateur introuvable');

    filter.catch(error, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 404 }),
    );
  });

  it('mappe InvalidCredentialsError vers 401', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new InvalidCredentialsError(), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('mappe InsufficientPermissionsError vers 403', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new InsufficientPermissionsError(), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });

  it('mappe InvalidInputError vers 400', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new InvalidInputError('champ invalide'), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('mappe TokenExpiredError vers 401', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new TokenExpiredError(), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('mappe TokenReuseDetectedError vers 401', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new TokenReuseDetectedError(), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('mappe ResourceConflictError vers 409', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new ResourceConflictError(), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('mappe DomainValidationError vers 400', () => {
    const { host, statusFn } = createMockHost();

    filter.catch(new DomainValidationError('invariant viole'), host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('retourne 500 pour une DomainError inconnue (fallback)', () => {
    const { host, statusFn, jsonFn } = createMockHost('/api/fallback');
    const error = new UnknownDomainError();

    filter.catch(error, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        detail: 'Erreur domaine inconnue',
        instance: '/api/fallback',
        type: 'https://httpstatuses.com/500',
      }),
    );
  });

  it('inclut le format RFC 7807 complet dans la reponse', () => {
    const { host, jsonFn } = createMockHost('/api/users/1');
    const error = new ResourceNotFoundError('Utilisateur #1 introuvable');

    filter.catch(error, host);

    expect(jsonFn).toHaveBeenCalledWith({
      type: 'https://httpstatuses.com/404',
      title: 'NOT_FOUND',
      status: 404,
      detail: 'Utilisateur #1 introuvable',
      instance: '/api/users/1',
    });
  });
});
