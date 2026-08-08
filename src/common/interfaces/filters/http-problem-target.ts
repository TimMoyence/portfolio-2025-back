import type { ArgumentsHost } from '@nestjs/common';

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

export function httpProblemTarget(host: ArgumentsHost): {
  response: JsonResponse;
  instance: string;
} {
  const ctx = host.switchToHttp();
  return {
    response: ctx.getResponse<JsonResponse>(),
    instance: ctx.getRequest<{ url: string }>().url,
  };
}
