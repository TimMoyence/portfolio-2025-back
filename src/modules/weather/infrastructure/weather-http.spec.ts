import type { Logger } from '@nestjs/common';
import type { WeatherProviderHttp } from './weather-http';
import { fetchProviderJson, WeatherProviderTimeoutError } from './weather-http';

const TEST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=48&longitude=2';

function buildHttp(overrides: Partial<WeatherProviderHttp> = {}) {
  const warn = jest.fn();
  const http: WeatherProviderHttp = {
    provider: 'Open-Meteo',
    timeoutMs: 8_000,
    logger: { warn } as unknown as Logger,
    ...overrides,
  };
  return { http, warn };
}

describe('fetchProviderJson', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it('devrait retourner la charge utile JSON quand la reponse est OK', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ city: 'Paris' }),
    });
    const { http, warn } = buildHttp();

    const result = await fetchProviderJson<{ city: string }>(TEST_URL, http);

    expect(result).toEqual({ city: 'Paris' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('devrait nommer le fournisseur dans l erreur HTTP et la journaliser', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 });
    const { http, warn } = buildHttp();

    await expect(fetchProviderJson(TEST_URL, http)).rejects.toThrow(
      'Open-Meteo HTTP 503',
    );
    expect(warn).toHaveBeenCalledWith(
      'Erreur Open-Meteo: Error: Open-Meteo HTTP 503',
    );
  });

  it('devrait convertir un abandon en WeatherProviderTimeoutError', async () => {
    fetchSpy.mockImplementationOnce(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const { http, warn } = buildHttp({
      timeoutTarget: (url) => new URL(url).pathname,
    });

    jest.useFakeTimers();
    const promise = fetchProviderJson(TEST_URL, http);
    jest.advanceTimersByTime(8_001);

    await expect(promise).rejects.toBeInstanceOf(WeatherProviderTimeoutError);
    await expect(promise).rejects.toThrow('Open-Meteo timeout (8000ms)');
    expect(warn).toHaveBeenCalledWith('Timeout apres 8000ms pour /v1/forecast');
  });

  it('devrait journaliser le message reecrit par formatError', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('appel refuse appid=secret'));
    const { http, warn } = buildHttp({
      provider: 'OpenWeatherMap',
      formatError: (error) =>
        error instanceof Error
          ? error.message.replace(/appid=[^&\s]+/g, 'appid=***')
          : 'Unknown error',
    });

    await expect(fetchProviderJson(TEST_URL, http)).rejects.toThrow(
      'appel refuse',
    );
    expect(warn).toHaveBeenCalledWith(
      'Erreur OpenWeatherMap: appel refuse appid=***',
    );
  });
});
