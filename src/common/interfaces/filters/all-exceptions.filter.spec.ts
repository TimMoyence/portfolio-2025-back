import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { MESSAGE_DEPENDANCE_INJOIGNABLE } from './dependency-outage';
import {
  createHttpResponseHost,
  type HoteDeReponseHttp,
} from '../../../../test/factories/execution-context.factory';
import { sousEnvironnement } from '../../../../test/helpers/environnement';
import { attendreProbleme } from '../../../../test/helpers/reponse-probleme';
import { espionnerLeLoggerAChaqueTest } from '../../../../test/helpers/silence-nest-logger';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let hote: HoteDeReponseHttp;

  const requestUrl = '/api/test';

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    hote = createHttpResponseHost(requestUrl);
  });

  const intercepter = (exception: unknown) =>
    filter.catch(exception, hote.host);

  const intercepterSous = (nodeEnv: string, exception: unknown) =>
    sousEnvironnement({ NODE_ENV: nodeEnv }, () =>
      Promise.resolve(intercepter(exception)),
    );

  const erreurs = espionnerLeLoggerAChaqueTest('error');

  it('devrait retourner le status et le message pour une HttpException', () => {
    intercepter(
      new HttpException('Ressource introuvable', HttpStatus.NOT_FOUND),
    );

    attendreProbleme(hote, HttpStatus.NOT_FOUND, {
      detail: 'Ressource introuvable',
    });
  });

  it.each([
    [
      'devrait retourner 500 avec message generique pour une erreur inconnue en production',
      'production',
      'Database connection failed',
      'Une erreur interne est survenue.',
    ],
    [
      'devrait inclure le stack trace en mode developpement',
      'development',
      'Null pointer exception',
      'Null pointer exception',
    ],
  ])('%s', async (_titre, nodeEnv, message, detailAttendu) => {
    await intercepterSous(nodeEnv, new Error(message));

    attendreProbleme(hote, HttpStatus.INTERNAL_SERVER_ERROR, {
      detail: detailAttendu,
    });
  });

  it('devrait rendre 503 et une consigne quand la base est injoignable', () => {
    intercepter(
      Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
        code: 'ECONNREFUSED',
      }),
    );

    attendreProbleme(hote, HttpStatus.SERVICE_UNAVAILABLE, {
      detail: MESSAGE_DEPENDANCE_INJOIGNABLE,
    });
    expect(erreurs()).toHaveBeenCalled();
  });

  const erreurDuParseurDeCorps = (status: number, message: string) =>
    Object.assign(new Error(message), {
      status,
      statusCode: status,
      expose: status < 500,
      type: 'entity.too.large',
    });

  it('rend son statut et son message a une erreur client que le parseur de corps declare exposable', async () => {
    await intercepterSous(
      'production',
      erreurDuParseurDeCorps(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'request entity too large',
      ),
    );

    attendreProbleme(hote, HttpStatus.PAYLOAD_TOO_LARGE, {
      detail: 'request entity too large',
    });
    expect(erreurs()).not.toHaveBeenCalled();
  });

  it.each([
    [
      'une erreur a statut client non declaree exposable',
      Object.assign(new Error('Request failed with status code 404'), {
        status: HttpStatus.NOT_FOUND,
      }),
    ],
    [
      'une erreur serveur declaree par le parseur',
      erreurDuParseurDeCorps(HttpStatus.INTERNAL_SERVER_ERROR, 'stream error'),
    ],
  ])('garde 500 et le message generique pour %s', async (_cas, erreur) => {
    await intercepterSous('production', erreur);

    attendreProbleme(hote, HttpStatus.INTERNAL_SERVER_ERROR, {
      detail: 'Une erreur interne est survenue.',
    });
  });

  it('devrait formater la reponse en RFC 7807 (type, title, status, detail, instance)', () => {
    intercepter(new HttpException('Interdit', HttpStatus.FORBIDDEN));

    expect(hote.jsonFn).toHaveBeenCalledWith({
      type: 'https://httpstatuses.com/403',
      title: 'FORBIDDEN',
      status: HttpStatus.FORBIDDEN,
      detail: 'Interdit',
      instance: requestUrl,
    });
  });

  it.each([
    [
      'devrait logger l erreur pour les status >= 500',
      new Error('Unexpected failure'),
      true,
    ],
    [
      'ne devrait pas logger pour les erreurs client (status < 500)',
      new HttpException('Bad request', HttpStatus.BAD_REQUEST),
      false,
    ],
  ])('%s', (_titre, exception, journalise) => {
    intercepter(exception);

    expect(erreurs().mock.calls.length > 0).toBe(journalise);
  });

  it.each([
    [
      'devrait extraire le message depuis un objet de reponse HttpException',
      'Validation echouee',
    ],
    [
      'devrait gerer un tableau de messages depuis le ValidationPipe',
      ['property injected should not exist', 'email must be an email'],
    ],
  ])('%s', (_titre, message) => {
    intercepter(
      new HttpException(
        { message, error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      ),
    );

    expect(hote.jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ detail: message }),
    );
  });

  it('devrait gerer une exception non-Error (string)', async () => {
    await intercepterSous('development', 'something went wrong');

    expect(hote.statusFn).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(hote.jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 'something went wrong' }),
    );
  });
});
