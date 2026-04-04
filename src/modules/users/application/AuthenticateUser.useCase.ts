import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import { Users } from '../domain/Users';
import type { LoginCommand } from './dto/Login.command';
import { JwtTokenService } from './services/JwtTokenService';
import { PasswordService } from './services/PasswordService';

/** Duree de vie par defaut d'un refresh token : 30 jours en millisecondes. */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: Users;
}

/** Authentifie un utilisateur par email/mot de passe et retourne un JWT + refresh token. */
@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: IUsersRepository,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(dto: LoginCommand): Promise<AuthResult> {
    const user = await this.repo.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token, expiresIn } = await this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [],
    });

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = TokenHash.fromRaw(rawRefreshToken).value;

    await this.refreshTokensRepo.create({
      userId: user.id!,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revoked: false,
    });

    return {
      accessToken: token,
      expiresIn,
      refreshToken: rawRefreshToken,
      user,
    };
  }
}
