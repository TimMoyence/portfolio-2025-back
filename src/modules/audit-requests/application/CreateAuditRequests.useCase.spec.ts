import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
/* eslint-disable @typescript-eslint/unbound-method */
import { RateLimitExceededError } from '../../../common/domain/errors/RateLimitExceededError';
import { TokenHash } from '../../../common/domain/crypto/TokenHash';
import { CreateAuditRequestsUseCase } from './CreateAuditRequests.useCase';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import {
  SelfAuditForbiddenError,
  SelfAuditGuard,
} from '../domain/SelfAuditGuard';
import { CreateAuditRequestCommand } from './dto/CreateAuditRequest.command';
import {
  createMockAuditRequestsRepo,
  createMockAuditNotifier,
  createMockAuditQueue,
} from '../../../../test/factories/audit-requests.factory';
import { sectionSurLeDepot } from '../../../../test/factories/verrou-par-boite.factory';
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../test/helpers/avertissements';
import { attendreResultatEtEffetsUniques } from '../../../../test/helpers/effets-uniques';

describe('CreateAuditRequestsUseCase', () => {
  let useCase: CreateAuditRequestsUseCase;
  let repo: jest.Mocked<IAuditRequestsRepository>;
  let queueService: jest.Mocked<IAuditQueuePort>;
  let notifier: jest.Mocked<IAuditNotifierPort>;
  let selfGuard: SelfAuditGuard;
  const avertissements = espionnerLesAvertissements();

  const validCommand: CreateAuditRequestCommand = {
    websiteName: 'example.com',
    contactMethod: 'PHONE',
    contactValue: '+33612345678',
    locale: 'fr',
  };

  const demandeParCourriel: CreateAuditRequestCommand = {
    websiteName: 'https://www.example.com/tarifs?x=1',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    locale: 'en',
  };

  const expectedResponse: AuditRequestResponse = (() => {
    const r = new AuditRequestResponse();
    r.message = "Demande d'audit creee";
    r.auditId = 'audit-123';
    r.status = 'PENDING';
    return r;
  })();

  beforeEach(() => {
    repo = createMockAuditRequestsRepo();
    queueService = createMockAuditQueue();
    notifier = createMockAuditNotifier();
    selfGuard = new SelfAuditGuard(['asilidesign.fr']);
    useCase = new CreateAuditRequestsUseCase(
      repo,
      queueService,
      notifier,
      selfGuard,
    );

    repo.create.mockResolvedValue(expectedResponse);
    queueService.enqueue.mockResolvedValue(undefined);
    notifier.sendAuditNotification.mockResolvedValue(undefined);
  });

  const attendreAucunAuditLance = () => {
    expect(repo.create).not.toHaveBeenCalled();
    expect(queueService.enqueue).not.toHaveBeenCalled();
    expect(notifier.sendAuditNotification).not.toHaveBeenCalled();
  };

  it('devrait creer la demande, la mettre en file d attente et retourner la reponse', async () => {
    const result = await useCase.execute(validCommand);

    attendreResultatEtEffetsUniques(
      result,
      expectedResponse,
      repo.create,
      notifier.sendAuditNotification,
    );
    expect(queueService.enqueue).toHaveBeenCalledWith('audit-123');
  });

  it('devrait retourner la reponse meme si la notification echoue', async () => {
    notifier.sendAuditNotification.mockRejectedValue(new Error('SMTP error'));

    const result = await useCase.execute(validCommand);

    attendreResultatEtEffetsUniques(
      result,
      expectedResponse,
      repo.create,
      queueService.enqueue,
      notifier.sendAuditNotification,
    );
  });

  it('journalise la cause d un échec de notification', async () => {
    notifier.sendAuditNotification.mockRejectedValue(new Error('smtp down'));

    await useCase.execute(validCommand);

    await attendreLAvertissement(
      avertissements,
      'Audit request notification failed: smtp down',
    );
  });

  it('devrait appeler queueService.enqueue avec le bon auditId', async () => {
    const customResponse = new AuditRequestResponse();
    customResponse.message = 'Demande creee';
    customResponse.auditId = 'audit-custom-456';
    customResponse.status = 'PENDING';
    repo.create.mockResolvedValue(customResponse);

    await useCase.execute(validCommand);

    expect(queueService.enqueue).toHaveBeenCalledWith('audit-custom-456');
  });

  describe('demande par courriel : rien ne part avant la confirmation', () => {
    it('cree la demande avec la seule empreinte du jeton, sans la mettre en file', async () => {
      await useCase.execute(demandeParCourriel);

      const [, empreinte] = repo.create.mock.calls[0];
      expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
      expect(queueService.enqueue).not.toHaveBeenCalled();
    });

    it('envoie le lien de confirmation a l adresse saisie, nommant le seul hote du site', async () => {
      await useCase.execute(demandeParCourriel);
      await new Promise<void>((resolve) => setImmediate(resolve));

      const [demande] = notifier.demanderLaConfirmation.mock.calls[0];
      const lien = new URL(demande.lien);
      const [, empreinte] = repo.create.mock.calls[0];
      expect(demande).toMatchObject({
        to: 'test@example.com',
        hote: 'www.example.com',
        locale: 'en',
      });
      expect(lien.pathname).toBe('/en/growth-audit');
      expect(
        TokenHash.fromRaw(lien.searchParams.get('token') ?? '').value,
      ).toBe(empreinte);
    });

    it('cree une demande par telephone sans jeton et la met en file aussitot', async () => {
      await useCase.execute(validCommand);

      expect(repo.create).toHaveBeenCalledWith(expect.anything(), null);
      expect(notifier.demanderLaConfirmation).not.toHaveBeenCalled();
      expect(queueService.enqueue).toHaveBeenCalledWith('audit-123');
    });
  });

  describe('plafond par adresse de contact', () => {
    const UNE_HEURE_MS = 60 * 60 * 1000;

    const refusDe = async (command: CreateAuditRequestCommand) => {
      const refus: unknown = await useCase.execute(command).catch((e) => e);
      expect(refus).toBeInstanceOf(RateLimitExceededError);
      return refus as RateLimitExceededError;
    };

    it('refuse en 429 la quatrieme demande de l heure vers la meme adresse, sans audit, file ni notification', async () => {
      repo.secondesAvantLaSortieDesDemandesVers.mockResolvedValue([
        120.2, 1800, 3000,
      ]);

      await refusDe(validCommand);
      attendreAucunAuditLance();
    });

    it.each([
      [[120.2, 1800, 3000], 121],
      [[5, 60.0001, 1800, 3000], 61],
      [[0.4, 1, 2], 1],
    ])(
      'fait attendre jusqu a la sortie de fenetre de la plus ancienne des trois dernieres demandes (%j s -> Retry-After %i)',
      async (delais, attente) => {
        repo.secondesAvantLaSortieDesDemandesVers.mockResolvedValue(delais);

        const refus = await refusDe(validCommand);

        expect(refus.secondesAvantDeReessayer).toBe(attente);
        expect(refus.message).toBe(
          'Trop de demandes d audit vers cette adresse.',
        );
      },
    );

    it('compte les demandes de la derniere heure vers l adresse de la demande et accepte la troisieme', async () => {
      repo.secondesAvantLaSortieDesDemandesVers.mockResolvedValue([1800, 3000]);

      await expect(useCase.execute(validCommand)).resolves.toEqual(
        expectedResponse,
      );

      expect(repo.secondesAvantLaSortieDesDemandesVers).toHaveBeenCalledTimes(
        1,
      );
      expect(repo.secondesAvantLaSortieDesDemandesVers).toHaveBeenCalledWith(
        validCommand.contactValue,
        UNE_HEURE_MS,
      );
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('compte et cree dans la section verrouillee de la boite, puis met en file et notifie apres sa fin', async () => {
      const depotDeLaSection = createMockAuditRequestsRepo();
      depotDeLaSection.create.mockResolvedValue(expectedResponse);
      repo.sousVerrouDeLaBoite = sectionSurLeDepot(
        () => depotDeLaSection,
        () => {
          expect(queueService.enqueue).not.toHaveBeenCalled();
          expect(notifier.sendAuditNotification).not.toHaveBeenCalled();
        },
      );

      await expect(useCase.execute(validCommand)).resolves.toEqual(
        expectedResponse,
      );

      expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledTimes(1);
      expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledWith(
        validCommand.contactValue,
        expect.any(Function),
      );
      expect(
        depotDeLaSection.secondesAvantLaSortieDesDemandesVers,
      ).toHaveBeenCalledTimes(1);
      expect(depotDeLaSection.create).toHaveBeenCalledTimes(1);
      expect(repo.secondesAvantLaSortieDesDemandesVers).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
      expect(queueService.enqueue).toHaveBeenCalledWith('audit-123');
      expect(notifier.sendAuditNotification).toHaveBeenCalledTimes(1);
    });

    it('verrouille et compte l adresse normalisee par le domaine, pas la saisie brute', async () => {
      await useCase.execute({
        ...demandeParCourriel,
        contactValue: ' Test@Example.COM ',
      });

      expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Function),
      );
      expect(repo.secondesAvantLaSortieDesDemandesVers).toHaveBeenCalledWith(
        'test@example.com',
        UNE_HEURE_MS,
      );
    });
  });

  describe('P0.2 — SelfAuditGuard protection', () => {
    const attendreLeRefusDe = async (websiteName: string) => {
      const selfCommand: CreateAuditRequestCommand = {
        ...validCommand,
        websiteName,
      };

      await expect(useCase.execute(selfCommand)).rejects.toThrow(
        SelfAuditForbiddenError,
      );
      expect(repo.create).not.toHaveBeenCalled();
    };

    it('devrait rejeter un audit sur le domaine self (asilidesign.fr)', async () => {
      await attendreLeRefusDe('asilidesign.fr');
      attendreAucunAuditLance();
    });

    it('devrait rejeter un audit sur un sous-domaine self', async () => {
      await attendreLeRefusDe('https://api.asilidesign.fr/path');
    });

    it('refuse en 400 un site que le pipeline ne sait pas auditer, sans rien lancer', async () => {
      await expect(
        useCase.execute({ ...validCommand, websiteName: 'localhost' }),
      ).rejects.toThrow(new DomainValidationError('Invalid audit website'));
      expect(repo.create).not.toHaveBeenCalled();
      attendreAucunAuditLance();
    });

    it('devrait accepter un audit sur un domaine tiers (example.com)', async () => {
      await expect(useCase.execute(validCommand)).resolves.toEqual(
        expectedResponse,
      );
      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });
});
