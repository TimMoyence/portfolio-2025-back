import type { ChatOpenAI } from '@langchain/openai';
import type { MetricsService } from '../../src/common/interfaces/metrics/metrics.service';
import type { AuditLocale } from '../../src/modules/audit-requests/domain/audit-locale.util';
import type { ChatOpenAIFactory } from '../../src/modules/audit-requests/infrastructure/automation/chat-openai.factory';
import { createMockMetricsService } from './metrics.factory';

export interface SectionGeneratorArgs {
  llm: ChatOpenAI;
  payload: Record<string, unknown>;
  locale: AuditLocale;
  compactMode?: boolean;
  retryMode?: boolean;
}

export function createStructuredOutputLlm(
  invoke: jest.Mock = jest.fn(),
): ChatOpenAI {
  return {
    withStructuredOutput: jest.fn().mockReturnValue({ invoke }),
  } as unknown as ChatOpenAI;
}

export function createChatOpenAIFactoryStub(
  llm: ChatOpenAI = createStructuredOutputLlm(),
): jest.Mocked<ChatOpenAIFactory> {
  return { create: jest.fn().mockReturnValue(llm) };
}

export function createLlmSuiviStub(invoke: jest.Mock): {
  fabrique: jest.Mocked<ChatOpenAIFactory>;
  metrics: jest.Mocked<MetricsService>;
} {
  return {
    fabrique: createChatOpenAIFactoryStub(createStructuredOutputLlm(invoke)),
    metrics: createMockMetricsService(),
  };
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
