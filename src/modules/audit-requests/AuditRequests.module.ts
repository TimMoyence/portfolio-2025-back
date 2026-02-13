import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAuditRequestsUseCase } from './application/CreateAuditRequests.useCase';
import { AUDIT_REQUESTS_REPOSITORY } from './domain/token';
import { AuditRequestsRepositoryTypeORM } from './infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestMailerService } from './infrastructure/AuditRequestMailer.service';
import { AuditRequestEntity } from './infrastructure/entities/AuditRequest.entity';
import { AuditRequestsController } from './interfaces/AuditRequests.controller';

const AUDIT_REQUESTS_USE_CASES = [CreateAuditRequestsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([AuditRequestEntity])],
  controllers: [AuditRequestsController],
  providers: [
    ...AUDIT_REQUESTS_USE_CASES,
    AuditRequestMailerService,
    {
      provide: AUDIT_REQUESTS_REPOSITORY,
      useClass: AuditRequestsRepositoryTypeORM,
    },
  ],
  exports: [AUDIT_REQUESTS_REPOSITORY],
})
export class AuditRequestsModule {}
