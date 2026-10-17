/* eslint-disable @typescript-eslint/unbound-method */
import {
  createMockLeadMagnetRequestRepo,
  createMockLeadMagnetNotifier,
  createMockToolkitPdfGenerator,
  createMockToolkitContentAssembler,
} from '../../../../../test/factories/lead-magnet-request.factory';
import { sectionSurLeDepot } from '../../../../../test/factories/verrou-par-boite.factory';
import { BadRequestException } from '@nestjs/common';
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../../test/helpers/avertissements';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import { RequestToolkitUseCase } from '../RequestToolkit.useCase';
import type { RequestToolkitCommand } from '../dto/RequestToolkit.command';

describe('RequestToolkitUseCase', () => {
  let useCase: RequestToolkitUseCase;
  let repo: ReturnType<typeof createMockLeadMagnetRequestRepo>;
  let notifier: ReturnType<typeof createMockLeadMagnetNotifier>;
  let pdfGenerator: ReturnType<typeof createMockToolkitPdfGenerator>;
  let assembler: ReturnType<typeof createMockToolkitContentAssembler>;
  const avertissements = espionnerLesAvertissements();

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
    assembler = createMockToolkitContentAssembler();
    useCase = new RequestToolkitUseCase(
      repo,
      notifier,
      pdfGenerator,
      assembler,
    );
  });

  const demanderLeToolkit = async () => {
    const result = await useCase.execute(validCommand);
    await flushPromises();

    expect(result.message).toContain('marie@example.com');
    return result;
  };

  it('should persist the request and send the email', async () => {
    const result = await demanderLeToolkit();

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(assembler.assemble).toHaveBeenCalledTimes(1);
    expect(assembler.assemble).toHaveBeenCalledWith('Marie');
    expect(pdfGenerator.generate).toHaveBeenCalledTimes(1);
    expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBeDefined();
  });

  it('should skip if recent duplicate exists (< 24h)', async () => {
    repo.existeUneDemandeRecenteVersLaBoiteDe.mockResolvedValue(true);

    await demanderLeToolkit();

    expect(repo.create).not.toHaveBeenCalled();
    expect(pdfGenerator.generate).not.toHaveBeenCalled();
    expect(notifier.sendToolkitEmail).not.toHaveBeenCalled();
  });

  it('cherche le doublon et cree la demande dans la section verrouillee de la boite, puis genere et envoie apres sa fin', async () => {
    const depotDeLaSection = createMockLeadMagnetRequestRepo();
    repo.sousVerrouDeLaBoite = sectionSurLeDepot(
      () => depotDeLaSection,
      () => {
        expect(assembler.assemble).not.toHaveBeenCalled();
        expect(notifier.sendToolkitEmail).not.toHaveBeenCalled();
      },
    );

    await demanderLeToolkit();

    expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledWith(
      validCommand.email,
      expect.any(Function),
    );
    expect(
      depotDeLaSection.existeUneDemandeRecenteVersLaBoiteDe,
    ).toHaveBeenCalledWith(validCommand.email, validCommand.formationSlug);
    expect(depotDeLaSection.create).toHaveBeenCalledTimes(1);
    expect(repo.existeUneDemandeRecenteVersLaBoiteDe).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
    expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
  });

  it('verrouille la boite de l adresse normalisee, pas la saisie brute', async () => {
    await useCase.execute({ ...validCommand, email: '  Marie@Example.COM ' });

    expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledWith(
      'marie@example.com',
      expect.any(Function),
    );
  });

  it('should not block on email failure', async () => {
    notifier.sendToolkitEmail.mockRejectedValue(new Error('SMTP down'));

    await demanderLeToolkit();

    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('journalise la cause d un échec d envoi de la boîte à outils', async () => {
    notifier.sendToolkitEmail.mockRejectedValue(new Error('smtp down'));

    await demanderLeToolkit();

    await attendreLAvertissement(
      avertissements,
      'Lead magnet email failed: smtp down',
    );
  });

  it('should reject invalid email', async () => {
    await expect(
      useCase.execute({ ...validCommand, email: 'not-an-email' }),
    ).rejects.toThrow(
      new BadRequestException('Invalid lead magnet request email'),
    );
  });

  it('enregistre l email normalise', async () => {
    await useCase.execute({ ...validCommand, email: '  Marie@Example.COM ' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'marie@example.com' }),
    );
  });

  it('should reject empty firstName', async () => {
    await expect(
      useCase.execute({ ...validCommand, firstName: '' }),
    ).rejects.toThrow();
  });
});
