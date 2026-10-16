import type { ModuleMetadata } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AUDIT_REQUESTS_REPOSITORY } from '../src/modules/audit-requests/domain/token';
import type { AuditSnapshot } from '../src/modules/audit-requests/domain/AuditProcessing';
import { CreateAuditRequestsUseCase } from '../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../src/modules/audit-requests/application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../src/modules/audit-requests/application/StreamAuditEvents.useCase';
import { LangchainClientReportService } from '../src/modules/audit-requests/infrastructure/automation/langchain-client-report.service';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { ARTICLES_REPOSITORY } from '../src/modules/articles/application/articles.repository';
import type { ArticleWrite } from '../src/modules/articles/application/articles.repository';
import { ArticlesService } from '../src/modules/articles/application/articles.service';
import type { ArticleIngestEnvelope } from '../src/modules/articles/domain/article-contract';
import { ArticleHmacGuard } from '../src/modules/articles/interfaces/article-hmac.guard';
import { ArticlesController } from '../src/modules/articles/interfaces/articles.controller';
import { validArticleIngestEnvelope } from '../src/modules/articles/testing/article-ingest.fixture';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { RequestToolkitUseCase } from '../src/modules/lead-magnets/application/RequestToolkit.useCase';
import { GetToolkitByTokenUseCase } from '../src/modules/lead-magnets/application/queries/GetToolkitByToken.useCase';
import type { InteractionProfile } from '../src/modules/lead-magnets/domain/InteractionProfile';
import {
  LEAD_MAGNET_NOTIFIER,
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
  TOOLKIT_PDF_GENERATOR,
} from '../src/modules/lead-magnets/domain/token';
import { ToolkitContentAssemblerService } from '../src/modules/lead-magnets/infrastructure/ToolkitContentAssembler.service';
import { LeadMagnetsController } from '../src/modules/lead-magnets/interfaces/LeadMagnets.controller';
import { GetPresentationInteractionsUseCase } from '../src/modules/presentations/application/GetPresentationInteractions.useCase';
import { PRESENTATIONS_REPOSITORY } from '../src/modules/presentations/domain/token';
import { PresentationsRepositoryInMemory } from '../src/modules/presentations/infrastructure/Presentations.repository.inMemory';
import { PresentationsController } from '../src/modules/presentations/interfaces/Presentations.controller';
import {
  buildArticleRecord,
  createMockArticlesRepository,
} from './factories/article.factory';
import { buildAuditAutomationConfig } from './factories/audit-config.factory';
import {
  buildAuditSnapshot,
  buildClientReportContext,
  createMockAuditRequestsRepo,
} from './factories/audit-requests.factory';
import {
  coreControllerProviders,
  createCoreUseCaseStubs,
  primeCoreUseCaseStubs,
} from './factories/core-api.factory';
import { buildChoixDeConsentement } from './factories/cookie-consents.factory';
import {
  buildLeadMagnetRequest,
  createMockLeadMagnetNotifier,
  createMockLeadMagnetRequestRepo,
  createMockToolkitPdfGenerator,
} from './factories/lead-magnet-request.factory';
import { createChatOpenAIFactoryStub } from './factories/section-generator.factory';
import {
  applicationDeLaSuite,
  bootstrapTestApp,
  serveurHttpDe,
} from './helpers/nest-test-app';
import { silenceNestLogger } from './helpers/silence-nest-logger';
import { lecteurDeTrames } from './helpers/trames-sse';

const AUDIT_SUIVI = '00000000-0000-4000-a000-000000000001';
const JETON_DU_GUIDE = '550e8400-e29b-41d4-a716-446655440000';
const BATTEMENT_MS = 15_000;
const DUREE_MAX_DU_FLUX_MS = 30 * 60 * 1000;
const SAISIE_HUMAINE_MS = 5_000;

const ARTICLE_DE_L_EDITION: ArticleIngestEnvelope = {
  ...validArticleIngestEnvelope,
  article: {
    ...validArticleIngestEnvelope.article,
    sections: [
      {
        ...validArticleIngestEnvelope.article.sections[0],
        items: [
          {
            entity: 'Laboratoire',
            text: 'Un fait de la veille, daté par sa source et relevé ce matin.',
            source: 'Source',
            url: 'https://example.com/fait-date',
            published_at: '2026-09-08T10:00:00.000Z',
            retrieved_at: '2026-09-09T05:00:00.000Z',
          },
          {
            entity: 'Editeur',
            text: 'Un fait de la veille dont la source ne donne aucune date.',
            source: 'Source',
            url: 'https://example.com/fait-sans-date',
          },
        ],
      },
    ],
    sources: [
      ...validArticleIngestEnvelope.article.sources,
      {
        name: 'Source datee',
        url: 'https://example.com/source-datee',
        published_at: '2026-09-08T10:00:00.000Z',
        retrieved_at: '2026-09-09T05:00:00.000Z',
      },
    ],
    seo: {
      ...validArticleIngestEnvelope.article.seo,
      image_url: 'https://example.com/couverture.webp',
      image_alt: 'Couverture de l edition',
    },
  },
};

const PROFIL_DEBUTANT_SANS_BUDGET: InteractionProfile = {
  aiLevel: 'debutant',
  toolsAlreadyUsed: ['chatgpt'],
  budgetTier: '0',
  sector: 'conseil',
  generatedPrompt: 'Tu es mon assistant de prospection.',
};

function serveurDeLaSuite(
  metadata: ModuleMetadata,
): () => ReturnType<typeof serveurHttpDe> {
  const app = applicationDeLaSuite(async () =>
    bootstrapTestApp(await Test.createTestingModule(metadata).compile()),
  );
  return () => serveurHttpDe(app());
}

async function ecritureDeLArticle(
  envelope: ArticleIngestEnvelope,
): Promise<ArticleWrite> {
  const depot = createMockArticlesRepository();
  depot.findDeliveryByDeliveryOrIdempotency.mockResolvedValue(null);
  depot.findDeliveryByNonce.mockResolvedValue(null);
  await new ArticlesService(depot).ingest(envelope, 'idempotence-1', 'nonce-1');
  const [ecrite] = depot.saveArticleAndDelivery.mock.calls[0];
  return ecrite;
}

describe('Reponses du site public servies par les vrais controleurs', () => {
  const coreStubs = createCoreUseCaseStubs();
  const articles = createMockArticlesRepository();
  const demandes = createMockLeadMagnetRequestRepo();

  const serveur = serveurDeLaSuite({
    controllers: [
      CookieConsentsController,
      ArticlesController,
      PresentationsController,
      LeadMagnetsController,
    ],
    providers: [
      ...coreControllerProviders(coreStubs),
      ArticlesService,
      ArticleHmacGuard,
      { provide: ARTICLES_REPOSITORY, useValue: articles },
      GetPresentationInteractionsUseCase,
      {
        provide: PRESENTATIONS_REPOSITORY,
        useClass: PresentationsRepositoryInMemory,
      },
      RequestToolkitUseCase,
      GetToolkitByTokenUseCase,
      { provide: LEAD_MAGNET_REQUEST_REPOSITORY, useValue: demandes },
      {
        provide: LEAD_MAGNET_NOTIFIER,
        useValue: createMockLeadMagnetNotifier(),
      },
      {
        provide: TOOLKIT_PDF_GENERATOR,
        useValue: createMockToolkitPdfGenerator(),
      },
      {
        provide: TOOLKIT_CONTENT_ASSEMBLER,
        useClass: ToolkitContentAssemblerService,
      },
    ],
  });

  beforeEach(async () => {
    primeCoreUseCaseStubs(coreStubs);
    const ecrite = await ecritureDeLArticle(ARTICLE_DE_L_EDITION);
    articles.listPublished.mockResolvedValue([
      buildArticleRecord(ecrite),
      buildArticleRecord({ ...ecrite, id: 'record-2' }),
    ]);
    articles.findPublishedBySlug.mockResolvedValue(buildArticleRecord(ecrite));
  });

  it('POST /api/cookie-consents enregistre le choix du visiteur', async () => {
    const reponse = await request(serveur())
      .post('/api/cookie-consents')
      .send(buildChoixDeConsentement())
      .expect(201);

    expect(reponse.body).toMatchObject({ httpCode: 201 });
  });

  it('GET /api/articles sert une page d articles complets et le curseur de la suivante', async () => {
    const reponse = await request(serveur())
      .get('/api/articles?locale=fr&limit=1')
      .expect(200);

    expect(reponse.body).toMatchObject({
      items: [{ slug: 'morning-brief-2026-09-09' }],
      next_cursor: expect.any(String) as string,
    });
  });

  it('GET /api/articles/:slug sert l article publie, ses rubriques et ses sources', async () => {
    const reponse = await request(serveur())
      .get('/api/articles/morning-brief-2026-09-09?locale=fr')
      .expect(200);

    expect(reponse.body).toMatchObject({
      slug: 'morning-brief-2026-09-09',
      sources: ARTICLE_DE_L_EDITION.article.sources,
    });
  });

  it('GET /api/presentations/:slug/interactions sert les interactions de chaque diapo', async () => {
    const reponse = await request(serveur())
      .get('/api/presentations/ia-solopreneurs/interactions')
      .expect(200);

    expect(reponse.body).toMatchObject({ slug: 'ia-solopreneurs' });
  });

  it.each([
    ['rend le jeton du guide a une premiere demande', false, true],
    ['ne rend aucun jeton a une demande repetee dans les 24 h', true, false],
  ])(
    'POST /api/lead-magnets/formations-toolkit %s',
    async (_cas, dejaDemande, jetonRendu) => {
      demandes.existeUneDemandeRecenteVersLaBoiteDe.mockResolvedValueOnce(
        dejaDemande,
      );

      const reponse = await request(serveur())
        .post('/api/lead-magnets/formations-toolkit')
        .send(demandeDuGuide())
        .expect(201);

      expect(Object.hasOwn(reponse.body as object, 'accessToken')).toBe(
        jetonRendu,
      );
    },
  );

  it.each([
    ['sans profil', undefined],
    ['avec le profil saisi', PROFIL_DEBUTANT_SANS_BUDGET],
  ])(
    'GET /api/lead-magnets/toolkit/:token sert le guide %s',
    async (_cas, profile) => {
      demandes.findByToken.mockResolvedValueOnce(
        buildLeadMagnetRequest({ profile }),
      );

      const reponse = await request(serveur())
        .get(`/api/lead-magnets/toolkit/${JETON_DU_GUIDE}`)
        .expect(200);

      expect(reponse.body).toMatchObject({
        generatedPrompt: profile?.generatedPrompt ?? null,
      });
    },
  );
});

function demandeDuGuide() {
  return {
    formStartedAt: Date.now() - SAISIE_HUMAINE_MS,
    firstName: 'Marie',
    email: 'marie@example.com',
    formationSlug: 'ia-solopreneurs',
    termsVersion: '2026-04-10',
    termsLocale: 'fr',
    termsAcceptedAt: '2026-04-10T10:00:00.000Z',
    profile: { aiLevel: 'debutant', budgetTier: '0' },
  };
}

describe('Flux SSE d un audit servi par le vrai cas d usage', () => {
  silenceNestLogger();

  const coreStubs = createCoreUseCaseStubs();
  const audits = createMockAuditRequestsRepo();

  const serveur = serveurDeLaSuite({
    controllers: [AuditsController],
    providers: [
      {
        provide: CreateAuditRequestsUseCase,
        useValue: coreStubs.createAuditRequestsUseCase,
      },
      {
        provide: GetAuditSummaryUseCase,
        useValue: coreStubs.getAuditSummaryUseCase,
      },
      StreamAuditEventsUseCase,
      { provide: AUDIT_REQUESTS_REPOSITORY, useValue: audits },
    ],
  });
  const cheminDuFlux = `/api/audits/${AUDIT_SUIVI}/stream`;

  function evenementsDe(texte: string): string[] {
    return lecteurDeTrames()(texte).map(({ type }) => type);
  }

  afterEach(() => {
    jest.useRealTimers();
    audits.findById.mockReset();
  });

  it.each([
    ['avant que le rapport client soit persiste', null],
    ['apres la persistance du rapport client', 'rapport'],
  ] as const)(
    'clot le flux sur l evenement completed %s',
    async (_cas, rapport) => {
      const clientReport =
        rapport === null
          ? null
          : await new LangchainClientReportService(
              buildAuditAutomationConfig({ openAiApiKey: undefined }),
              createChatOpenAIFactoryStub(),
            ).generate(buildClientReportContext());
      audits.findById.mockResolvedValue(
        buildAuditSnapshot({
          id: AUDIT_SUIVI,
          processingStatus: 'COMPLETED',
          progress: 100,
          done: true,
          summaryText: 'Synthese de l audit',
          quickWins: ['Ajouter des meta descriptions'],
          pillarScores: { seo: 62, performance: 55 },
          clientReport,
        }),
      );

      const reponse = await request(serveur()).get(cheminDuFlux).expect(200);

      expect(evenementsDe(reponse.text)).toEqual(['completed']);
    },
  );

  it.each([
    ['un audit en echec', buildAuditSnapshot({ processingStatus: 'FAILED' })],
    ['un audit introuvable', null],
  ])('clot le flux sur l evenement failed pour %s', async (_cas, audit) => {
    audits.findById.mockResolvedValue(audit);

    const reponse = await request(serveur()).get(cheminDuFlux).expect(200);

    expect(evenementsDe(reponse.text)).toEqual(['failed']);
  });

  it('suit chaque phase, bat la mesure puis clot le flux par timeout apres 30 min', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
    const phases = [analyseDesPages(), entreeEnSynthese(), enCoursDeSynthese()];
    for (const phase of phases.slice(0, -1)) {
      audits.findById.mockResolvedValueOnce(phase);
    }
    audits.findById.mockResolvedValue(phases.at(-1) ?? null);

    const reponse = request(serveur())
      .get(cheminDuFlux)
      .then((servie) => servie);
    while (audits.findById.mock.calls.length === 0) {
      await new Promise((suite) => setImmediate(suite));
    }
    await jest.advanceTimersByTimeAsync(BATTEMENT_MS);
    await jest.advanceTimersByTimeAsync(DUREE_MAX_DU_FLUX_MS);

    const evenements = evenementsDe((await reponse).text);
    expect([...new Set(evenements)]).toEqual([
      'progress',
      'heartbeat',
      'timeout',
    ]);
    expect(evenements.filter((type) => type === 'progress')).toHaveLength(
      phases.length,
    );
  });
});

function analyseDesPages(): AuditSnapshot {
  return buildAuditSnapshot({
    id: AUDIT_SUIVI,
    processingStatus: 'RUNNING',
    progress: 36,
    step: 'Analyse technique des pages (4/10)',
    keyChecks: {
      progressDetails: {
        phase: 'technical_pages',
        iaTask: 'technical_scan',
        iaSubTask: 'headers_indexability_signals',
        done: 4,
        total: 10,
        currentUrl: 'https://example.com/contact',
        recentCompletedUrls: [
          'https://example.com/',
          'https://example.com/offres',
          'https://example.com/contact',
        ],
      },
    },
  });
}

function entreeEnSynthese(): AuditSnapshot {
  return buildAuditSnapshot({
    id: AUDIT_SUIVI,
    processingStatus: 'RUNNING',
    progress: 85,
    step: 'Generation de la synthese',
    keyChecks: {
      progressDetails: {
        phase: 'synthesis',
        iaTask: 'synthesis',
        iaSubTask: 'summary',
        done: 0,
        total: 5,
      },
    },
  });
}

function enCoursDeSynthese(): AuditSnapshot {
  return buildAuditSnapshot({
    id: AUDIT_SUIVI,
    processingStatus: 'RUNNING',
    progress: 88,
    step: null,
    keyChecks: {
      progressDetails: {
        phase: 'synthesis',
        iaTask: 'synthesis',
        iaSubTask: 'executiveSection',
        done: 2,
        total: 5,
        section: 'executiveSection',
        sectionStatus: 'completed',
        sectionStatuses: {
          summary: 'completed',
          executiveSection: 'completed',
          prioritySection: 'started',
          executionSection: 'started',
          clientCommsSection: 'started',
        },
      },
    },
  });
}
