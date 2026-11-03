import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envListe } from '../../config/environnement/env-readers.util';
import { ConfirmAuditRequestUseCase } from './application/ConfirmAuditRequest.useCase';
import { CreateAuditRequestsUseCase } from './application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from './application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from './application/StreamAuditEvents.useCase';
import { AUDIT_PDF_GENERATOR } from './domain/traitement/IAuditPdfGenerator';
import { SelfAuditGuard } from './domain/demande/SelfAuditGuard';
import {
  AUDIT_AUTOMATION_CONFIG,
  AUDIT_NOTIFIER,
  AUDIT_QUEUE,
  AUDIT_REQUESTS_REPOSITORY,
  AUDIT_SELF_GUARD,
} from './domain/token';
import { AuditRequestsRepositoryTypeORM } from './infrastructure/AuditRequests.repository.typeORM';
import { AuditClientReportMailer } from './infrastructure/mail/rapports/audit-client-report.mailer';
import { AuditExpertReportMailer } from './infrastructure/mail/rapports/audit-expert-report.mailer';
import { AuditConfirmationMailer } from './infrastructure/mail/rapports/audit-confirmation.mailer';
import { AuditNotificationMailer } from './infrastructure/mail/rapports/audit-notification.mailer';
import { AuditNotifierFacade } from './infrastructure/mail/audit-notifier.facade';
import { ExpediteurDAuditProvider } from './infrastructure/mail/expediteur-d-audit.provider';
import { AiHeadersAnalyzerService } from './infrastructure/automation/collecte/ia/ai-headers-analyzer.service';
import { AuditDeliveryOrchestrator } from './infrastructure/automation/pipeline/audit-delivery.orchestrator';
import { AuditPdfGeneratorService } from './infrastructure/automation/rendu/audit-pdf-generator.service';
import { AuditPipelineService } from './infrastructure/automation/pipeline/audit-pipeline.service';
import { AuditQueueService } from './infrastructure/automation/pipeline/audit-queue.service';
import { AuditReportHtmlRendererService } from './infrastructure/automation/rendu/audit-report-html-renderer.service';
import { AuditWorkerService } from './infrastructure/automation/pipeline/audit-worker.service';
import { loadAuditAutomationConfig } from './infrastructure/automation/pipeline/audit.config';
import {
  CHAT_OPENAI_FACTORY,
  DefaultChatOpenAIFactory,
} from './infrastructure/automation/redaction/llm/chat-openai.factory';
import {
  ANTHROPIC_CHAT_FACTORY,
  DefaultAnthropicChatFactory,
} from './infrastructure/automation/redaction/llm/anthropic-chat.factory';
import { CachingSectionRunner } from './infrastructure/automation/redaction/section-generators';
import { CitationWorthinessService } from './infrastructure/automation/collecte/ia/citation-worthiness.service';
import { DeepUrlAnalysisService } from './infrastructure/automation/collecte/page/deep-url-analysis.service';
import { HomepageAnalyzerService } from './infrastructure/automation/collecte/page/homepage-analyzer.service';
import {
  LLM_EXECUTOR,
  SharedLlmExecutor,
} from './infrastructure/automation/redaction/llm/llm-executor.port';
import { LangchainAuditReportService } from './infrastructure/automation/redaction/rapport/langchain-audit-report.service';
import { LangchainClientReportService } from './infrastructure/automation/redaction/rapport/langchain-client-report.service';
import { LlmsTxtAnalyzerService } from './infrastructure/automation/collecte/ia/llms-txt-analyzer.service';
import { PageAiRecapService } from './infrastructure/automation/collecte/page/page-ai-recap.service';
import { SafeFetchService } from './infrastructure/automation/collecte/securite/safe-fetch.service';
import { ScoringService } from './infrastructure/automation/rendu/scoring.service';
import { SitemapDiscoveryService } from './infrastructure/automation/collecte/sitemaps/sitemap-discovery.service';
import { StructuredDataQualityService } from './infrastructure/automation/collecte/page/structured-data-quality.service';
import { UrlIndexabilityService } from './infrastructure/automation/collecte/ia/url-indexability.service';
import { ReportQualityGateService } from './infrastructure/automation/redaction/rapport/report-quality-gate.service';
import { AuditRequestEntity } from './infrastructure/entities/AuditRequest.entity';
import { AuditsController } from './interfaces/Audits.controller';

const AUDIT_REQUESTS_USE_CASES = [
  CreateAuditRequestsUseCase,
  ConfirmAuditRequestUseCase,
  GetAuditSummaryUseCase,
  StreamAuditEventsUseCase,
];

const AUDIT_CRAWL_SERVICES = [
  SafeFetchService,
  HomepageAnalyzerService,
  SitemapDiscoveryService,
  UrlIndexabilityService,
  DeepUrlAnalysisService,
];

const AUDIT_AI_ANALYSIS_SERVICES = [
  LlmsTxtAnalyzerService,
  AiHeadersAnalyzerService,
  CitationWorthinessService,
  StructuredDataQualityService,
];

const AUDIT_SYNTHESIS_SERVICES = [
  ScoringService,
  PageAiRecapService,
  LangchainAuditReportService,
  LangchainClientReportService,
  ReportQualityGateService,
];

const AUDIT_LLM_ABSTRACTIONS = [
  {
    provide: CHAT_OPENAI_FACTORY,
    useClass: DefaultChatOpenAIFactory,
  },
  {
    provide: ANTHROPIC_CHAT_FACTORY,
    useClass: DefaultAnthropicChatFactory,
  },
  CachingSectionRunner,
  {
    provide: LLM_EXECUTOR,
    useClass: SharedLlmExecutor,
  },
];

const AUDIT_ORCHESTRATION_SERVICES = [
  AuditDeliveryOrchestrator,
  AuditPipelineService,
  AuditQueueService,
  AuditWorkerService,
];

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
    ExpediteurDAuditProvider,
    AuditNotificationMailer,
    AuditClientReportMailer,
    AuditExpertReportMailer,
    AuditConfirmationMailer,
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
        const domains = envListe('AUDIT_SELF_DOMAINS');
        return new SelfAuditGuard(
          domains.length > 0 ? domains : ['asilidesign.fr'],
        );
      },
    },
  ],
  exports: [AUDIT_REQUESTS_REPOSITORY, AuditQueueService],
})
export class AuditRequestsModule {}
