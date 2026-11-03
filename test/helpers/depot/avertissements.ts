import { flushPromises } from '../temps/flush-promises';
import { espionnerLeLoggerAChaqueTest } from '../http/silence-nest-logger';

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
