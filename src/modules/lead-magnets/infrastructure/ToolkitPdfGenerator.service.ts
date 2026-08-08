import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import type { ToolkitContent } from '../domain/ToolkitContent';
import { ToolkitHtmlRendererService } from './ToolkitHtmlRenderer.service';

@Injectable()
export class ToolkitPdfGeneratorService
  implements IToolkitPdfGenerator, OnModuleDestroy
{
  private readonly logger = new Logger(ToolkitPdfGeneratorService.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly htmlRenderer: ToolkitHtmlRendererService) {}

  async generate(
    _request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer> {
    const html = this.htmlRenderer.render(content);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        // La cover deborde ces marges par marges negatives, cf. la regle
        // `.cover.page` de toolkit-html.css.ts.
        margin: {
          top: '28mm',
          bottom: '24mm',
          left: '22mm',
          right: '22mm',
        },
        preferCSSPageSize: false,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }
    return this.browserPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise) {
      try {
        const browser = await this.browserPromise;
        await browser.close();
      } catch (error) {
        this.logger.warn(
          `Echec lors de la fermeture du navigateur Puppeteer: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      } finally {
        this.browserPromise = null;
      }
    }
  }
}
