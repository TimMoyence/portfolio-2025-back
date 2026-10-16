import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export interface HoteDeReponseHttp {
  host: ArgumentsHost;
  jsonFn: jest.Mock;
  statusFn: jest.Mock;
  setHeaderFn: jest.Mock;
}

export function createHttpResponseHost(url = '/test'): HoteDeReponseHttp {
  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const setHeaderFn = jest.fn();
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status: statusFn, setHeader: setHeaderFn }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, jsonFn, statusFn, setHeaderFn };
}

export interface FausseReponseHttp extends EventEmitter {
  statusCode: number;
  writableFinished: boolean;
  destroyed: boolean;
}

export function createFakeHttpResponse(
  etat: Partial<
    Pick<FausseReponseHttp, 'statusCode' | 'writableFinished' | 'destroyed'>
  > = {},
): FausseReponseHttp {
  return Object.assign(new EventEmitter(), {
    statusCode: 200,
    writableFinished: true,
    destroyed: false,
    ...etat,
  });
}

export function createHttpExecutionContext(
  request: unknown = {},
  response: unknown = {},
  handler: object = jest.fn(),
): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getHandler: () => handler,
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

export function createRpcExecutionContext(): ExecutionContext {
  return { getType: () => 'rpc' } as unknown as ExecutionContext;
}
