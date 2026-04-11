import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticateGoogleUserUseCase } from './application/AuthenticateGoogleUser.useCase';
import { CreateUsersUseCase } from './application/CreateUsers.useCase';
import { DeleteUsersUseCase } from './application/DeleteUsers.useCase';
import { ListUsersUseCase } from './application/ListUsers.useCase';
import { ListOneUserUseCase } from './application/ListOneUser.useCase';
import { RefreshTokensUseCase } from './application/RefreshTokens.useCase';
import { RevokeTokenUseCase } from './application/RevokeToken.useCase';
import { UpdateUsersUseCase } from './application/UpdateUsers.useCase';
import { VerifyEmailUseCase } from './application/VerifyEmail.useCase';
import { ResendVerificationEmailUseCase } from './application/ResendVerificationEmail.useCase';
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
import { RefreshTokensRepositoryTypeORM } from './infrastructure/RefreshTokens.repository.typeORM';
import { PasswordResetTokensRepositoryTypeORM } from './infrastructure/PasswordResetTokens.repository.typeORM';
import { EmailVerificationTokensRepositoryTypeORM } from './infrastructure/EmailVerificationTokens.repository.typeORM';
import { UsersController } from './interfaces/Users.controller';
import { AuthAuditLogger } from './application/services/AuthAuditLogger';
import { PasswordService } from './application/services/PasswordService';
import { JwtTokenService } from './application/services/JwtTokenService';
import { AuthenticateUserUseCase } from './application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from './application/ChangePassword.useCase';
import { AuthController } from './interfaces/Auth.controller';
import { JwtAuthGuard } from '../../common/interfaces/auth/jwt-auth.guard';
import { PasswordResetMailerService } from './infrastructure/PasswordResetMailer.service';
import { VerificationMailerService } from './infrastructure/VerificationMailer.service';
import { RequestPasswordResetUseCase } from './application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from './application/ResetPassword.useCase';
import { SetPasswordUseCase } from './application/SetPassword.useCase';
import { UpdateProfileUseCase } from './application/UpdateProfile.useCase';
import { GetCurrentUserUseCase } from './application/GetCurrentUser.useCase';
import { RefreshTokenCleanupService } from './infrastructure/RefreshTokenCleanup.service';

const USERS_USE_CASES = [
  ListUsersUseCase,
  ListOneUserUseCase,
  CreateUsersUseCase,
  UpdateUsersUseCase,
  DeleteUsersUseCase,
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
  controllers: [UsersController, AuthController],
  providers: [
    ...USERS_USE_CASES,
    AuthAuditLogger,
    PasswordService,
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
      useFactory: (config: ConfigService) =>
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
