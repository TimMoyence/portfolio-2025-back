import type { ExecutionContext } from '@nestjs/common';

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
