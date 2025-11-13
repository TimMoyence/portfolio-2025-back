import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateRedirectsUseCase } from './application/CreateRedirects.useCase';
import { REDIRECTS_REPOSITORY } from './domain/token';
import { RedirectsEntity } from './infrastructure/entities/Redirects.entity';
import { RedirectsRepositoryTypeORM } from './infrastructure/Redirects.repository.typeORM';
import { RedirectsController } from './interfaces/Redirects.controller';

const REDIRECTS_USE_CASES = [CreateRedirectsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([RedirectsEntity])],
  controllers: [RedirectsController],
  providers: [
    ...REDIRECTS_USE_CASES,
    {
      provide: REDIRECTS_REPOSITORY,
      useClass: RedirectsRepositoryTypeORM,
    },
  ],
  exports: [REDIRECTS_REPOSITORY],
})
export class RedirectsModule {}
