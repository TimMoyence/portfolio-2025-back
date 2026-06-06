import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthAuditLogger } from '../application/services/AuthAuditLogger';
import { AuthenticateGoogleUserUseCase } from '../application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { RefreshTokensUseCase } from '../application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../application/SetPassword.useCase';
import { UpdateProfileUseCase } from '../application/UpdateProfile.useCase';
import { GetCurrentUserUseCase } from '../application/GetCurrentUser.useCase';
import { VerifyEmailUseCase } from '../application/VerifyEmail.useCase';
import { ResendVerificationEmailUseCase } from '../application/ResendVerificationEmail.useCase';
import {
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from '../domain/auth.constants';
import { AuthMessageResponseDto } from './dto/AuthMessage.response.dto';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { CreateUserDto } from './dto/CreateUser.dto';
import { ForgotPasswordDto } from './dto/ForgotPassword.dto';
import { GoogleAuthDto } from './dto/GoogleAuth.dto';
import { LoginDto } from './dto/Login.dto';
import { ResendVerificationDto } from './dto/ResendVerification.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { SetPasswordDto } from './dto/SetPassword.dto';
import { AuthResponseDto } from './dto/Auth.response.dto';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';
import { UserResponseDto } from './dto/User.response.dto';
import { Public } from '../../../common/interfaces/auth/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly authenticateGoogleUserUseCase: AuthenticateGoogleUserUseCase,
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly revokeTokenUseCase: RevokeTokenUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly setPasswordUseCase: SetPasswordUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase,
    private readonly auditLogger: AuthAuditLogger,
  ) {}

  /** Extrait l'adresse IP depuis la requete HTTP. */
  private extractIp(req: Request): string {
    return req.ip ?? req.headers['x-forwarded-for']?.toString() ?? 'unknown';
  }

  /** Extrait le User-Agent depuis la requete HTTP. */
  private extractUserAgent(req: Request): string {
    return req.headers['user-agent'] ?? 'unknown';
  }

  /**
   * Positionne le cookie HttpOnly contenant le refresh token.
   * Le cookie est restreint au path /auth pour limiter l'envoi automatique.
   */
  private setRefreshCookie(res: Response, refreshToken: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    });
  }

  /** Efface le cookie HttpOnly du refresh token (logout). */
  private clearRefreshCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Connexion par email et mot de passe' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Identifiants invalides' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const ip = this.extractIp(req);
    const userAgent = this.extractUserAgent(req);

    try {
      const result = await this.authenticateUserUseCase.execute(dto);
      this.setRefreshCookie(res, result.refreshToken);
      this.auditLogger.log({
        event: 'LOGIN_SUCCESS',
        email: dto.email,
        userId: result.user.id,
        ip,
        userAgent,
        timestamp: new Date(),
      });
      return AuthResponseDto.fromAuthResult(result);
    } catch (error) {
      this.auditLogger.log({
        event: 'LOGIN_FAILURE',
        email: dto.email,
        ip,
        userAgent,
        timestamp: new Date(),
        details: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('google')
  @ApiOperation({ summary: 'Authentification via Google OAuth' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid Google token' })
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const ip = this.extractIp(req);
    const userAgent = this.extractUserAgent(req);

    try {
      const result = await this.authenticateGoogleUserUseCase.execute(
        dto.idToken,
      );
      this.setRefreshCookie(res, result.refreshToken);
      this.auditLogger.log({
        event: 'GOOGLE_AUTH_SUCCESS',
        email: result.user.email,
        userId: result.user.id,
        ip,
        userAgent,
        timestamp: new Date(),
      });
      return AuthResponseDto.fromAuthResult(result);
    } catch (error) {
      this.auditLogger.log({
        event: 'GOOGLE_AUTH_FAILURE',
        ip,
        userAgent,
        timestamp: new Date(),
        details: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Rafraichit le couple access + refresh token (rotation)',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const ip = this.extractIp(req);
    const userAgent = this.extractUserAgent(req);

    const rawRefreshToken = (
      req.cookies as Record<string, string | undefined>
    )?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie');
    }

    try {
      const result = await this.refreshTokensUseCase.execute(rawRefreshToken);
      this.setRefreshCookie(res, result.refreshToken);
      this.auditLogger.log({
        event: 'TOKEN_REFRESH',
        userId: result.user.id,
        email: result.user.email,
        ip,
        userAgent,
        timestamp: new Date(),
      });
      return AuthResponseDto.fromAuthResult(result);
    } catch (error) {
      this.auditLogger.log({
        event: 'TOKEN_REFRESH_FAILURE',
        ip,
        userAgent,
        timestamp: new Date(),
        details: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Revoque le refresh token (deconnexion)' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthMessageResponseDto> {
    const ip = this.extractIp(req);
    const userAgent = this.extractUserAgent(req);

    const rawRefreshToken = (
      req.cookies as Record<string, string | undefined>
    )?.[REFRESH_TOKEN_COOKIE_NAME];

    if (rawRefreshToken) {
      await this.revokeTokenUseCase.execute(rawRefreshToken);
    }

    this.clearRefreshCookie(res);
    this.auditLogger.log({
      event: 'LOGOUT',
      ip,
      userAgent,
      timestamp: new Date(),
    });
    return { message: 'Deconnexion reussie.' };
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer le mot de passe (utilisateur connecte)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides ou utilisateur inactif',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = req.user!;
    const updatedUser = await this.changePasswordUseCase.execute({
      ...dto,
      userId: user.sub,
    });
    return UserResponseDto.fromDomain(updatedUser);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Envoie un email de reinitialisation de mot de passe',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<AuthMessageResponseDto> {
    return this.requestPasswordResetUseCase.execute(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Reinitialise le mot de passe via un token de reset',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid/expired token',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<AuthMessageResponseDto> {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Post('set-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Definit un mot de passe pour un compte Google-only',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive user',
  })
  @ApiConflictResponse({ description: 'Password is already configured' })
  async setPassword(
    @Body() dto: SetPasswordDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const user = req.user!;
    const updatedUser = await this.setPasswordUseCase.execute({
      ...dto,
      userId: user.sub,
    });
    return UserResponseDto.fromDomain(updatedUser);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({
    summary:
      "Inscription d'un nouvel utilisateur. Un email de verification est envoye.",
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Inscription echouee' })
  async register(@Body() dto: CreateUserDto): Promise<AuthMessageResponseDto> {
    await this.createUsersUseCase.execute({
      ...dto,
      roles: [],
      updatedOrCreatedBy: 'self-registration',
    });
    return {
      message:
        'Inscription reussie. Un email de verification a ete envoye a votre adresse.',
    };
  }

  @Public()
  @Get('verify-email')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: "Verifie l'adresse email via le token envoye" })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token invalide ou expire' })
  @ApiQuery({ name: 'token', required: true, type: String })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<AuthMessageResponseDto> {
    return this.verifyEmailUseCase.execute(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({
    summary: "Renvoie l'email de verification (rate limited 3/h)",
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiBadRequestResponse({ description: 'Trop de demandes' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
  ): Promise<AuthMessageResponseDto> {
    return this.resendVerificationEmailUseCase.execute(dto.email);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mettre a jour le profil de l'utilisateur connecte (self-update)",
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  @ApiUnauthorizedResponse({ description: 'Token invalide ou expire' })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const payload = req.user!;
    const updatedUser = await this.updateProfileUseCase.execute(
      payload.sub,
      dto,
    );
    return UserResponseDto.fromDomain(updatedUser);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Recuperer le profil de l'utilisateur connecte" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token invalide ou expire' })
  async me(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req.user!;
    const user = await this.getCurrentUserUseCase.execute(payload.sub);
    return UserResponseDto.fromDomain(user);
  }
}
