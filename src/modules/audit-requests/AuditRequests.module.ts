import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAuditRequestsUseCase } from './application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from './application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from './application/StreamAuditEvents.useCase';
import { AUDIT_PDF_GENERATOR } from './domain/IAuditPdfGenerator';
import { SelfAuditGuard } from './domain/SelfAuditGuard';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_NOTIFIER,
  AUDIT_QUEUE,
  AUDIT_REQUESTS_REPOSITORY,
  AUDIT_SELF_GUARD,
} from './domain/token';
import { AuditRequestsRepositoryTypeORM } from './infrastructure/AuditRequests.repository.typeORM';
import { AuditClientReportMailer } from './infrastructure/mail/audit-client-report.mailer';
import { AuditExpertReportMailer } from './infrastructure/mail/audit-expert-report.mailer';
import { AuditNotificationMailer } from './infrastructure/mail/audit-notification.mailer';
import { AuditNotifierFacade } from './infrastructure/mail/audit-notifier.facade';
import { SmtpTransporterProvider } from './infrastructure/mail/smtp-transporter.provider';
import { AiHeadersAnalyzerService } from './infrastructure/automation/ai-headers-analyzer.service';
import { AuditDeliveryOrchestrator } from './infrastructure/automation/audit-delivery.orchestrator';
import { AuditPdfGeneratorService } from './infrastructure/automation/audit-pdf-generator.service';
import { AuditPipelineService } from './infrastructure/automation/audit-pipeline.service';
import { AuditQueueService } from './infrastructure/automation/audit-queue.service';
import { AuditReportHtmlRendererService } from './infrastructure/automation/audit-report-html-renderer.service';
import { AuditWorkerService } from './infrastructure/automation/audit-worker.service';
import { loadAuditAutomationConfig } from './infrastructure/automation/audit.config';
import {
  CHAT_OPENAI_FACTORY,
  DefaultChatOpenAIFactory,
} from './infrastructure/automation/chat-openai.factory';
import { CitationWorthinessService } from './infrastructure/automation/citation-worthiness.service';
import { DeepUrlAnalysisService } from './infrastructure/automation/deep-url-analysis.service';
import { HomepageAnalyzerService } from './infrastructure/automation/homepage-analyzer.service';
import {
  LLM_EXECUTOR,
  SharedLlmExecutor,
} from './infrastructure/automation/llm-executor.port';
import { LangchainAuditReportService } from './infrastructure/automation/langchain-audit-report.service';
import { LangchainClientReportService } from './infrastructure/automation/langchain-client-report.service';
import { LlmsTxtAnalyzerService } from './infrastructure/automation/llms-txt-analyzer.service';
import { PageAiRecapService } from './infrastructure/automation/page-ai-recap.service';
import { SafeFetchService } from './infrastructure/automation/safe-fetch.service';
import { ScoringService } from './infrastructure/automation/scoring.service';
import { SitemapDiscoveryService } from './infrastructure/automation/sitemap-discovery.service';
import { StructuredDataQualityService } from './infrastructure/automation/structured-data-quality.service';
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

// Analyse IA / indexabilité multi-moteurs (Phase 2/3)
const AUDIT_AI_ANALYSIS_SERVICES = [
  LlmsTxtAnalyzerService,
  AiHeadersAnalyzerService,
  CitationWorthinessService,
  StructuredDataQualityService,
];

// Scoring, IA et synthese
const AUDIT_SYNTHESIS_SERVICES = [
  ScoringService,
  PageAiRecapService,
  LangchainAuditReportService,
  LangchainClientReportService,
  ReportQualityGateService,
];

// Abstractions LLM partagees (C4a) — factory ChatOpenAI + limiter d'execution
const AUDIT_LLM_ABSTRACTIONS = [
  {
    provide: CHAT_OPENAI_FACTORY,
    useClass: DefaultChatOpenAIFactory,
  },
  {
    provide: LLM_EXECUTOR,
    useClass: SharedLlmExecutor,
  },
];

// Orchestration et queue
const AUDIT_ORCHESTRATION_SERVICES = [
  AuditDeliveryOrchestrator,
  AuditPipelineService,
  AuditQueueService,
  AuditWorkerService,
];

// Generation PDF (rapport Growth Audit)
const AUDIT_PDF_SERVICES = [
  AuditReportHtmlRendererService,
  AuditPdfGeneratorService,
];

@Module({
  imports: [TypeOrmModule.forFeature([AuditRequestEntity])],
  controllers: [AuditsController],
  providers: [
    ...AUDIT_REQUESTS_USE_CASES,
    ...AUDIT_CRAWL_SERVICES,
    ...AUDIT_AI_ANALYSIS_SERVICES,
    ...AUDIT_SYNTHESIS_SERVICES,
    ...AUDIT_LLM_ABSTRACTIONS,
    ...AUDIT_ORCHESTRATION_SERVICES,
    ...AUDIT_PDF_SERVICES,
    SmtpTransporterProvider,
    AuditNotificationMailer,
    AuditClientReportMailer,
    AuditExpertReportMailer,
    AuditNotifierFacade,
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
      useExisting: AuditNotifierFacade,
    },
    {
      provide: AUDIT_PDF_GENERATOR,
      useExisting: AuditPdfGeneratorService,
    },
    {
      provide: AUDIT_SELF_GUARD,
      useFactory: (): SelfAuditGuard => {
        const raw = process.env.AUDIT_SELF_DOMAINS?.trim();
        const domains = raw
          ? raw
              .split(',')
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
          : ['asilidesign.fr'];
        return new SelfAuditGuard(domains);
      },
    },
  ],
  exports: [AUDIT_REQUESTS_REPOSITORY, AuditQueueService],
})
export class AuditRequestsModule {}
