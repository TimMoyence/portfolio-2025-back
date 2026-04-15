import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import { AuditPdfGeneratorService } from './audit-pdf-generator.service';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

// Mock Puppeteer : on ne veut jamais lancer Chromium dans les tests unitaires.
type PdfOptions = {
  format?: string;
  printBackground?: boolean;
  margin?: { top: string; bottom: string; left: string; right: string };
};

const pagePdfMock = jest.fn<Promise<Uint8Array>, [PdfOptions | undefined]>();
const pageSetContentMock = jest.fn<Promise<void>, [string, unknown?]>();
const pageCloseMock = jest.fn<Promise<void>, []>();
const newPageMock = jest.fn();
const browserCloseMock = jest.fn<Promise<void>, []>();
const launchMock = jest.fn();

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: (...args: unknown[]) => launchMock(...args),
  },
  launch: (...args: unknown[]) => launchMock(...args),
}));

describe('AuditPdfGeneratorService', () => {
  let service: AuditPdfGeneratorService;
  let htmlRenderer: AuditReportHtmlRendererService;
  let renderMock: jest.Mock;

  const audit = {
    websiteName: 'Test Co',
    createdAt: new Date('2026-04-15T10:00:00Z'),
    finalUrl: 'https://test.co',
    keyChecks: {},
  } as unknown as AuditSnapshot;

  const clientReport = {} as ClientReportSynthesis;
  const expertReport = {
    perPageAnalysis: [],
    crossPageFindings: [],
    priorityBacklog: [],
    internalNotes: '',
  } as unknown as ExpertReportSynthesis;

  beforeEach(() => {
    jest.clearAllMocks();
    pagePdfMock.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    pageSetContentMock.mockResolvedValue(undefined);
    pageCloseMock.mockResolvedValue(undefined);
    newPageMock.mockResolvedValue({
      setContent: pageSetContentMock,
      pdf: pagePdfMock,
      close: pageCloseMock,
    });
    browserCloseMock.mockResolvedValue(undefined);
    launchMock.mockResolvedValue({
      newPage: newPageMock,
      close: browserCloseMock,
    });

    renderMock = jest
      .fn()
      .mockReturnValue('<html><body>FAKE HTML</body></html>');
    htmlRenderer = {
      render: renderMock,
    } as unknown as AuditReportHtmlRendererService;

    service = new AuditPdfGeneratorService(htmlRenderer);
  });

  it('genere un Buffer PDF depuis le HTML rendu', async () => {
    const buffer = await service.generate(audit, clientReport, expertReport);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBe(4);
    expect(renderMock).toHaveBeenCalledWith(audit, clientReport, expertReport);
    expect(pageSetContentMock).toHaveBeenCalledWith(
      '<html><body>FAKE HTML</body></html>',
      expect.objectContaining({ waitUntil: 'networkidle0' }),
    );
  });

  it('passe les bonnes options A4 a page.pdf()', async () => {
    await service.generate(audit, clientReport, expertReport);

    expect(pagePdfMock).toHaveBeenCalledTimes(1);
    const options = pagePdfMock.mock.calls[0][0]!;
    expect(options.format).toBe('A4');
    expect(options.printBackground).toBe(true);
    expect(options.margin).toEqual({
      top: '28mm',
      bottom: '24mm',
      left: '22mm',
      right: '22mm',
    });
  });

  it('ferme la page meme si page.pdf() throw', async () => {
    pagePdfMock.mockRejectedValueOnce(new Error('boom'));

    await expect(
      service.generate(audit, clientReport, expertReport),
    ).rejects.toThrow('boom');

    expect(pageCloseMock).toHaveBeenCalledTimes(1);
    // Le browser ne doit pas etre ferme en cas d'erreur sur une page
    expect(browserCloseMock).not.toHaveBeenCalled();
  });

  it('reutilise le browser Puppeteer sur plusieurs appels (singleton lazy)', async () => {
    await service.generate(audit, clientReport, expertReport);
    await service.generate(audit, clientReport, expertReport);

    expect(launchMock).toHaveBeenCalledTimes(1);
    expect(newPageMock).toHaveBeenCalledTimes(2);
  });

  it('onModuleDestroy ferme proprement le browser', async () => {
    await service.generate(audit, clientReport, expertReport);
    await service.onModuleDestroy();

    expect(browserCloseMock).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy ne throw pas si browser.close() echoue', async () => {
    browserCloseMock.mockRejectedValueOnce(new Error('close failed'));
    await service.generate(audit, clientReport, expertReport);

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });

  it("onModuleDestroy ne fait rien si aucun browser n'a ete lance", async () => {
    await service.onModuleDestroy();
    expect(browserCloseMock).not.toHaveBeenCalled();
  });
});
