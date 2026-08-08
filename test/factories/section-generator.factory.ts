import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../src/modules/audit-requests/domain/audit-locale.util';

export interface SectionGeneratorArgs {
  llm: ChatOpenAI;
  payload: Record<string, unknown>;
  locale: AuditLocale;
  compactMode?: boolean;
  retryMode?: boolean;
}

export function createStructuredOutputLlm(): ChatOpenAI {
  return {
    withStructuredOutput: jest.fn().mockReturnValue({ invoke: jest.fn() }),
  } as unknown as ChatOpenAI;
}

export function buildSectionGeneratorArgs(
  overrides: Partial<SectionGeneratorArgs> = {},
): SectionGeneratorArgs {
  return {
    llm: createStructuredOutputLlm(),
    payload: {},
    locale: 'fr',
    ...overrides,
  };
}

export function systemMessagesOf(
  invokeTracked: jest.Mock,
): Array<{ role: string }> {
  const [, messages] = invokeTracked.mock.calls[0] as [
    unknown,
    Array<{ role: string }>,
  ];
  return messages.filter((message) => message.role === 'system');
}
