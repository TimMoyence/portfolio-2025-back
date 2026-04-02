import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DomainValidationError } from '../../domain/errors/DomainValidationError';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let jsonFn: jest.Mock;
  let statusFn: jest.Mock;
  let host: ArgumentsHost;

  const requestUrl = '/api/test';

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    jsonFn = jest.fn();
    statusFn = jest.fn().mockReturnValue({ json: jsonFn });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn }),
        getRequest: () => ({ url: requestUrl }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('devrait retourner le status et le message pour une HttpException', () => {
    const exception = new HttpException(
      'Ressource introuvable',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        detail: 'Ressource introuvable',
      }),
    );
  });

  it('devrait retourner 400 pour une DomainValidationError', () => {
    const exception = new DomainValidationError('Le champ email est invalide');

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.BAD_REQUEST,
        detail: 'Le champ email est invalide',
      }),
    );
  });

  it('devrait retourner 500 avec message generique pour une erreur inconnue en production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const exception = new Error('Database connection failed');

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'Une erreur interne est survenue.',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('devrait inclure le stack trace en mode developpement', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const exception = new Error('Null pointer exception');

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'Null pointer exception',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('devrait formater la reponse en RFC 7807 (type, title, status, detail, instance)', () => {
    const exception = new HttpException('Interdit', HttpStatus.FORBIDDEN);

    filter.catch(exception, host);

    expect(jsonFn).toHaveBeenCalledWith({
      type: 'https://httpstatuses.com/403',
      title: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
      detail: 'Interdit',
      instance: requestUrl,
    });
  });

  it('devrait logger l erreur pour les status >= 500', () => {
    const loggerSpy = jest
      .spyOn(filter['logger'], 'error')
      .mockImplementation();

    const exception = new Error('Unexpected failure');

    filter.catch(exception, host);

    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it('ne devrait pas logger pour les erreurs client (status < 500)', () => {
    const loggerSpy = jest
      .spyOn(filter['logger'], 'error')
      .mockImplementation();

    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(loggerSpy).not.toHaveBeenCalled();
    loggerSpy.mockRestore();
  });

  it('devrait extraire le message depuis un objet de reponse HttpException', () => {
    const exception = new HttpException(
      { message: 'Validation echouee', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Validation echouee',
      }),
    );
  });

  it('devrait gerer un tableau de messages depuis le ValidationPipe', () => {
    const exception = new HttpException(
      {
        message: [
          'property injected should not exist',
          'email must be an email',
        ],
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: [
          'property injected should not exist',
          'email must be an email',
        ],
      }),
    );
  });

  it('devrait gerer une exception non-Error (string)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    filter.catch('something went wrong', host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'something went wrong',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});
