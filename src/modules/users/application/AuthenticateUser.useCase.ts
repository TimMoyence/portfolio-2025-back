import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../domain/IRefreshTokens.repository';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { REFRESH_TOKENS_REPOSITORY, USERS_REPOSITORY } from '../domain/token';
import type { User } from '../domain/User';
import { CasDUsageMotDePasse } from './CasDUsageUtilisateurs';
import type { LoginCommand } from './dto/Login.command';
import { issueAuthSession } from './services/issue-auth-session';
import { JwtTokenService } from './services/JwtTokenService';
import { PasswordService } from './services/PasswordService';

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: User;
}

@Injectable()
export class AuthenticateUserUseCase extends CasDUsageMotDePasse {
  constructor(
    @Inject(USERS_REPOSITORY)
    repo: IUsersRepository,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    refreshTokensRepo: IRefreshTokensRepository,
    passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
  ) {
    super(repo, passwordService, refreshTokensRepo);
  }

  async execute(dto: LoginCommand): Promise<AuthResult> {
    const user = await this.repo.findByEmail(dto.email);

    if (!user || !user.isActive || !user.passwordHash) {
      await this.passwordService.equalizeVerifyTiming(dto.password);
      throw new InvalidCredentialsError('Invalid credentials');
    }

    const passwordMatches = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError('Invalid credentials');
    }

    if (this.passwordService.needsRehash(user.passwordHash)) {
      await this.enregistrerMotDePasse(user, dto.password, 'password-rehash');
    }

    return issueAuthSession(user, this.jwtTokenService, this.refreshTokensRepo);
  }
}
