import { UnauthorizedException } from '@nestjs/common';
import { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';
import { AuthenticateUserUseCase } from './AuthenticateUser.useCase';
import { LoginDto } from './dto/Login.dto';
import { JwtTokenService } from './services/JwtTokenService';
import { PasswordService } from './services/PasswordService';

describe('AuthenticateUserUseCase', () => {
  let repo: jest.Mocked<IUsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let useCase: AuthenticateUserUseCase;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    passwordService = {
      hash: jest.fn(),
      verify: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<PasswordService>;

    jwtTokenService = {
      sign: jest
        .fn()
        .mockReturnValue({ token: 'jwt-token', expiresIn: 3600, expiresAt: 0 }),
    } as unknown as jest.Mocked<JwtTokenService>;

    useCase = new AuthenticateUserUseCase(
      repo,
      passwordService,
      jwtTokenService,
    );
  });

  it('returns a token when credentials are valid', async () => {
    const user: Users = {
      id: 'user-1',
      email: 'john@example.com',
      passwordHash: 'hashed',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: null,
    };
    repo.findByEmail.mockResolvedValue(user);

    const dto: LoginDto = { email: 'john@example.com', password: 'password' };

    const result = await useCase.execute(dto);

    expect(passwordService.verify).toHaveBeenCalledWith(
      dto.password,
      user.passwordHash,
    );
    expect(jwtTokenService.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
    expect(result).toEqual({ accessToken: 'jwt-token', expiresIn: 3600, user });
  });

  it('throws when credentials are invalid', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when the user is inactive', async () => {
    const inactiveUser: Users = {
      id: 'user-2',
      email: 'inactive@example.com',
      passwordHash: 'hashed',
      firstName: 'Ina',
      lastName: 'Ctive',
      phone: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: null,
    };

    repo.findByEmail.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ email: 'inactive@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwordService.verify).not.toHaveBeenCalled();
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });

  it('throws when the password does not match', async () => {
    const user: Users = {
      id: 'user-3',
      email: 'johnny@example.com',
      passwordHash: 'hashed',
      firstName: 'John',
      lastName: 'Smith',
      phone: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedOrCreatedBy: null,
    };
    repo.findByEmail.mockResolvedValue(user);
    passwordService.verify.mockReturnValue(false);

    await expect(
      useCase.execute({
        email: 'johnny@example.com',
        password: 'bad-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(passwordService.verify).toHaveBeenCalledWith(
      'bad-password',
      user.passwordHash,
    );
    expect(jwtTokenService.sign).not.toHaveBeenCalled();
  });
});
