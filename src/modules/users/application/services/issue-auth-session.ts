import { InvalidCredentialsError } from '../../../../common/domain/errors/InvalidCredentialsError';
import type { IRefreshTokensRepository } from '../../domain/IRefreshTokens.repository';
import type { RefreshToken } from '../../domain/RefreshToken';
import { emettreJeton, TokenHash } from '../../domain/TokenHash';
import { REFRESH_TOKEN_TTL_MS } from '../../domain/auth.constants';
import type { User } from '../../domain/User';
import type { AuthResult } from '../AuthenticateUser.useCase';
import type { JwtTokenService } from './JwtTokenService';

export async function jetonDeRafraichissementConnu(
  refreshTokensRepo: IRefreshTokensRepository,
  rawRefreshToken: string,
): Promise<RefreshToken> {
  const tokenHash = TokenHash.fromRaw(rawRefreshToken).value;
  const stored = await refreshTokensRepo.findByTokenHash(tokenHash);
  if (!stored) {
    throw new InvalidCredentialsError('Invalid refresh token');
  }
  return stored;
}

export async function issueAuthSession(
  user: User,
  jwtTokenService: JwtTokenService,
  refreshTokensRepo: IRefreshTokensRepository,
): Promise<AuthResult> {
  const { token, expiresIn } = await jwtTokenService.sign({
    sub: user.id,
    email: user.email,
    roles: user.roles ?? [],
  });

  const jeton = emettreJeton();

  await refreshTokensRepo.create({
    userId: user.id!,
    tokenHash: jeton.empreinte,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    revoked: false,
  });

  return {
    accessToken: token,
    expiresIn,
    refreshToken: jeton.brut,
    user,
  };
}
