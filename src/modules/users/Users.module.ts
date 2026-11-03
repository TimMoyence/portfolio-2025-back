import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { ValeursDeLEnv } from '../../config/environnement/env.validation';
import { AuthenticateGoogleUserUseCase } from './application/connexion/AuthenticateGoogleUser.useCase';
import { CreateUsersUseCase } from './application/inscription/CreateUsers.useCase';
import { RefreshTokensUseCase } from './application/connexion/RefreshTokens.useCase';
import { RevokeTokenUseCase } from './application/connexion/RevokeToken.useCase';
import { VerifyEmailUseCase } from './application/inscription/VerifyEmail.useCase';
import { ResendVerificationEmailUseCase } from './application/inscription/ResendVerificationEmail.useCase';
import {
  EMAIL_VERIFICATION_NOTIFIER,
  EMAIL_VERIFICATION_TOKENS_REPOSITORY,
  GOOGLE_CLIENT_ID,
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
  REFRESH_TOKENS_REPOSITORY,
  USERS_REPOSITORY,
} from './domain/token';
import { UsersEntity } from './infrastructure/entities/Users.entity';
import { RefreshTokenEntity } from './infrastructure/entities/RefreshToken.entity';
import { PasswordResetTokenEntity } from './infrastructure/entities/PasswordResetToken.entity';
import { EmailVerificationTokenEntity } from './infrastructure/entities/EmailVerificationToken.entity';
import { UsersRepositoryTypeORM } from './infrastructure/Users.repository.typeORM';
import { RefreshTokensRepositoryTypeORM } from './infrastructure/jetons/RefreshTokens.repository.typeORM';
import { PasswordResetTokensRepositoryTypeORM } from './infrastructure/jetons/PasswordResetTokens.repository.typeORM';
import { EmailVerificationTokensRepositoryTypeORM } from './infrastructure/jetons/EmailVerificationTokens.repository.typeORM';
import { AuthAuditLogger } from './application/services/AuthAuditLogger';
import { PasswordService } from './application/services/PasswordService';
import { EnvoiDeVerificationEmail } from './application/services/email-verification-dispatch';
import { EnvoiDeReinitialisation } from './application/services/password-reset-dispatch';
import { JwtTokenService } from './application/services/jetons/JwtTokenService';
import { AuthenticateUserUseCase } from './application/connexion/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from './application/mot-de-passe/ChangePassword.useCase';
import { AuthController } from './interfaces/Auth.controller';
import { JwtAuthGuard } from '../../common/interfaces/auth/jwt-auth.guard';
import { PasswordResetMailerService } from './infrastructure/PasswordResetMailer.service';
import { VerificationMailerService } from './infrastructure/VerificationMailer.service';
import { RequestPasswordResetUseCase } from './application/mot-de-passe/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from './application/mot-de-passe/ResetPassword.useCase';
import { SetPasswordUseCase } from './application/mot-de-passe/SetPassword.useCase';
import { UpdateProfileUseCase } from './application/inscription/UpdateProfile.useCase';
import { GetCurrentUserUseCase } from './application/connexion/GetCurrentUser.useCase';
import { RefreshTokenCleanupService } from './infrastructure/jetons/RefreshTokenCleanup.service';

const USERS_USE_CASES = [
  CreateUsersUseCase,
  AuthenticateUserUseCase,
  AuthenticateGoogleUserUseCase,
  ChangePasswordUseCase,
  RefreshTokensUseCase,
  RevokeTokenUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  SetPasswordUseCase,
  UpdateProfileUseCase,
  GetCurrentUserUseCase,
  VerifyEmailUseCase,
  ResendVerificationEmailUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      PasswordResetTokenEntity,
      RefreshTokenEntity,
      EmailVerificationTokenEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    ...USERS_USE_CASES,
    AuthAuditLogger,
    PasswordService,
    EnvoiDeVerificationEmail,
    EnvoiDeReinitialisation,
    JwtTokenService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersRepositoryTypeORM,
    },
    {
      provide: PASSWORD_RESET_TOKENS_REPOSITORY,
      useClass: PasswordResetTokensRepositoryTypeORM,
    },
    {
      provide: REFRESH_TOKENS_REPOSITORY,
      useClass: RefreshTokensRepositoryTypeORM,
    },
    {
      provide: EMAIL_VERIFICATION_TOKENS_REPOSITORY,
      useClass: EmailVerificationTokensRepositoryTypeORM,
    },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useClass: PasswordResetMailerService,
    },
    {
      provide: EMAIL_VERIFICATION_NOTIFIER,
      useClass: VerificationMailerService,
    },
    {
      provide: GOOGLE_CLIENT_ID,
      useFactory: (config: ConfigService<ValeursDeLEnv>) =>
        config.get<string>('GOOGLE_CLIENT_ID', ''),
      inject: [ConfigService],
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    RefreshTokenCleanupService,
  ],
  exports: [USERS_REPOSITORY, JwtTokenService],
})
export class UsersModule {}
