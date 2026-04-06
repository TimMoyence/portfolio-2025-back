import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { TokenHash } from '../domain/TokenHash';
import { User } from '../domain/User';
import {
  GOOGLE_CLIENT_ID,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from '../domain/token';
import { REFRESH_TOKEN_TTL_MS } from '../domain/auth.constants';
import { DEFAULT_SELF_REGISTRATION_ROLES } from '../domain/roles';
import type { AuthResult } from './AuthenticateUser.useCase';
import { JwtTokenService } from './services/JwtTokenService';
import { UsersMapper } from './mappers/UsersMapper';

/** Authentifie un utilisateur via son Google ID token (popup GIS). */
@Injectable()
export class AuthenticateGoogleUserUseCase {
  private readonly logger = new Logger(AuthenticateGoogleUserUseCase.name);
  private readonly client: OAuth2Client;

  constructor(
    @Inject(USERS_REPOSITORY) private readonly repo: IUsersRepository,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: IRefreshTokensRepository,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(GOOGLE_CLIENT_ID) private readonly googleClientId: string,
  ) {
    this.client = new OAuth2Client(this.googleClientId);
  }

  async execute(idToken: string): Promise<AuthResult> {
    const payload = await this.verifyGoogleToken(idToken);
    const googleId = payload.sub;
    const email = payload.email;

    if (!email || !payload.email_verified) {
      throw new InvalidCredentialsError('Google email not verified');
    }

    // 1. Chercher par googleId
    const byGoogleId = await this.repo.findByGoogleId(googleId);
    if (byGoogleId) {
      this.ensureActive(byGoogleId);
      return this.signResult(byGoogleId);
    }

    // 2. Chercher par email → lier le googleId
    const byEmail = await this.repo.findByEmail(email);
    if (byEmail) {
      this.ensureActive(byEmail);
      await this.repo.update(byEmail.id!, { googleId } as Partial<User>);
      byEmail.googleId = googleId;
      return this.signResult(byEmail);
    }

    // 3. Creer un nouveau compte
    const newUser = UsersMapper.fromGoogleAuth({
      email,
      firstName: payload.given_name ?? email.split('@')[0],
      lastName: payload.family_name ?? '',
      googleId,
      roles: DEFAULT_SELF_REGISTRATION_ROLES,
    });
    const created = await this.repo.create(newUser);
    return this.signResult(created);
  }

  /** Verifie le token Google ID et retourne le payload. */
  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new InvalidCredentialsError('Invalid Google token');
      }
      return payload;
    } catch (error) {
      this.logger.warn(
        `Google token verification failed (clientId=${this.googleClientId ? 'SET' : 'EMPTY'}): ${String(error)}`,
      );
      throw new InvalidCredentialsError('Invalid Google token');
    }
  }

  /** Verifie que le compte utilisateur est actif. */
  private ensureActive(user: { isActive: boolean }): void {
    if (!user.isActive) {
      throw new InvalidCredentialsError('Account deactivated');
    }
  }

  /** Signe un JWT, cree un refresh token et retourne le resultat d'authentification. */
  private async signResult(user: User): Promise<AuthResult> {
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
