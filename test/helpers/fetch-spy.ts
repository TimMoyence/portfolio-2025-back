export function okJsonResponse(payload: unknown): {
  ok: true;
  json: () => Promise<unknown>;
} {
  return { ok: true, json: () => Promise.resolve(payload) };
}

export function httpErrorResponse(status: number): {
  ok: false;
  status: number;
} {
  return { ok: false, status };
}

export function mockAbortableFetchOnce(fetchSpy: jest.SpyInstance): void {
  fetchSpy.mockImplementationOnce(
    (_url: string, options: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }),
  );
}
