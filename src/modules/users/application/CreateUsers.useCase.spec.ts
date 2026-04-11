/* eslint-disable @typescript-eslint/unbound-method */
import type { ConfigService } from '@nestjs/config';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import type { IEmailVerificationTokensRepository } from '../domain/IEmailVerificationTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { CreateUsersUseCase } from './CreateUsers.useCase';
import type { CreateUserCommand } from './dto/CreateUser.command';
import type { PasswordService } from './services/PasswordService';
import {
  buildUser,
  createMockUsersRepo,
  createMockPasswordService,
} from '../../../../test/factories/user.factory';
import { createMockEmailVerificationTokensRepo } from '../../../../test/factories/email-verification-token.factory';

function createMockConfigService(): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockReturnValue('https://asilidesign.fr/verify-email'),
  } as unknown as jest.Mocked<ConfigService>;
}

function createMockEmailVerificationNotifier(): jest.Mocked<IEmailVerificationNotifier> {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };
}

describe('CreateUsersUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let emailVerificationTokensRepo: jest.Mocked<IEmailVerificationTokensRepository>;
  let emailVerificationNotifier: jest.Mocked<IEmailVerificationNotifier>;
  let passwordService: jest.Mocked<PasswordService>;
  let configService: jest.Mocked<ConfigService>;
  let useCase: CreateUsersUseCase;

  beforeEach(() => {
    repo = createMockUsersRepo();
    emailVerificationTokensRepo = createMockEmailVerificationTokensRepo();
    emailVerificationNotifier = createMockEmailVerificationNotifier();
    passwordService = createMockPasswordService();
    configService = createMockConfigService();
    passwordService.hash.mockResolvedValue('hashed-password');
    emailVerificationTokensRepo.create.mockResolvedValue({
      id: 'evt-1',
      userId: 'uuid',
      token: 'token',
      expiresAt: new Date(),
    });

    useCase = new CreateUsersUseCase(
      repo,
      emailVerificationTokensRepo,
      emailVerificationNotifier,
      passwordService,
      configService,
    );
  });

  it('maps the DTO and persists the user', async () => {
    const dto: CreateUserCommand = {
      email: 'john@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const savedUser = buildUser({
      id: 'uuid',
      email: dto.email,
      passwordHash: 'hashed-password',
      firstName: dto.firstName,
      lastName: dto.lastName,
      updatedOrCreatedBy: 'self-registration',
    });
    repo.create.mockResolvedValue(savedUser);

    const result = await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        passwordHash: 'hashed-password',
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: null,
        isActive: true,
        updatedOrCreatedBy: 'self-registration',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
    expect(passwordService.hash).toHaveBeenCalledWith(dto.password);
    expect(result).toBe(savedUser);
  });

  it('devrait envoyer un email de verification pour les inscriptions publiques', async () => {
    const dto: CreateUserCommand = {
      email: 'new@example.com',
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'User',
    };

    const savedUser = buildUser({
      id: 'uuid',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerified: false,
    });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(emailVerificationTokensRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'uuid',
        token: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(
      emailVerificationNotifier.sendVerificationEmail,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        firstName: 'New',
        lastName: 'User',
        verificationUrl: expect.stringContaining('token='),
        expiresInMinutes: 1440,
      }),
    );
  });

  it('devrait creer le compte sans roles pour les inscriptions publiques (roles attribues apres verification)', async () => {
    const dto: CreateUserCommand = {
      email: 'attacker@example.com',
      password: 'Hack123!',
      firstName: 'Evil',
      lastName: 'User',
      roles: ['admin', 'budget'],
    };

    const savedUser = buildUser({
      email: dto.email,
      roles: [],
      emailVerified: false,
    });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [],
      }),
    );
  });

  it('devrait conserver les roles quand cree par un admin', async () => {
    const dto: CreateUserCommand = {
      email: 'new@example.com',
      password: 'Secure123!',
      firstName: 'New',
      lastName: 'User',
      roles: ['budget', 'weather'],
      updatedOrCreatedBy: 'admin-user-id',
    };

    const savedUser = buildUser({
      email: dto.email,
      roles: ['budget', 'weather'],
    });
    repo.create.mockResolvedValue(savedUser);

    await useCase.execute(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['budget', 'weather'] }),
    );
    // Pas d'email de verification pour les comptes admin
    expect(
      emailVerificationNotifier.sendVerificationEmail,
    ).not.toHaveBeenCalled();
  });
});
