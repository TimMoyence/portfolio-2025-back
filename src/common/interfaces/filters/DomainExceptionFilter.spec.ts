import { HttpStatus } from '@nestjs/common';
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
import { RateLimitExceededError } from '../../domain/errors/RateLimitExceededError';
import { createHttpResponseHost } from '../../../../test/factories/execution-context.factory';
import { attendreProbleme } from '../../../../test/helpers/reponse-probleme';

class UnknownDomainError extends DomainError {
  constructor() {
    super('Erreur domaine inconnue');
  }
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
  });

  const intercepter = (error: DomainError, url?: string) => {
    const hote = createHttpResponseHost(url);
    filter.catch(error, hote.host);
    return hote;
  };

  it('mappe ResourceNotFoundError vers 404', () => {
    const hote = intercepter(
      new ResourceNotFoundError('Ressource introuvable'),
      '/api/resource',
    );

    attendreProbleme(hote, HttpStatus.NOT_FOUND, {
      detail: 'Ressource introuvable',
      instance: '/api/resource',
    });
  });

  it('mappe UserNotFoundError vers 404', () => {
    attendreProbleme(
      intercepter(new UserNotFoundError('Utilisateur introuvable')),
      HttpStatus.NOT_FOUND,
    );
  });

  it.each<[string, DomainError, HttpStatus]>([
    [
      'InvalidCredentialsError',
      new InvalidCredentialsError(),
      HttpStatus.UNAUTHORIZED,
    ],
    [
      'InsufficientPermissionsError',
      new InsufficientPermissionsError(),
      HttpStatus.FORBIDDEN,
    ],
    [
      'InvalidInputError',
      new InvalidInputError('champ invalide'),
      HttpStatus.BAD_REQUEST,
    ],
    ['TokenExpiredError', new TokenExpiredError(), HttpStatus.UNAUTHORIZED],
    [
      'TokenReuseDetectedError',
      new TokenReuseDetectedError(),
      HttpStatus.UNAUTHORIZED,
    ],
    ['ResourceConflictError', new ResourceConflictError(), HttpStatus.CONFLICT],
    [
      'DomainValidationError',
      new DomainValidationError('invariant viole'),
      HttpStatus.BAD_REQUEST,
    ],
  ])('mappe %s vers %s', (_nom, error, status) => {
    expect(intercepter(error).statusFn).toHaveBeenCalledWith(status);
  });

  it('retourne 500 pour une DomainError inconnue (fallback)', () => {
    const hote = intercepter(new UnknownDomainError(), '/api/fallback');

    attendreProbleme(hote, HttpStatus.INTERNAL_SERVER_ERROR, {
      detail: 'Erreur domaine inconnue',
      instance: '/api/fallback',
      type: 'https://httpstatuses.com/500',
    });
  });

  it('mappe RateLimitExceededError vers 429 sans propager de code', () => {
    const hote = intercepter(
      new RateLimitExceededError('Quota depasse'),
      '/api/share',
    );

    attendreProbleme(hote, HttpStatus.TOO_MANY_REQUESTS, {
      detail: 'Quota depasse',
      instance: '/api/share',
    });
    const body = hote.jsonFn.mock.calls[0][0] as Record<string, unknown>;
    expect(body).not.toHaveProperty('code');
  });

  it('inclut le format RFC 7807 complet dans la reponse', () => {
    const { jsonFn } = intercepter(
      new ResourceNotFoundError('Utilisateur #1 introuvable'),
      '/api/users/1',
    );

    expect(jsonFn).toHaveBeenCalledWith({
      type: 'https://httpstatuses.com/404',
      title: 'NOT_FOUND',
      status: 404,
      detail: 'Utilisateur #1 introuvable',
      instance: '/api/users/1',
    });
  });
});
