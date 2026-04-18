import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import { User } from '../domain/User';
import type { LoginCommand } from './dto/Login.command';
import { JwtTokenService } from './services/JwtTokenService';
import { PasswordService } from './services/PasswordService';
import { REFRESH_TOKEN_TTL_MS } from '../domain/auth.constants';

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: User;
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

    if (!user || !user.isActive || !user.passwordHash) {
      // Dummy verify pour egaliser le timing et empecher l'enumeration
      // d'utilisateurs via l'analyse de la duree de reponse du login.
      await this.passwordService.performDummyVerify(dto.password);
      throw new InvalidCredentialsError('Invalid credentials');
    }

    const passwordMatches = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError('Invalid credentials');
    }

    // Rehash transparent si le hash utilise un algorithme obsolete (PBKDF2 → Argon2id)
    if (this.passwordService.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordService.hash(dto.password);
      await this.repo.update(user.id!, { passwordHash: newHash });
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
