import { llmsTxtAbsent } from './AiIndexability';

describe('llmsTxtAbsent', () => {
  it('décrit un llms.txt absent à l adresse donnée, avec la seule raison donnée', () => {
    expect(
      llmsTxtAbsent('https://example.com/llms.txt', 'Fichier llms.txt absent'),
    ).toEqual({
      present: false,
      url: 'https://example.com/llms.txt',
      sizeBytes: 0,
      sections: [],
      hasFullVariant: false,
      complianceScore: 0,
      issues: ['Fichier llms.txt absent'],
    });
  });
});
