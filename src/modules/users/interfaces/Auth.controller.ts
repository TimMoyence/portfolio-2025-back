import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthenticateGoogleUserUseCase } from '../application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import { RefreshTokensUseCase } from '../application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../application/SetPassword.useCase';
import type { IUsersRepository } from '../domain/IUsers.repository';
import { USERS_REPOSITORY } from '../domain/token';
import { AuthMessageResponseDto } from './dto/AuthMessage.response.dto';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import { CreateUserDto } from './dto/CreateUser.dto';
import { ForgotPasswordDto } from './dto/ForgotPassword.dto';
import { GoogleAuthDto } from './dto/GoogleAuth.dto';
import { LoginDto } from './dto/Login.dto';
import { RefreshTokenDto } from './dto/RefreshToken.dto';
import { ResetPasswordDto } from './dto/ResetPassword.dto';
import { SetPasswordDto } from './dto/SetPassword.dto';
import { AuthResponseDto } from './dto/Auth.response.dto';
import { UserResponseDto } from './dto/User.response.dto';
import { Public } from './decorators/public.decorator';

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
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.authenticateUserUseCase.execute(dto);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('google')
  @ApiOperation({ summary: 'Authentification via Google OAuth' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid Google token' })
  async googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponseDto> {
    const result = await this.authenticateGoogleUserUseCase.execute(
      dto.idToken,
    );
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
    };
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
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const result = await this.refreshTokensUseCase.execute(dto.refreshToken);
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Revoque le refresh token (deconnexion)' })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async logout(@Body() dto: RefreshTokenDto): Promise<AuthMessageResponseDto> {
    await this.revokeTokenUseCase.execute(dto.refreshToken);
    return { message: 'Deconnexion reussie.' };
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive user',
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
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Registration failed' })
  async register(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.createUsersUseCase.execute({
      ...dto,
      roles: [],
      updatedOrCreatedBy: 'self-registration',
    });
    return UserResponseDto.fromDomain(result);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async me(@Req() req: Request): Promise<UserResponseDto> {
    const payload = req.user!;
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }
}
