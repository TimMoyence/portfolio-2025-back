import { Sse } from '@nestjs/common';
import { EMPTY, type Observable } from 'rxjs';
import {
  createFakeHttpResponse,
  createHttpExecutionContext,
  type FausseReponseHttp,
} from '../../../../test/factories/execution-context.factory';
import { methodeDe } from '../../../../test/helpers/metadonnees-de-route';
import { aLaFermeture } from './a-la-fermeture';

class ControleurTemoin {
  @Sse('flux')
  flux(): Observable<never> {
    return EMPTY;
  }
}

type EtatDeLaReponse = Partial<
  Pick<FausseReponseHttp, 'writableFinished' | 'destroyed'>
>;

function rappelsApres(
  etat: EtatDeLaReponse,
  fermetures: number,
  handler?: object,
): unknown[][] {
  const reponse = createFakeHttpResponse(etat);
  const rappel = jest.fn();
  aLaFermeture(createHttpExecutionContext({}, reponse, handler), rappel);
  for (let rang = 0; rang < fermetures; rang += 1) reponse.emit('close');
  return rappel.mock.calls;
}

describe('aLaFermeture', () => {
  it('ne rappelle rien tant que la réponse reste ouverte', () => {
    expect(rappelsApres({}, 0)).toEqual([]);
  });

  it.each<[string, EtatDeLaReponse, number, object | undefined, boolean]>([
    ['une réponse terminée, refermée deux fois', {}, 2, undefined, false],
    [
      'une réponse fermée avant d être terminée',
      { writableFinished: false },
      1,
      undefined,
      true,
    ],
    [
      'une réponse déjà fermée, qui n émettra plus close',
      { destroyed: true, writableFinished: false },
      0,
      undefined,
      true,
    ],
    [
      'un flux SSE que le client referme',
      { writableFinished: false },
      1,
      methodeDe(ControleurTemoin, 'flux'),
      false,
    ],
  ])(
    'rappelle une seule fois pour %s',
    (_cas, etat, fermetures, handler, abandonnee) => {
      expect(rappelsApres(etat, fermetures, handler)).toEqual([[abandonnee]]);
    },
  );
});
