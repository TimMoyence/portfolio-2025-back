import { DefaultAnthropicChatFactory } from './anthropic-chat.factory';
import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';

describe('DefaultAnthropicChatFactory', () => {
  it('reports disabled when the flag is off', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: false,
        anthropicApiKey: 'sk-ant-test',
      }),
    );

    expect(factory.isEnabled()).toBe(false);
  });

  it('reports disabled when the api key is missing even with flag on', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: true,
        anthropicApiKey: undefined,
      }),
    );

    expect(factory.isEnabled()).toBe(false);
  });

  it('reports enabled when the flag is on and the api key is provided', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: true,
        anthropicApiKey: 'sk-ant-test',
      }),
    );

    expect(factory.isEnabled()).toBe(true);
    expect(factory.model()).toBe('claude-sonnet-4-6');
  });

  it('exposes the configured model override', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: true,
        anthropicApiKey: 'sk-ant-test',
        anthropicModel: 'claude-opus-4-7',
      }),
    );

    expect(factory.model()).toBe('claude-opus-4-7');
  });

  it('throws when create() is called while disabled', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: false,
      }),
    );

    expect(() => factory.create(1000)).toThrow(/disabled/i);
  });

  it('returns an Anthropic client when enabled', () => {
    const factory = new DefaultAnthropicChatFactory(
      buildAuditAutomationConfig({
        enableAnthropicCaching: true,
        anthropicApiKey: 'sk-ant-test',
      }),
    );

    const client = factory.create(5000);
    expect(client).toBeDefined();
    expect(client.messages).toBeDefined();
  });
});
