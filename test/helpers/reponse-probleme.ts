import type { Response } from 'supertest';
import { MESSAGE_D_OCTET_NUL } from '../../src/common/interfaces/http/refus-de-l-octet-nul.pipe';
import type { HoteDeReponseHttp } from '../factories/execution-context.factory';

export const REFUS_DE_L_OCTET_NUL = [400, MESSAGE_D_OCTET_NUL] as const;

export const statutEtDetail = (reponse: Response): readonly unknown[] => [
  reponse.status,
  (reponse.body as { detail: unknown }).detail,
];

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
