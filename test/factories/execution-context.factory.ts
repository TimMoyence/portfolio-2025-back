import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';

export interface HoteDeReponseHttp {
  host: ArgumentsHost;
  jsonFn: jest.Mock;
  statusFn: jest.Mock;
}

export function createHttpResponseHost(url = '/test'): HoteDeReponseHttp {
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

export function createHttpExecutionContext(
  request: unknown = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}
