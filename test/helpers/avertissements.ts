import { flushPromises } from './flush-promises';
import { espionnerLeLogger } from './silence-nest-logger';

export function espionnerLesAvertissements(): () => jest.SpyInstance {
  let espion: jest.SpyInstance;
  beforeEach(() => {
    espion = espionnerLeLogger('warn');
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
