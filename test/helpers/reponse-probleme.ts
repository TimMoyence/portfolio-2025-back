import type { HoteDeReponseHttp } from '../factories/execution-context.factory';

export function attendreProbleme(
  hote: HoteDeReponseHttp,
  status: number,
  champs: Record<string, unknown> = {},
): void {
  expect(hote.statusFn).toHaveBeenCalledWith(status);
  expect(hote.jsonFn).toHaveBeenCalledWith(
    expect.objectContaining({ status, ...champs }),
  );
}
