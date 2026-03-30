import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAuditRequestsUseCase } from './application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from './application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from './application/StreamAuditEvents.useCase';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_NOTIFIER,
  AUDIT_QUEUE,
  AUDIT_REQUESTS_REPOSITORY,
} from './domain/token';
import { AuditRequestMailerService } from './infrastructure/AuditRequestMailer.service';
import { AuditRequestsRepositoryTypeORM } from './infrastructure/AuditRequests.repository.typeORM';
import { AuditPipelineService } from './infrastructure/automation/audit-pipeline.service';
import { AuditQueueService } from './infrastructure/automation/audit-queue.service';
import { AuditWorkerService } from './infrastructure/automation/audit-worker.service';
import { loadAuditAutomationConfig } from './infrastructure/automation/audit.config';
import { DeepUrlAnalysisService } from './infrastructure/automation/deep-url-analysis.service';
import { HomepageAnalyzerService } from './infrastructure/automation/homepage-analyzer.service';
import { LangchainAuditReportService } from './infrastructure/automation/langchain-audit-report.service';
import { PageAiRecapService } from './infrastructure/automation/page-ai-recap.service';
import { SafeFetchService } from './infrastructure/automation/safe-fetch.service';
import { ScoringService } from './infrastructure/automation/scoring.service';
import { SitemapDiscoveryService } from './infrastructure/automation/sitemap-discovery.service';
import { UrlIndexabilityService } from './infrastructure/automation/url-indexability.service';
import { ReportQualityGateService } from './infrastructure/automation/report-quality-gate.service';
import { AuditRequestEntity } from './infrastructure/entities/AuditRequest.entity';
import { AuditsController } from './interfaces/Audits.controller';

const AUDIT_REQUESTS_USE_CASES = [
  CreateAuditRequestsUseCase,
  GetAuditSummaryUseCase,
  StreamAuditEventsUseCase,
];

// Crawl & analyse technique
const AUDIT_CRAWL_SERVICES = [
  SafeFetchService,
  HomepageAnalyzerService,
  SitemapDiscoveryService,
  UrlIndexabilityService,
  DeepUrlAnalysisService,
];

// Scoring, IA et synthese
const AUDIT_SYNTHESIS_SERVICES = [
  ScoringService,
  PageAiRecapService,
  LangchainAuditReportService,
  ReportQualityGateService,
];

// Orchestration et queue
const AUDIT_ORCHESTRATION_SERVICES = [
  AuditPipelineService,
  AuditQueueService,
  AuditWorkerService,
];

@Module({
  imports: [TypeOrmModule.forFeature([AuditRequestEntity])],
  controllers: [AuditsController],
  providers: [
    ...AUDIT_REQUESTS_USE_CASES,
    ...AUDIT_CRAWL_SERVICES,
    ...AUDIT_SYNTHESIS_SERVICES,
    ...AUDIT_ORCHESTRATION_SERVICES,
    AuditRequestMailerService,
    {
      provide: AUDIT_AUTOMATION_CONFIG,
      useFactory: loadAuditAutomationConfig,
    },
    {
      provide: AUDIT_REQUESTS_REPOSITORY,
      useClass: AuditRequestsRepositoryTypeORM,
    },
    {
      provide: AUDIT_QUEUE,
      useExisting: AuditQueueService,
    },
    {
      provide: AUDIT_NOTIFIER,
      useExisting: AuditRequestMailerService,
    },
  ],
  exports: [AUDIT_REQUESTS_REPOSITORY, AuditQueueService],
})
export class AuditRequestsModule {}
