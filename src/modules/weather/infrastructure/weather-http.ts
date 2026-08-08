import type { Logger } from '@nestjs/common';

export class WeatherProviderTimeoutError extends Error {
  constructor(provider: string, timeoutMs: number) {
    super(`${provider} timeout (${timeoutMs}ms)`);
  }
}

export interface WeatherProviderHttp {
  provider: string;
  timeoutMs: number;
  logger: Logger;
  timeoutTarget?: (url: string) => string;
  formatError?: (error: unknown) => string;
}

export async function fetchProviderJson<T>(
  url: string,
  http: WeatherProviderHttp,
): Promise<T> {
  try {
    return await fetchJson<T>(url, http.provider, http.timeoutMs);
  } catch (error) {
    http.logger.warn(describeFailure(url, error, http));
    throw error;
  }
}

function describeFailure(
  url: string,
  error: unknown,
  http: WeatherProviderHttp,
): string {
  if (error instanceof WeatherProviderTimeoutError) {
    const target = http.timeoutTarget?.(url) ?? http.provider;
    return `Timeout apres ${http.timeoutMs}ms pour ${target}`;
  }
  return `Erreur ${http.provider}: ${http.formatError?.(error) ?? String(error)}`;
}

async function fetchJson<T>(
  url: string,
  provider: string,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${provider} HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new WeatherProviderTimeoutError(provider, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
