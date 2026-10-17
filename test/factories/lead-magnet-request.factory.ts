import { LeadMagnetRequest } from '../../src/modules/lead-magnets/domain/LeadMagnetRequest';
import type { ILeadMagnetRequestRepository } from '../../src/modules/lead-magnets/domain/ILeadMagnetRequestRepository';
import type { ILeadMagnetNotifier } from '../../src/modules/lead-magnets/domain/ILeadMagnetNotifier';
import type { IToolkitPdfGenerator } from '../../src/modules/lead-magnets/domain/IToolkitPdfGenerator';
import type { IToolkitContentAssembler } from '../../src/modules/lead-magnets/domain/IToolkitContentAssembler';
import type { ToolkitContent } from '../../src/modules/lead-magnets/domain/ToolkitContent';
import { sectionSurLeDepot } from './verrou-par-boite.factory';

export function buildLeadMagnetRequest(
  overrides?: Partial<LeadMagnetRequest>,
): LeadMagnetRequest {
  const request = LeadMagnetRequest.create({
    firstName: 'Marie',
    email: 'marie@example.com',
    formationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsLocale: 'fr',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
    ...overrides,
  });
  if (overrides?.accessToken) {
    request.accessToken = overrides.accessToken;
  }
  return request;
}

export function buildToolkitContent(
  overrides: Partial<ToolkitContent> = {},
): ToolkitContent {
  return {
    recap: { firstName: 'Tim' },
    cheatsheet: [
      {
        tool: 'ChatGPT',
        category: 'produire',
        price: 'Gratuit',
        url: 'https://chat.openai.com',
        tip: 'Le couteau suisse',
        decision: 'Brainstormer ou analyser',
      },
    ],
    prompts: [
      {
        category: 'Prospection',
        title: 'Message LinkedIn',
        level: 'debutant',
        prompt: 'Ecris un message pour {{prospect}}',
        tool: 'ChatGPT',
      },
    ],
    workflows: [
      {
        title: 'Prospection automatisee',
        description: 'Detecte les leads LinkedIn',
        setupTime: '2h',
        monthlyCost: 0,
        tools: ['Waalaxy', 'Zapier'],
        steps: [
          {
            step: 1,
            action: 'Capturer le lead',
            tool: 'Waalaxy',
            detail: 'Campagne LinkedIn ciblee',
          },
        ],
      },
    ],
    templates: [
      {
        name: 'CRM Solopreneur',
        platform: 'Notion',
        url: 'https://notion.so/templates/crm',
        description: 'Pipeline de vente complet',
        minBudget: 0,
      },
    ],
    ...overrides,
  };
}

export function createMockLeadMagnetRequestRepo(): jest.Mocked<ILeadMagnetRequestRepository> {
  const defaultRequest = buildLeadMagnetRequest({
    accessToken: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  });
  defaultRequest.id = 'test-uuid';
  defaultRequest.createdAt = new Date();

  const repo: jest.Mocked<ILeadMagnetRequestRepository> = {
    sousVerrouDeLaBoite: sectionSurLeDepot(() => repo),
    create: jest.fn().mockResolvedValue(defaultRequest),
    existeUneDemandeRecenteVersLaBoiteDe: jest.fn().mockResolvedValue(false),
    findByToken: jest.fn().mockResolvedValue(defaultRequest),
  };
  return repo;
}

export function createMockLeadMagnetNotifier(): jest.Mocked<ILeadMagnetNotifier> {
  return { sendToolkitEmail: jest.fn().mockResolvedValue(undefined) };
}

export function createMockToolkitPdfGenerator(): jest.Mocked<IToolkitPdfGenerator> {
  return { generate: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')) };
}

export function createMockToolkitContentAssembler(): jest.Mocked<IToolkitContentAssembler> {
  return {
    assemble: jest.fn().mockReturnValue(buildToolkitContent()),
  };
}
