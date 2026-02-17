import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAuditRequestsUseCase } from './application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from './application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from './application/StreamAuditEvents.useCase';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_REQUESTS_REPOSITORY,
} from './domain/token';
import { AuditRequestsRepositoryTypeORM } from './infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestMailerService } from './infrastructure/AuditRequestMailer.service';
import { loadAuditAutomationConfig } from './infrastructure/automation/audit.config';
import { AuditPipelineService } from './infrastructure/automation/audit-pipeline.service';
import { AuditQueueService } from './infrastructure/automation/audit-queue.service';
import { AuditWorkerService } from './infrastructure/automation/audit-worker.service';
import { HomepageAnalyzerService } from './infrastructure/automation/homepage-analyzer.service';
import { LangchainAuditReportService } from './infrastructure/automation/langchain-audit-report.service';
import { SafeFetchService } from './infrastructure/automation/safe-fetch.service';
import { ScoringService } from './infrastructure/automation/scoring.service';
import { SitemapDiscoveryService } from './infrastructure/automation/sitemap-discovery.service';
import { UrlIndexabilityService } from './infrastructure/automation/url-indexability.service';
import { AuditRequestEntity } from './infrastructure/entities/AuditRequest.entity';
import { AuditsController } from './interfaces/Audits.controller';
import { AuditRequestsController } from './interfaces/AuditRequests.controller';

const AUDIT_REQUESTS_USE_CASES = [
  CreateAuditRequestsUseCase,
  GetAuditSummaryUseCase,
  StreamAuditEventsUseCase,
];

const AUDIT_AUTOMATION_SERVICES = [
  SafeFetchService,
  HomepageAnalyzerService,
  SitemapDiscoveryService,
  UrlIndexabilityService,
  ScoringService,
  LangchainAuditReportService,
  AuditPipelineService,
  AuditQueueService,
  AuditWorkerService,
];

@Module({
  imports: [TypeOrmModule.forFeature([AuditRequestEntity])],
  controllers: [AuditRequestsController, AuditsController],
  providers: [
    ...AUDIT_REQUESTS_USE_CASES,
    ...AUDIT_AUTOMATION_SERVICES,
    AuditRequestMailerService,
    {
      provide: AUDIT_AUTOMATION_CONFIG,
      useFactory: loadAuditAutomationConfig,
    },
    {
      provide: AUDIT_REQUESTS_REPOSITORY,
      useClass: AuditRequestsRepositoryTypeORM,
    },
  ],
  exports: [AUDIT_REQUESTS_REPOSITORY, AuditQueueService],
})
export class AuditRequestsModule {}
