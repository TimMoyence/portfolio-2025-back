import { Logger } from '@nestjs/common';

type LoggerMethod = 'log' | 'warn' | 'error' | 'debug' | 'verbose';

export function espionnerLeLogger(
  method: LoggerMethod,
  remplacement: (message: unknown) => void = () => undefined,
): jest.SpyInstance {
  const espion: jest.SpyInstance = jest.spyOn(Logger.prototype, method);
  return espion.mockImplementation(remplacement);
}

export function silenceNestLogger(
  methods: LoggerMethod[] = ['log', 'warn'],
): void {
  let spies: jest.SpyInstance[] = [];

  beforeAll(() => {
    spies = methods.map((method) => espionnerLeLogger(method));
  });

  afterAll(() => {
    for (const spy of spies) {
      spy.mockRestore();
    }
  });
}
