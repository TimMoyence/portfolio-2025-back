import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateServicesUseCase } from './application/CreateServices.useCase';
import { SERVICES_REPOSITORY } from './domain/token';
import { ServicesEntity } from './infrastructure/entities/Services.entity';
import { ServicesFaqEntity } from './infrastructure/entities/ServicesFaq.entity';
import { ServicesFaqTranslationEntity } from './infrastructure/entities/ServicesFaqTranslation.entity';
import { ServicesTranslationEntity } from './infrastructure/entities/ServicesTranslation.entity';
import { ServicesRepositoryTypeORM } from './infrastructure/Services.repository.typeORM';
import { ServicesController } from './interfaces/Services.controller';

const SERVICES_USE_CASES = [CreateServicesUseCase];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServicesEntity,
      ServicesTranslationEntity,
      ServicesFaqTranslationEntity,
      ServicesFaqEntity,
    ]),
  ],
  controllers: [ServicesController],
  providers: [
    ...SERVICES_USE_CASES,
    {
      provide: SERVICES_REPOSITORY,
      useClass: ServicesRepositoryTypeORM,
    },
  ],
  exports: [SERVICES_REPOSITORY],
})
export class ServicesModule {}
