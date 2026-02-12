import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateCookieConsentsUseCase } from './application/CreateCookieConsents.useCase';
import { COOKIE_CONSENTS_REPOSITORY } from './domain/token';
import { CookieConsentsRepositoryTypeORM } from './infrastructure/CookieConsents.repository.typeORM';
import { CookieConsentEntity } from './infrastructure/entities/CookieConsent.entity';
import { CookieConsentsController } from './interfaces/CookieConsents.controller';

const COOKIE_CONSENTS_USE_CASES = [CreateCookieConsentsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([CookieConsentEntity])],
  controllers: [CookieConsentsController],
  providers: [
    ...COOKIE_CONSENTS_USE_CASES,
    {
      provide: COOKIE_CONSENTS_REPOSITORY,
      useClass: CookieConsentsRepositoryTypeORM,
    },
  ],
  exports: [COOKIE_CONSENTS_REPOSITORY],
})
export class CookieConsentsModule {}
