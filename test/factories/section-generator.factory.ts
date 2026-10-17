import type { ChatOpenAI } from '@langchain/openai';
import type { AuditLocale } from '../../src/modules/audit-requests/domain/audit-locale.util';
import type { ChatOpenAIFactory } from '../../src/modules/audit-requests/infrastructure/automation/chat-openai.factory';

export interface SectionGeneratorArgs {
  llm: ChatOpenAI;
  payload: Record<string, unknown>;
  locale: AuditLocale;
  compactMode?: boolean;
  retryMode?: boolean;
}

export function createStructuredOutputLlmStub(invoke: jest.Mock = jest.fn()): {
  llm: ChatOpenAI;
  withStructuredOutput: jest.Mock;
} {
  const withStructuredOutput = jest.fn().mockReturnValue({ invoke });
  return {
    llm: { withStructuredOutput } as unknown as ChatOpenAI,
    withStructuredOutput,
  };
}

export function createStructuredOutputLlm(
  invoke: jest.Mock = jest.fn(),
): ChatOpenAI {
  return createStructuredOutputLlmStub(invoke).llm;
}

export function createChatOpenAIFactoryStub(
  llm: ChatOpenAI = createStructuredOutputLlm(),
): jest.Mocked<ChatOpenAIFactory> {
  return { create: jest.fn().mockReturnValue(llm) };
}

export function createChatOpenAIFactoryQuiInvoque(
  invoke: jest.Mock,
): jest.Mocked<ChatOpenAIFactory> {
  return createChatOpenAIFactoryStub(createStructuredOutputLlm(invoke));
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

export function systemMessagesOf(invoke: jest.Mock): Array<{ role: string }> {
  const [messages] = invoke.mock.calls[0] as [Array<{ role: string }>];
  return messages.filter((message) => message.role === 'system');
}
