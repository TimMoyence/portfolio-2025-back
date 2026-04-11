import { LeadMagnetRequest } from '../../src/modules/lead-magnets/domain/LeadMagnetRequest';
import type { ILeadMagnetRequestRepository } from '../../src/modules/lead-magnets/domain/ILeadMagnetRequestRepository';
import type { ILeadMagnetNotifier } from '../../src/modules/lead-magnets/domain/ILeadMagnetNotifier';
import type { IToolkitPdfGenerator } from '../../src/modules/lead-magnets/domain/IToolkitPdfGenerator';
import type { IToolkitContentAssembler } from '../../src/modules/lead-magnets/domain/IToolkitContentAssembler';
import type { ToolkitContent } from '../../src/modules/lead-magnets/domain/ToolkitContent';

/** Construit une demande de lead magnet avec des valeurs par defaut. */
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

/** Contenu par defaut pour les mocks de l'assembleur. */
function buildDefaultToolkitContent(): ToolkitContent {
  return {
    recap: {
      firstName: 'Marie',
      aiLevel: null,
      sector: null,
      budgetTier: null,
    },
    cheatsheet: [],
    prompts: [],
    workflows: [],
    templates: [],
    generatedPrompt: null,
  };
}

/** Mock du repository de demandes de lead magnet. */
export function createMockLeadMagnetRequestRepo(): jest.Mocked<ILeadMagnetRequestRepository> {
  const defaultRequest = new LeadMagnetRequest();
  defaultRequest.id = 'test-uuid';
  defaultRequest.firstName = 'Marie';
  defaultRequest.email = 'marie@example.com';
  defaultRequest.formationSlug = 'ia-solopreneurs';
  defaultRequest.termsVersion = '2026-04-10';
  defaultRequest.termsLocale = 'fr';
  defaultRequest.termsAcceptedAt = new Date('2026-04-10T10:00:00Z');
  defaultRequest.accessToken = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  defaultRequest.createdAt = new Date();

  return {
    create: jest.fn().mockResolvedValue(defaultRequest),
    existsRecentByEmail: jest.fn().mockResolvedValue(false),
    findByToken: jest.fn().mockResolvedValue(defaultRequest),
  };
}

/** Mock du notifier de lead magnet. */
export function createMockLeadMagnetNotifier(): jest.Mocked<ILeadMagnetNotifier> {
  return { sendToolkitEmail: jest.fn().mockResolvedValue(undefined) };
}

/** Mock du generateur PDF. */
export function createMockToolkitPdfGenerator(): jest.Mocked<IToolkitPdfGenerator> {
  return { generate: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')) };
}

/** Mock de l'assembleur de contenu personnalise. */
export function createMockToolkitContentAssembler(): jest.Mocked<IToolkitContentAssembler> {
  return {
    assemble: jest.fn().mockReturnValue(buildDefaultToolkitContent()),
  };
}
