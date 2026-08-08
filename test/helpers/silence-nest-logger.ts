import { Logger } from '@nestjs/common';

type LoggerMethod = 'log' | 'warn' | 'error' | 'debug' | 'verbose';

export function silenceNestLogger(
  methods: LoggerMethod[] = ['log', 'warn'],
): void {
  let spies: jest.SpyInstance[] = [];

  beforeAll(() => {
    spies = methods.map((method) =>
      jest.spyOn(Logger.prototype, method).mockImplementation(() => undefined),
    );
  });

  afterAll(() => {
    for (const spy of spies) {
      spy.mockRestore();
    }
  });
}
