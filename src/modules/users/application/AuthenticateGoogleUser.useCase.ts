import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { Users } from '../domain/Users';
import { GOOGLE_CLIENT_ID, USERS_REPOSITORY } from '../domain/token';
import type { AuthResult } from './AuthenticateUser.useCase';
import { JwtTokenService } from './services/JwtTokenService';
import { UsersMapper } from './mappers/UsersMapper';

/** Roles attribues par defaut a un nouvel utilisateur Google. */
const DEFAULT_GOOGLE_ROLES = ['budget', 'weather', 'sebastian'];

/** Authentifie un utilisateur via son Google ID token (popup GIS). */
@Injectable()
export class AuthenticateGoogleUserUseCase {
  private readonly logger = new Logger(AuthenticateGoogleUserUseCase.name);
  private readonly client: OAuth2Client;

  constructor(
    @Inject(USERS_REPOSITORY) private readonly repo: IUsersRepository,
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
      throw new UnauthorizedException('Google email not verified');
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
      await this.repo.update(byEmail.id!, { googleId } as Partial<Users>);
      byEmail.googleId = googleId;
      return this.signResult(byEmail);
    }

    // 3. Creer un nouveau compte
    const newUser = UsersMapper.fromGoogleAuth({
      email,
      firstName: payload.given_name ?? email.split('@')[0],
      lastName: payload.family_name ?? '',
      googleId,
      roles: DEFAULT_GOOGLE_ROLES,
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
        throw new UnauthorizedException('Invalid Google token');
      }
      return payload;
    } catch (error) {
      this.logger.warn(
        `Google token verification failed (clientId=${this.googleClientId ? 'SET' : 'EMPTY'}): ${String(error)}`,
      );
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /** Verifie que le compte utilisateur est actif. */
  private ensureActive(user: { isActive: boolean }): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Account deactivated');
    }
  }

  /** Signe un JWT et retourne le resultat d'authentification. */
  private signResult(user: Users): AuthResult {
    const { token, expiresIn } = this.jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [],
    });
    return { accessToken: token, expiresIn, user };
  }
}
