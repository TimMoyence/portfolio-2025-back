import { LeadMagnetRequest } from '../../src/modules/lead-magnets/domain/LeadMagnetRequest';
import type { ILeadMagnetRequestRepository } from '../../src/modules/lead-magnets/domain/ILeadMagnetRequestRepository';
import type { ILeadMagnetNotifier } from '../../src/modules/lead-magnets/domain/ILeadMagnetNotifier';
import type { IToolkitPdfGenerator } from '../../src/modules/lead-magnets/domain/IToolkitPdfGenerator';

export function buildLeadMagnetRequest(
  overrides?: Partial<LeadMagnetRequest>,
): LeadMagnetRequest {
  return LeadMagnetRequest.create({
    firstName: 'Marie',
    email: 'marie@example.com',
    formationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsLocale: 'fr',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
    ...overrides,
  });
}

export function createMockLeadMagnetRequestRepo(): jest.Mocked<ILeadMagnetRequestRepository> {
  return {
    create: jest.fn().mockResolvedValue({
      message: 'Lead magnet request created successfully.',
    }),
    existsRecentByEmail: jest.fn().mockResolvedValue(false),
  };
}

export function createMockLeadMagnetNotifier(): jest.Mocked<ILeadMagnetNotifier> {
  return { sendToolkitEmail: jest.fn().mockResolvedValue(undefined) };
}

export function createMockToolkitPdfGenerator(): jest.Mocked<IToolkitPdfGenerator> {
  return { generate: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')) };
}
