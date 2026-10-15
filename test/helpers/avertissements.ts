import { flushPromises } from './flush-promises';
import { espionnerLeLoggerAChaqueTest } from './silence-nest-logger';

export function espionnerLesAvertissements(): () => jest.SpyInstance {
  return espionnerLeLoggerAChaqueTest('warn');
}

export async function attendreLAvertissement(
  avertissements: () => jest.SpyInstance,
  message: string,
): Promise<void> {
  await flushPromises();
  expect(avertissements()).toHaveBeenCalledWith(message);
}
