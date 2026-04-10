/* eslint-disable @typescript-eslint/unbound-method */
import {
  createMockLeadMagnetRequestRepo,
  createMockLeadMagnetNotifier,
  createMockToolkitPdfGenerator,
} from '../../../../../test/factories/lead-magnet-request.factory';
import { RequestToolkitUseCase } from '../RequestToolkit.useCase';
import type { RequestToolkitCommand } from '../dto/RequestToolkit.command';

describe('RequestToolkitUseCase', () => {
  let useCase: RequestToolkitUseCase;
  let repo: ReturnType<typeof createMockLeadMagnetRequestRepo>;
  let notifier: ReturnType<typeof createMockLeadMagnetNotifier>;
  let pdfGenerator: ReturnType<typeof createMockToolkitPdfGenerator>;

  const validCommand: RequestToolkitCommand = {
    firstName: 'Marie',
    email: 'marie@example.com',
    formationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsLocale: 'fr',
    termsAcceptedAt: new Date('2026-04-10T10:00:00Z'),
  };

  beforeEach(() => {
    repo = createMockLeadMagnetRequestRepo();
    notifier = createMockLeadMagnetNotifier();
    pdfGenerator = createMockToolkitPdfGenerator();
    useCase = new RequestToolkitUseCase(repo, notifier, pdfGenerator);
  });

  it('should persist the request and send the email', async () => {
    const result = await useCase.execute(validCommand);

    // Give fire-and-forget time to resolve
    await new Promise((resolve) => setImmediate(resolve));

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(pdfGenerator.generate).toHaveBeenCalledTimes(1);
    expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('marie@example.com');
  });

  it('should skip if recent duplicate exists (< 24h)', async () => {
    repo.existsRecentByEmail.mockResolvedValue(true);
    const result = await useCase.execute(validCommand);

    await new Promise((resolve) => setImmediate(resolve));

    expect(repo.create).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
    expect(notifier.sendToolkitEmail).not.toHaveBeenCalled();
    expect(result.message).toContain('marie@example.com');
  });

  it('should not block on email failure', async () => {
    notifier.sendToolkitEmail.mockRejectedValue(new Error('SMTP down'));
    const result = await useCase.execute(validCommand);

    await new Promise((resolve) => setImmediate(resolve));

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('marie@example.com');
  });

  it('should reject invalid email', async () => {
    await expect(
      useCase.execute({ ...validCommand, email: 'not-an-email' }),
    ).rejects.toThrow();
  });

  it('should reject empty firstName', async () => {
    await expect(
      useCase.execute({ ...validCommand, firstName: '' }),
    ).rejects.toThrow();
  });
});
