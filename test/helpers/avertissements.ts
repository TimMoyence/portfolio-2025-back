import { Logger } from '@nestjs/common';
import { flushPromises } from './flush-promises';

export function espionnerLesAvertissements(): () => jest.SpyInstance {
  let espion: jest.SpyInstance;
  beforeEach(() => {
    espion = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });
  afterEach(() => espion.mockRestore());
  return () => espion;
}

export async function attendreLAvertissement(
  avertissements: () => jest.SpyInstance,
  message: string,
): Promise<void> {
  await flushPromises();
  expect(avertissements()).toHaveBeenCalledWith(message);
}
